import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { websocketService } from "../services/webSocketService";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import "./calendar-styles.css";
import {
  Inbox,
  Calendar,
  DollarSign,
  Home,
  CheckSquare,
  Star,
  Settings,
  Clock,
  Users,
  BarChart2,
  Globe,
} from "lucide-react";

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dailyPrices, setDailyPrices] = useState({});
  const [newEvent, setNewEvent] = useState({
    propertyId: "",
    guestName: "",
    numberOfGuests: "1",
    pricePerNight: "0",
    source: "direct",
    startDate: "",
    endDate: "",
  });

  const sidebarItems = [
    { icon: <Inbox size={18} />, label: "Inbox" },
    { icon: <Calendar size={18} />, label: "Calendar", active: true },
    { icon: <DollarSign size={18} />, label: "Price" },
    { icon: <Home size={18} />, label: "Properties", path: "/properties" },
    { icon: <CheckSquare size={18} />, label: "Tasks" },
    { icon: <Star size={18} />, label: "Reviews" },
    { icon: <Settings size={18} />, label: "Automation" },
    { icon: <Clock size={18} />, label: "Owner Connect" },
    { icon: <Users size={18} />, label: "Guests" },
    { icon: <BarChart2 size={18} />, label: "Metrics" },
    { icon: <Globe size={18} />, label: "Booking Site" },
  ];

  const getEventColor = useCallback((source) => {
    const colors = {
      direct: "#4F46E5", // Indigo
      airbnb: "#EC4899", // Pink
      "booking.com": "#10B981", // Emerald
      vrbo: "#F59E0B", // Amber
    };
    return colors[source] || "#6B7280"; // Gray as default
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
    } catch (err) {
      setError("Error fetching properties: " + err.message);
      console.error("Error fetching properties:", err);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/bookings", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch bookings");

      const bookings = await response.json();
      const formattedEvents = bookings.map((booking) => ({
        id: booking._id,
        title: `${booking.guestName}`,
        start: new Date(booking.startDate),
        end: new Date(booking.endDate),
        backgroundColor: getEventColor(booking.source),
        borderColor: getEventColor(booking.source),
        className: "rounded-lg shadow-sm",
        extendedProps: {
          propertyId: booking.property._id,
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
    setNewEvent({
      propertyId: event.extendedProps.propertyId,
      guestName: event.extendedProps.guestName,
      source: event.extendedProps.source,
      startDate: event.start.toISOString().slice(0, 16),
      endDate: event.end.toISOString().slice(0, 16),
      notes: event.extendedProps.notes,
    });
    setShowEventModal(true);
  }, []);

  const eventContent = useCallback((eventInfo) => {
    const nights = calculateNights(eventInfo.event.start, eventInfo.event.end);
    const checkInDate = formatDate(eventInfo.event.start);
  
    return (
      <div className="relative group flex items-center justify-between p-1 py-2 rounded-lg h-full w-full hover:opacity-90 transition-opacity">
        <div className="flex-1 font-medium truncate">
          {eventInfo.event.title}
        </div>
        <div className="flex items-center space-x-1 text-white/90 ml-2">
          <Users size={14} />
          <span className="text-sm">
            {eventInfo.event.extendedProps.numberOfGuests}
          </span>
        </div>
  
        <div className="absolute invisible group-hover:visible bg-gray-900 text-white text-sm rounded-lg px-3 py-2 left-1/2 transform -translate-x-1/2 -top-16 min-w-max z-50 shadow-lg">
          <div className="flex flex-col items-center space-y-1">
            <div className="font-medium">Check-in: {checkInDate}</div>
            <div>
              {nights} {nights === 1 ? "night" : "nights"}
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

    // Check if there's a booking for this date
    const isDateBooked = events.some((event) => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      const currentDate = new Date(arg.date);

      // Reset time parts to compare only dates
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      return currentDate >= startDate && currentDate < endDate;
    });

    // Get or generate price
    let price;
    if (!isDateBooked) {
      price = dailyPrices[dateKey] || generateRandomPrice();
      if (!dailyPrices[dateKey]) {
        setDailyPrices((prev) => ({ ...prev, [dateKey]: price }));
      }
    }

    return (
      <>
        <div className="fc-daygrid-day-top">
          <div className="text-sm font-semibold">{arg.dayNumberText}</div>
        </div>
        {!isDateBooked && (
          <div className="price-display">
            <div className="text-xs text-gray-600">${price}</div>
          </div>
        )}
      </>
    );
  };

  

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex-shrink-0">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Estia Hospitality
            </span>
          </div>
        </div>
        <nav className="mt-6 px-3">
          {sidebarItems.map((item, index) =>
            item.path ? (
              <Link
                key={index}
                to={item.path}
                className="mb-2 px-4 py-3 flex items-center text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
              >
                {item.icon}
                <span className="ml-3 font-medium">{item.label}</span>
              </Link>
            ) : (
              <button
                key={index}
                className={`mb-2 w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-150 ${
                  item.active
                    ? "text-blue-600 bg-blue-50 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </button>
            )
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="h-full flex flex-col relative p-6">
          {error && (
            <div
              onClick={() => setError("")}
              className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-lg mb-4 cursor-pointer shadow-sm"
            >
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={events}
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

          {/* Modal */}
     
{showEventModal && (
  <div 
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    style={{ zIndex: 9999 }}
    onClick={() => setShowEventModal(false)}
  >
    <div 
      className="bg-white rounded-xl w-full max-w-lg shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {newEvent.id ? "Edit Booking" : "New Booking"}
          </h2>
          <button
            onClick={() => setShowEventModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Property Selection - Full Width */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property *
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={newEvent.propertyId}
              onChange={(e) => setNewEvent({ ...newEvent, propertyId: e.target.value })}
            >
              <option value="">Select Property</option>
              {properties.map((property) => (
                <option key={property._id} value={property._id}>
                  {property.title}
                </option>
              ))}
            </select>
          </div>

          {/* Guest Name - Full Width */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest Name *
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newEvent.guestName}
              onChange={(e) => setNewEvent({ ...newEvent, guestName: e.target.value })}
              placeholder="Enter guest name"
            />
          </div>

          {/* Number of Guests - Half Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Guests *
            </label>
            <input
              type="number"
              min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newEvent.numberOfGuests}
              onChange={(e) => setNewEvent({ ...newEvent, numberOfGuests: e.target.value })}
            />
          </div>

          {/* Price per Night - Half Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per Night *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newEvent.pricePerNight}
                onChange={(e) => setNewEvent({ ...newEvent, pricePerNight: e.target.value })}
              />
            </div>
          </div>

          {/* Start Date - Half Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="datetime-local"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newEvent.startDate}
              onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
            />
          </div>

          {/* End Date - Half Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="datetime-local"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newEvent.endDate}
              onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
            />
          </div>

          {/* Source Selection - Full Width */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newEvent.source}
              onChange={(e) => setNewEvent({ ...newEvent, source: e.target.value })}
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
          <div className="mt-4 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            onClick={() => setShowEventModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            onClick={handleSaveEvent}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {newEvent.id ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
