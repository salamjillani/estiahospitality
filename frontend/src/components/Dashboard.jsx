import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { websocketService } from "../services/websocketService";
import { api } from "../utils/api";
import {
  Loader2,
  Trash2,
  Search,
  Calendar,
  Users,
  Phone,
  Building,
  X,
  Home,
  Clock,
  Mail,
  DollarSign,
  MapPin,
  BedDouble,
  ChevronRight,
  Bath,
  Save,
  AlertCircle,
  Bed,
  Globe,
  Coins,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAuthToken } from "../utils/api";
import Navbar from "./Navbar";

const defaultCommissions = {
  direct: 0,
  airbnb: 12,
  "booking.com": 15,
  vrbo: 8,
};

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bookingAgents, setBookingAgents] = useState([]);
  const navigate = useNavigate();
  
  const [newEvent, setNewEvent] = useState({
    propertyId: "",
    guestName: "",
    email: "",
    phone: "",
    checkInDate: "",
    checkOutDate: "",
    rooms: 1,
    adults: 1,
    children: 0,
    nationality: "",
    currency: "USD",
    specialRequests: "",
    pricePerNight: "0",
    source: "direct",
    arrivalTime: "",
    paymentMethod: "cash",
    paymentDate: "",
    customPaymentText: "",
    reservationCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
  });

  const allBookingSources = [
    ...Object.keys(defaultCommissions),
    ...(bookingAgents?.map((agent) => agent.name) || []),
  ];

  const formatNewEvent = (booking) => ({
    id: booking._id,
    title: `${booking.guestName} - ${booking.status}`,
    start: new Date(booking.checkInDate),
    end: new Date(booking.checkOutDate),
    backgroundColor: booking.status === "confirmed" ? "#10B981" :
                     booking.status === "cancelled" ? "#EF4444" : "#F59E0B",
    extendedProps: {
      propertyId: booking.property._id,
      guestName: booking.guestName,
      phone: booking.phone,
      email: booking.email,
      arrivalTime: booking.arrivalTime,
      source: booking.source,
      status: booking.status || "pending",
      isCurrentUser: booking.createdBy?._id === user?._id,
      reservationCode: booking.reservationCode,
    },
  });
  

  const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "INR", "SGD"];
  const nationalities = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "India",
    "Germany",
    "France",
    "China",
    "Japan",
    "Other",
  ];

  const getEventColor = useCallback((source) => {
    const colors = {
      direct: "#4F46E5",
      airbnb: "#EC4899",
      "booking.com": "#10B981",
      vrbo: "#F59E0B",
    };
    return colors[source] || "#6B7280";
  }, []);

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

  const { user } = useAuth();

  const fetchProperties = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/api/properties", {
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

  const fetchAgents = async () => {
    try {
      const response = await api.get("/api/booking-agents");
      setBookingAgents(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      setBookingAgents([]);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe(
      "property_created",
      (newProperty) => {
        setProperties((prev) => [...prev, newProperty]);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered = properties.filter((property) =>
      property.title.toLowerCase().includes(propertySearchQuery.toLowerCase())
    );
    setFilteredProperties(filtered);
  }, [propertySearchQuery, properties]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(false);
      const data = await api.get("/api/bookings");
      const formattedEvents = data.map((booking) => ({
        id: booking._id,
        title: `${booking.guestName} - ${booking.status}`,
        start: new Date(booking.checkInDate),
        end: new Date(booking.checkOutDate),
        backgroundColor: booking.status === 'confirmed' ? '#10B981' : 
                       booking.status === 'cancelled' ? '#EF4444' : '#F59E0B',
        extendedProps: {
          propertyId: booking.property._id,
          guestName: booking.guestName,
          phone: booking.phone,
          email: booking.email,
          arrivalTime: booking.arrivalTime,
          source: booking.source,
          status: booking.status || 'pending',
          isCurrentUser: booking.createdBy?._id === user?._id,
          reservationCode: booking.reservationCode,
          
        },
      }));
      setEvents(formattedEvents);
  } catch (err) {
    setError("Failed to load bookings: " + err.message);
  }
}, []);

useEffect(() => {
  const socket = websocketService.connect();
  
  socket.on("bookingUpdate", (updatedBooking) => {
    setEvents(prev => {
      const existing = prev.find(e => e.id === updatedBooking._id);
      if (existing) {
        return prev.map(event => 
          event.id === updatedBooking._id ? 
          { ...event, 
            title: `${updatedBooking.guestName} - ${updatedBooking.status}`,
            backgroundColor: updatedBooking.status === 'confirmed' ? '#10B981' :
                           updatedBooking.status === 'cancelled' ? '#EF4444' : '#F59E0B'
          } : event
        );
      }
      return [...prev, formatNewEvent(updatedBooking)];
    });
  });

  return () => socket.disconnect();
}, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProperties();
      fetchBookings();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchProperties, fetchBookings]);

  const validateBooking = (booking) => {
    if (!booking.propertyId) {
      throw new Error("Please select a property");
    }
    if (!booking.guestName.trim()) {
      throw new Error("Please enter a guest name");
    }
    if (!booking.checkInDate || !booking.checkOutDate) {
      throw new Error("Please select both check-in and check-out dates");
    }
    if (isNaN(booking.rooms) || booking.rooms < 1) {
      throw new Error("Number of rooms must be at least 1");
    }
    if (isNaN(booking.adults) || booking.adults < 1) {
      throw new Error("Number of adults must be at least 1");
    }
    const pricePerNight = parseFloat(booking.pricePerNight);
    if (isNaN(pricePerNight) || pricePerNight <= 0) {
      throw new Error("Price per night must be greater than 0");
    }
    return booking;
  };

  const handleSaveEvent = async () => {
    try {
      setLoading(true);
      setError("");

      const validatedBooking = validateBooking(newEvent);

      const bookingData = {
        property: validatedBooking.propertyId,
        guestName: validatedBooking.guestName,
        phone: validatedBooking.phone,
        email: validatedBooking.email,
        checkInDate: new Date(validatedBooking.checkInDate).toISOString(),
        checkOutDate: new Date(validatedBooking.checkOutDate).toISOString(),
        rooms: validatedBooking.rooms,
        adults: validatedBooking.adults,
        children: validatedBooking.children,
        nationality: validatedBooking.nationality,
        pricePerNight: parseFloat(validatedBooking.pricePerNight),
        source: validatedBooking.source,
        arrivalTime: validatedBooking.arrivalTime,
        specialRequests: validatedBooking.specialRequests,
        user: user._id,
        createdBy: user._id,
        reservationCode: newEvent.reservationCode,
      };

      const response = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save booking");
      }

      await fetchBookings();
      setShowEventModal(false);
      setNewEvent({
        propertyId: "",
        guestName: "",
        email: "",
        phone: "",
        checkInDate: "",
        checkOutDate: "",
        rooms: 1,
        adults: 1,
        children: 0,
        nationality: "",
        currency: "USD",
        specialRequests: "",
        pricePerNight: "0",
        source: "direct",
        arrivalTime: "",
        paymentMethod: "cash",
        paymentDate: "",
        customPaymentText: "",
        reservationCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = useCallback((selectInfo) => {
    setNewEvent((prev) => ({
      ...prev,
      checkInDate: selectInfo.startStr,
      checkOutDate: selectInfo.endStr,
    }));
    setShowEventModal(true);
  }, []);

  const handleEventClick = useCallback((clickInfo) => {
    const event = clickInfo.event;
    if (!user?.role === "admin") return;

    setSelectedEventId(event.id);
    setIsEditMode(true);
    setNewEvent({
      id: event.id,
      propertyId: event.extendedProps.propertyId,
      guestName: event.extendedProps.guestName,
      phone: event.extendedProps.phone || "",
      email: event.extendedProps.email || "",
      checkInDate: event.start.toISOString(),
      checkOutDate: event.end.toISOString(),
      pricePerNight: event.extendedProps.pricePerNight.toString(),
      source: event.extendedProps.source,
      arrivalTime: event.extendedProps.arrivalTime || "",
      reservationCode: event.extendedProps.reservationCode,
      rooms: 1,
      adults: 1,
      children: 0,
      nationality: "",
      currency: "USD",
      specialRequests: "",
    });
    setShowEventModal(true);
  }, []);

  const handleDeleteBooking = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/bookings/${selectedEventId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete booking");
      }

      await fetchBookings();
      setShowEventModal(false);
      resetForm();
    } catch (error) {
      setError("Error deleting booking: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBooking = async () => {
    try {
      setLoading(true);
      setError("");

      const validatedBooking = validateBooking(newEvent);

      const bookingData = {
        property: validatedBooking.propertyId,
        guestName: validatedBooking.guestName,
        numberOfGuests: validatedBooking.numberOfGuests,
        pricePerNight: validatedBooking.pricePerNight,
        source: validatedBooking.source,
        startDate: new Date(validatedBooking.startDate).toISOString(),
        endDate: new Date(validatedBooking.endDate).toISOString(),
        phone: validatedBooking.phone,
        email: validatedBooking.email,
        arrivalTime: validatedBooking.arrivalTime,
        reservationCode: newEvent.reservationCode,
      };

      const response = await fetch(
        `http://localhost:5000/api/bookings/${selectedEventId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(bookingData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update booking");
      }

      await fetchBookings();
      setShowEventModal(false);
      resetForm();
    } catch (error) {
      setError("Error updating booking: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewEvent({
      propertyId: "",
      guestName: "",
      numberOfGuests: "1",
      pricePerNight: "0",
      source: "direct",
      startDate: "",
      endDate: "",
      reservationCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
    });
    setSelectedEventId(null);
    setIsEditMode(false);
  };

  const eventContent = useCallback(
    (eventInfo) => {
      if (eventInfo.event.extendedProps.status === 'cancelled') {
        return (
          <div className="line-through opacity-50">
            {eventInfo.event.title}
          </div>
        );
      }
      const property = properties.find(
        (p) => p._id.toString() === eventInfo.event.extendedProps.propertyId.toString()
      );
      const checkInDate = formatDate(eventInfo.event.start);
      const checkOutDate = formatDate(eventInfo.event.end);
      const nights = calculateNights(eventInfo.event.start, eventInfo.event.end);
      const totalPrice = (eventInfo.event.extendedProps.pricePerNight * nights).toFixed(2);

      return (
        <div className="relative group flex items-center justify-between p-1 py-2 rounded-full h-full w-full hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: eventInfo.event.extendedProps.isCurrentUser || user?.role === "admin"
              ? getEventColor(eventInfo.event.extendedProps.source)
              : "#e5e7eb",
          }}>
          <div className="flex-1 font-medium truncate pl-2">
            {eventInfo.event.title}
          </div>
          <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1 ml-2">
            <Users size={14} className="text-white" />
            <span className="text-sm">
              {eventInfo.event.extendedProps.adults}
            </span>
          </div>
          <div className="absolute invisible group-hover:visible bg-white/95 backdrop-blur-sm text-gray-700 text-sm rounded-xl p-4 left-1/2 transform -translate-x-1/2 -top-44 min-w-[320px] z-50 shadow-lg border border-gray-100/50">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100/50">
                <h3 className="font-semibold text-base text-gray-900">
                  {property?.title || "Unknown Property"}
                </h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {eventInfo.event.extendedProps.reservationCode}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Check-in</p>
                    <p className="text-sm font-medium">{checkInDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Check-out</p>
                    <p className="text-sm font-medium">{checkOutDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Arrival Time</p>
                    <p className="text-sm font-medium">
                      {eventInfo.event.extendedProps.arrivalTime || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Adults</p>
                    <p className="text-sm font-medium">
                      {eventInfo.event.extendedProps.adults}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {nights} {nights === 1 ? "Night" : "Nights"}
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    ${totalPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [properties, user]
  );
  const dayCellContent = (arg) => {
    const currentDate = new Date(arg.date);

    // Booking check without dateKey
    const bookingEvent = events.find((event) => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      return currentDate >= startDate && currentDate < endDate;
    });

    return (
      <div className="h-full flex flex-col p-1">
        <div className="flex justify-between items-center">
          <div className="-ml-16 text-md font-medium text-green-600">$60</div>
          <div className="text-sm font-semibold text-gray-800">
            {arg.dayNumberText}
          </div>
        </div>
        {bookingEvent && (
          <div className="mt-1 w-full h-1 bg-blue-500 rounded-full"></div>
        )}
      </div>
    );
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  // 2. Error State - Show if loading is done but error exists
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600 p-4 border border-red-300 rounded-lg bg-white">
          Error: {error}
        </div>
      </div>
    );
  }

  // 3. Empty State - Show if no data after loading
  if (events.length === 0 && filteredProperties.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm">
          <Calendar className="h-16 w-16 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No bookings or properties found
          </h3>
          <p className="mt-1 text-gray-500">
            Get started by creating your first booking or property
          </p>
        </div>
      </div>
    );
  }

  const renderBookingSources = () => (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Booking Source
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allBookingSources.map((source) => (
          <div key={source} className="relative group">
            <button
              type="button"
              onClick={() => setNewEvent({ ...newEvent, source })}
              className={`w-full flex flex-col items-center p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${
                newEvent.source === source
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                  newEvent.source === source ? "bg-blue-500" : "bg-gray-100"
                }`}
              >
                <Building
                  className={`w-5 h-5 ${
                    newEvent.source === source ? "text-white" : "text-gray-500"
                  }`}
                />
              </div>
              <span
                className={`text-sm font-medium capitalize ${
                  newEvent.source === source ? "text-blue-600" : "text-gray-700"
                }`}
              >
                {source}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50">
      <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="pt-16 h-screen flex">
        <div className={`fixed lg:relative lg:block w-full lg:w-96 bg-white/80 backdrop-blur-xl border-r border-gray-100/50 h-full transform transition-transform duration-300 ease-in-out z-40 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}>
          <div className="p-4 lg:p-6 overflow-y-auto h-full">
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search properties..."
                value={propertySearchQuery}
                onChange={(e) => setPropertySearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200 placeholder-gray-400"
              />
            </div>
            <div className="space-y-4">
              {filteredProperties.map((property) => (
                <Link
                  key={property._id}
                  to={`/properties/${property._id}`}
                  className="group block p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
                      {property.photos?.[0] ? (
                        <img
                          src={property.photos[0].url}
                          alt={property.title}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-8 h-8 text-blue-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{property.title}</h3>
                      <p className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        {property.location.city || "Location not specified"}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-sm text-gray-600">
                          <BedDouble className="w-4 h-4" /> {property.bedrooms}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-sm text-gray-600">
                          <Bath className="w-4 h-4" /> {property.bathrooms}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 lg:p-6 bg-transparent">
          <div className="h-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-500/5 border border-gray-100/50 overflow-hidden">
          <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          eventContent={eventContent}
          dayCellContent={dayCellContent}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="100%"
          contentHeight="auto"
          themeSystem="standard"
          eventDisplay="block"
          slotMinTime="06:00:00"
          slotMaxTime="21:00:00"
          slotDuration="01:00:00"
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
          }}
        />
          </div>
        </div>
      </div>

      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
          <div className="my-8 bg-white rounded-3xl w-full max-w-3xl shadow-2xl relative border border-gray-100">
            <div className="max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-8 py-6 border-b border-gray-100 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    {isEditMode && user?.role === "admin" ? "Edit Booking" : "New Booking"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      setNewEvent({
                        propertyId: "",
                        guestName: "",
                        email: "",
                        phone: "",
                        checkInDate: "",
                        checkOutDate: "",
                        rooms: 1,
                        adults: 1,
                        children: 0,
                        nationality: "",
                        currency: "USD",
                        specialRequests: "",
                        pricePerNight: "0",
                        source: "direct",
                        arrivalTime: "",
                        paymentMethod: "cash",
                        paymentDate: "",
                        customPaymentText: "",
                        reservationCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
                      });
                      setIsEditMode(false);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property
                    </label>
                    <select
                      value={newEvent.propertyId}
                      onChange={(e) => setNewEvent({ ...newEvent, propertyId: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="">Select Property</option>
                      {properties.map((property) => (
                        <option key={property._id} value={property._id}>
                          {property.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guest Name *
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      value={newEvent.guestName}
                      onChange={(e) => setNewEvent({ ...newEvent, guestName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newEvent.email}
                        onChange={(e) => setNewEvent({ ...newEvent, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newEvent.phone}
                        onChange={(e) => setNewEvent({ ...newEvent, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newEvent.checkInDate.split('T')[0]}
                        onChange={(e) => setNewEvent({ ...newEvent, checkInDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newEvent.checkOutDate.split('T')[0]}
                        onChange={(e) => setNewEvent({ ...newEvent, checkOutDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rooms *
                    </label>
                    <div className="relative">
                      <Bed className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newEvent.rooms}
                        onChange={(e) => setNewEvent({ ...newEvent, rooms: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adults *
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newEvent.adults}
                        onChange={(e) => setNewEvent({ ...newEvent, adults: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Children
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newEvent.children}
                      onChange={(e) => setNewEvent({ ...newEvent, children: e.target.value })}
                    />
                  </div>
                  {renderBookingSources()}
                   {/* Add price per night field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Night
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-8 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newEvent.pricePerNight}
                      onChange={(e) => setNewEvent({ ...newEvent, pricePerNight: e.target.value })}
                    />
                  </div>
                </div>

                {/* Add payment method section */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {["cash", "credit_card", "bank_deposit", "stripe", "other"].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, paymentMethod: method })}
                        className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${
                          newEvent.paymentMethod === method
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                            newEvent.paymentMethod === method ? "bg-blue-500" : "bg-gray-100"
                          }`}
                        >
                          <DollarSign
                            className={`w-5 h-5 ${
                              newEvent.paymentMethod === method ? "text-white" : "text-gray-500"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium capitalize ${
                            newEvent.paymentMethod === method ? "text-blue-600" : "text-gray-700"
                          }`}
                        >
                          {method.replace("_", " ")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nationality *
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        value={newEvent.nationality}
                        onChange={(e) => setNewEvent({ ...newEvent, nationality: e.target.value })}
                      >
                        <option value="">Select Nationality</option>
                        {nationalities.map((nation) => (
                          <option key={nation} value={nation}>{nation}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency *
                    </label>
                    <div className="relative">
                      <Coins className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        value={newEvent.currency}
                        onChange={(e) => setNewEvent({ ...newEvent, currency: e.target.value })}
                      >
                        {currencies.map((currency) => (
                          <option key={currency} value={currency}>{currency}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Requests
                    </label>
                    <textarea
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                      value={newEvent.specialRequests}
                      onChange={(e) => setNewEvent({ ...newEvent, specialRequests: e.target.value })}
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-200">
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      {error}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm px-8 py-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    {selectedEventId && user?.role === "admin" && isEditMode && (
                      <button
                        type="button"
                        onClick={handleDeleteBooking}
                        className="flex items-center px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Booking
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEventModal(false)}
                      className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={isEditMode ? handleUpdateBooking : handleSaveEvent}
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 transition-colors duration-200 disabled:opacity-70"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {isEditMode ? "Update Booking" : "Create Booking"}
                    </button>
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