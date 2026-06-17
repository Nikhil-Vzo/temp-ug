import mongoose from 'mongoose';
import { AppError } from '../config/CatchAsync.js';
import Chapter from '../models/Chapter.js';
import Course from '../models/Course.js';
import { runInTransaction } from '../config/database.js';
import { CacheService } from '../core/cache/cacheClient.js';

const findCourse = async (courseIdOrUuid: string, session?: any) => {
  let course;
  if (mongoose.Types.ObjectId.isValid(courseIdOrUuid)) {
    course = await Course.findById(courseIdOrUuid).session(session).lean();
  } else {
    course = await Course.findOne({ course_uuid: courseIdOrUuid }).session(session).lean();
  }
  if (!course) throw new AppError('Course not found', 404);
  return course;
};

export const create_section = async (courseIdOrUuid: string, title: string) => {
  return await runInTransaction(async (session) => {
    const course = await findCourse(courseIdOrUuid, session);

    const [newChapter] = await (Chapter.create as any)([{
      course_id: course._id,
      title,
      modules: []
    }], { session });

    await Course.findByIdAndUpdate(
      course._id,
      { $push: { chapters: newChapter._id } },
      { session }
    );

    if (course.course_uuid) {
      await CacheService.invalidateCourseMeta(course.course_uuid.toString());
    }

    return newChapter;
  });
};

export const get_sections = async (courseIdOrUuid: string) => {
  const isId = mongoose.Types.ObjectId.isValid(courseIdOrUuid);
  const matchQuery = isId
    ? { _id: new mongoose.Types.ObjectId(courseIdOrUuid) }
    : { course_uuid: courseIdOrUuid };

  const course = await Course.findOne(matchQuery)
    .populate({ path: 'chapters', populate: { path: 'modules', populate: { path: 'activities' } } })
    .lean();

  if (!course) throw new AppError('Course not found', 404);
  return course.chapters || [];
};

export const update_section = async (sectionIdOrUuid: string, title: string) => {
  const query = mongoose.Types.ObjectId.isValid(sectionIdOrUuid)
    ? { _id: sectionIdOrUuid }
    : { chapter_uuid: sectionIdOrUuid };

  const updatedChapter = await Chapter.findOneAndUpdate(
    query,
    { $set: { title } },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedChapter) throw new AppError('Section not found', 404);
  return updatedChapter;
};

export const delete_section = async (sectionIdOrUuid: string) => {
  return await runInTransaction(async (session) => {
    const query = mongoose.Types.ObjectId.isValid(sectionIdOrUuid)
      ? { _id: sectionIdOrUuid }
      : { chapter_uuid: sectionIdOrUuid };

    const chapter = await Chapter.findOne(query).session(session).lean();
    if (!chapter) throw new AppError('Section not found', 404);

    await Course.findByIdAndUpdate(
      chapter.course_id,
      { $pull: { chapters: chapter._id } },
      { session }
    );

    await Chapter.deleteOne({ _id: chapter._id }).session(session);
    return true;
  });
};
