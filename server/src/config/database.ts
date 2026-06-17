import mongoose, { type ClientSession } from 'mongoose';
import Role from '../models/Roles.js';
import { SYSTEM_ROLES } from '../core/constants/roles.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string, {
      // Production performance tweaks
      maxPoolSize: 50, // Maintain up to 50 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Seed default system roles if they don't exist
    const rolesCount = await Role.countDocuments();
    if (rolesCount === 0) {
      await Role.insertMany([
        { name: SYSTEM_ROLES.ADMIN, description: 'Organization Administrator with full access', permissions: [] },
        { name: SYSTEM_ROLES.MAINTAINER, description: 'Can manage content and settings', permissions: [] },
        { name: SYSTEM_ROLES.INSTRUCTOR, description: 'Can create and edit course content', permissions: [] },
        { name: SYSTEM_ROLES.STUDENT, description: 'Standard student enrolled in courses', permissions: [] }
      ]);
      console.log('🌱 Default roles seeded successfully.');
    }
  } catch (error: any) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Kill the server if the DB won't connect
  }
};

// Monitor the Mongoose connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected! Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected successfully.');
});

// Graceful shutdown: Close DB connection on process termination (e.g., Ctrl+C or Docker stop)
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed due to app termination.');
  process.exit(0);
});

export const runInTransaction = async <T>(
  callback: (session: any) => Promise<T>
): Promise<T> => {
  // Check topology to detect standalone vs replica set
  const topologyType = (mongoose.connection as any).client?.topology?.description?.type;
  const isReplicaSet = topologyType === 'ReplicaSetWithPrimary' || topologyType === 'ReplicaSetNoPrimary';

  if (!isReplicaSet) {
    // Standalone fallback: Execute callback directly without session/transactions
    return await callback(undefined as any);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    console.error('[DB Transaction Rolled Back]', error);
    throw error;
  } finally {
    session.endSession();
  }
};