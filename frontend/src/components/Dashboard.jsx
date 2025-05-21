import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  Calendar,
  Users,
  AlertCircle,
  Bed,
  Coins,
  Clock,
  CreditCard,
  Send,
  Hotel,
  CheckCircle,
  Phone,
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

const DAY_CELL_WIDTH = 60;
const ROW_HEIGHT = 140;
const BOOKING_HEIGHT = 32;
const BOOKING_GAP = 4;

const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
  SGD: "S$",
};

const Bookings = () => {
  const [properties, setProperties] = useState([]);
  const [propertyBookedDates, setPropertyBookedDates] = useState({});
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isScrollingSidebar, setIsScrollingSidebar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [pricings, setPricings] = useState([]);
  const [maxGuests, setMaxGuests] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [dailyRateBreakdown, setDailyRateBreakdown] = useState([]);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [agents, setAgents] = useState([]);
  const [propertyDetails, setPropertyDetails] = useState({
    pricePerNight: 0,
    currency: "USD",
    title: "",
    rooms: 1,
    type: "",
  });
  const [bookedDates, setBookedDates] = useState([]);
  const [fetchingBookings, setFetchingBookings] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [formData, setFormData] = useState({
    checkInDate: "",
    checkOutDate: "",
    rooms: 1,
    nights: 1,
    adults: 1,
    children: 0,
    currency: "USD",
    nationality: "",
    specialRequests: "",
    guestName: "",
    email: "",
    phone: "",
    arrivalTime: "",
    paymentMethod: "cash",
    property: "",
    bookingAgent: "",
    commissionPercentage: 0,
  });

  const calendarRef = useRef(null);
  const propertyListRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const daysToShow = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
    let nextDate = addDays(days[days.length - 1], 1);
    const additionalDays = [];
    for (let i = 0; i < 7; i++) {
      additionalDays.push(nextDate);
      nextDate = addDays(nextDate, 1);
    }
    return [...days, ...additionalDays];
  }, [currentMonth]);

  useEffect(() => {
    if (calendarRef.current) {
      const today = new Date();
      const todayIndex = daysToShow.findIndex((day) => isSameDay(day, today));
      if (todayIndex !== -1) {
        calendarRef.current.scrollLeft = todayIndex * DAY_CELL_WIDTH;
      }
    }
  }, [daysToShow]);

  useEffect(() => {
    const fetchAllPropertyBookings = async () => {
      const newBookedDates = {};
      for (const property of properties) {
        try {
          const response = await api.get(
            `/api/bookings/property/${property._id}`
          );
          const dates = response
            .filter((b) => b.status !== "cancelled")
            .flatMap((b) => {
              const start = new Date(b.checkInDate);
              const end = new Date(b.checkOutDate);
              return eachDayOfInterval({ start, end }).map((d) =>
                format(d, "yyyy-MM-dd")
              );
            });
          newBookedDates[property._id] = [...new Set(dates)]; // Remove duplicates
        } catch (err) {
          console.error(`Error fetching dates for ${property._id}:`, err);
        }
      }
      setPropertyBookedDates(newBookedDates);
    };

    if (user.role !== "admin" && properties.length > 0) {
      fetchAllPropertyBookings();
    }
  }, [properties, user.role]);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
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
      const data = await response.json();
      setProperties(data || []);
      setFilteredProperties(data || []);

      try {
        const pricingRes = await api.get("/api/pricings");
        setPricings(pricingRes);
        const categoriesRes = await api.get("/api/category-prices");
        setCategories(categoriesRes);
      } catch (pricingErr) {
        console.error("Error fetching pricing data:", pricingErr);
        setError("Error fetching pricing data");
      }
    } catch (err) {
      setError("Error fetching properties: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      let endpoint =
        user.role === "admin"
          ? "/api/bookings/admin"
          : `/api/bookings/client/${user._id}`;
      const data = await api.get(endpoint);
      setBookings(data || []);
    } catch (err) {
      setError(
        err.message.includes("401")
          ? "Session expired"
          : "Failed to load bookings"
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe(
      "bookingUpdate",
      (updatedBooking) => {
        setBookings((prev) =>
          prev.map((b) => (b._id === updatedBooking._id ? updatedBooking : b))
        );
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchBookings();
    }
  }, [user, fetchProperties, fetchBookings]);

  useEffect(() => {
    const filtered = properties.filter(
      (property) =>
        property.title
          .toLowerCase()
          .includes(propertySearchQuery.toLowerCase()) ||
        property.location?.city
          ?.toLowerCase()
          .includes(propertySearchQuery.toLowerCase())
    );
    setFilteredProperties(filtered);
  }, [propertySearchQuery, properties]);

  const getPriceForDate = useCallback(
    (propertyId, date) => {
      const propertyPricings = pricings.filter(
        (p) => p.property === propertyId || p.isGlobalTemplate
      );
      const dateStr = format(date, "yyyy-MM-dd");

      const specificDatePricing = propertyPricings
        .flatMap((p) => p.datePrices || [])
        .find((dp) => format(new Date(dp.date), "yyyy-MM-dd") === dateStr);

      if (specificDatePricing) return specificDatePricing.price;

      const currentMonth = date.getMonth() + 1;
      const currentYear = date.getFullYear();
      const dayOfMonth = date.getDate();

      const monthlyPricing = propertyPricings.find(
        (p) =>
          p.type === "monthly" &&
          p.month === currentMonth &&
          p.year === currentYear
      );

      if (monthlyPricing?.blockPrices) {
        const block = monthlyPricing.blockPrices.find(
          (b) => dayOfMonth >= b.startDay && dayOfMonth <= b.endDay
        );
        if (block) return block.price;
      }

      const property = properties.find((p) => p._id === propertyId);
      return property?.pricePerNight || 0;
    },
    [pricings, properties]
  );

  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate) {
      const startDate = new Date(formData.checkInDate);
      const endDate = new Date(formData.checkOutDate);

      if (startDate && endDate && endDate > startDate) {
        const nights = differenceInDays(endDate, startDate);
        setFormData((prev) => ({ ...prev, nights: nights }));

        const dailyRates = [];
        let totalPrice = 0;

        if (selectedProperty) {
          for (let i = 0; i < nights; i++) {
            const currentDate = addDays(startDate, i);
            const dailyRate = getPriceForDate(
              selectedProperty._id,
              currentDate
            );
            dailyRates.push({
              date: format(currentDate, "yyyy-MM-dd"),
              rate: dailyRate,
            });
            totalPrice += dailyRate;
          }

          const category = categories.find(
            (cat) => cat.type === selectedProperty.type
          );
          if (category) {
            const currentMonth = new Date().getMonth() + 1;
            const isHighSeason = currentMonth >= 4 && currentMonth <= 10;
            const seasonalFee = isHighSeason
              ? category.highSeason
              : category.lowSeason;
            totalPrice += seasonalFee;
            dailyRates.push({
              date: "seasonal-fee",
              rate: seasonalFee,
              source: "seasonal",
            });
          }
        }

        setDailyRateBreakdown(dailyRates);
        setCalculatedPrice(totalPrice);
      }
    }
  }, [
    formData.checkInDate,
    formData.checkOutDate,
    selectedProperty,
    categories,
    getPriceForDate,
  ]);

  const handleCalendarScroll = (e) => {
    if (propertyListRef.current && !isScrollingSidebar) {
      propertyListRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handlePropertyListScroll = (e) => {
    setIsScrollingSidebar(true);
    if (calendarRef.current) calendarRef.current.scrollTop = e.target.scrollTop;
    setTimeout(() => setIsScrollingSidebar(false), 100);
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const isDateBooked = useCallback(
    (propertyId, date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const allBooked = propertyBookedDates[propertyId] || [];
      const userBooked = bookings.some(
        (b) =>
          isSameDay(parseISO(b.checkInDate), date) && b.user?._id === user._id
      );

      return allBooked.includes(dateStr) && !userBooked;
    },
    [bookedDates, propertyBookedDates, bookings, user._id]
  );

  const isPastDate = (date) => {
    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const compareDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    return compareDate < todayDate;
  };

  const handleDateClick = (property, date, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Check if the date is either:
    // 1. Available
    // 2. Is the checkout date of an existing booking
    const isCheckoutDate = bookings.some((b) => {
      const checkout = new Date(b.checkOutDate);
      return isSameDay(checkout, date) && b.property?._id === property._id;
    });

    // Only proceed if the date is not booked (or is a checkout date) and not in the past
    if (
      (isCheckoutDate || !isDateBooked(property._id, date)) &&
      !isPastDate(date)
    ) {
      setSelectedProperty(property);
      setSelectedDate(date);
      setFormData((prev) => ({
        ...prev,
        checkInDate: format(date, "yyyy-MM-dd"),
        checkOutDate: format(addDays(date, 1), "yyyy-MM-dd"),
        property: property._id,
        currency: property.currency || "USD",
        rooms: property.bedrooms || 1,
      }));

      loadPropertyDetails(property._id);
      fetchAgents();
      fetchPropertyBookings(property._id);
    }
  };

  const closeReservationModal = () => {
    setSelectedDate(null);
    setSelectedProperty(null);
    setShowConfirmation(false);
    setBookedDates([]);
  };

  const loadPropertyDetails = async (propertyId) => {
    try {
      const data = await api.get(`/api/properties/${propertyId}`);
      setMaxGuests(data.guestCapacity || 1);
      setPropertyDetails({
        pricePerNight: data.pricePerNight || 0,
        currency: data.bankDetails?.currency || "USD",
        title: data.title || "Property",
        rooms: data.bedrooms || 1,
        type: data.type || "",
      });

      setFormData((prev) => ({
        ...prev,
        currency: data.bankDetails?.currency || "USD",
        rooms: data.bedrooms || 1,
        pricePerNight: data.pricePerNight || 0,
      }));
    } catch (err) {
      setError(
        "Failed to load property details: " + (err.message || "Unknown error")
      );
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await api.get("/api/booking-agents/public");
      setAgents(response);
    } catch (err) {
      console.error("Failed to fetch agents:", err);
      setError("Failed to fetch booking agents");
    }
  };

  const fetchPropertyBookings = async (propertyId) => {
    setFetchingBookings(true);
    setBookedDates([]);

    try {
      const response = await api.get(`/api/bookings/property/${propertyId}`);
      const dates = [];
      response.forEach((booking) => {
        if (booking.status !== "cancelled") {
          const start = new Date(booking.checkInDate);
          const end = new Date(booking.checkOutDate);
          for (
            let date = new Date(start);
            date < end;
            date.setDate(date.getDate() + 1)
          ) {
            dates.push(format(date, "yyyy-MM-dd"));
          }
        }
      });
      setBookedDates(dates);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
      setError("Failed to fetch property bookings");
    } finally {
      setFetchingBookings(false);
    }
  };

const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "bookingAgent") {
    const selectedAgent = agents.find((agent) => agent._id === value);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      commissionPercentage: selectedAgent?.commissionPercentage || 0,
    }));
  } else {
    // Convert numeric fields to numbers
    const numericFields = ['adults', 'children', 'rooms', 'nights'];
    const parsedValue = numericFields.includes(name) 
      ? parseInt(value, 10) || 0  // Handle invalid numbers as 0
      : value;

    setFormData((prev) => ({ 
      ...prev, 
      [name]: parsedValue 
    }));
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (!formData.checkInDate || !formData.checkOutDate)
        throw new Error("Please select check-in and check-out dates");
      if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate))
        throw new Error("Check-out date must be after check-in date");
      if (formData.adults > maxGuests)
        throw new Error(`Maximum ${maxGuests} adults allowed`);
      if (formData.adults + formData.children > maxGuests)
        throw new Error(
          `Total guests exceed property capacity of ${maxGuests}`
        );

      const requiredFields = ["guestName", "email", "phone", "nationality"];
      const missing = requiredFields.filter((field) => !formData[field]);
      if (missing.length > 0)
        throw new Error(`Missing required fields: ${missing.join(", ")}`);

      setShowConfirmation(true);
    } catch (err) {
      setError(err.message || "Please fill in all required fields");
    }
  };

  const submitBooking = async () => {
    setLoading(true);
    setError("");

    const bookingData = {
      ...formData,
      totalPrice: calculatedPrice,
      pricePerNight: propertyDetails.pricePerNight,
      currency: propertyDetails.currency,
      user: user._id,
      status: user.role === "admin" ? "confirmed" : "pending",
      checkInDate: new Date(formData.checkInDate).toISOString(),
      checkOutDate: new Date(formData.checkOutDate).toISOString(),
    };

    try {
      await api.post("/api/bookings", bookingData);
      navigate(user.role === "admin" ? "/bookings" : "/my-bookings", {
        state: { success: "Booking submitted!" },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit booking");
    } finally {
      setLoading(false);
      closeReservationModal();
    }
  };

  const getPositionedBookings = useCallback(
    (propertyId) => {
      // Filter bookings for this property and not cancelled
      let propertyBookings = bookings.filter(
        (b) =>
          (b.property?._id?.toString?.() === propertyId ||
            b.property?.toString?.() === propertyId ||
            b.property === propertyId) &&
          b.status !== "cancelled"
      );

      if (user.role !== "admin") {
        propertyBookings = propertyBookings.filter(
          (b) => (b.user?._id || b.user) === user._id
        );
      }

      if (propertyBookings.length === 0) return [];

      const sortedBookings = [...propertyBookings].sort(
        (a, b) => new Date(a.checkInDate) - new Date(b.checkInDate)
      );

      const rows = [];
      const positioned = [];

      sortedBookings.forEach((booking) => {
        const checkInDate = new Date(booking.checkInDate);
        const checkOutDate = new Date(booking.checkOutDate);

        let rowIndex = 0;
        let foundRow = false;

        while (!foundRow && rowIndex < 10) {
          if (!rows[rowIndex]) {
            rows[rowIndex] = [];
            foundRow = true;
          } else {
            const hasOverlap = rows[rowIndex].some((existingBooking) => {
              const existingCheckIn = new Date(existingBooking.checkInDate);
              const existingCheckOut = new Date(existingBooking.checkOutDate);
              return (
                checkInDate <= existingCheckOut &&
                checkOutDate >= existingCheckIn
              );
            });

            if (!hasOverlap) {
              foundRow = true;
            } else {
              rowIndex++;
            }
          }
        }

        rows[rowIndex] = rows[rowIndex] || [];
        rows[rowIndex].push(booking);

        positioned.push({
          ...booking,
          rowIndex,
        });
      });

      return positioned;
    },
    [bookings, user.role, user._id]
  );

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
        border: "border-blue-600",
      },
      pending: {
        bg: "bg-gradient-to-r from-amber-400 to-amber-500",
        hover: "hover:from-amber-500 hover:to-amber-600",
        border: "border-amber-500",
      },
      cancelled: {
        bg: "bg-gradient-to-r from-red-400 to-red-500",
        hover: "hover:from-red-500 hover:to-red-600",
        border: "border-red-500",
      },
    };

    const statusColor = statusColors[booking.status] || statusColors.pending;

    return {
      left: `${left}px`,
      width: `${width}px`,
      top: `${top}px`,
      height: `${BOOKING_HEIGHT}px`,
      className: `absolute transition-all duration-150 cursor-pointer rounded-md border shadow-md ${statusColor.bg} ${statusColor.hover} ${statusColor.border}`,
    };
  };

  const calculateNights = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return differenceInDays(endDate, startDate);
  };

  const formatDate = (date) => {
    return format(new Date(date), "EEE, MMM d, yyyy");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="pt-16 h-screen overflow-hidden flex flex-col">
        <div className="px-4 py-3 bg-white/90 backdrop-blur-xl shadow-md z-10 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
            </div>
            <div className="flex gap-1">
              <button
                onClick={previousMonth}
                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
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
            className="w-72 bg-white shadow-md border-r border-gray-200 overflow-y-auto"
          >
            <div className="sticky top-0 z-20 p-3 bg-white/95 border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={propertySearchQuery}
                  onChange={(e) => setPropertySearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-white/70 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>
            <div>
              {filteredProperties.map((property) => (
                <div
                  key={property._id}
                  className="p-3 border-b border-gray-200 hover:bg-blue-50"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <div className="flex items-start gap-3 h-full">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
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
                        <MapPin className="w-3 h-3" />
                        {property.location?.city || "Location not specified"}
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

          <div
            ref={calendarRef}
            onScroll={handleCalendarScroll}
            className="flex-1 overflow-x-auto overflow-y-auto relative"
          >
            {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                  <p className="mt-2 text-blue-600 font-medium">
                    Loading data...
                  </p>
                </div>
              </div>
            )}

            <div className="sticky top-0 z-20 bg-white/95 border-b border-gray-200 flex min-w-max">
              <div className="flex">
                {daysToShow.map((day, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 text-center py-2 text-xs font-medium ${
                      format(day, "MMM") !== format(currentMonth, "MMM")
                        ? "text-gray-400 bg-gray-50"
                        : "text-gray-700"
                    } ${
                      isSameDay(day, new Date())
                        ? "bg-blue-50 text-blue-700"
                        : ""
                    }`}
                    style={{ width: `${DAY_CELL_WIDTH}px` }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase">
                        {format(day, "EEE")}
                      </span>
                      <span
                        className={`w-6 h-6 flex items-center justify-center mt-1 rounded-full ${
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
                      {daysToShow.map((day, dayIndex) => {
                        const isBooked = isDateBooked(property._id, day);
                        const isPast = isPastDate(day);

                        const isAvailable = !isBooked && !isPast;

                        return (
                          <div
                            key={dayIndex}
                            className={`h-full border-r relative ${
                              isBooked
                                ? "bg-gray-100/50 cursor-not-allowed"
                                : isAvailable
                                ? "hover:bg-blue-100/50 cursor-pointer"
                                : ""
                            }`}
                            style={{ width: `${DAY_CELL_WIDTH}px` }}
                            onClick={
                              isAvailable
                                ? (e) => handleDateClick(property, day, e)
                                : undefined
                            }
                          >
                            {isBooked && (
                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="h-1 w-full rounded-full bg-red-500"></div>
                              </div>
                            )}
                            {isAvailable && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-base font-medium text-blue-700">
                                  {currencySymbols[property.currency] ||
                                    property.currency}
                                 €{getPriceForDate(property._id, day)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="absolute inset-0 pointer-events-none">
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
                            onClick={() => setSelectedBooking(booking)}
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

        {selectedProperty && selectedDate && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeReservationModal}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="bg-white rounded-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeReservationModal}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
                aria-label="Close modal"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>

              {fetchingBookings && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="mt-2 text-blue-600">
                      Checking availability...
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Hotel className="h-6 w-6" />
                    <h2 className="text-xl font-bold">
                      {propertyDetails.title}
                    </h2>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Guest Name *
                      </label>
                      <input
                        type="text"
                        name="guestName"
                        value={formData.guestName}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone *
                      </label>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nationality
                      </label>
                      <select
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Select country</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Spain">Spain</option>
                        <option value="Italy">Italy</option>
                        <option value="China">China</option>
                        <option value="Japan">Japan</option>
                        <option value="Australia">Australia</option>
                        <option value="Canada">Canada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Check-in Date *
                      </label>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <input
                          type="date"
                          name="checkInDate"
                          value={formData.checkInDate}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Check-out Date *
                      </label>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <input
                          type="date"
                          name="checkOutDate"
                          value={formData.checkOutDate}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Number of Rooms
                      </label>
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-2 text-gray-500" />
                        <input
                          type="number"
                          name="rooms"
                          min="1"
                          max={propertyDetails.rooms || 1}
                          value={formData.rooms}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nights
                      </label>
                      <input
                        type="number"
                        name="nights"
                        min="1"
                        value={formData.nights}
                        readOnly
                        className="w-full p-2 border rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Adults
                      </label>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        <input
                          type="number"
                          name="adults"
                          min="1"
                          max={maxGuests}
                          value={formData.adults}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Children
                      </label>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        <input
                          type="number"
                          name="children"
                          min="0"
                          max={maxGuests - formData.adults}
                          value={formData.children}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Arrival Time
                      </label>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <input
                          type="time"
                          name="arrivalTime"
                          value={formData.arrivalTime}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Payment Method
                      </label>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                        <select
                          name="paymentMethod"
                          value={formData.paymentMethod}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="cash">Cash</option>
                          <option value="credit">Credit Card</option>
                          <option value="bank">Bank Transfer</option>
                          <option value="paypal">PayPal</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Currency
                      </label>
                      <div className="flex items-center">
                        <Coins className="h-4 w-4 mr-2 text-gray-500" />
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="JPY">JPY (¥)</option>
                          <option value="CAD">CAD (CA$)</option>
                          <option value="AUD">AUD (A$)</option>
                          <option value="INR">INR (₹)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Booking Agent
                      </label>
                      <select
                        name="bookingAgent"
                        value={formData.bookingAgent}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">None</option>
                        {agents.map((agent) => (
                          <option key={agent._id} value={agent._id}>
                            {agent.name} ({agent.commissionPercentage}%)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Commission (%)
                      </label>
                      <div className="flex items-center">
                        <Banknote className="h-4 w-4 mr-2 text-gray-500" />
                        <input
                          type="number"
                          name="commissionPercentage"
                          min="0"
                          max="100"
                          value={formData.commissionPercentage}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Special Requests
                      </label>
                      <textarea
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleChange}
                        rows="3"
                        className="w-full p-2 border rounded-md"
                        placeholder="Any special requirements or requests..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Price Summary</h3>
                      <span className="text-lg font-bold text-blue-700">
                        {currencySymbols[propertyDetails.currency] ||
                          propertyDetails.currency}{" "}
                        {calculatedPrice}
                      </span>
                    </div>
                    {dailyRateBreakdown.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {dailyRateBreakdown.map((item, index) =>
                          item.source === "seasonal" ? (
                            <p key={index}>
                              Seasonal Fee:{" "}
                              {currencySymbols[propertyDetails.currency]}{" "}
                              {item.rate}
                            </p>
                          ) : (
                            <p key={index}>
                              {format(new Date(item.date), "MMM d")}:{" "}
                              {currencySymbols[propertyDetails.currency]}{" "}
                              {item.rate}
                            </p>
                          )
                        )}
                        <p>
                          Total: {currencySymbols[propertyDetails.currency]}{" "}
                          {calculatedPrice}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {loading ? "Processing..." : "Book Now"}
                  </button>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold">Confirm Booking</h3>
                <button onClick={() => setShowConfirmation(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h4 className="font-medium mb-2">{propertyDetails.title}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Check-in</p>
                      <p>{formData.checkInDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Check-out</p>
                      <p>{formData.checkOutDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Guests</p>
                      <p>
                        {formData.adults} adult
                        {formData.adults !== 1 ? "s" : ""}
                        {formData.children > 0
                          ? `, ${formData.children} children`
                          : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Rooms</p>
                      <p>{formData.rooms}</p>
                    </div>
                  </div>
                </div>
                <div className="border-b pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span>
                      Price for {formData.nights} night
                      {formData.nights !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {currencySymbols[propertyDetails.currency] ||
                        propertyDetails.currency}{" "}
                      {calculatedPrice}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">
                      {currencySymbols[propertyDetails.currency] ||
                        propertyDetails.currency}{" "}
                      {calculatedPrice}
                    </span>
                  </div>
                </div>
                <button
                  onClick={submitBooking}
                  className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {loading ? "Processing..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        )}

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
                    {/* Add Invoice Download Button */}
                    {selectedBooking.invoice ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Invoice:</span>
                        <a
                          href={`${import.meta.env.VITE_API_URL}/api/invoices/${
                            selectedBooking.invoice._id
                          }/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Download Invoice
                        </a>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Invoice:</span>
                        <span className="text-gray-500">No invoice</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking Channel:</span>
                      <span className="font-medium text-blue-900">
                        {selectedBooking.bookingAgent?.name || "Direct"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mobile:</span>
                      <span className="font-medium text-blue-900">
                        {selectedBooking.phone}
                      </span>
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
                        {currencySymbols[selectedBooking.currency]}
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
    </div>
  );
};

export default Bookings;
