const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const uploadRoutes = require('./routes/uploadRoutes');
const chatRoutes = require('./routes/chatRoutes');
const documentRoutes = require('./routes/documentRoutes');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Use request logging
app.use(morgan('dev'));

// Configure CORS — allow frontend origin
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse incoming payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve temporary static media if uploaded files need to be retrieved directly 
app.use('/uploads', express.static('uploads'));

// Map API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/user', userRoutes);
app.use('/api', uploadRoutes);
app.use('/api', chatRoutes);
app.use('/api', documentRoutes);
app.use('/api', healthRoutes);

// Catch-all 404 Route
app.use((req, res, next) => {
  const err = new Error(`Endpoint ${req.originalUrl} not found`);
  err.status = 404;
  next(err);
});

// Centralized error middleware
app.use(errorHandler);

module.exports = app;
