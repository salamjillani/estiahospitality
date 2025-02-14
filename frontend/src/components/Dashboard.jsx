import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { websocketService } from "../services/webSocketService";
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
} from "lucide-react";
import { Link } from "react-router-dom";
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

  const [newEvent, setNewEvent] = useState({
    propertyId: "",
    guestName: "",
    numberOfGuests: "1",
    pricePerNight: "0",
    source: "direct",
    startDate: "",
    endDate: "",
    phone: "",
    email: "",
    arrivalTime: "",
    comments: "",
    paymentMethod: "cash",
    paymentDate: "",
    customPaymentText: "",
    reservationCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
  });

  const allBookingSources = [
    ...Object.keys(defaultCommissions),
    ...bookingAgents.map((agent) => agent.name),
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
      setError("");
      const response = await fetch("http://localhost:5000/api/properties", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch properties");
      }

      const data = await response.json();
      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (err) {
      setError("Error fetching properties: " + err.message);
      console.error("Error fetching properties:", err);
    }
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/booking-agents", {
        credentials: "include",
      });
      const data = await response.json();
      setBookingAgents(data);
    } catch (error) {
      console.error("Error fetching agents:", error);
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
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/bookings", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch bookings");

      const data = await response.json();
      const bookingsData = Array.isArray(data) ? data : data.bookings || [];

      const formattedEvents = bookingsData.map((booking) => ({
        id: booking._id,
        title: `${booking.guestName}`,
        start: new Date(booking.startDate),
        end: new Date(booking.endDate),
        backgroundColor: getEventColor(booking.source),
        borderColor: getEventColor(booking.source),
        className: "rounded-full shadow-sm",
        extendedProps: {
          propertyId: booking.property._id,
          guestName: booking.guestName,
          numberOfGuests: booking.numberOfGuests,
          pricePerNight: booking.pricePerNight,
          phone: booking.phone,
          email: booking.email,
          arrivalTime: booking.arrivalTime,
          source: booking.source,
          status: booking.status,
        },
      }));
      setEvents(formattedEvents);
    } catch (error) {
      setError("Error fetching bookings: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [getEventColor]);

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
    if (!booking.startDate || !booking.endDate) {
      throw new Error("Please select both start and end dates");
    }

    const numberOfGuests = parseInt(booking.numberOfGuests);
    if (isNaN(numberOfGuests) || numberOfGuests < 1) {
      throw new Error("Number of guests must be at least 1");
    }

    const pricePerNight = parseFloat(booking.pricePerNight);
    if (isNaN(pricePerNight) || pricePerNight <= 0) {
      throw new Error("Price per night must be greater than 0");
    }

    return {
      ...booking,
      numberOfGuests,
      pricePerNight,
    };
  };

  const handleSaveEvent = async () => {
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
        createdBy: user._id,
        phone: validatedBooking.phone,
        email: validatedBooking.email,
        arrivalTime: validatedBooking.arrivalTime,
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
        numberOfGuests: "1",
        pricePerNight: "0",
        source: "direct",
        startDate: "",
        endDate: "",
        reservationCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = useCallback((selectInfo) => {
    const startDate = new Date(selectInfo.start);
    const endDate = new Date(selectInfo.end);

    setNewEvent((prev) => ({
      ...prev,
      startDate: startDate.toISOString().slice(0, 16),
      endDate: endDate.toISOString().slice(0, 16),
    }));
    setShowEventModal(true);
  }, []);

  const handleEventClick = useCallback((clickInfo) => {
    const event = clickInfo.event;
    setSelectedEventId(event.id);
    setIsEditMode(true);
    setNewEvent({
      id: event.id,
      propertyId: event.extendedProps.propertyId,
      guestName: event.extendedProps.guestName,
      numberOfGuests: event.extendedProps.numberOfGuests.toString(),
      pricePerNight: event.extendedProps.pricePerNight.toString(),
      source: event.extendedProps.source,
      startDate: event.start.toISOString().slice(0, 16),
      endDate: event.end.toISOString().slice(0, 16),
      phone: event.extendedProps.phone || "",
      email: event.extendedProps.email || "",
      arrivalTime: event.extendedProps.arrivalTime || "",
      reservationCode: event.extendedProps.reservationCode,
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
      const property = properties.find(
        (p) => p._id.toString() === eventInfo.event.extendedProps.propertyId.toString()
      );
      const checkInDate = formatDate(eventInfo.event.start);
      const checkOutDate = formatDate(eventInfo.event.end);
      const nights = calculateNights(
        eventInfo.event.start,
        eventInfo.event.end
      );
      const totalPrice = (
        eventInfo.event.extendedProps.pricePerNight * nights
      ).toFixed(2);

      return (
        <div
          className="relative group flex items-center justify-between p-1 py-2 rounded-full h-full w-full hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: eventInfo.event.backgroundColor,
            color: "white",
          }}
        >
          <div className="flex-1 font-medium truncate pl-2">
            {eventInfo.event.title}
          </div>
          <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1 ml-2">
            <Users size={14} className="text-white" />
            <span className="text-sm">
              {eventInfo.event.extendedProps.numberOfGuests}
            </span>
          </div>

          <div className="absolute invisible group-hover:visible bg-white/95 backdrop-blur-sm text-gray-700 text-sm rounded-xl p-4 left-1/2 transform -translate-x-1/2 -top-44 min-w-[320px] z-50 shadow-lg border border-gray-100/50">
            <div className="flex flex-col space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100/50">
                <h3 className="font-semibold text-base text-gray-900">
                  {property?.title || "Unknown Property"}
                </h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {eventInfo.event.extendedProps.reservationCode}
                </span>
              </div>

              {/* Details Grid */}
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
                      {eventInfo.event.extendedProps.arrivalTime ||
                        "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Guests</p>
                    <p className="text-sm font-medium">
                      {eventInfo.event.extendedProps.numberOfGuests}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Summary */}
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

            {/* Tooltip Arrow */}
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
              <div className="border-8 border-transparent border-t-white/95"></div>
            </div>
          </div>
        </div>
      );
    },
    [properties]
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="pt-16 h-screen flex">
        {/* Sidebar */}
        <div
          className={`fixed lg:relative lg:block w-full lg:w-96 bg-white/80 backdrop-blur-xl border-r border-gray-100/50 h-full transform transition-transform duration-300 ease-in-out z-40 ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-4 lg:p-6 overflow-y-auto h-full">
            {/* Search Box */}
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

            {/* Property Cards */}
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
                      <h3 className="font-medium text-gray-900">
                        {property.title}
                      </h3>
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

        {/* Calendar Section */}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div
            className="my-8 bg-white rounded-3xl w-full max-w-3xl shadow-2xl relative border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-8 py-6 border-b border-gray-100 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    {isEditMode ? "Edit Booking" : "New Booking"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      resetForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Property Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property
                    </label>
                    <select
                      value={newEvent.propertyId}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, propertyId: e.target.value })
                      }
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

                  {/* Guest Information */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      value={newEvent.guestName}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, guestName: e.target.value })
                      }
                      placeholder="Enter guest name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reservation Code
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      value={newEvent.reservationCode}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      value={newEvent.numberOfGuests}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          numberOfGuests: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Contact Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newEvent.phone}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, phone: e.target.value })
                        }
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newEvent.email}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, email: e.target.value })
                        }
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Night
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-8 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={newEvent.pricePerNight}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            pricePerNight: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      value={newEvent.startDate}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, startDate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      value={newEvent.endDate}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, endDate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approximate Arrival Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <input
                        type="time"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newEvent.arrivalTime}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            arrivalTime: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newEvent.paymentDate}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            paymentDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        "cash",
                        "credit_card",
                        "bank_deposit",
                        "stripe",
                        "other",
                      ].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() =>
                            setNewEvent({ ...newEvent, paymentMethod: method })
                          }
                          className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${
                            newEvent.paymentMethod === method
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                              newEvent.paymentMethod === method
                                ? "bg-blue-500"
                                : "bg-gray-100"
                            }`}
                          >
                            <DollarSign
                              className={`w-5 h-5 ${
                                newEvent.paymentMethod === method
                                  ? "text-white"
                                  : "text-gray-500"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-sm font-medium capitalize ${
                              newEvent.paymentMethod === method
                                ? "text-blue-600"
                                : "text-gray-700"
                            }`}
                          >
                            {method.replace("_", " ")}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {newEvent.paymentMethod === "other" && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Payment Details
                      </label>
                      <input
                        type="text"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newEvent.customPaymentText}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            customPaymentText: e.target.value,
                          })
                        }
                        placeholder="Enter custom payment details"
                      />
                    </div>
                  )}

                  {/* Booking Source */}
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
                                newEvent.source === source
                                  ? "bg-blue-500"
                                  : "bg-gray-100"
                              }`}
                            >
                              <Building
                                className={`w-5 h-5 ${
                                  newEvent.source === source
                                    ? "text-white"
                                    : "text-gray-500"
                                }`}
                              />
                            </div>
                            <span
                              className={`text-sm font-medium capitalize ${
                                newEvent.source === source
                                  ? "text-blue-600"
                                  : "text-gray-700"
                              }`}
                            >
                              {source}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="md:col-span-2">
                    <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Nights</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {newEvent.startDate && newEvent.endDate
                            ? calculateNights(
                                newEvent.startDate,
                                newEvent.endDate
                              )
                            : 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Price</span>
                        <span className="text-lg font-semibold text-gray-900">
                          $
                          {newEvent.startDate &&
                          newEvent.endDate &&
                          newEvent.pricePerNight
                            ? (
                                calculateNights(
                                  newEvent.startDate,
                                  newEvent.endDate
                                ) * parseFloat(newEvent.pricePerNight)
                              ).toFixed(2)
                            : "0.00"}
                        </span>
                      </div>

                      {/* Comments Section */}
                      <div className="pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Comments
                        </label>
                        <textarea
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none"
                          value={newEvent.comments}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              comments: e.target.value,
                            })
                          }
                          placeholder="Add any additional comments or special requests..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-200">
                    <div className="flex items-center text-red-600">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm px-8 py-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={handleDeleteBooking}
                        disabled={loading}
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
                      onClick={() => {
                        setShowEventModal(false);
                        resetForm();
                      }}
                      className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={
                        isEditMode ? handleUpdateBooking : handleSaveEvent
                      }
                      disabled={loading}
                      className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
