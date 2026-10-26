const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const employeeRoutes = require('./routes/employee.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Security & Parsing Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'StaffSync HRMS REST API is running',
    version: '1.0.0',
    docs: '/api/health'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'StaffSync HRMS API is operational',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Feature Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/employees', employeeRoutes);

// 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
