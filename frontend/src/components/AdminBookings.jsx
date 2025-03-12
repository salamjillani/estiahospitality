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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 pt-16">
          <div className="text-center w-full max-w-sm px-4">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
              <Loader2 className="animate-spin h-12 w-12 sm:h-14 sm:w-14 text-indigo-600 mx-auto mb-4 sm:mb-5" />
              <p className="text-gray-700 font-medium text-sm sm:text-base">Loading booking requests...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-16 sm:pt-20 pb-10 sm:pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                New Booking Requests
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Manage and respond to pending reservation requests
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-white border border-indigo-100 text-indigo-600 px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium text-sm sm:text-base"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
              Refresh
            </button>
          </div>

          {/* Real-time connection status */}
          {socketConnected && (
            <div className="mb-4 sm:mb-6 text-xs sm:text-sm text-green-600 bg-green-50 p-3 sm:p-4 rounded-xl flex items-center shadow-md border border-green-200">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500 animate-pulse"></span>
                <span className="font-medium">Real-time updates active</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 sm:mb-6 text-xs sm:text-sm text-red-600 bg-red-50 p-3 sm:p-4 rounded-xl flex items-center gap-2 sm:gap-3 shadow-md border border-red-200">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 sm:p-14 text-center">
              <div className="flex flex-col items-center max-w-md mx-auto">
                <div className="bg-indigo-50 p-3 sm:p-4 rounded-full mb-4 sm:mb-6">
                  <Calendar className="h-10 w-10 sm:h-14 sm:w-14 text-indigo-500" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3">
                  No pending bookings
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  There are currently no booking requests that require your attention.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md flex items-center gap-2 font-medium text-sm sm:text-base"
                >
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                  Refresh List
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {bookings.map((booking) => (
                <div
                  key={booking._id}
                  className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="flex flex-col gap-4 sm:gap-6">
                    {/* Status indicator bar at top */}
                    <div className="h-1.5 rounded-full -mt-4 sm:-mt-6 -mx-4 sm:-mx-6 mb-1 sm:mb-2 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
                    
                    {/* Property title and booking code */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 line-clamp-1">
                          {booking.property?.title || "Property Not Found"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-1.5">
                          <span className="font-mono text-xs bg-indigo-100 px-2 py-0.5 sm:py-1 rounded text-indigo-700">
                            {booking.reservationCode}
                          </span>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                        <button
                          onClick={() => updateStatus(booking._id, "confirmed")}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium shadow-md"
                        >
                          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Confirm
                        </button>
                        <button
                          onClick={() => updateStatus(booking._id, "canceled")}
                          className="bg-white text-red-600 border border-red-200 hover:bg-red-50 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium shadow-sm"
                        >
                          <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                    
                    {/* Guest Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-xl flex items-center gap-3 sm:gap-4">
                      <div className="bg-white p-2 sm:p-2.5 rounded-full shadow-sm">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm text-indigo-700 font-medium">
                          {booking.user?.name || "Unknown Guest"}
                        </span>
                        <p className="text-xs text-indigo-600 break-all">
                          {booking.user?.email}
                        </p>
                      </div>
                    </div>
                    
                    {/* Booking details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1 font-medium">Stay Period</span>
                        <div className="flex items-center gap-2 sm:gap-2.5 text-gray-700">
                          <div className="bg-indigo-100 p-1.5 rounded-full">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600" />
                          </div>
                          <span className="font-medium text-xs sm:text-sm">
                            {booking.checkInDate} - {booking.checkOutDate}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1 font-medium">Property</span>
                        <div className="flex items-center gap-2 sm:gap-2.5 text-gray-700">
                          <div className="bg-indigo-100 p-1.5 rounded-full">
                            <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600" />
                          </div>
                          <span className="font-medium text-xs sm:text-sm truncate">
                            {booking.property?.title || "Property Not Found"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1 font-medium">Total Price</span>
                        <div className="flex items-center gap-2 sm:gap-2.5 text-gray-700">
                          <div className="bg-indigo-100 p-1.5 rounded-full">
                            <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600" />
                          </div>
                          <span className="font-bold text-xs sm:text-sm">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-5 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl animate-fadeIn">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
              Confirm Action
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Are you sure you want to <span className={`font-semibold ${currentAction === "confirmed" ? "text-green-600" : "text-red-600"}`}>{currentAction}</span> this reservation?
            </p>
            {currentBooking && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl text-sm">
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
                className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-all text-sm sm:text-base"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-white font-medium text-sm sm:text-base ${
                  currentAction === "confirmed" 
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" 
                    : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                } transition-all`}
                onClick={confirmStatusUpdate}
              >
                {currentAction === "confirmed" ? "Confirm" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminBookings;