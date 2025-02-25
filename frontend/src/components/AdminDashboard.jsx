// src/components/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { Loader2, Users, Calendar, Shield } from "lucide-react";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch users and bookings
        const usersRes = await api.get("/api/auth/users");
        const bookingsRes = await api.get("/api/bookings");

        const processedBookings = bookingsRes.map((booking) => ({
          ...booking,
          checkInDate: booking.checkInDate
            ? new Date(booking.checkInDate).toLocaleDateString()
            : "N/A",
          checkOutDate: booking.checkOutDate
            ? new Date(booking.checkOutDate).toLocaleDateString()
            : "N/A",
          totalPrice: booking.totalPrice?.toFixed(2) || "N/A",
          user: booking.user || { name: "Unknown" },
          property: booking.property || { title: "Unknown Property" },
        }));

        setUsers(usersRes);
        setBookings(processedBookings);
        setError("");
      } catch (err) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") fetchData();
  }, [user]);

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Users Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Users className="h-6 w-6" /> Registered Users ({users.length})
        </h2>
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Registered On
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                      <Shield className="w-4 h-4 mr-1" /> {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bookings Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Calendar className="h-6 w-6" /> All Bookings ({bookings.length})
        </h2>
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  R.Code
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Guest
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Property
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Dates
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Total Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td className="px-6 py-4 font-mono">
                    {booking.reservationCode}
                  </td>
                  <td className="px-6 py-4">
                    {booking.user?.name || "Guest " + booking.reservationCode}
                  </td>
                  <td className="px-6 py-4">
                    {booking.property?.title || "Property Not Found"}
                  </td>
                  <td className="px-6 py-4">
                    {booking.checkInDate} - {booking.checkOutDate}
                  </td>
                  <td className="px-6 py-4">
                    {currencySymbols[booking.currency] || "$"}
                    {booking.totalPrice}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
