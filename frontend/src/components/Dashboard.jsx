import { useState, useEffect, useCallback, useRef } from "react";
import { websocketService } from "../services/websocketService";
import { api } from "../utils/api";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  BedDouble,
  Bath,
  CalendarDays,
  X,
  Banknote,
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getAuthToken } from "../utils/api";
import Navbar from "./Navbar";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  isSameDay,
  differenceInDays,
  parseISO,
} from "date-fns";

const Dashboard = () => {
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isScrollingSidebar, setIsScrollingSidebar] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const calendarRef = useRef(null);
  const propertyListRef = useRef(null);

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const DAY_CELL_WIDTH = 64;
  const ROW_HEIGHT = 140;
  const BOOKING_HEIGHT = 32;
  const BOOKING_GAP = 4;

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const daysToShow = [...days];

  let nextDate = addDays(days[days.length - 1], 1);
  for (let i = 0; i < 7; i++) {
    daysToShow.push(nextDate);
    nextDate = addDays(nextDate, 1);
  }

  const getCurrencySymbol = (currency) => {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "CA$",
      AUD: "A$",
      INR: "₹",
      SGD: "S$",
    };
    return symbols[currency] || currency;
  };

  const calculateNights = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return differenceInDays(endDate, startDate);
  };

  const formatDate = (date) => {
    return format(new Date(date), "EEE, MMM d, yyyy");
  };

  const handleBookingClick = (booking) => {
    // Explicitly set the selected booking to show modal
    setSelectedBooking(booking);
  };

  const fetchProperties = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/properties`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/auth");
          return;
        }
        throw new Error("Failed to fetch properties");
      }

      const data = await response.json();
      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (err) {
      setError("Error fetching properties: " + err.message);
    }
  }, [navigate]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!user) {
        navigate("/auth");
        return;
      }

      let endpoint;
      if (user.role === "admin") {
        endpoint = "/api/bookings/admin";
      } else if (user.role === "client" && user._id) {
        endpoint = `/api/bookings/client/${user._id}`;
      } else {
        setError("Invalid user role or missing user ID");
        setLoading(false);
        return;
      }

      const data = await api.get(endpoint);
      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      if (err.message.includes("401") || err.message.includes("expired")) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/auth"), 2000);
      } else {
        setError("Failed to load bookings: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe(
      "bookingUpdate",
      (updatedBooking) => {
        if (user?.role === "admin" || updatedBooking.user?._id === user?._id) {
          setBookings((prev) => {
            const existingIndex = prev.findIndex(
              (booking) => booking._id === updatedBooking._id
            );
            if (existingIndex >= 0) {
              const newBookings = [...prev];
              newBookings[existingIndex] = updatedBooking;
              return newBookings;
            }
            return [...prev, updatedBooking];
          });
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchBookings();
    }
  }, [user, fetchProperties, fetchBookings]);

  useEffect(() => {
    if (properties.length > 0) {
      const filtered = properties.filter(
        (property) =>
          property.title
            .toLowerCase()
            .includes(propertySearchQuery.toLowerCase()) ||
          (property.location?.city &&
            property.location.city
              .toLowerCase()
              .includes(propertySearchQuery.toLowerCase()))
      );
      setFilteredProperties(filtered);
    }
  }, [propertySearchQuery, properties]);

  const handleCalendarScroll = (e) => {
    if (propertyListRef.current && !isScrollingSidebar) {
      propertyListRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handlePropertyListScroll = (e) => {
    setIsScrollingSidebar(true);
    if (calendarRef.current) {
      calendarRef.current.scrollTop = e.target.scrollTop;
    }
    setTimeout(() => setIsScrollingSidebar(false), 100);
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getBookingsForProperty = (propertyId) => {
    return bookings.filter((booking) => booking.property?._id === propertyId);
  };

  // Position bookings with smart layout algorithm to avoid overlaps
  const getPositionedBookings = (propertyId) => {
    const propertyBookings = getBookingsForProperty(propertyId);
    
    if (propertyBookings.length === 0) return [];
    
    // Sort bookings by start date
    const sortedBookings = [...propertyBookings].sort((a, b) => 
      new Date(a.checkInDate) - new Date(b.checkInDate)
    );
    
    // Track positions
    const rows = [];
    const positionedBookings = [];
    
    sortedBookings.forEach(booking => {
      const checkInDate = new Date(booking.checkInDate);
      const checkOutDate = new Date(booking.checkOutDate);
      
      // Find available row
      let rowIndex = 0;
      let foundRow = false;
      
      while (!foundRow && rowIndex < 10) { // Limit to 10 rows max
        if (!rows[rowIndex]) {
          rows[rowIndex] = [];
          foundRow = true;
        } else {
          // Check if this row has space
          const hasOverlap = rows[rowIndex].some(existingBooking => {
            const existingCheckIn = new Date(existingBooking.checkInDate);
            const existingCheckOut = new Date(existingBooking.checkOutDate);
            
            return (
              (checkInDate <= existingCheckOut && checkOutDate >= existingCheckIn)
            );
          });
          
          if (!hasOverlap) {
            foundRow = true;
          } else {
            rowIndex++;
          }
        }
      }
      
      // Add to row
      rows[rowIndex] = rows[rowIndex] || [];
      rows[rowIndex].push(booking);
      
      positionedBookings.push({
        ...booking,
        rowIndex
      });
    });
    
    return positionedBookings;
  };

  const getBookingStyle = (booking) => {
    const checkInDate = new Date(booking.checkInDate);
    const checkOutDate = new Date(booking.checkOutDate);
    const { rowIndex } = booking;

    let startDayIndex = daysToShow.findIndex((day) =>
      isSameDay(day, checkInDate)
    );
    if (startDayIndex < 0) {
      if (checkInDate < startOfMonth(currentMonth)) {
        startDayIndex = 0;
      } else {
        return { display: "none" };
      }
    }

    let endDayIndex = daysToShow.findIndex((day) =>
      isSameDay(day, checkOutDate)
    );
    if (endDayIndex < 0) {
      if (checkOutDate > daysToShow[daysToShow.length - 1]) {
        endDayIndex = daysToShow.length - 1;
      } else {
        return { display: "none" };
      }
    }

    const left = startDayIndex * DAY_CELL_WIDTH;
    const width = (endDayIndex - startDayIndex + 1) * DAY_CELL_WIDTH - 4;
    const top = 10 + rowIndex * (BOOKING_HEIGHT + BOOKING_GAP);

    const statusColors = {
      confirmed: {
        bg: "bg-gradient-to-r from-blue-500 to-blue-600",
        hover: "hover:from-blue-600 hover:to-blue-700",
        border: "border-blue-600"
      },
      pending: {
        bg: "bg-gradient-to-r from-amber-400 to-amber-500",
        hover: "hover:from-amber-500 hover:to-amber-600",
        border: "border-amber-500"
      },
      cancelled: {
        bg: "bg-gradient-to-r from-red-400 to-red-500",
        hover: "hover:from-red-500 hover:to-red-600",
        border: "border-red-500"
      }
    };

    const statusColor = statusColors[booking.status] || statusColors.pending;

    return {
      left: `${left}px`,
      width: `${width}px`,
      top: `${top}px`,
      height: `${BOOKING_HEIGHT}px`,
      className: `absolute transition-all duration-150 cursor-pointer rounded-md border shadow-md ${statusColor.bg} ${statusColor.hover} ${statusColor.border}`
    };
  };

  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl shadow-blue-500/10 border border-white">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        <p className="mt-4 text-blue-800 font-medium">
          Loading your dashboard...
        </p>
      </div>
    </div>
  );

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-red-100">
        <div className="text-center p-8 border border-red-200 rounded-2xl bg-white/90 backdrop-blur-xl shadow-xl shadow-red-500/10 max-w-md">
          <div className="text-red-600 mb-6 font-medium">{error}</div>
          <button
            onClick={() => {
              setError("");
              fetchBookings();
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="pt-16 h-screen overflow-hidden flex flex-col">
        <div className="px-4 py-3 bg-white shadow-md z-10 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors border border-blue-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium border border-blue-200"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors border border-blue-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-grow overflow-hidden">
          <div
            ref={propertyListRef}
            onScroll={handlePropertyListScroll}
            className="w-72 bg-white shadow-md backdrop-blur-xl border-r border-gray-200 overflow-y-auto"
          >
            <div className="sticky top-0 z-20 p-3 bg-white border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={propertySearchQuery}
                  onChange={(e) => setPropertySearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200 placeholder-gray-500 shadow-sm text-sm"
                />
              </div>
            </div>

            <div>
              {filteredProperties.map((property) => (
                <div
                  key={property._id}
                  className="p-3 border-b border-gray-200 hover:bg-blue-50 transition-colors"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <div className="flex items-start gap-3 h-full">
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 shadow-sm">
                      {property.photos?.[0] ? (
                        <img
                          src={property.photos[0].url}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-6 h-6 text-blue-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {property.title}
                      </h3>
                      <p className="flex items-center gap-1 mt-1 text-xs text-blue-600 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {property.location?.city || "Location not specified"}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md text-xs text-blue-600 font-medium">
                          <BedDouble className="w-3 h-3" /> {property.bedrooms}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-md text-xs text-purple-600 font-medium">
                          <Bath className="w-3 h-3" /> {property.bathrooms}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={calendarRef}
            onScroll={handleCalendarScroll}
            className="flex-1 overflow-x-auto overflow-y-auto relative"
          >
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200 flex min-w-max">
              <div className="flex">
                {daysToShow.map((day, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 text-center py-2 text-xs font-medium ${
                      format(day, "MMM") !== format(currentMonth, "MMM")
                        ? "text-gray-400 bg-gray-50/80"
                        : "text-gray-700"
                    } ${
                      isSameDay(day, new Date())
                        ? "bg-blue-50 text-blue-700"
                        : ""
                    }`}
                    style={{ width: `${DAY_CELL_WIDTH}px` }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase font-semibold">
                        {format(day, "EEE")}
                      </span>
                      <span
                        className={`w-7 h-7 flex items-center justify-center mt-1 rounded-full ${
                          isSameDay(day, new Date())
                            ? "bg-blue-500 text-white"
                            : ""
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-max">
              {filteredProperties.map((property) => {
                const positionedBookings = getPositionedBookings(property._id);
                
                return (
                  <div
                    key={property._id}
                    className="flex border-b border-gray-200 relative"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    <div className="flex h-full w-full">
                      {daysToShow.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`h-full border-r border-gray-100 flex-shrink-0 ${
                            format(day, "MMM") !== format(currentMonth, "MMM")
                              ? "bg-gray-50/50"
                              : ""
                          } ${
                            isSameDay(day, new Date()) ? "bg-blue-50/30" : ""
                          }`}
                          style={{ width: `${DAY_CELL_WIDTH}px` }}
                        ></div>
                      ))}
                    </div>

                    <div className="absolute inset-0">
                      {positionedBookings.map((booking) => {
                        const style = getBookingStyle(booking);
                        const nights = calculateNights(
                          booking.checkInDate,
                          booking.checkOutDate
                        );
                        
                        if (style.display === "none") return null;
                        
                        return (
                          <div
                            key={booking._id}
                            style={{
                              left: style.left,
                              width: style.width,
                              top: style.top,
                              height: style.height,
                              position: "absolute",
                              zIndex: 10,
                            }}
                            className={`${style.className} pointer-events-auto`}
                            onClick={() => handleBookingClick(booking)}
                          >
                            <div className="flex items-center justify-between w-full h-full px-2 text-white">
                              <div className="flex flex-col overflow-hidden">
                                <div className="text-xs font-semibold truncate">
                                  {booking.guestName}
                                </div>
                                <div className="text-[0.65rem] truncate opacity-90">
                                  {booking.bookingAgent?.name || "Direct"}
                                </div>
                              </div>
                              <div className="text-xs font-bold whitespace-nowrap">
                                {nights}N
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-800">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                  Booking Details
                </h3>

                <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property:</span>
                    <span className="font-medium text-blue-900">
                      {selectedBooking.property?.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guest:</span>
                    <span className="font-medium text-blue-900">
                      {selectedBooking.guestName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-medium text-blue-900">
                      {formatDate(selectedBooking.checkInDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-medium text-blue-900">
                      {formatDate(selectedBooking.checkOutDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nights:</span>
                    <span className="font-medium text-blue-900">
                      {calculateNights(
                        selectedBooking.checkInDate,
                        selectedBooking.checkOutDate
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking Channel:</span>
                    <span className="font-medium text-blue-900">
                      {selectedBooking.bookingAgent?.name || "Direct"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mobile:</span>
                    <span className="font-medium text-blue-900">{selectedBooking.phone}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-800">
                  <Banknote className="h-6 w-6 text-green-600" />
                  Payment Details
                </h3>

                <div className="space-y-3 bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-medium ${
                        selectedBooking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : selectedBooking.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="font-medium text-green-900">
                      {getCurrencySymbol(selectedBooking.currency)}
                      {selectedBooking.totalPrice?.toFixed(2)}
                    </span>
                  </div>
                  {selectedBooking.commissionPercentage > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission:</span>
                      <span className="font-medium text-green-900">
                        {selectedBooking.commissionPercentage}%
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reservation Code:</span>
                    <span className="font-medium text-green-900">
                      {selectedBooking.reservationCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booked At:</span>
                    <span className="font-medium text-green-900">
                      {format(
                        new Date(selectedBooking.createdAt),
                        "MMM d, yyyy HH:mm"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;