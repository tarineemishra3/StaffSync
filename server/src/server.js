const dotenv = require('dotenv');

// Load environment variables before anything else
dotenv.config();

const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Attempt database connection
connectDB();

const server = app.listen(PORT, () => {
  console.log(`[StaffSync API] Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  console.log(`[StaffSync API] Health check endpoint: http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

module.exports = server;
