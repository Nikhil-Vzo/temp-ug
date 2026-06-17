import { type Request, type Response } from 'express';
import { catchAsync } from '../config/CatchAsync.js';
import * as moduleService from '../services/module-service.js';

// ==========================================
// 1. Create Module
// ==========================================
export const createModule = catchAsync(async (req: any, res: Response) => {
  const { sectionId } = req.params;
  const { title } = req.body;

  const newModule = await moduleService.create_module(sectionId, title);

  res.status(201).json({
    status: 'success',
    data: { module: newModule }
  });
});

// ==========================================
// 2. Get Modules for Section
// ==========================================
export const getModules = catchAsync(async (req: any, res: Response) => {
  const { sectionId } = req.params;

  const modules = await moduleService.get_modules(sectionId);

  res.status(200).json({
    status: 'success',
    results: modules.length,
    data: { modules }
  });
});

// ==========================================
// 3. Update Module
// ==========================================
export const updateModule = catchAsync(async (req: any, res: Response) => {
  const { moduleId } = req.params;
  const { title } = req.body;

  const updatedModule = await moduleService.update_module(moduleId, title);

  res.status(200).json({
    status: 'success',
    data: { module: updatedModule }
  });
});

// ==========================================
// 4. Delete Module
// ==========================================
export const deleteModule = catchAsync(async (req: any, res: Response) => {
  const { moduleId } = req.params;

  await moduleService.delete_module(moduleId);

  res.status(204).send(); // 204 No Content
});
