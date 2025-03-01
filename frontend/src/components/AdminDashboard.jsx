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
  Building,
  Banknote,
  ChevronRight,
  AlertTriangle,
  User,
  ClipboardList,
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
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-500 mt-1">
                Manage users and bookings across your property network
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-indigo-50 rounded-lg text-indigo-600 font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Admin Access</span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 text-sm text-red-600 bg-red-50 p-4 rounded-lg flex items-center gap-3 shadow-sm border border-red-100">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Total Users</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {users.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Total Bookings</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {bookings.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Banknote className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Active Reservations</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {bookings.filter((b) => b.status === "confirmed").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <User className="h-6 w-6 text-indigo-600" /> Registered Users
              </h2>
              <span className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full">
                {users.length} users
              </span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800">
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            <Shield className="w-3 h-3 mr-1" /> {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-indigo-600" /> All
                Bookings
              </h2>
              <span className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full">
                {bookings.length} bookings
              </span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        R.Code
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Guest
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Property
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Dates
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Total Price
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
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
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {booking.reservationCode}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                              {(booking.user?.name || "G")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <span className="text-gray-800">
                              {booking.user?.name ||
                                "Guest " + booking.reservationCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">
                              {booking.property?.title || "Property Not Found"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>{booking.checkInDate}</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>{booking.checkOutDate}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          <span className="text-gray-800">
                            {currencySymbols[booking.currency] || "$"}
                            {booking.totalPrice}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
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
                        <td className="px-6 py-4">
                          {booking.invoice && booking.invoice._id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleDownloadInvoice(booking.invoice._id)
                                }
                                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded flex items-center transition-colors"
                                disabled={
                                  downloadingInvoice === booking.invoice._id
                                }
                              >
                                {downloadingInvoice === booking.invoice._id ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4 mr-1" />
                                )}
                                Download Invoice
                              </button>
                              <span className="text-sm text-gray-500 flex items-center">
                                #{booking.invoice.invoiceNumber || "N/A"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm italic">
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
