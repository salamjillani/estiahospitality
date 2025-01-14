// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use('/api/auth', authRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});