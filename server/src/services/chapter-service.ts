
// ==========================================
// 1. DEPRECATED: Get Course Chapters (Relational)
// ==========================================
// This fetches chapters independently. It does not guarantee the 

import { AppError } from "../config/CatchAsync.js";
import { runInTransaction } from "../config/database.js";
import { CacheService } from "../core/cache/cacheClient.js";
import Chapter from "../models/Chapter.js";
import Course from "../models/Course.js";
import Module from "../models/Module.js";

// explicit order defined in the Course's `chapters` array.
export const DEPRECEATED_get_course_chapters = async (courseObjectId: string) => {
  return await Chapter.find({ course_id: courseObjectId }).lean();
};

// ==========================================
// 2. Create Chapter (Transaction Required)
// ==========================================
export const create_chapter = async (courseUuid: string, title: string) => {
  return await runInTransaction(async (session) => {
    // 1. Find the parent Course
    const course = await Course.findOne({ course_uuid: courseUuid }).session(session).lean();
    if (!course) throw new AppError('Course not found', 404);

    // 2. Create the new Chapter
    const [newChapter] = await (Chapter.create as any)([{
      course_id: course._id,
      title: title,
      modules: [] // Initialize empty modules array
    }], { session });

    // 3. Push the new Chapter's ID into the Course's ordered array
    await Course.findByIdAndUpdate(
      course._id,
      { $push: { chapters: newChapter._id } },
      { session }
    );

    // 4. Invalidate the parent course cache
    await CacheService.invalidateCourseMeta(courseUuid);

    return newChapter;
  });
};

// ==========================================
// 3. Delete Chapter (Transaction Required)
// ==========================================
export const delete_chapter = async (chapterUuid: string) => {
  return await runInTransaction(async (session) => {
    const chapter = await Chapter.findOne({ chapter_uuid: chapterUuid }).session(session).lean();
    if (!chapter) throw new AppError('Chapter not found', 404);

    // 1. Pull the Chapter ID out of the parent Course's array
    await Course.findByIdAndUpdate(
      chapter.course_id,
      { $pull: { chapters: chapter._id } },
      { session }
    );

    // 2. Delete the Chapter document itself
    await Chapter.deleteOne({ _id: chapter._id }).session(session);

    // (Future consideration: Add a step here to delete all related Activities inside chapter.activities)

    return true;
  });
};

// ==========================================
// 4. Get Chapter (By UUID)
// ==========================================
export const get_chapter = async (chapterUuid: string) => {
  const chapter = await Chapter.findOne({ chapter_uuid: chapterUuid })
    .populate({
      path: 'modules',
      populate: {
        path: 'activities'
      }
    }) // Hydrate the ordered modules array
    .lean();
    
  if (!chapter) throw new AppError('Chapter not found', 404);
  return chapter;
};

// ==========================================
// 5. Get Course Chapters (The Modern Way)
// ==========================================
// This fetches the chapters specifically through the Course document
// to perfectly preserve the drag-and-drop array order.
export const get_course_chapters = async (courseUuid: string) => {
  const course = await Course.findOne({ course_uuid: courseUuid })
    .populate({
      path: 'chapters',
      populate: {
        path: 'modules',
        populate: {
          path: 'activities',
          populate: {
            path: 'assignment_config'
          }
        }
      }
    })
    .lean();

  if (!course) throw new AppError('Course not found', 404);

  return course.chapters;
};

// ==========================================
// 6. Reorder Chapters & Activities
// ==========================================
// Designed to ingest a single UI payload after a drag-and-drop event
export const reorder_chapters_and_activities = async (
  courseUuid: string, 
  newChapterOrder: string[], // Array of Chapter ObjectIds
  chapterActivityUpdates: { chapterId: string; newActivities: string[] }[], // Array of Module ObjectIds per Chapter
  moduleActivityUpdates?: { moduleId: string; newLessons: string[] }[] // Array of Lesson ObjectIds per Module
) => {
  return await runInTransaction(async (session) => {
    const course = await Course.findOne({ course_uuid: courseUuid }).session(session).lean();
    if (!course) throw new AppError('Course not found', 404);

    // 1. Update the parent Course with the new Chapter order
    if (newChapterOrder && newChapterOrder.length > 0) {
      await Course.findByIdAndUpdate(
        course._id,
        { $set: { chapters: newChapterOrder } },
        { session }
      );
    }

    // 2. Bulk update all Chapters with their new Module orders simultaneously
    if (chapterActivityUpdates && chapterActivityUpdates.length > 0) {
      const bulkOps = chapterActivityUpdates.map(update => ({
        updateOne: {
          filter: { _id: update.chapterId },
          update: { $set: { modules: update.newActivities } }
        }
      }));

      await Chapter.bulkWrite(bulkOps as any, { session });
    }

    // 3. Bulk update all Modules with their new Lesson/Activity orders simultaneously
    if (moduleActivityUpdates && moduleActivityUpdates.length > 0) {
      const moduleOps = moduleActivityUpdates.map(update => ({
        updateOne: {
          filter: { _id: update.moduleId },
          update: { $set: { activities: update.newLessons } }
        }
      }));

      await Module.bulkWrite(moduleOps as any, { session });
    }

    await CacheService.invalidateCourseMeta(courseUuid);

    return true;
  });
};

// ==========================================
// 7. Update Chapter (Title/Metadata)
// ==========================================
export const update_chapter = async (chapterUuid: string, updateData: { title?: string }) => {
  const updatedChapter = await Chapter.findOneAndUpdate(
    { chapter_uuid: chapterUuid },
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedChapter) throw new AppError('Chapter not found', 404);
  return updatedChapter;
};