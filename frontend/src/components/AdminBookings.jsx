import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import io from "socket.io-client";
import { formatDate } from "../utils/dateUtils"; // Create this utility

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);
  const { user } = useAuth();
  const socket = io(import.meta.env.VITE_API_URL);

  const processBooking = (booking) => ({
    ...booking,
    checkInDate: formatDate(booking.checkInDate),
    checkOutDate: formatDate(booking.checkOutDate),
  });

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("/api/bookings?status=pending", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await response.json();
        setBookings(data.map(processBooking));
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    fetchBookings();

  }, []);

  useEffect(() => {
    socket.on("statusUpdate", (updatedBooking) => {
      setBookings(prev => prev.map(b => 
        b._id === updatedBooking._id ? processBooking(updatedBooking) : b
      ));
    });
    
    return () => {
      socket.off("statusUpdate");
    };
  }, []);

  useEffect(() => {
    socket.on("newBooking", (newBooking) => {
      setBookings((prev) => [processBooking(newBooking), ...prev]);
    });

    return () => {
      socket.off("newBooking");
    };
  }, []);

  const updateStatus = async (bookingId, status) => {
    const booking = bookings.find(b => b._id === bookingId);
    setCurrentBookingId(bookingId);
    setCurrentAction(status);
    setCurrentBooking(booking);
    setShowConfirmation(true);
  };

  const confirmStatusUpdate = async () => {
    try {
      const response = await fetch(`/api/bookings/${currentBookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status: currentAction }),
      });
      
      if (response.ok) {
        const data = await response.json();
        socket.emit("statusUpdate", data);
        // Update local state immediately
        setBookings(prev => prev.map(b => 
          b._id === data._id ? processBooking(data) : b
        ));
      }
      setShowConfirmation(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
        New Bookings
      </h2>

      {bookings.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No pending bookings found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservation Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.reservationCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {booking.property?.title || "Property Not Found"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {booking.user?.name || "Unknown Guest"} (
                    {booking.user?.email})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className="flex items-center">
                      <span className="text-blue-600">
                        {booking.checkInDate}
                      </span>
                      <span className="mx-2">to</span>
                      <span className="text-blue-600">
                        {booking.checkOutDate}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateStatus(booking._id, "confirmed")}
                        className="bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-3 rounded transition-colors duration-200"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => updateStatus(booking._id, "canceled")}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-3 rounded transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <p className="text-lg mb-4">
              Are you sure you want to {currentAction} this reservation?
            </p>
            {currentBooking && (
              <div className="mb-4 text-sm">
                <p><span className="font-semibold">Property:</span> {currentBooking.property?.title || "Property Not Found"}</p>
                <p><span className="font-semibold">Guest:</span> {currentBooking.user?.name || "Unknown Guest"}</p>
              </div>
            )}
            <div className="flex gap-4 justify-end">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowConfirmation(false)}
              >
                No
              </button>
              <button
                className={`px-4 py-2 ${
                  currentAction === "confirmed" 
                    ? "bg-green-500 text-white" 
                    : "bg-red-500 text-white"
                } rounded`}
                onClick={confirmStatusUpdate}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;