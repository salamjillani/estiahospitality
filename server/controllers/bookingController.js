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


export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('property user');

    // Emit real-time update
    req.io.emit('bookingUpdate', booking);
    
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getClientBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.params.userId,
      status: { $ne: 'deleted' }
    });
    res.send(bookings);
  } catch (err) {
    res.status(500).send();
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({});
    res.send(bookings);
  } catch (err) {
    res.status(500).send();
  }
};