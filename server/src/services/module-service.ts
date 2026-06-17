import mongoose from 'mongoose';
import { AppError } from '../config/CatchAsync.js';
import Module from '../models/Module.js';
import Chapter from '../models/Chapter.js';
import { runInTransaction } from '../config/database.js';

const findSection = async (sectionIdOrUuid: string, session?: any) => {
  let section;
  if (mongoose.Types.ObjectId.isValid(sectionIdOrUuid)) {
    section = await Chapter.findById(sectionIdOrUuid).session(session).lean();
  } else {
    section = await Chapter.findOne({ chapter_uuid: sectionIdOrUuid }).session(session).lean();
  }
  if (!section) throw new AppError('Section not found', 404);
  return section;
};

export const create_module = async (sectionIdOrUuid: string, title: string) => {
  return await runInTransaction(async (session) => {
    const section = await findSection(sectionIdOrUuid, session);

    const [newModule] = await (Module.create as any)([{
      section_id: section._id,
      title,
      activities: []
    }], { session });

    await Chapter.findByIdAndUpdate(
      section._id,
      { $push: { modules: newModule._id } },
      { session }
    );

    return newModule;
  });
};

export const get_modules = async (sectionIdOrUuid: string) => {
  const section = await findSection(sectionIdOrUuid);
  return await Module.find({ section_id: section._id })
    .populate('activities')
    .sort({ created_at: 1 })
    .lean();
};

export const update_module = async (moduleIdOrUuid: string, title: string) => {
  const query = mongoose.Types.ObjectId.isValid(moduleIdOrUuid)
    ? { _id: moduleIdOrUuid }
    : { module_uuid: moduleIdOrUuid };

  const updatedModule = await Module.findOneAndUpdate(
    query,
    { $set: { title, updated_at: new Date() } },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedModule) throw new AppError('Module not found', 404);
  return updatedModule;
};

export const delete_module = async (moduleIdOrUuid: string) => {
  return await runInTransaction(async (session) => {
    const query = mongoose.Types.ObjectId.isValid(moduleIdOrUuid)
      ? { _id: moduleIdOrUuid }
      : { module_uuid: moduleIdOrUuid };

    const moduleDoc = await Module.findOne(query).session(session).lean();
    if (!moduleDoc) throw new AppError('Module not found', 404);

    await Chapter.findByIdAndUpdate(
      moduleDoc.section_id,
      { $pull: { modules: moduleDoc._id } },
      { session }
    );

    await Module.deleteOne({ _id: moduleDoc._id }).session(session);
    return true;
  });
};
