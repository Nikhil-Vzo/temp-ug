import 'dotenv/config'; // Loads variables from .env file immediately
import app from './app.js';
import { connectDB } from './config/database.js';

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  // 1. Establish Database Connection First
  await connectDB();

  // 2. Start HTTP Server
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  // 3. Handle Unhandled Promise Rejections globally
  // (e.g., if a third-party async call fails and isn't caught)
  process.on('unhandledRejection', (err:any) => {
    console.error(`💥 Unhandled Rejection: ${err.name} - ${err.message}`);
    // Gracefully shut down the server before exiting
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();