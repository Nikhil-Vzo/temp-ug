import mongoose from 'mongoose';
import { AppError } from '../config/CatchAsync.js';
import Activity from '../models/Activity.js';

export const generate_upload_url = async (fileName: string) => {
  const timestamp = Date.now();
  const fileKey = `videos/${timestamp}-${fileName}`;
  const uploadUrl = `https://mock-s3-bucket.s3.amazonaws.com/${fileKey}?AWSAccessKeyId=MOCK&Expires=1800&Signature=MOCK_SIG`;
  return { uploadUrl, fileKey };
};

export const attach_video = async (lessonIdOrUuid: string, fileKey: string) => {
  const query = mongoose.Types.ObjectId.isValid(lessonIdOrUuid)
    ? { _id: lessonIdOrUuid }
    : { activity_uuid: lessonIdOrUuid };

  const lesson = await Activity.findOne(query);
  if (!lesson) throw new AppError('Lesson not found', 404);

  const videoBlock = {
    block_type: 'video',
    content: { fileKey },
    order: lesson.blocks ? lesson.blocks.length + 1 : 1
  };

  lesson.blocks.push(videoBlock as any);
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
  const streamingUrl = `https://mock-cloudfront-distribution.net/${fileKey}?Expires=3600&Signature=MOCK_SIG`;
  return { streamingUrl, fileKey };
};
