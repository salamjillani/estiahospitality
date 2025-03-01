import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { websocketService } from "../services/websocketService";
import Navbar from "../components/Navbar";
import {
  Loader2,
  Calendar,
  Home,
  XCircle,
  Info,
  Clock,
  Banknote,
  Download,
  AlertTriangle,
  CheckCircle,
  Building,
  Share2,
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
      const response = await fetch(
        `/api/invoices/${invoiceId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          credentials: "include",
        }
      );

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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-16">
          <div className="text-center">
            <div className="relative">
              <Loader2 className="animate-spin h-14 w-14 text-blue-600 mx-auto mb-6" />
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-2">
              Loading your bookings
            </h3>
            <p className="text-slate-500">
              We&apos;re preparing your travel itinerary...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-slate-50 pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                <span>My Bookings</span>
              </h1>
              <p className="text-slate-500">
                Manage all your property reservations in one place
              </p>
            </div>

            <Link
              to="/properties"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2 font-medium"
            >
              <Building className="h-5 w-5" />
              Book New Property
            </Link>
          </div>

          {/* Real-time connection status */}
          {socketConnected && (
            <div className="mb-6 text-sm text-emerald-600 bg-emerald-50 p-4 rounded-lg flex items-center shadow-sm border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-medium">Real-time updates active</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 text-sm text-rose-600 bg-rose-50 p-4 rounded-lg flex items-center gap-3 shadow-sm border border-rose-100">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* No bookings state */}
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-16 text-center">
              <div className="flex flex-col items-center max-w-md mx-auto">
                <div className="bg-blue-50 p-5 rounded-full mb-6">
                  <Calendar className="h-16 w-16 text-blue-500" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-3">
                  No bookings found
                </h3>
                <p className="text-slate-500 mb-8">
                  You haven&apos;t made any bookings yet. Start your journey by
                  booking your first property!
                </p>
                <Link
                  to="/properties"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-3 text-lg font-medium"
                >
                  <Building className="h-6 w-6" />
                  Browse Properties
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-8">
              {bookings.map((booking) => {
                const nights = calculateNights(
                  booking.checkInDate,
                  booking.checkOutDate
                );

                return (
                  <div
                    key={booking._id}
                    className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
                  >
                    {/* Status indicator bar at top */}
                    <div
                      className={`h-2 ${
                        booking.status === "confirmed"
                          ? "bg-emerald-500"
                          : booking.status === "pending"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    ></div>

                    <div className="p-8">
                      <div className="flex flex-col gap-8">
                        {/* Property title and booking code */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-800">
                              {booking.property?.title || "Unknown Property"}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                {booking.reservationCode ||
                                  booking._id.substring(0, 8)}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                                  booking.status === "confirmed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : booking.status === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-rose-100 text-rose-700"
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
                              className="text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg px-4 py-2 flex items-center gap-2 transition-all text-sm font-medium"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Cancel Booking</span>
                            </button>
                          )}
                        </div>

                        {/* Booking details */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-xl">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Check-in Date
                            </span>
                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                              <Calendar className="h-5 w-5 text-blue-500" />
                              <span>{formatDate(booking.checkInDate)}</span>
                            </div>
                            {booking.arrivalTime && (
                              <div className="flex items-center gap-2 text-slate-500 text-sm mt-1.5 ml-7">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Arrival: {booking.arrivalTime}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Check-out Date
                            </span>
                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                              <Calendar className="h-5 w-5 text-blue-500" />
                              <span>{formatDate(booking.checkOutDate)}</span>
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Duration
                            </span>
                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                              <Home className="h-5 w-5 text-blue-500" />
                              <span>
                                {nights} night{nights !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Total Price
                            </span>
                            <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                              <Banknote className="h-5 w-5 text-blue-500" />
                              <span>
                                {currencySymbols[booking.currency] || "$"}
                                {booking.totalPrice}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Invoice and actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-3">
                            <Share2 className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-500">
                              Booking made on{" "}
                              {formatDate(booking.createdAt || new Date())}
                            </span>
                          </div>

                          {booking.invoice && booking.invoice._id ? (
                            <button
                              onClick={() =>
                                handleDownloadInvoice(booking.invoice._id)
                              }
                              className={`px-3 py-1 rounded flex items-center transition-colors ${
                                downloadingInvoice === booking.invoice._id
                                  ? "bg-indigo-100 text-indigo-600 cursor-wait"
                                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                              }`}
                              disabled={
                                downloadingInvoice === booking.invoice._id
                              }
                            >
                              {downloadingInvoice === booking.invoice._id ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4 mr-1" />
                              )}
                              {downloadingInvoice === booking.invoice._id
                                ? "Processing..."
                                : "Download Invoice"}
                            </button>
                          ) : (
                            <span className="text-sm text-slate-500 italic flex items-center gap-2">
                              <Info className="h-4 w-4" />
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
