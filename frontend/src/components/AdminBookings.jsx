// AdminBookings.jsx (New Component)
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import io from "socket.io-client";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const { user } = useAuth();
  const socket = io(import.meta.env.VITE_API_URL);

  useEffect(() => {
    const fetchBookings = async () => {
      const response = await fetch("/api/bookings?status=pending", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      setBookings(data);
    };

    fetchBookings();
    
    socket.on("statusUpdate", (updatedBooking) => {
      setBookings(prev => prev.map(b => 
        b._id === updatedBooking._id ? updatedBooking : b
      ));
    });
  
    return () => {
      socket.off("statusUpdate");
    };
  }, []);

  useEffect(() => {
    socket.on("newBooking", (newBooking) => {
      setBookings(prev => [newBooking, ...prev]);
    });
  
    return () => {
      socket.off("newBooking");
    };
  }, []);

  const updateStatus = async (bookingId, status) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (response.ok) {
        socket.emit("statusUpdate", data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-bookings">
      <h2>New Bookings</h2>
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>User</th>
            <th>Dates</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id}>
            <td>{booking.reservationCode}</td>
              <td>{booking.property.name}</td>
              <td>{booking.user.email}</td>
              <td>
                {booking.checkInDate} to {booking.checkOutDate}
              </td>
              <td>{booking.status}</td>
              <td>
                <button onClick={() => updateStatus(booking._id, "confirmed")}>
                  Confirm
                </button>
                <button onClick={() => updateStatus(booking._id, "canceled")}>
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBookings;
