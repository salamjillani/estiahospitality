import { useState, useEffect, useCallback, useRef } from "react";
import { websocketService } from "../services/websocketService";
import { api } from "../utils/api";
import {
  Loader2,
  Search,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Home,
  Clock,
  MapPin,
  BedDouble,
  Bath,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
import { useAuth } from "../context/AuthContext";
import { getAuthToken } from "../utils/api";
import Navbar from "./Navbar";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isSameDay, differenceInDays } from 'date-fns';

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
  const calendarRef = useRef(null);
  const propertyListRef = useRef(null);
  
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Define constants for layout
  const DAY_CELL_WIDTH = 60; // Increased from 40 to 60
  const ROW_HEIGHT = 140; // Increased from 16 to give more vertical space

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const daysToShow = [...days]; // Copy the days array for display
  
  // Add 7 days from next month
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

  const fetchProperties = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/properties`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
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
          setBookings(prev => {
            const existingIndex = prev.findIndex(booking => booking._id === updatedBooking._id);
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

  // Handle calendar horizontal scrolling
  const handleCalendarScroll = (e) => {
    if (propertyListRef.current && !isScrollingSidebar) {
      propertyListRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // Handle property list vertical scrolling
  const handlePropertyListScroll = (e) => {
    setIsScrollingSidebar(true);
    if (calendarRef.current) {
      calendarRef.current.scrollTop = e.target.scrollTop;
    }
    // Reset the scrolling flag after a short delay
    setTimeout(() => setIsScrollingSidebar(false), 100);
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getBookingsForProperty = (propertyId) => {
    return bookings.filter(booking => booking.property?._id === propertyId);
  };

  const getBookingStyle = (booking, index, totalBookings) => {
    const checkInDate = new Date(booking.checkInDate);
    const checkOutDate = new Date(booking.checkOutDate);
    
    // Find the start day index (if checkInDate is before currentMonth, start from day 0)
    let startDayIndex = daysToShow.findIndex(day => isSameDay(day, checkInDate));
    if (startDayIndex < 0) {
      // If check-in date is before current month, start from the beginning
      if (checkInDate < startOfMonth(currentMonth)) {
        startDayIndex = 0;
      } else {
        // If check-in date is not found (after displayed days), don't show
        return { display: 'none' };
      }
    }
    
    // Find the end day index
    let endDayIndex = daysToShow.findIndex(day => isSameDay(day, checkOutDate));
    if (endDayIndex < 0) {
      // If check-out date is after displayed days, end at the last day
      if (checkOutDate > daysToShow[daysToShow.length - 1]) {
        endDayIndex = daysToShow.length - 1;
      } else {
        // If end date is before first day, don't show
        return { display: 'none' };
      }
    }
    
    // Calculate the width and left position
    const left = startDayIndex * DAY_CELL_WIDTH;
    const width = (endDayIndex - startDayIndex + 1) * DAY_CELL_WIDTH;
    
    // Improved booking heights and visibility
    const BOOKING_HEIGHT = 36; // Increased from 24 to 36
    const VERTICAL_GAP = 8; // Increased from 4 to 8
    const TOP_MARGIN = 10; // Increased from 6 to 10
    
    // Calculate combined height of bookings plus gaps
    const totalRequiredHeight = (BOOKING_HEIGHT * totalBookings) + (VERTICAL_GAP * (totalBookings - 1));
    
    // If we have more bookings than can fit in the row height, scale them down
    const availableHeight = ROW_HEIGHT - (TOP_MARGIN * 2);
    
    let actualBookingHeight, actualGap;
    
    if (totalRequiredHeight > availableHeight && totalBookings > 1) {
      // Scale down proportionally
      const ratio = availableHeight / totalRequiredHeight;
      actualBookingHeight = Math.max(28, Math.floor(BOOKING_HEIGHT * ratio)); // Increased minimum height from 18 to 28
      actualGap = Math.max(4, Math.floor(VERTICAL_GAP * ratio)); // Increased minimum gap from 2 to 4
    } else {
      actualBookingHeight = BOOKING_HEIGHT;
      actualGap = VERTICAL_GAP;
    }
    
    // Calculate top position based on index and adjusted heights
    const topPosition = TOP_MARGIN + (index * (actualBookingHeight + actualGap));
    
    return {
      left: `${left}px`,
      width: `${width}px`,
      position: 'absolute',
      height: `${actualBookingHeight}px`,
      top: `${topPosition}px`,
      zIndex: 10,
      borderRadius: '0.375rem', // Slightly increased border radius
      boxShadow: '0 4px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.2)', // Enhanced shadow
      backgroundColor: booking.status === "confirmed" 
        ? '#3B82F6' 
        : booking.status === "cancelled" 
          ? '#EF4444' 
          : '#F59E0B',
      color: 'white',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      fontSize: '0.875rem', // Increased from 0.8rem to 0.875rem
      fontWeight: '500',
      padding: '0 0.75rem', // Increased from 0.5rem to 0.75rem
      textShadow: '0 1px 1px rgba(0,0,0,0.2)', // Enhanced text shadow
      clipPath: 'inset(0 0 0 0)', // Ensure the booking doesn't overflow its container
    };
  };

  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl shadow-blue-500/10 border border-white">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        <p className="mt-4 text-blue-800 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  // Loading state
  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  // Error state with retry button
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
  
  const BookingTooltip = ({ booking, property }) => {
    if (!booking) return null;
    
    const checkInDate = formatDate(booking.checkInDate);
    const checkOutDate = formatDate(booking.checkOutDate);
    const nights = calculateNights(booking.checkInDate, booking.checkOutDate);
    const totalPrice = (booking.pricePerNight * nights).toFixed(2);
    const currencySymbol = getCurrencySymbol(booking.currency || "USD");

    return (
      <div className="absolute invisible group-hover:visible bg-white/95 backdrop-blur-sm text-gray-700 text-sm rounded-xl p-4 -translate-y-full -top-2 left-0 min-w-64 z-50 shadow-xl border border-gray-100/50 transition-all duration-200">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-base text-gray-900 truncate max-w-40">
              {property?.title || "Unknown Property"}
            </h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
              {booking.reservationCode}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Guest</p>
                <p className="text-sm font-medium">
                  {booking.guestName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <Calendar className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Check-in</p>
                <p className="text-sm font-medium">{checkInDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Check-out</p>
                <p className="text-sm font-medium">{checkOutDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Arrival</p>
                <p className="text-sm font-medium truncate max-w-24">
                  {booking.arrivalTime || "Not specified"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg">
              <span className="text-sm text-gray-700">
                {nights} {nights === 1 ? "Night" : "Nights"}
              </span>
              <span className="text-sm font-semibold text-blue-700">
                {currencySymbol}
                {totalPrice}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  BookingTooltip.propTypes = {
    booking: PropTypes.shape({
      checkInDate: PropTypes.string.isRequired,
      checkOutDate: PropTypes.string.isRequired,
      pricePerNight: PropTypes.number.isRequired,
      currency: PropTypes.string,
      reservationCode: PropTypes.string,
      guestName: PropTypes.string,
      arrivalTime: PropTypes.string,
    }).isRequired,
    property: PropTypes.shape({
      title: PropTypes.string,
    }),
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="pt-16 h-screen overflow-hidden flex flex-col">
        {/* Calendar Header with Navigation */}
        <div className="px-4 py-3 bg-white/90 backdrop-blur-xl shadow-md z-10 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={previousMonth}
                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
              >
                Today
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-grow overflow-hidden">
          {/* Property List (Left Side) - Made wider and with clearer separation */}
          <div 
            ref={propertyListRef}
            onScroll={handlePropertyListScroll}
            className="w-72 bg-white shadow-md backdrop-blur-xl border-r border-gray-200 overflow-y-auto"
          >
            {/* Search Bar */}
            <div className="sticky top-0 z-20 p-3 bg-white/95 backdrop-blur-xl border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={propertySearchQuery}
                  onChange={(e) => setPropertySearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-white/70 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200 placeholder-gray-500 shadow-sm text-sm"
                />
              </div>
            </div>

            {/* Property List Items - With proper sizing to match calendar rows */}
            <div>
              {filteredProperties.map((property) => (
                <div 
                  key={property._id}
                  className="p-3 border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <div className="flex items-start gap-3 h-full">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 shadow-sm">
                      {property.photos?.[0] ? (
                        <img
                          src={property.photos[0].url}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-5 h-5 text-blue-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {property.title}
                      </h3>
                      <p className="flex items-center gap-1 mt-1 text-xs text-blue-500 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {property.location?.city || "Location not specified"}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 rounded-md text-xs text-blue-600">
                          <BedDouble className="w-3 h-3" /> {property.bedrooms}
                        </span>
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 rounded-md text-xs text-purple-600">
                          <Bath className="w-3 h-3" /> {property.bathrooms}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar View (Right Side) - With improved day cell width */}
          <div 
            ref={calendarRef}
            onScroll={handleCalendarScroll}
            className="flex-1 overflow-x-auto overflow-y-auto relative"
          >
            {/* Calendar Header (Days) - With improved spacing */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-200 flex min-w-max">
              <div className="flex">
                {daysToShow.map((day, index) => (
                  <div 
                    key={index} 
                    className={`flex-shrink-0 text-center py-2 text-xs font-medium ${
                      format(day, 'MMM') !== format(currentMonth, 'MMM') 
                        ? 'text-gray-400 bg-gray-50' 
                        : 'text-gray-700'
                    } ${isSameDay(day, new Date()) ? 'bg-blue-50 text-blue-700' : ''}`}
                    style={{ width: `${DAY_CELL_WIDTH}px` }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase">{format(day, 'EEE')}</span>
                      <span className={`w-6 h-6 flex items-center justify-center mt-1 rounded-full ${
                        isSameDay(day, new Date()) ? 'bg-blue-500 text-white' : ''
                      }`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Body (Property Rows with Bookings) - With improved height and visual connection */}
            <div className="min-w-max">
              {filteredProperties.map((property) => {
                const propertyBookings = getBookingsForProperty(property._id);
                
                return (
                  <div 
                    key={property._id}
                    className="flex border-b border-gray-200 relative"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {/* Calendar Cells for this Property Row */}
                    <div className="flex h-full w-full">
                      {daysToShow.map((day, dayIndex) => (
                        <div 
                          key={dayIndex} 
                          className={`h-full border-r border-gray-100 flex-shrink-0 ${
                            format(day, 'MMM') !== format(currentMonth, 'MMM') 
                              ? 'bg-gray-50/50' 
                              : ''
                          } ${isSameDay(day, new Date()) ? 'bg-blue-50/50' : ''}`}
                          style={{ width: `${DAY_CELL_WIDTH}px` }}
                        >
                          {/* Cell content if needed */}
                        </div>
                      ))}
                    </div>

                    {/* Bookings for this property - With improved positioning to prevent overlapping */}
                    <div className="absolute inset-0 pointer-events-none">
                      {propertyBookings.map((booking, index) => (
                        <div
                          key={booking._id}
                          className="group absolute pointer-events-auto cursor-pointer"
                          style={getBookingStyle(booking, index, propertyBookings.length)}
                        >
                          <div className="truncate text-xs">
                            {booking.guestName} ({booking.adults || 1})
                          </div>
                          <BookingTooltip booking={booking} property={property} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;