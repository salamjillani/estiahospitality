const path = require('path');
const multer = require('multer');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Import routes
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const bookingRoutes = require('./routes/bookings');
const bookingAgentRoutes = require('./routes/bookingAgents');

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// WebSocket setup
const wss = new WebSocket.Server({ server });

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Configure CORS first
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://res.cloudinary.com',
    'https://*.cloudinary.com',
    
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // For Cloudinary uploads
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    allowedTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Invalid file type'));
  }
});
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
  next(err);
});
// File upload endpoint - must come before body parsers
app.post('/api/properties/upload', upload.array('photos', 10), async (req, res) => {
  try {
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'properties' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);
    const photoUrls = results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id
    }));

    res.json({ photoUrls });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Standard middleware (after file upload handler)
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/booking-agents', bookingAgentRoutes);

// WebSocket broadcast function
const broadcast = (type, data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, data }));
    }
  });
};

app.locals.broadcast = broadcast;

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

// Error handlers
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});