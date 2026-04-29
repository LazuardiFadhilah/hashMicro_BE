require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const checkerRoutes = require('./routes/checkerRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', authMiddleware, studentRoutes);
app.use('/api/subjects', authMiddleware, subjectRoutes);
app.use('/api/grades', authMiddleware, gradeRoutes);
app.use('/api/checker', authMiddleware, checkerRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5001;

// Connect to database for Vercel serverless
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await connectDB();
    isConnected = true;
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    throw err;
  }
};

// Vercel serverless handler
const handler = async (req, res) => {
  await connectToDatabase();
  return app(req, res);
};

// Only start the server if we're not in a test environment or Vercel
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
}

module.exports = handler;
