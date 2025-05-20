import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import Navbar from "../components/Navbar";
import {
  Loader2,
  Calendar,
  Download,
  ChevronRight,
  AlertTriangle,
  ClipboardList,
  Clock,
} from "lucide-react";

const Dashboard = () => {
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
        const bookingsRes = await api.get(
          "/api/bookings/admin/bookings?populate=invoice"
        );
        const processedBookings = Array.isArray(bookingsRes.data || bookingsRes)
          ? (bookingsRes.data || bookingsRes).map((booking) => {
              const checkInDate = booking.checkInDate
                ? new Date(booking.checkInDate).toLocaleDateString()
                : "N/A";
              const checkOutDate = booking.checkOutDate
                ? new Date(booking.checkOutDate).toLocaleDateString()
                : "N/A";
              const invoice = booking.invoice || null;
              
              // Calculate nights
              const nights = booking.checkInDate && booking.checkOutDate
                ? Math.ceil(
                    (new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / 
                    (1000 * 60 * 60 * 24)
                  )
                : "N/A";

              // Calculate reservation price and fees/taxes (based on 13% VAT from invoice)
              const totalPrice = parseFloat(booking.totalPrice) || 0;
              const vatRate = 13;
              const netAmount = (totalPrice * 100) / (100 + vatRate);
              const taxAmount = totalPrice - netAmount;

              return {
                ...booking,
                checkInDate,
                checkOutDate,
                nights,
                _id: booking._id,
                invoiceNumber: invoice?.invoiceNumber || "N/A",
                reservationPrice: netAmount.toFixed(2),
                feesTaxes: taxAmount.toFixed(2),
                user: booking.user || { name: "Unknown" },
                property: booking.property || { 
                  title: "Unknown Property",
                  location: { city: "N/A" }
                },
                invoice,
                channelName: booking.bookingAgent?.name || "Direct",
                location: booking.property?.location?.city || "N/A",
              };
            })
          : [];
        processedBookings.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
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
          {error && (
            <div className="mb-6 text-sm text-red-600 bg-red-50 p-4 rounded-xl flex items-center gap-3 shadow-md border border-red-100 animate-pulse">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

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
                        Channel
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Nights
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Location
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Dates
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">
                        Reservation Price
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">
                        Fees/Taxes
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
                          <span className="text-gray-700 text-sm">
                            {booking.channelName}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span className="text-gray-700 text-sm">
                            {booking.nights}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span className="text-gray-700 text-sm">
                            {booking.location}
                          </span>
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
                            {booking.reservationPrice}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium hidden sm:table-cell text-sm">
                          <span className="text-gray-800">
                            {currencySymbols[booking.currency] || "$"}
                            {booking.feesTaxes}
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

export default Dashboard;