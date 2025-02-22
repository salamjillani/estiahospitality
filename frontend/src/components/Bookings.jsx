import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/bookings", {
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch bookings");
        const data = await response.json();

        setBookings(data.bookings || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const updatedBooking = await api.patch(`/api/bookings/${bookingId}/status`, { status: newStatus });
      
      setBookings(prev =>
        prev.map(booking => 
          booking._id === bookingId ? updatedBooking : booking
        )
      );
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="bg-red-50 text-red-600 px-6 py-4 rounded-lg shadow-sm">
            <p className="font-medium">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                All Bookings
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and view all bookings
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors duration-150"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No bookings found
              </h3>
              <p className="mt-1 text-gray-500">
                Get started by creating your first booking
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="w-32 px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words whitespace-normal">
                      ID
                    </th>
                    <th className="w-40 px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words whitespace-normal">
                      Guest
                    </th>
                    <th className="w-40 px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words whitespace-normal">
                      Property
                    </th>
                    <th className="w-24 px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words whitespace-normal">
                      Type
                    </th>
                    <th className="w-40 px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words whitespace-normal">
                      Location
                    </th>
                    <th className="w-32 px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words whitespace-normal">
                      Phone
                    </th>
                    <th className="w-40 px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words whitespace-normal">
                      Dates
                    </th>
                    <th className="w-24 px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words whitespace-normal">
                      Price
                    </th>
                    <th className="w-24 px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words whitespace-normal">
                      Source
                    </th>
                    <th className="w-28 px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words whitespace-normal">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 font-mono break-words whitespace-normal">
                          {booking._id}
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <div className="font-medium text-gray-900 break-words whitespace-normal">
                          {booking.guestName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.numberOfGuests} guests
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <div className="text-gray-900 break-words whitespace-normal">
                          {booking.property?.title || "N/A"}
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <span className="text-sm text-gray-900 capitalize break-words whitespace-normal">
                          {booking.property?.type || "N/A"}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <span className="text-sm text-gray-900 break-words whitespace-normal">
                          {booking.property?.location?.city}, {booking.property?.location?.country || "N/A"}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <span className="text-sm text-gray-900 break-words whitespace-normal">
                          {booking.phone || "N/A"}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 break-words whitespace-normal">
                          {new Date(booking.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.totalNights} nights
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <div className="font-medium text-gray-900 break-words whitespace-normal">
                          ${booking.totalPrice?.toFixed(2) || "0.00"}
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 break-words whitespace-normal">
                          {booking.source}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        {user?.role === "admin" ? (
                          <select
                            value={booking.status}
                            onChange={(e) =>
                              handleStatusUpdate(booking._id, e.target.value)
                            }
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            } cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500`}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {booking.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookings;