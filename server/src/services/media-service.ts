import mongoose from 'mongoose';
import crypto from 'crypto';
import { AppError } from '../config/CatchAsync.js';
import Activity from '../models/Activity.js';

export const generate_upload_url = async (fileName: string) => {
  const timestamp = Math.round(Date.now() / 1000);
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const isPdf = fileName.toLowerCase().endsWith('.pdf');
  const folder = isPdf ? 'documents' : 'videos';
  const resourceType = isPdf ? 'auto' : 'video';

  if (cloudName && apiKey && apiSecret) {
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const stringToSign = `${paramsToSign}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    return {
      uploadUrl,
      fileKey: `${folder}/${timestamp}-${fileName.replace(/\s+/g, '_')}`,
      signature,
      apiKey,
      timestamp,
      folder
    };
  } else {
    // Fallback to mock S3
    const fileKey = `${folder}/${timestamp}-${fileName}`;
    const uploadUrl = `https://mock-s3-bucket.s3.amazonaws.com/${fileKey}?AWSAccessKeyId=MOCK&Expires=1800&Signature=MOCK_SIG`;
    return { uploadUrl, fileKey };
  }
};

export const attach_video = async (lessonIdOrUuid: string, fileKey: string) => {
  const query = mongoose.Types.ObjectId.isValid(lessonIdOrUuid)
    ? { _id: lessonIdOrUuid }
    : { activity_uuid: lessonIdOrUuid };

  const lesson = await Activity.findOne(query);
  if (!lesson) throw new AppError('Lesson not found', 404);

  // Remove existing video blocks if any, to keep one video per lesson
  lesson.blocks = lesson.blocks ? (lesson.blocks.filter(b => b.block_type !== 'video') as any) : [];

  const videoBlock = {
    block_type: 'video',
    content: { fileKey },
    order: lesson.blocks.length + 1
  };

  lesson.blocks.push(videoBlock as any);
  await lesson.save();
  return lesson;
};

export const attach_pdf = async (lessonIdOrUuid: string, fileKey: string) => {
  const query = mongoose.Types.ObjectId.isValid(lessonIdOrUuid)
    ? { _id: lessonIdOrUuid }
    : { activity_uuid: lessonIdOrUuid };

  const lesson = await Activity.findOne(query);
  if (!lesson) throw new AppError('Lesson not found', 404);

  // Remove existing pdf blocks if any, to keep one pdf per lesson
  lesson.blocks = lesson.blocks ? (lesson.blocks.filter(b => b.block_type !== 'pdf') as any) : [];

  const pdfBlock = {
    block_type: 'pdf',
    content: { fileKey },
    order: lesson.blocks.length + 1
  };

  lesson.blocks.push(pdfBlock as any);
  await lesson.save();
  return lesson;
};

export const get_streaming_url = async (lessonIdOrUuid: string) => {
  const query = mongoose.Types.ObjectId.isValid(lessonIdOrUuid)
    ? { _id: lessonIdOrUuid }
    : { activity_uuid: lessonIdOrUuid };

  const lesson = await Activity.findOne(query).lean();
  if (!lesson) throw new AppError('Lesson not found', 404);

  const videoBlock = lesson.blocks?.find(b => b.block_type === 'video');
  if (!videoBlock || !videoBlock.content?.fileKey) {
    throw new AppError('No video content attached to this lesson', 404);
  }

  const fileKey = videoBlock.content.fileKey;
  // If the fileKey is a full URL (like a Cloudinary URL), return it directly
  const streamingUrl = fileKey.startsWith('http')
    ? fileKey
    : `https://mock-cloudfront-distribution.net/${fileKey}?Expires=3600&Signature=MOCK_SIG`;

  return { streamingUrl, fileKey };
};
