import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import Navbar from "../components/Navbar";
import {
  Loader2,
  Users,
  Calendar,
  Shield,
  Download,
  Banknote,
  ChevronRight,
  AlertTriangle,
  User,
  ClipboardList,
  ArrowUpRight,
  Clock
} from "lucide-react";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const { user } = useAuth();

  const BASE_URL = import.meta.env.VITE_API_URL || "";

  const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
  };

  const handleDownloadInvoice = async (invoiceId) => {
    if (!invoiceId) {
      console.error("No invoice ID provided");
      setError("Invoice ID is missing");
      return;
    }

    try {
      setDownloadingInvoice(invoiceId);

      const response = await fetch(
        `${BASE_URL}/api/invoices/${invoiceId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! Status: ${response.status}`, errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
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
      setError(`Failed to download invoice: ${err.message}`);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch users
        const usersRes = await api.get("/api/auth/users");

        // Fetch bookings with properly populated invoice data
        const bookingsRes = await api.get(
          "/api/bookings/admin/bookings?populate=invoice"
        );

        // Process bookings data with safer access to possibly undefined properties
        const processedBookings = Array.isArray(bookingsRes.data || bookingsRes)
          ? (bookingsRes.data || bookingsRes).map((booking) => {
              // Handle nested objects and dates
              const checkInDate = booking.checkInDate
                ? new Date(booking.checkInDate).toLocaleDateString()
                : "N/A";

              const checkOutDate = booking.checkOutDate
                ? new Date(booking.checkOutDate).toLocaleDateString()
                : "N/A";

              // Safely extract invoice data if it exists
              const invoice = booking.invoice || null;

              // Create a processed booking object with safe property access
              return {
                ...booking,
                checkInDate,
                checkOutDate,
                // Use optional chaining to safely access invoice properties
                _id: booking._id, // Use booking ID if invoice ID is not available
                invoiceNumber: invoice?.invoiceNumber || "N/A",
                totalPrice: booking.totalPrice?.toFixed(2) || "N/A",
                user: booking.user || { name: "Unknown" },
                property: booking.property || { title: "Unknown Property" },
                invoice, // Keep the full invoice object
              };
            })
          : [];
        processedBookings.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setUsers(usersRes.data || usersRes);
        setBookings(processedBookings);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") fetchData();
  }, [user]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-500 mt-1">
                Manage users and bookings across your property network
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-indigo-50 rounded-lg text-indigo-600 font-medium flex items-center gap-2 shadow-sm">
                <Shield className="h-4 w-4" />
                <span>Admin Access</span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 text-sm text-red-600 bg-red-50 p-4 rounded-xl flex items-center gap-3 shadow-md border border-red-100 animate-pulse">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-xs sm:text-sm font-medium">Total Users</h3>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">
                    {users.length}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:mt-3 text-xs text-blue-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span>Active platform members</span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-xs sm:text-sm font-medium">Total Bookings</h3>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">
                    {bookings.length}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:mt-3 text-xs text-purple-600 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>All time reservations</span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
                  <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-xs sm:text-sm font-medium">Active Reservations</h3>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">
                    {bookings.filter((b) => b.status === "confirmed").length}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:mt-3 text-xs text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span>Current confirmed bookings</span>
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 text-gray-800">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" /> Registered Users
              </h2>
              <span className="bg-indigo-100 text-indigo-800 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-medium shadow-sm">
                {users.length} users
              </span>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">
                        Email
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Role
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden md:table-cell">
                        Registered On
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm text-xs sm:text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800 text-sm sm:text-base">
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 hidden sm:table-cell text-sm">
                          {user.email}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span
                            className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium shadow-sm ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            <Shield className="w-3 h-3 mr-1" /> {user.role}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 hidden md:table-cell text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bookings Section */}
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 text-gray-800">
                <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" /> All
                Bookings
              </h2>
              <span className="bg-indigo-100 text-indigo-800 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-medium shadow-sm">
                {bookings.length} bookings
              </span>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">
                        R.Code
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Guest
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden md:table-cell">
                        Property
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Dates
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">
                        Total Price
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden lg:table-cell">
                        Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr
                        key={booking._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md text-gray-700 shadow-sm">
                            {booking.reservationCode}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                              {(booking.user?.name || "G")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <span className="text-gray-800 font-medium text-sm">
                              {booking.user?.name ||
                                "Guest " + booking.reservationCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 text-sm">
                              {booking.property?.title || "Property Not Found"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-1 text-xs sm:text-sm bg-indigo-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-indigo-600 max-w-fit">
                            <Calendar className="h-3 w-3" />
                            <span className="whitespace-nowrap">{booking.checkInDate}</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="whitespace-nowrap">{booking.checkOutDate}</span>
                          </div>
                          {booking.arrivalTime && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 ml-1 sm:ml-2">
                              <Clock className="h-3 w-3" />
                              <span>Arrival: {booking.arrivalTime}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium hidden sm:table-cell text-sm">
                          <span className="text-gray-800">
                            {currencySymbols[booking.currency] || "$"}
                            {booking.totalPrice}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span
                            className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium shadow-sm ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                          {booking.invoice && booking.invoice._id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleDownloadInvoice(booking.invoice._id)
                                }
                                className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md flex items-center transition-colors shadow-sm text-xs sm:text-sm"
                                disabled={
                                  downloadingInvoice === booking.invoice._id
                                }
                              >
                                {downloadingInvoice === booking.invoice._id ? (
                                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                                ) : (
                                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                )}
                                Download Invoice
                              </button>
                              <span className="text-xs sm:text-sm text-gray-500 flex items-center">
                                #{booking.invoice.invoiceNumber || "N/A"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs sm:text-sm italic">
                              No Invoice
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;