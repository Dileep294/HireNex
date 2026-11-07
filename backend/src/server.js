import dotenv from 'dotenv';

// Load environment variables before importing app or db
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import { validateEnvironment } from './config/envValidation.js';

// Validate required environment configurations
validateEnvironment();

const PORT = process.env.PORT || 5000;

// Initialize Database connection
connectDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 [Server] HireNex Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔗 [Server] Health check available at: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
