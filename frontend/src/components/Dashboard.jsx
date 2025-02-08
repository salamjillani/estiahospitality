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
  Home,
  Users,
  Building2,
  MapPin,
  Phone,
  Plane,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./calendar-styles.css";

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dailyPrices, setDailyPrices] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const [newEvent, setNewEvent] = useState({
    propertyId: "",
    guestName: "",
    numberOfGuests: "1",
    pricePerNight: "0",
    source: "direct",
    startDate: "",
    endDate: "",
  });

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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
      setError("");
      const response = await fetch("http://localhost:5000/api/properties", {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch properties");
      }

      const data = await response.json();
      setProperties(data.properties || []);
      setFilteredProperties(data.properties || []);
    } catch (err) {
      setError("Error fetching properties: " + err.message);
      console.error("Error fetching properties:", err);
    }
  }, []);

  useEffect(() => {
    const filtered = properties.filter((property) =>
      property.title.toLowerCase().includes(propertySearchQuery.toLowerCase())
    );
    setFilteredProperties(filtered);
  }, [propertySearchQuery, properties]);

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
  };

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/bookings", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch bookings");

      const data = await response.json();
      // Handle both cases: when response is an array directly or wrapped in bookings property
      const bookingsData = Array.isArray(data) ? data : data.bookings || [];

      const formattedEvents = bookingsData.map((booking) => ({
        id: booking._id,
        title: `${booking.guestName}`,
        start: new Date(booking.startDate),
        end: new Date(booking.endDate),
        backgroundColor: getEventColor(booking.source),
        borderColor: getEventColor(booking.source),
        className: "rounded-lg shadow-sm",
        extendedProps: {
          propertyId: booking.property,
          guestName: booking.guestName,
          numberOfGuests: booking.numberOfGuests,
          pricePerNight: booking.pricePerNight,
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

    const unsubscribe = websocketService.subscribe(
      "property_created",
      (newProperty) => {
        setProperties((prev) => [...prev, newProperty]);
      }
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
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
        createdBy: "6786d83f4ff2c84b44528678",
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

      // Wait for fetchBookings to complete before closing modal
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
    });
    setShowEventModal(true);
  }, []);

  // Add handleDeleteBooking function
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

  // Add handleUpdateBooking function
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

  // Add resetForm function
  const resetForm = () => {
    setNewEvent({
      propertyId: "",
      guestName: "",
      numberOfGuests: "1",
      pricePerNight: "0",
      source: "direct",
      startDate: "",
      endDate: "",
    });
    setSelectedEventId(null);
    setIsEditMode(false);
  };

  const eventContent = useCallback((eventInfo) => {
    const nights = calculateNights(eventInfo.event.start, eventInfo.event.end);
    const checkInDate = formatDate(eventInfo.event.start);
    const totalPrice = (
      eventInfo.event.extendedProps.pricePerNight * nights
    ).toFixed(2);

    // Placeholder for additional booking details
    const additionalDetails = [
      { icon: Plane, text: "Early morning flight" },
      { icon: Phone, text: "Prefers late check-in" },
    ];

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

        <div className="absolute invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg px-3 py-2 left-1/2 transform -translate-x-1/2 -top-32 min-w-max z-50 shadow-lg">
          <div className="flex flex-col items-center space-y-2">
            <div className="font-medium">Check-in: {checkInDate}</div>
            <div>
              {nights} {nights === 1 ? "night" : "nights"}
            </div>
            <div className="font-semibold">Total Price: ${totalPrice}</div>
            <div className="w-full border-t border-gray-700 pt-2">
              {additionalDetails.map((detail, index) => (
                <div key={index} className="flex items-center space-x-2 mb-1">
                  <detail.icon size={14} className="text-gray-300" />
                  <span>{detail.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
            <div className="border-8 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }, []);

  // Generate a random price between 100 and 200
  const generateRandomPrice = () => {
    return Math.floor(Math.random() * (200 - 100 + 1)) + 100;
  };

  // Generate prices for a month
  const generateMonthlyPrices = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prices = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      if (!dailyPrices[dateKey]) {
        prices[dateKey] = generateRandomPrice();
      }
    }

    setDailyPrices((prev) => ({ ...prev, ...prices }));
  };

  // Update prices when the calendar view changes
  const handleDatesSet = (dateInfo) => {
    generateMonthlyPrices(dateInfo.start);
    if (dateInfo.start.getMonth() !== dateInfo.end.getMonth()) {
      generateMonthlyPrices(dateInfo.end);
    }
  };

  const dayCellContent = (arg) => {
    const dateKey = arg.date.toISOString().split("T")[0];

    const bookingEvent = events.find((event) => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      const currentDate = new Date(arg.date);

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      return currentDate >= startDate && currentDate < endDate;
    });

    let price;
    if (!bookingEvent) {
      price =
        dailyPrices[dateKey] ||
        Math.floor(Math.random() * (250 - 100 + 1)) + 100;
      if (!dailyPrices[dateKey]) {
        setDailyPrices((prev) => ({ ...prev, [dateKey]: price }));
      }
    }

    return (
      <div className="h-full flex flex-col p-1">
        <div className="flex justify-between items-center">
          {!bookingEvent && (
            <div className=" -ml-16 text-md font-medium text-green-600">
              ${price}
            </div>
          )}
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="text-white" size={20} />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Estia Hospitality
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/calendar"
              className="flex items-center text-gray-600 hover:text-blue-600 transition"
            >
              <Calendar size={18} className="mr-2" />
              Calendar
            </Link>
            <Link
              to="/properties"
              className="flex items-center text-gray-600 hover:text-blue-600 transition"
            >
              <Home size={18} className="mr-2" />
              Properties
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex mt-16 h-[calc(100vh-4rem)] w-full">
        {/* Properties Section */}
        <div className="w-96 bg-white border-r border-gray-100 overflow-y-auto p-4 space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-4 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search properties..."
              value={propertySearchQuery}
              onChange={(e) => setPropertySearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="space-y-3">
            {filteredProperties.map((property) => (
              <div
                key={property._id}
                onClick={() => handlePropertySelect(property)}
                className={`p-4 border rounded-xl cursor-pointer transition-all group ${
                  selectedProperty?._id === property._id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={
                        property.photos?.[0]?.url || "/placeholder-property.jpg"
                      }
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin size={14} className="mr-1" />
                      {property.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Section */}
        <div className="flex-1 p-4 bg-white">
          <div className="h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={
                selectedProperty
                  ? events.filter(
                      (event) =>
                        event.extendedProps.propertyId === selectedProperty._id
                    )
                  : events
              }
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              eventContent={eventContent}
              dayCellContent={dayCellContent}
              datesSet={handleDatesSet}
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

      {/* Modal */}
      {showEventModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => {
            setShowEventModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEditMode ? "Edit Booking" : "New Booking"}
                </h2>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Form Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Property Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property *
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={newEvent.propertyId}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        propertyId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Property</option>
                    {properties.map((property) => (
                      <option key={property._id} value={property._id}>
                        {property.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Guest Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newEvent.guestName}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        guestName: e.target.value,
                      })
                    }
                    placeholder="Enter guest name"
                  />
                </div>

                {/* Number of Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newEvent.numberOfGuests}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        numberOfGuests: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Price per Night */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Night *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newEvent.startDate}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newEvent.endDate}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, endDate: e.target.value })
                    }
                  />
                </div>

                {/* Source Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channel
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newEvent.source}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, source: e.target.value })
                    }
                  >
                    <option value="direct">Direct</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="booking.com">Booking.com</option>
                    <option value="vrbo">VRBO</option>
                  </select>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 text-red-600 text-sm">{error}</div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex justify-between">
                {/* Left side - Delete button */}
                <div>
                  {isEditMode && (
                    <button
                      type="button"
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
                      onClick={handleDeleteBooking}
                      disabled={loading}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>

                {/* Right side - Cancel and Save/Update buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setShowEventModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                    onClick={isEditMode ? handleUpdateBooking : handleSaveEvent}
                    disabled={loading}
                  >
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEditMode ? "Update" : "Save"}
                  </button>
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
