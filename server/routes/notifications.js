// server/routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth, checkRole } = require('../middleware/auth');

// Get all notifications (admin only)
router.get('/', auth, checkRole(['admin']), async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('booking property')
      .sort('-createdAt');
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update notification status
router.patch('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('booking property');
    
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;