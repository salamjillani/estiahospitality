//server/controllers/bookingController.js
exports.createBooking = async (req, res) => {
    try {
      const booking = await Booking.create(req.body);
      
      // Create admin notification
      const notification = await Notification.create({
        type: 'booking',
        message: `New booking from ${req.user.name}`,
        relatedBooking: booking._id,
        status: 'pending'
      });
  
      // Notify admins via WebSocket
      req.app.locals.broadcast('new_booking', notification);
      
      res.status(201).json({ success: true, data: booking });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };