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
  FileText,
  Info,
} from "lucide-react";

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
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

  const toggleDetails = (id) => {
    setShowDetails(showDetails === id ? null : id);
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

              const locationParts = [
                booking.property?.location?.address,
                booking.property?.location?.city,
                booking.property?.location?.country,
              ]
                .map(part => part ? part.trim() : "")
                .filter(part => part !== "");
              const location = locationParts.length > 0 ? locationParts.join(", ") : "N/A";

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
                location,
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

            {/* Mobile view - Card layout */}
            <div className="lg:hidden space-y-4">
              {bookings.map((booking) => (
                <div 
                  key={booking._id} 
                  className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                          {(booking.user?.name || "G").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-800 font-medium">{booking.user?.name || "Guest " + booking.reservationCode}</span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Property:</span>
                        <span className="text-gray-800 font-medium">{booking.property?.title || "Property Not Found"}</span>
                      </div>
                      
                                                  <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="text-gray-800 text-right max-w-48 truncate" title={booking.location}>
                          {booking.location}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Dates:</span>
                        <div className="flex items-center gap-1 text-xs bg-indigo-50 px-2 py-1 rounded-md text-indigo-600">
                          <Calendar className="h-3 w-3" />
                          <span>{booking.checkInDate}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span>{booking.checkOutDate}</span>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Nights:</span>
                        <span className="text-gray-800">{booking.nights}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Channel:</span>
                        <span className="text-gray-800">{booking.channelName}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Reservation:</span>
                        <span className="text-gray-800 font-medium">
                          {currencySymbols[booking.currency] || "$"}{booking.reservationPrice}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Fees/Taxes:</span>
                        <span className="text-gray-800 font-medium">
                          {currencySymbols[booking.currency] || "$"}{booking.feesTaxes}
                        </span>
                      </div>
                    </div>

                    {booking.invoice && booking.invoice._id && (
                      <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Invoice #{booking.invoice.invoiceNumber || "N/A"}</span>
                        <button
                          onClick={() => handleDownloadInvoice(booking.invoice._id)}
                          className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 px-3 py-1.5 rounded-md flex items-center transition-colors shadow-sm text-xs"
                          disabled={downloadingInvoice === booking.invoice._id}
                        >
                          {downloadingInvoice === booking.invoice._id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3 mr-1" />
                          )}
                          Download Invoice
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop view - Table layout */}
            <div className="hidden lg:block bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="w-16 px-4 py-3 text-left text-xs font-semibold text-gray-700">
                        Guest
                      </th>
                      <th className="w-24 px-4 py-3 text-left text-xs font-semibold text-gray-700">
                        Property
                      </th>
                      <th className="w-16 px-4 py-3 text-left text-xs font-semibold text-gray-700">
                        Channel
                      </th>
                      <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-gray-700">
                        Nights
                      </th>
                      <th className="w-20 px-4 py-3 text-left text-xs font-semibold text-gray-700">
                        Location
                      </th>
                      <th className="w-28 px-4 py-3 text-left text-xs font-semibold text-gray-700">
                        Dates
                      </th>
                      <th className="w-20 px-4 py-3 text-left text-xs font-semibold text-gray-700">
                        Price
                      </th>
                      <th className="w-14 px-4 py-3 text-left text-xs font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="w-24 px-4 py-3 text-left text-xs font-semibold text-gray-700">
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                              {(booking.user?.name || "G")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <span className="text-gray-800 font-medium text-xs truncate">
                              {booking.user?.name ||
                                "Guest " + booking.reservationCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-700 text-xs truncate">
                            {booking.property?.title || "Property Not Found"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700 text-xs">
                            {booking.channelName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700 text-xs">
                            {booking.nights}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-full overflow-hidden">
                            <span className="text-gray-700 text-xs block truncate" title={booking.location}>
                              {booking.location}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs bg-indigo-50 px-2 py-1 rounded-md text-indigo-600">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{booking.checkInDate}</span>
                            <ChevronRight className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{booking.checkOutDate}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs space-y-1">
                            <div className="font-medium text-gray-800">
                              {currencySymbols[booking.currency] || "$"}{booking.reservationPrice}
                            </div>
                            <div className="text-gray-500">
                              +{currencySymbols[booking.currency] || "$"}{booking.feesTaxes} tax
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm ${
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
                        <td className="px-4 py-3">
                          {booking.invoice && booking.invoice._id ? (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleDownloadInvoice(booking.invoice._id)}
                                className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 px-2 py-1 rounded-md flex items-center justify-center transition-colors shadow-sm text-xs"
                                disabled={downloadingInvoice === booking.invoice._id}
                              >
                                {downloadingInvoice === booking.invoice._id ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <Download className="w-3 h-3 mr-1" />
                                )}
                                Download Invoice
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">
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
