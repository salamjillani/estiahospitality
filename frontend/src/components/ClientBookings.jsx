import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { websocketService } from "../services/websocketService";
import Navbar from "../components/Navbar";
import {
  Loader2,
  Calendar,
  XCircle,
  Info,
  Clock,
  RefreshCw,
  Banknote,
  Download,
  AlertTriangle,
  CheckCircle,
  Building,
  Share2,
  MapPin,
  Users,
} from "lucide-react";

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
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);

  const handleDownloadInvoice = async (invoiceId) => {
    if (!invoiceId) {
      setError("Invoice ID is missing");
      return;
    }

    try {
      setDownloadingInvoice(invoiceId);
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType.includes("application/pdf")) {
        const errorText = await response.text();
        throw new Error(`Failed to download invoice: ${errorText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Download failed:", err);
      setError(err.message);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  // Fetch bookings initially
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/api/bookings/client/${user._id}?populate=invoice,property,user`
        );

        // Better handling of response structure
        const bookingsData =
          response?.data?.data || response?.data || response || [];

        console.log("Raw response:", response);
        console.log("Bookings data:", bookingsData);

        // Check if it's an array
        const bookingsArray = Array.isArray(bookingsData) ? bookingsData : [];

        const processedBookings = bookingsArray.map((booking) => {
          // Log each booking's invoice data for debugging
          console.log(`Booking ${booking._id} invoice:`, booking.invoice);

          return {
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
            // Ensure invoice data is properly structured
            invoice: booking.invoice || null,
          };
        });

        processedBookings.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setBookings(processedBookings);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        if (err.message?.includes("403")) {
          logout();
          navigate("/auth?session=expired");
        }
        setError(err.message || "Failed to fetch bookings");
        setLoading(false);
      }
    };

    if (user?._id) fetchBookings();
  }, [user?._id, navigate, logout]);

  useEffect(() => {
    if (!user?._id) return;

    websocketService.connect();

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    websocketService.subscribe("connect", handleConnect);
    websocketService.subscribe("disconnect", handleDisconnect);

    return () => {
      websocketService.unsubscribe("connect", handleConnect);
      websocketService.unsubscribe("disconnect", handleDisconnect);
    };
  }, [user?._id]);

  // Redirect if user is not a client
  useEffect(() => {
    if (user && user.role !== "client") {
      navigate("/");
    }
  }, [user, navigate]);

  const handleCancel = async (bookingId) => {
    try {
      if (!websocketService.socket?.connected) {
        websocketService.connect();
      }
      const response = await api.patch(`/api/bookings/client/${bookingId}`);

      if (response.error) {
        throw new Error(response.error);
      }

      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: "cancelled" } : b
        )
      );

      // Use websocketService for emitting events
      websocketService.emit("cancelBooking", bookingId);
    } catch (err) {
      console.error("Error canceling booking:", err);
      if (err.message?.includes("403")) {
        logout();
        navigate("/auth?session=expired");
      }
      setError(err.message || "Failed to cancel booking");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-slate-50 pt-16 px-4">
          <div className="text-center p-6 sm:p-8 bg-white rounded-2xl shadow-xl max-w-md mx-auto border border-blue-100 w-full">
            <div className="relative">
              <Loader2 className="animate-spin h-12 sm:h-16 w-12 sm:w-16 text-blue-600 mx-auto mb-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-3">
              Loading Your Bookings
            </h3>
            <p className="text-slate-500 mb-5 text-sm sm:text-base">
              If it takes too long to load, please click the refresh button
              below.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 font-medium mx-auto text-sm sm:text-base"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50 pt-16 sm:pt-20 pb-12 sm:pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 sm:mb-10 gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg shadow-lg shadow-blue-200">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <span>My Bookings</span>
              </h1>
              <p className="text-slate-500 text-base sm:text-lg">
                Manage all your property reservations in one place
              </p>
            </div>

            <Link
              to="/properties"
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 font-medium group text-sm sm:text-base w-full md:w-auto justify-center md:justify-start mt-4 md:mt-0"
            >
              <Building className="h-4 sm:h-5 w-4 sm:w-5 group-hover:scale-110 transition-transform" />
              Book New Property
            </Link>
          </div>

          {/* Real-time connection status */}
          {socketConnected && (
            <div className="mb-4 sm:mb-6 text-xs sm:text-sm text-green-600 bg-green-50 p-3 sm:p-4 rounded-xl flex items-center shadow-md border border-green-200">
              <div className="flex items-center gap-2">
                <span className="h-2 sm:h-3 w-2 sm:w-3 rounded-full bg-green-500 animate-pulse"></span>
                <span className="font-medium">Real-time updates active</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 sm:mb-8 text-xs sm:text-sm text-rose-600 bg-rose-50 p-4 sm:p-5 rounded-xl flex items-center gap-3 shadow-lg border border-rose-100 animate-pulse">
              <div className="bg-rose-100 p-1.5 sm:p-2 rounded-full">
                <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5 text-rose-500" />
              </div>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* No bookings state */}
          {bookings.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-10 md:p-16 text-center">
              <div className="flex flex-col items-center max-w-md mx-auto">
                <div className="bg-blue-50 p-4 sm:p-6 rounded-full mb-6 sm:mb-8 shadow-inner">
                  <Calendar className="h-12 sm:h-16 md:h-20 w-12 sm:w-16 md:w-20 text-blue-500" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">
                  No bookings found
                </h3>
                <p className="text-slate-500 mb-6 sm:mb-10 text-base sm:text-lg leading-relaxed">
                  You haven&apos;t made any bookings yet. Start your journey by
                  booking your first property!
                </p>
                <Link
                  to="/properties"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-medium"
                >
                  <Building className="h-5 sm:h-6 w-5 sm:w-6" />
                  Browse Properties
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:gap-8">
              {bookings.map((booking) => {
                const nights = calculateNights(
                  booking.checkInDate,
                  booking.checkOutDate
                );

                return (
                  <div
                    key={booking._id}
                    className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all hover:shadow-2xl"
                  >
                    {/* Status indicator bar at top */}
                    <div
                      className={`h-2 ${
                        booking.status === "confirmed"
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : booking.status === "pending"
                          ? "bg-gradient-to-r from-amber-400 to-amber-500"
                          : "bg-gradient-to-r from-rose-400 to-rose-500"
                      }`}
                    ></div>

                    <div className="p-4 sm:p-6 md:p-8">
                      <div className="flex flex-col gap-6 sm:gap-8">
                        {/* Property title and booking code */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                              <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
                              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 break-words">
                                {booking.property?.title || "Unknown Property"}
                              </h3>
                            </div>
                            <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-2">
                              <span className="font-mono text-xs bg-slate-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-slate-600 font-medium border border-slate-200">
                                {booking.reservationCode ||
                                  booking._id.substring(0, 8)}
                              </span>
                              <span
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                                  booking.status === "confirmed"
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    : booking.status === "pending"
                                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                                    : "bg-rose-100 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {getStatusIcon(booking.status)}
                                <span className="capitalize">
                                  {booking.status}
                                </span>
                              </span>
                            </div>
                          </div>

                          {["pending", "confirmed"].includes(
                            booking.status
                          ) && (
                            <button
                              onClick={() => handleCancel(booking._id)}
                              className="text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 transition-all text-xs sm:text-sm font-medium w-full md:w-auto justify-center mt-2 md:mt-0"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Cancel Booking</span>
                            </button>
                          )}
                        </div>

                        {/* Booking details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 md:p-8 rounded-xl border border-blue-100 shadow-inner">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">
                              Check-in
                            </span>
                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-blue-100">
                                <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
                              </div>
                              <span className="text-sm sm:text-base">
                                {formatDate(booking.checkInDate)}
                              </span>
                            </div>
                            {booking.arrivalTime && (
                              <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm mt-1.5 ml-9">
                                <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                                <span>Arrival: {booking.arrivalTime}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">
                              Check-out
                            </span>
                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-blue-100">
                                <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
                              </div>
                              <span className="text-sm sm:text-base">
                                {formatDate(booking.checkOutDate)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">
                              Duration
                            </span>
                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-blue-100">
                                <Users className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
                              </div>
                              <span className="text-sm sm:text-base">
                                {nights} night{nights !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">
                              Total Price
                            </span>
                            <div className="flex items-center gap-2 text-slate-800 font-bold text-base sm:text-lg">
                              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-blue-100">
                                <Banknote className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
                              </div>
                              <span>
                                {currencySymbols[booking.currency] || "$"}
                                {booking.totalPrice}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Invoice and actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2 sm:gap-3 text-slate-400">
                            <Share2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                            <span className="text-xs sm:text-sm">
                              Booking made on{" "}
                              <span className="text-slate-600 font-medium">
                                {formatDate(booking.createdAt || new Date())}
                              </span>
                            </span>
                          </div>

                          {booking.invoice && booking.invoice._id ? (
                            <button
                              onClick={() =>
                                handleDownloadInvoice(booking.invoice._id)
                              }
                              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center transition-all shadow-sm text-xs sm:text-sm w-full sm:w-auto justify-center mt-2 sm:mt-0 ${
                                downloadingInvoice === booking.invoice._id
                                  ? "bg-indigo-100 text-indigo-600 cursor-wait"
                                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:shadow"
                              }`}
                              disabled={
                                downloadingInvoice === booking.invoice._id
                              }
                            >
                              {downloadingInvoice === booking.invoice._id ? (
                                <Loader2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 animate-spin" />
                              ) : (
                                <Download className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2" />
                              )}
                              {downloadingInvoice === booking.invoice._id
                                ? "Processing..."
                                : "Download Invoice"}
                            </button>
                          ) : (
                            <span className="text-xs sm:text-sm text-slate-500 italic flex items-center gap-2 bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl w-full sm:w-auto justify-center mt-2 sm:mt-0">
                              <Info className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                              No Invoice Available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientBookings;
