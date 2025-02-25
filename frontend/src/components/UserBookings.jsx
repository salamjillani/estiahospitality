// UserBookings.jsx (Updated for real-time)
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const { user } = useAuth();
  const socket = io(import.meta.env.VITE_API_URL);


  useEffect(() => {
    const fetchBookings = async () => {
      const response = await fetch(`/api/users/${user.id}/bookings`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      setBookings(data);
    };

    fetchBookings();

    // Listen for status updates
    socket.on('bookingUpdate', (updatedBooking) => {
      setBookings(prev => prev.map(b => 
        b._id === updatedBooking._id ? updatedBooking : b
      ));
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="user-bookings">
      <h2>My Bookings</h2>
      {bookings.map(booking => (
        <div key={booking._id} className={`booking ${booking.status}`}>
          <div>{booking.property.name}</div>
          <div>{booking.checkInDate} to {booking.checkOutDate}</div>
          <div>Status: {booking.status}</div>
        </div>
      ))}
    </div>
  );
};

export default UserBookings