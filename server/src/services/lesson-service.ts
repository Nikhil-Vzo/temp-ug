import mongoose from 'mongoose';
import { AppError } from '../config/CatchAsync.js';
import Activity from '../models/Activity.js';
import Module from '../models/Module.js';
import { runInTransaction } from '../config/database.js';

const findModule = async (moduleIdOrUuid: string, session?: any) => {
  let moduleDoc;
  if (mongoose.Types.ObjectId.isValid(moduleIdOrUuid)) {
    moduleDoc = await Module.findById(moduleIdOrUuid).session(session).lean();
  } else {
    moduleDoc = await Module.findOne({ module_uuid: moduleIdOrUuid }).session(session).lean();
  }
  if (!moduleDoc) throw new AppError('Module not found', 404);
  return moduleDoc;
};

export const create_lesson = async (moduleIdOrUuid: string, title: string, lessonType: string) => {
  return await runInTransaction(async (session) => {
    const moduleDoc = await findModule(moduleIdOrUuid, session);

    const [newActivity] = await (Activity.create as any)([{
      title,
      activity_type: lessonType.toLowerCase() as any,
      blocks: [],
      org_id: moduleDoc.section_id
    }], { session });

    await Module.findByIdAndUpdate(
      moduleDoc._id,
      { $push: { activities: newActivity._id } },
      { session }
    );

    return newActivity;
  });
};

export const get_lesson = async (lessonIdOrUuid: string) => {
  const query = mongoose.Types.ObjectId.isValid(lessonIdOrUuid)
    ? { _id: lessonIdOrUuid }
    : { activity_uuid: lessonIdOrUuid };

  const lesson = await Activity.findOne(query).populate('assignment_config').lean();
  if (!lesson) throw new AppError('Lesson not found', 404);
  return lesson;
};

export const update_lesson = async (lessonIdOrUuid: string, updateData: any) => {
  const query = mongoose.Types.ObjectId.isValid(lessonIdOrUuid)
    ? { _id: lessonIdOrUuid }
    : { activity_uuid: lessonIdOrUuid };

  const updatePayload: any = {};
  if (updateData.title) updatePayload.title = updateData.title;
  if (updateData.lessonType) updatePayload.activity_type = updateData.lessonType.toLowerCase();
  if (updateData.blocks) updatePayload.blocks = updateData.blocks;

  const updatedLesson = await Activity.findOneAndUpdate(
    query,
    { $set: updatePayload },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedLesson) throw new AppError('Lesson not found', 404);
  return updatedLesson;
};

export const delete_lesson = async (lessonIdOrUuid: string) => {
  return await runInTransaction(async (session) => {
    const query = mongoose.Types.ObjectId.isValid(lessonIdOrUuid)
      ? { _id: lessonIdOrUuid }
      : { activity_uuid: lessonIdOrUuid };

    const lesson = await Activity.findOne(query).session(session).lean();
    if (!lesson) throw new AppError('Lesson not found', 404);

    await Module.updateMany(
      { activities: lesson._id },
      { $pull: { activities: lesson._id } },
      { session }
    );

    await Activity.deleteOne({ _id: lesson._id }).session(session);
    return true;
  });
};
