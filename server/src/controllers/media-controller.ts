import { type Request, type Response } from 'express';
import { catchAsync } from '../config/CatchAsync.js';
import * as mediaService from '../services/media-service.js';

// ==========================================
// 1. Generate Upload URL
// ==========================================
export const generateUploadUrl = catchAsync(async (req: any, res: Response) => {
  const { fileName } = req.body;

  const result = await mediaService.generate_upload_url(fileName || 'file.mp4');

  res.status(200).json({
    status: 'success',
    data: result
  });
});

// ==========================================
// 2. Attach Video to Lesson
// ==========================================
export const attachVideo = catchAsync(async (req: any, res: Response) => {
  const { lessonId } = req.params;
  const { fileKey } = req.body;

  const updatedLesson = await mediaService.attach_video(lessonId, fileKey);

  res.status(200).json({
    status: 'success',
    data: { lesson: updatedLesson }
  });
});

// ==========================================
// 2b. Attach PDF to Lesson
// ==========================================
export const attachPdf = catchAsync(async (req: any, res: Response) => {
  const { lessonId } = req.params;
  const { fileKey } = req.body;

  const updatedLesson = await mediaService.attach_pdf(lessonId, fileKey);

  res.status(200).json({
    status: 'success',
    data: { lesson: updatedLesson }
  });
});

// ==========================================
// 3. Get Streaming URL
// ==========================================
export const getStreamingUrl = catchAsync(async (req: any, res: Response) => {
  const { lessonId } = req.params;

  const result = await mediaService.get_streaming_url(lessonId);

  res.status(200).json({
    status: 'success',
    data: result
  });
});
