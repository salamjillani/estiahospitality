import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { websocketService } from "../services/websocketService";
import { formatDate } from "../utils/dateUtils";
import { api } from "../utils/api";
import Navbar from "../components/Navbar";
import {
  Loader2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
  AlertTriangle,
  User,
  Home,
  RefreshCw,
} from "lucide-react";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const { user } = useAuth();

  const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
  };

  const processBooking = (booking) => ({
    ...booking,
    checkInDate: formatDate(booking.checkInDate),
    checkOutDate: formatDate(booking.checkOutDate),
  });

  useEffect(() => {
    websocketService.connect();

    const handleStatusUpdate = (updatedBooking) => {
      setBookings(prev => prev.map(b => 
        b._id === updatedBooking._id ? processBooking(updatedBooking) : b
      ));
    };

    const handleNewBooking = (newBooking) => {
      if (newBooking.status === "pending") {
        setBookings(prev => [processBooking(newBooking), ...prev]);
      }
    };

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    websocketService.subscribe("bookingUpdate", handleStatusUpdate);
    websocketService.subscribe("newBooking", handleNewBooking);
    websocketService.subscribe("connect", handleConnect);
    websocketService.subscribe("disconnect", handleDisconnect);

    return () => {
      websocketService.unsubscribe("bookingUpdate", handleStatusUpdate);
      websocketService.unsubscribe("newBooking", handleNewBooking);
      websocketService.unsubscribe("connect", handleConnect);
      websocketService.unsubscribe("disconnect", handleDisconnect);
    };
  }, [user?.token]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/bookings/admin/bookings");
        const pendingBookings = response.filter(b => b.status === "pending");
        setBookings(pendingBookings.map(processBooking));
        setLoading(false);
      } catch (error) {
        setError("Failed to load bookings");
        console.error("Error fetching bookings:", error);
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const updateStatus = (bookingId, status) => {
    const booking = bookings.find((b) => b._id === bookingId);
    setCurrentBookingId(bookingId);
    setCurrentAction(status);
    setCurrentBooking(booking);
    setShowConfirmation(true);
  };

  const confirmStatusUpdate = async () => {
    try {
      const response = await api.patch(`/api/bookings/${currentBookingId}`, {
        status: currentAction
      });

      if (response) {
        setBookings(prev => 
          prev.filter(b => b._id !== currentBookingId)
        );
      }
      setShowConfirmation(false);
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "Failed to update booking status");
      setShowConfirmation(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span>confirmed</span>
          </span>
        );
      case "pending":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-yellow-100 text-yellow-800">
            <Clock className="h-4 w-4" />
            <span>pending</span>
          </span>
        );
      case "canceled":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-red-100 text-red-800">
            <XCircle className="h-4 w-4" />
            <span>canceled</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-gray-100 text-gray-800">
            <span>{status}</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading booking requests...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">

        <div className="max-w-6xl mx-auto px-4">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                New Booking Requests
              </h1>
              <p className="text-gray-500 mt-1">
                Manage and respond to pending reservation requests
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center gap-2 font-medium"
            >
              <RefreshCw className="h-5 w-5" />
              Refresh
            </button>
          </div>

          {/* Real-time connection status */}
          {socketConnected && (
            <div className="mb-6 text-sm text-green-600 bg-green-50 p-3 rounded-lg flex items-center shadow-sm border border-green-100">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="font-medium">Real-time updates active</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 text-sm text-red-600 bg-red-50 p-4 rounded-lg flex items-center gap-3 shadow-sm border border-red-100">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="flex flex-col items-center max-w-md mx-auto">
                <div className="bg-blue-50 p-3 rounded-full mb-4">
                  <Calendar className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No pending bookings
                </h3>
                <p className="text-gray-500 mb-6">
                  There are currently no booking requests that require your attention.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {bookings.map((booking) => (
                <div
                  key={booking._id}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="flex flex-col gap-6">
                    {/* Status indicator bar at top */}
                    <div className="h-1 rounded-full -mt-6 -mx-6 mb-2 bg-yellow-500"></div>
                    
                    {/* Property title and booking code */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {booking.property?.title || "Property Not Found"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {booking.reservationCode}
                          </span>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(booking._id, "confirmed")}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Confirm
                        </button>
                        <button
                          onClick={() => updateStatus(booking._id, "canceled")}
                          className="bg-white text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                    
                    {/* Guest Information */}
                    <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm text-blue-700 font-medium">
                          {booking.user?.name || "Unknown Guest"}
                        </span>
                        <p className="text-xs text-blue-600">
                          {booking.user?.email}
                        </p>
                      </div>
                    </div>
                    
                    {/* Booking details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">Stay Period</span>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>
                            {booking.checkInDate} - {booking.checkOutDate}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">Property</span>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Home className="h-4 w-4 text-blue-500" />
                          <span>
                            {booking.property?.title || "Property Not Found"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">Total Price</span>
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                          <Banknote className="h-4 w-4 text-blue-500" />
                          <span>
                            {currencySymbols[booking.currency] || "$"}
                            {booking.totalPrice}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Confirm Action
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to <span className={`font-semibold ${currentAction === "confirmed" ? "text-green-600" : "text-red-600"}`}>{currentAction}</span> this reservation?
            </p>
            {currentBooking && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="mb-2">
                  <span className="font-semibold text-gray-700">Property:</span>{" "}
                  <span className="text-gray-800">{currentBooking.property?.title || "Property Not Found"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Guest:</span>{" "}
                  <span className="text-gray-800">{currentBooking.user?.name || "Unknown Guest"}</span>
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  currentAction === "confirmed" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                } transition-colors`}
                onClick={confirmStatusUpdate}
              >
                {currentAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminBookings;