import mongoose from 'mongoose';
import { AppError } from '../config/CatchAsync.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Activity from '../models/Activity.js';
import { runInTransaction } from '../config/database.js';
import { publishEvent } from './event-bus.js';

const findLesson = async (lessonIdOrUuid: string, session?: any) => {
  let lesson;
  if (mongoose.Types.ObjectId.isValid(lessonIdOrUuid)) {
    lesson = await Activity.findById(lessonIdOrUuid).session(session);
  } else {
    lesson = await Activity.findOne({ activity_uuid: lessonIdOrUuid }).session(session);
  }
  if (!lesson) throw new AppError('Lesson not found', 404);
  return lesson;
};

const findAssignment = async (assignmentIdOrUuid: string, session?: any) => {
  let assignment;
  if (mongoose.Types.ObjectId.isValid(assignmentIdOrUuid)) {
    assignment = await Assignment.findById(assignmentIdOrUuid).session(session).lean();
  } else {
    assignment = await Assignment.findOne({ assignment_uuid: assignmentIdOrUuid }).session(session).lean();
  }
  if (!assignment) throw new AppError('Assignment not found', 404);
  return assignment;
};

export const create_assignment = async (lessonIdOrUuid: string, title: string, instructions?: string) => {
  return await runInTransaction(async (session) => {
    const lesson = await findLesson(lessonIdOrUuid, session);

    const [newAssignment] = await (Assignment.create as any)([{ title, instructions }], { session });

    lesson.assignment_config = newAssignment._id;
    await lesson.save({ session });

    return newAssignment;
  });
};

export const submit_assignment = async (userId: string, assignmentIdOrUuid: string, submissionUrl: string) => {
  const assignment = await findAssignment(assignmentIdOrUuid);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const submission = await Submission.create({
    assignment_id: assignment._id,
    user_id: userObjectId,
    submission_url: submissionUrl
  });

  publishEvent('ASSIGNMENT_SUBMITTED', {
    userId,
    assignmentId: assignment._id.toString(),
    assignmentTitle: assignment.title
  });

  return submission;
};

export const grade_assignment = async (submissionIdOrUuid: string, score: number, remarks?: string) => {
  const query = mongoose.Types.ObjectId.isValid(submissionIdOrUuid)
    ? { _id: submissionIdOrUuid }
    : { submission_uuid: submissionIdOrUuid };

  const submission = await Submission.findOneAndUpdate(
    query,
    { $set: { score, remarks, graded_at: new Date() } },
    { new: true }
  ).lean();

  if (!submission) throw new AppError('Submission not found', 404);
  return submission;
};

export const get_assignment_results = async (assignmentIdOrUuid: string) => {
  const assignment = await findAssignment(assignmentIdOrUuid);
  return await Submission.find({ assignment_id: assignment._id })
    .populate('user_id', 'email')
    .sort({ submitted_at: -1 })
    .lean();
};

export const update_assignment = async (
  assignmentIdOrUuid: string,
  updateData: { title?: string; instructions?: string }
) => {
  const query = mongoose.Types.ObjectId.isValid(assignmentIdOrUuid)
    ? { _id: assignmentIdOrUuid }
    : { assignment_uuid: assignmentIdOrUuid };

  const assignment = await Assignment.findOneAndUpdate(
    query,
    { $set: updateData },
    { new: true }
  ).lean();

  if (!assignment) throw new AppError('Assignment not found', 404);
  return assignment;
};

export const get_my_submission = async (userId: string, assignmentIdOrUuid: string) => {
  const assignment = await findAssignment(assignmentIdOrUuid);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  return await Submission.findOne({
    assignment_id: assignment._id,
    user_id: userObjectId
  }).lean();
};
