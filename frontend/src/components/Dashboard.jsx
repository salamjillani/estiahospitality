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
  Plane,
  Settings,
  Bell,
  Building,
  User,
  X,
  Home,
  Menu,
  Plus,
  Clock,
  Mail,
  DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext'; // Adjust path as needed
import { getAuthToken } from '../utils/api';

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
  const [dailyPrices, setDailyPrices] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
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
        credentials: "include", // Add this
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`, // Add auth header
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

  const generateRandomPrice = () => {
    return Math.floor(Math.random() * (200 - 100 + 1)) + 100;
  };

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

    const price = dailyPrices[dateKey];

    return (
      <div className="h-full flex flex-col p-1">
        <div className="flex justify-between items-center">
          {!bookingEvent && price && (
            <div className="-ml-16 text-md font-medium text-green-600">
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

  const AddAgentModal = () => {
    const [newAgentCommission, setNewAgentCommission] = useState("");

    const handleAddAgent = async () => {
      if (newAgentName.trim() && newAgentCommission.trim()) {
        try {
          const response = await fetch(
            "http://localhost:5000/api/booking-agents",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                name: newAgentName.trim(),
                commissionPercentage: parseFloat(newAgentCommission),
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to add agent");
          }

          const data = await response.json();
          setBookingAgents((prev) => [...prev, data]);
          setNewAgentName("");
          setNewAgentCommission("");
          setShowAddAgentModal(false);
        } catch (error) {
          setError(error.message);
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Booking Agent
            </h3>
            <button
              onClick={() => setShowAddAgentModal(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="Enter agent name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newAgentCommission}
                    onChange={(e) => setNewAgentCommission(e.target.value)}
                    placeholder="Enter commission"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12"
                  />
                  <span className="absolute right-4 top-3.5 text-gray-400">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddAgentModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAgent}
                disabled={!newAgentName.trim() || !newAgentCommission.trim()}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="max-w-8xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 mr-2 text-gray-500 hover:text-gray-700"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center space-x-3">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-1">
              <Link
                to="/calendar"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <Calendar className="w-4 h-4 inline-block mr-2" />
                Calendar
              </Link>
              <Link
                to="/properties"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <Building className="w-4 h-4 inline-block mr-2" />
                Properties
              </Link>
              <Link
                to="/bookings"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <Calendar className="w-4 h-4 inline-block mr-2" />
                Booking Information
              </Link>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
              <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                <Bell className="w-5 h-5" />
              </button>
              <button className="hidden sm:block p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                <Settings className="w-5 h-5" />
              </button>
              <div className="hidden sm:block h-8 w-px bg-gray-200"></div>
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                  Admin
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 h-screen flex">
        <div
          className={`fixed lg:relative lg:block w-full lg:w-96 bg-white border-r border-gray-100 h-full transform transition-transform duration-300 ease-in-out z-40 ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-4 lg:p-6 overflow-y-auto h-full">
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search properties..."
                value={propertySearchQuery}
                onChange={(e) => setPropertySearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            <div className="space-y-4">
              {filteredProperties.map((property) => (
                <Link
                  key={property._id}
                  to={`/properties/${property._id}`}
                  className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start gap-4">
                    {/* Property Image */}
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      {property.photos?.[0] ? (
                        <img
                          src={property.photos[0].url}
                          alt={property.title}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Property Details */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {property.title}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {property.type}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          🏠 {property.bedrooms} beds
                        </span>
                        <span className="flex items-center gap-1">
                          🚿 {property.bathrooms} baths
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 lg:p-6 bg-gray-50">
          <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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

      {showEventModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div
            className="my-8 bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-100 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property
                    </label>
                    <select
                      value={newEvent.propertyId}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, propertyId: e.target.value })
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

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      value={newEvent.guestName}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, guestName: e.target.value })
                      }
                      placeholder="Enter guest name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      value={newEvent.numberOfGuests}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          numberOfGuests: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      <Mail className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newEvent.email}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, email: e.target.value })
                        }
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Night
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                      <Clock className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="time"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      <Calendar className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          className={`flex flex-col items-center p-4 rounded-xl border transition-all duration-200 ${
                            newEvent.paymentMethod === method
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                              newEvent.paymentMethod === method
                                ? "bg-blue-500"
                                : "bg-gray-100"
                            }`}
                          >
                            <DollarSign
                              className={`w-4 h-4 ${
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Booking Source
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddAgentModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add New Agent
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {allBookingSources.map((source) => {
                        const agent = bookingAgents.find(
                          (a) => a.name === source
                        );
                        return (
                          <div key={source} className="relative group">
                            <button
                              type="button"
                              onClick={() =>
                                setNewEvent({ ...newEvent, source })
                              }
                              className={`w-full flex flex-col items-center p-4 rounded-xl border transition-all duration-200 ${
                                newEvent.source === source
                                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                                  : "border-gray-200 hover:border-blue-300"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                                  newEvent.source === source
                                    ? "bg-blue-500"
                                    : "bg-gray-100"
                                }`}
                              >
                                <Building
                                  className={`w-4 h-4 ${
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
                            {agent && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(
                                      `http://localhost:5000/api/booking-agents/${agent._id}`,
                                      { method: "DELETE" }
                                    );
                                    if (!response.ok) {
                                      const errorData = await response.json();
                                      throw new Error(
                                        errorData.message ||
                                          "Failed to delete agent"
                                      );
                                    }
                                    setBookingAgents((prev) =>
                                      prev.filter((a) => a._id !== agent._id)
                                    );
                                    if (newEvent.source === agent.name) {
                                      setNewEvent((prev) => ({
                                        ...prev,
                                        source: "direct",
                                      }));
                                    }
                                  } catch (error) {
                                    setError(error.message);
                                  }
                                }}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                title="Delete agent"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
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
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Comments
                        </label>
                        <textarea
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
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

                {error && (
                  <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
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

              <div className="sticky bottom-0 bg-white px-8 py-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={handleDeleteBooking}
                        disabled={loading}
                        className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
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
                      className="px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={
                        isEditMode ? handleUpdateBooking : handleSaveEvent
                      }
                      disabled={loading}
                      className="flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
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
      {showAddAgentModal && <AddAgentModal />}
    </div>
  );
};

export default Dashboard;
