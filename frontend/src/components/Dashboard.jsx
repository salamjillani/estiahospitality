import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { websocketService } from "../services/websocketService";
import { api } from "../utils/api";
import {
  Loader2,
  Search,
  Calendar,
  Users,
  Home,
  Clock,
  MapPin,
  BedDouble,
  ChevronRight,
  Bath,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAuthToken } from "../utils/api";
import Navbar from "./Navbar";

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

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
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

      const formattedEvents = data.map((booking) => ({
        id: booking._id,
        title: `${booking.guestName} - ${booking.status}`,
        start: new Date(booking.checkInDate),
        end: new Date(booking.checkOutDate),
        backgroundColor:
          booking.status === "confirmed"
            ? "#3B82F6"
            : booking.status === "cancelled"
            ? "#EF4444"
            : "#F59E0B",
        extendedProps: {
          propertyId: booking.property?._id,
          guestName: booking.guestName,
          phone: booking.phone,
          email: booking.email,
          arrivalTime: booking.arrivalTime,
          source: booking.source,
          status: booking.status || "pending",
          isCurrentUser: booking.createdBy?._id === user?._id,
          reservationCode: booking.reservationCode,
          adults: booking.adults,
          pricePerNight: booking.pricePerNight,
          currency: booking.currency,
        },
      }));

      setEvents(formattedEvents);
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
          setEvents((prev) => {
            const existing = prev.find((e) => e.id === updatedBooking._id);
            if (existing) {
              return prev.map((event) =>
                event.id === updatedBooking._id
                  ? {
                      ...event,
                      title: `${updatedBooking.guestName} - ${updatedBooking.status}`,
                      backgroundColor:
                        updatedBooking.status === "confirmed"
                          ? "#3B82F6"
                          : updatedBooking.status === "cancelled"
                          ? "#EF4444"
                          : "#F59E0B",
                    }
                  : event
              );
            }
            return [...prev];
          });
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (user) {
      // Fetch properties for all users (admin will get sidebar, all get events)
      fetchProperties();
      // Fetch bookings for the authenticated user
      fetchBookings();
    }
  }, [user, fetchProperties, fetchBookings]);

  useEffect(() => {
    // Filter properties based on search query
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

  const eventContent = (eventInfo) => {
    if (eventInfo.event.extendedProps.status === "cancelled") {
      return (
        <div className="line-through opacity-50">{eventInfo.event.title}</div>
      );
    }

    const property = properties.find(
      (p) =>
        p._id?.toString() ===
        eventInfo.event.extendedProps.propertyId?.toString()
    );

    const checkInDate = formatDate(eventInfo.event.start);
    const checkOutDate = formatDate(eventInfo.event.end);
    const nights = calculateNights(eventInfo.event.start, eventInfo.event.end);
    const totalPrice = (
      eventInfo.event.extendedProps.pricePerNight * nights
    ).toFixed(2);
    const currencySymbol = getCurrencySymbol(
      eventInfo.event.extendedProps.currency || "USD"
    );

    return (
      <div
        className="relative group flex items-center justify-between p-1 py-2 rounded-full h-full w-full hover:opacity-90 transition-all duration-200"
        style={{ backgroundColor: eventInfo.backgroundColor }}
      >
        <div className="flex-1 font-medium truncate pl-2 text-white text-xs sm:text-sm">
          {eventInfo.event.title}
        </div>
        <div className="flex items-center space-x-1 bg-white/30 backdrop-blur-sm rounded-full px-2 py-1 ml-2">
          <Users size={12} className="text-white hidden sm:inline" />
          <span className="text-xs text-white font-medium">
            {eventInfo.event.extendedProps.adults}
          </span>
        </div>

        <div className="absolute invisible group-hover:visible bg-white/95 backdrop-blur-sm text-gray-700 text-sm rounded-xl p-4 left-1/2 transform -translate-x-1/2 -top-44 min-w-[280px] sm:min-w-[320px] z-50 shadow-xl border border-gray-100/50 transition-all duration-200">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-semibold text-base text-gray-900 truncate max-w-[180px] sm:max-w-[220px]">
                {property?.title || "Unknown Property"}
              </h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                {eventInfo.event.extendedProps.reservationCode}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Adults</p>
                  <p className="text-sm font-medium">
                    {eventInfo.event.extendedProps.adults}
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
                  <p className="text-xs text-gray-500">Arrival Time</p>
                  <p className="text-sm font-medium truncate max-w-[100px] sm:max-w-[140px]">
                    {eventInfo.event.extendedProps.arrivalTime ||
                      "Not specified"}
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="pt-16 h-screen flex flex-col lg:flex-row overflow-hidden">
        {(user?.role === "admin" || user?.role === "client") && (
          <div
            className={`fixed lg:static w-full max-w-full lg:max-w-xs xl:max-w-sm 2xl:max-w-md bg-white/90 backdrop-blur-xl border-r border-gray-100 h-full transform transition-transform duration-300 ease-in-out z-40 overflow-hidden ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }`}
          >
            <div className="p-3 sm:p-4 lg:p-6 overflow-y-auto h-full">
              <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-grey-600" />
                </div>
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={propertySearchQuery}
                  onChange={(e) => setPropertySearchQuery(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 bg-white/70 border border-grey-600 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200 placeholder-grey-600 shadow-sm text-sm sm:text-base"
                />
              </div>
              <div className="space-y-3 sm:space-y-4">
                {filteredProperties.map((property) => (
                  <Link
                    key={property._id}
                    to={`/properties/${property._id}`}
                    className="group block p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 shadow-md shadow-blue-500/5">
                        {property.photos?.[0] ? (
                          <img
                            src={property.photos[0].url}
                            alt={property.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">
                          {property.title}
                        </h3>
                        <p className="flex items-center gap-1 mt-1 text-xs sm:text-sm text-blue-500 truncate">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">
                            {property.location?.city || "Location not specified"}
                          </span>
                        </p>
                        <div className="flex items-center gap-2 sm:gap-3 mt-2">
                          <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 rounded-md sm:rounded-lg text-xs sm:text-sm text-blue-600">
                            <BedDouble className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
                            {property.bedrooms}
                          </span>
                          <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-50 rounded-md sm:rounded-lg text-xs sm:text-sm text-purple-600">
                            <Bath className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
                            {property.bathrooms}
                          </span>
                        </div>
                      </div>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 bg-transparent h-full overflow-hidden">
          <div className="h-full bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl shadow-blue-500/10 border border-blue-100/30 overflow-hidden">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              editable={user?.role === "admin"}
              selectable={user?.role === "admin"}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              eventContent={eventContent}
              height="100%"
              contentHeight="auto"
              themeSystem="standard"
              eventClassNames="rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
              eventDisplay="block"
              slotMinTime="06:00:00"
              slotMaxTime="21:00:00"
              slotDuration="01:00:00"
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                meridiem: false,
              }}
              // Responsive views for different screen sizes
              views={{
                dayGridMonth: {
                  titleFormat: { 
                    year: 'numeric', 
                    month: 'short' 
                  }
                },
                timeGridWeek: {
                  titleFormat: { 
                    month: 'short', 
                    day: 'numeric' 
                  }
                },
                timeGridDay: {
                  titleFormat: { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;