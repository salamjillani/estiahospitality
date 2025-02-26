import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import {
  Loader2,
  Calendar,
  Home,
  XCircle,
  Info,
  Clock,
  Banknote,
} from "lucide-react";
import io from "socket.io-client";

// Date formatting utility
const formatDate = (dateString) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  const date = new Date(dateString);
  return isNaN(date)
    ? "Invalid Date"
    : date.toLocaleDateString(undefined, options);
};

const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
};

// Calculate nights between dates
const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (isNaN(start) || isNaN(end)) return 0;
  const diff = end - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const ClientBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [socketConnected, setSocketConnected] = useState(false);

  // Fetch bookings initially
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/bookings/client/${user._id}`);
        console.log("API response:", response);

        // Ensure response is an array before mapping
        const bookingsData = Array.isArray(response) ? response : 
                          (response.data && Array.isArray(response.data) ? response.data : []);

        // Process bookings with proper dates and nights calculation
        const processedBookings = bookingsData.map((booking) => ({
          ...booking,
          checkInDate: booking.checkInDate
            ? new Date(booking.checkInDate).toISOString()
            : null,
          checkOutDate: booking.checkOutDate
            ? new Date(booking.checkOutDate).toISOString()
            : null,
          totalNights:
            booking.totalNights ||
            calculateNights(booking.checkInDate, booking.checkOutDate),
        }));

        setBookings(processedBookings);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        if (err.message && err.message.includes("403")) {
          logout();
          navigate("/auth?session=expired");
        }
        setError(err.message || "Failed to fetch bookings");
        setLoading(false);
      }
    };

    if (user?._id) fetchBookings();
  }, [user?._id, navigate, logout]);

  // Combined socket connection and event handling
  useEffect(() => {
    if (!user?._id) return;
    
    // Create a single socket instance
    const socket = io(import.meta.env.VITE_API_URL);
    
    socket.on("connect", () => {
      console.log("Socket connected");
      setSocketConnected(true);
    });
    
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketConnected(false);
    });
    
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setSocketConnected(false);
    });
    
    // Listen for status updates
    socket.on("statusUpdate", (updatedBooking) => {
      console.log("Received status update:", updatedBooking);
      
      // Ensure we're only updating if this booking belongs to the current user
      if (updatedBooking.user && updatedBooking.user._id === user._id) {
        setBookings(prev => 
          prev.map(b => 
            b._id === updatedBooking._id ? {
              ...b,
              ...updatedBooking,
              status: updatedBooking.status,
              checkInDate: updatedBooking.checkInDate || b.checkInDate,
              checkOutDate: updatedBooking.checkOutDate || b.checkOutDate,
              totalNights: calculateNights(
                updatedBooking.checkInDate || b.checkInDate,
                updatedBooking.checkOutDate || b.checkOutDate
              )
            } : b
          )
        );
      }
    });
    
    return () => {
      // Clean up by disconnecting socket and removing all listeners
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("statusUpdate");
      socket.disconnect();
    };
  }, [user?._id]);

  // Redirect if user is not a client
  useEffect(() => {
    if (user && user.role !== "client") {
      navigate("/");
    }
  }, [user, navigate]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      await api.patch(`/api/bookings/${bookingId}/status`, {
        status: "cancelled",
      });

      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId
            ? {
                ...b,
                status: "cancelled",
                totalNights: calculateNights(b.checkInDate, b.checkOutDate),
              }
            : b
        )
      );
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setError(err.message || "Failed to cancel booking");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg mx-4 mt-4">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-8 w-8 text-blue-600" />
          My Bookings
        </h1>
        <Link
          to="/properties"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Book New Property
        </Link>
      </div>

      {socketConnected && (
        <div className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded-lg flex items-center">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
          Real-time updates active
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Info className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No bookings found. Start by creating a new booking!
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => {
            const nights = calculateNights(
              booking.checkInDate,
              booking.checkOutDate
            );

            return (
              <div
                key={booking._id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {booking.property?.title || "Unknown Property"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {booking.reservationCode}
                      </span>
                      {booking.arrivalTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Arrival: {booking.arrivalTime}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(booking.checkInDate)} -{" "}
                          {formatDate(booking.checkOutDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        <span>
                          {nights} night{nights !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Banknote className="h-4 w-4" />
                        <span>
                          {currencySymbols[booking.currency] || "$"}
                          {booking.totalPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                    {["pending", "confirmed"].includes(booking.status) && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="h-5 w-5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientBookings;