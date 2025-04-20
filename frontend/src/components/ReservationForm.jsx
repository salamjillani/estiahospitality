import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { calculateNights } from "../utils/dateUtils";

import {
  Loader2,
  Calendar,
  Users,
  AlertCircle,
  Bed,
  Globe,
  Coins,
  Clock,
  CreditCard,
  DollarSign,
  Send,
  Hotel,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { websocketService } from "../services/websocketService";
import PropTypes from "prop-types";

// Helper function to get month name
const getMonthName = (month) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month];
};

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

// Fixed AvailabilityCalendar Component
const AvailabilityCalendar = ({
  bookedDates,
  onSelectCheckIn,
  onSelectCheckOut,
  checkInDate,
  checkOutDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendar, setCalendar] = useState([]);
  const [selectionMode, setSelectionMode] = useState(
    checkInDate ? "checkout" : "checkin"
  );

  useEffect(() => {
    generateCalendar();
  }, [currentDate, bookedDates, checkInDate, checkOutDate]);

  useEffect(() => {
    // Update selection mode based on currently selected dates
    if (!checkInDate) {
      setSelectionMode("checkin");
    } else if (!checkOutDate) {
      setSelectionMode("checkout");
    }
  }, [checkInDate, checkOutDate]);

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and total days
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarDays = [];

    // Add empty slots for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      calendarDays.push(date);
    }

    setCalendar(calendarDays);
  };

  const nextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const prevMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  // Fixed: Improved date checking with proper string formatting
  const isDateBooked = (date) => {
    if (!date || !bookedDates || bookedDates.length === 0) return false;

    // Format the date as YYYY-MM-DD consistently
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const dateString = formatDate(date);
    return bookedDates.includes(dateString);
  };

  // Helper function to check if a date is selected for check-in
  const isCheckInDate = (date) => {
    if (!checkInDate || !date) return false;
    const checkIn = new Date(checkInDate);
    return (
      date.getDate() === checkIn.getDate() &&
      date.getMonth() === checkIn.getMonth() &&
      date.getFullYear() === checkIn.getFullYear()
    );
  };

  // Helper function to check if a date is selected for check-out
  const isCheckOutDate = (date) => {
    if (!checkOutDate || !date) return false;
    const checkOut = new Date(checkOutDate);
    return (
      date.getDate() === checkOut.getDate() &&
      date.getMonth() === checkOut.getMonth() &&
      date.getFullYear() === checkOut.getFullYear()
    );
  };

  // Helper function to check if date is in between check-in and check-out
  const isInRange = (date) => {
    if (!checkInDate || !checkOutDate || !date) return false;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    return date > checkIn && date < checkOut;
  };

  // Fixed: Handle date selection with better validation
  const handleSelectDate = (date, e) => {
    // Stop event propagation to prevent multiple clicks
    e.stopPropagation();

    if (!date || isPastDate(date) || isDateBooked(date)) {
      if (selectionMode === "checkin") {
        onSelectCheckIn("");
      }
      setSelectionMode("checkin");
      return;
    }

    // Format the date as YYYY-MM-DD consistently
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const selectedDate = formatDate(date);

    if (selectionMode === "checkin") {
      onSelectCheckIn(selectedDate);
      setSelectionMode("checkout");
    } else if (selectionMode === "checkout") {
      // Ensure check-out is after check-in
      if (checkInDate && selectedDate <= checkInDate) return;

      // Check if any date in the range is booked
      if (checkInDate) {
        const start = new Date(checkInDate);
        const end = new Date(selectedDate);
        let hasBookedDate = false;

        // Check each date in the range
        const currentDate = new Date(start);
        while (currentDate <= end) {
          if (isDateBooked(new Date(currentDate))) {
            hasBookedDate = true;
            break;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (hasBookedDate) {
          // Don't allow selection if any date in range is booked
          return;
        }
      }

      onSelectCheckOut(selectedDate);
      setSelectionMode("checkin");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={prevMonth}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>

        <h3 className="font-medium text-sm sm:text-base">
          {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
        </h3>

        <button
          onClick={nextMonth}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendar.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-7 sm:h-8"></div>;
          }

          const isPast = isPastDate(date);
          const isBooked = isDateBooked(date);
          const isCheckIn = isCheckInDate(date);
          const isCheckOut = isCheckOutDate(date);
          const inRange = isInRange(date);
          const dateString = date.getDate();

          // Fixed: Added pointer-events-none to isBooked condition to prevent selection
          return (
            <div
              key={`date-${date.getTime()}`}
              onClick={
                isBooked || isPast
                  ? undefined
                  : (e) => handleSelectDate(date, e)
              }
              className={` 
              h-7 sm:h-8 flex items-center justify-center text-xs sm:text-sm rounded relative
              ${isPast ? "text-gray-300 cursor-not-allowed bg-gray-50" : ""}
              ${isBooked ? "text-gray-400 bg-red-50 pointer-events-none" : ""}
              ${!isPast && !isBooked ? "cursor-pointer hover:bg-blue-50" : ""}
              ${isCheckIn ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
              ${isCheckOut ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
              ${inRange ? "bg-blue-100 hover:bg-blue-200" : ""}
              ${
                !isPast && !isBooked && !isCheckIn && !isCheckOut && !inRange
                  ? "bg-green-50 border border-green-100"
                  : ""
              }
            `}
            >
              {dateString}

              {/* Enhanced cross lines for booked dates */}
              {isBooked && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute h-[1.5px] w-full bg-red-600 rotate-45"></div>
                  <div className="absolute h-[1.5px] w-full bg-red-600 -rotate-45"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600 justify-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-50 border border-green-100 mr-1"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-50 relative mr-1">
            <div className="absolute inset-0">
              <div className="absolute h-px w-full bg-red-500 rotate-45"></div>
              <div className="absolute h-px w-full bg-red-500 -rotate-45"></div>
            </div>
          </div>
          <span>Booked</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-600 mr-1"></div>
          <span>Selected</span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <p className="text-xs text-blue-600 font-medium">
          {selectionMode === "checkin"
            ? "Select check-in date"
            : "Select check-out date"}
        </p>
      </div>
    </div>
  );
};

AvailabilityCalendar.propTypes = {
  bookedDates: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectCheckIn: PropTypes.func.isRequired,
  onSelectCheckOut: PropTypes.func.isRequired,
  checkInDate: PropTypes.string,
  checkOutDate: PropTypes.string,
};

const ReservationForm = () => {
  const { propertyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [maxGuests, setMaxGuests] = useState(0);
  const [pricings, setPricings] = useState([]);
  const [seasonalFee, setSeasonalFee] = useState(0);
  const { user, loading: authLoading } = useAuth();
  const [bookedDates, setBookedDates] = useState([]);
  const [fetchingBookings, setFetchingBookings] = useState(false);
  const [dailyRateBreakdown, setDailyRateBreakdown] = useState([]);

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
    property: propertyId || location.state?.propertyId || "",
    bookingAgent: "",
    commissionPercentage: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [agents, setAgents] = useState([]);
  const [propertyDetails, setPropertyDetails] = useState({
    pricePerNight: 0,
    currency: "USD",
    title: "",
    rooms: 1,
    type: "", // Added property type for seasonal fee calculation
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    websocketService.connect();
  }, [user?.token]);

  useEffect(() => {
    setFormData({
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
      property: propertyId || location.state?.propertyId || "",
    });
  }, [propertyId, location.state?.propertyId]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await api.get("/api/booking-agents/public");
        setAgents(response);
      } catch (err) {
        console.error("Failed to fetch agents:", err);
        if (err.message.includes("401")) {
          navigate("/auth?session=expired");
        }
      }
    };
    fetchAgents();
  }, [navigate]);

  useEffect(() => {
    if (!propertyId && !location.state?.propertyId) {
      navigate("/properties");
    }
  }, [propertyId, location.state?.propertyId, navigate]);

  useEffect(() => {
    if (!authLoading && !isInitialized) {
      setIsInitialized(true);

      if (!user) {
        const returnUrl = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        navigate(`/auth?returnTo=${returnUrl}`);
      }
    }
  }, [authLoading, user, navigate, isInitialized]);

  useEffect(() => {
    const fetchPricingData = async () => {
      if (propertyId) {
        try {
          const response = await api.get(
            `/api/pricings/property/${propertyId}`
          );
          const processed = response.map((p) => ({
            ...p,
            datePrices:
              p.datePrices?.map((dp) => ({
                ...dp,
                date: new Date(dp.date),
              })) || [],
          }));
          setPricings(processed);

          // Get seasonal fee
          const categoriesRes = await api.get("/api/category-prices");
          const category = categoriesRes.find(
            (cat) => cat.type === propertyDetails.type
          );

          if (category) {
            const currentMonth = new Date().getMonth() + 1;
            const isHighSeason = currentMonth >= 4 && currentMonth <= 10;
            setSeasonalFee(
              isHighSeason
                ? Number(category.highSeason)
                : Number(category.lowSeason)
            );
            setPropertyDetails((prev) => ({
              ...prev,
              currency: category.currency || prev.currency,
            }));
          }
        } catch (error) {
          console.error("Error fetching pricing data:", error);
        }
      }
    };

    if (propertyDetails.type) {
      fetchPricingData();
    }
  }, [propertyId, propertyDetails.type]);

  useEffect(() => {
    const calculatePrice = () => {
      if (!formData.checkInDate || !formData.checkOutDate) return;

      let total = 0;
      const startDate = new Date(formData.checkInDate);
      const endDate = new Date(formData.checkOutDate);
      const breakdown = [];
      const currentDate = new Date(startDate);

      // Convert all pricing dates to UTC for accurate comparison
      const processedPricings = pricings.map((pricing) => ({
        ...pricing,
        datePrices:
          pricing.datePrices?.map((dp) => ({
            date: new Date(dp.date).toISOString().split("T")[0],
            price: dp.price,
          })) || [],
      }));

      while (currentDate < endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        let dayPrice = propertyDetails.pricePerNight;
        let priceSource = "base";

        // 1. Check date-specific pricing (both property-specific and global)
        const dateMatches = processedPricings
          .filter((p) => p.type === "date")
          .flatMap((p) => p.datePrices)
          .filter((dp) => dp.date === dateStr);

        if (dateMatches.length > 0) {
          // Use the highest priority pricing (latest or highest price)
          dayPrice = Math.max(...dateMatches.map((dp) => dp.price));
          priceSource = "date-specific";
        }

        // 2. Check monthly pricing if no date-specific price found
        if (priceSource === "base") {
          const monthlyMatch = processedPricings.find(
            (p) =>
              p.type === "monthly" &&
              p.month === currentDate.getUTCMonth() + 1 &&
              p.year === currentDate.getUTCFullYear()
          );

          if (monthlyMatch) {
            const dayOfMonth = currentDate.getUTCDate();
            const block = monthlyMatch.blockPrices.find(
              (b) => dayOfMonth >= b.startDay && dayOfMonth <= b.endDay
            );

            if (block) {
              dayPrice = block.price;
              priceSource = "monthly-block";
            }
          }
        }

        // Add to total and breakdown
        total += dayPrice;
        breakdown.push({
          date: dateStr,
          price: dayPrice,
          source: priceSource,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Add seasonal fee once
      if (seasonalFee > 0) {
        total += seasonalFee;
        breakdown.push({
          date: "seasonal-fee",
          price: seasonalFee,
          source: "seasonal",
        });
      }

      setDailyRateBreakdown(breakdown);
      setCalculatedPrice(total);
    };

    calculatePrice();
  }, [
    formData.checkInDate,
    formData.checkOutDate,
    pricings,
    seasonalFee,
    propertyDetails.pricePerNight,
  ]);

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const data = await api.get(`/api/properties/${propertyId}`);
        const price = Number(data.pricePerNight || data.rates?.nightly || 0);

        if (!price || isNaN(price)) {
          throw new Error("Property pricing not configured");
        }
        if (!data.pricePerNight && !data.rates?.nightly) {
          throw new Error("Property pricing not configured");
        }
        setMaxGuests(data.guestCapacity || 1);
        setPropertyDetails({
          pricePerNight: price,
          currency: data.bankDetails?.currency || "USD",
          title: data.title || "Property",
          rooms: data.bedrooms || 1,
          type: data.type || "",
        });
      } catch (err) {
        setError("Failed to load property details");
        console.error(err);
      }
    };

    const fetchBookings = async () => {
      if (!propertyId) return;

      setFetchingBookings(true);
      try {
        const response = await api.get(`/api/bookings/property/${propertyId}`);

        // Process booked dates
        const dates = [];
        response.forEach((booking) => {
          if (booking.status !== "cancelled") {
            const start = new Date(booking.checkInDate);
            const end = new Date(booking.checkOutDate);

            // Add all dates between check-in and check-out
            for (
              let date = new Date(start);
              date < end;
              date.setDate(date.getDate() + 1)
            ) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              dates.push(`${year}-${month}-${day}`);
            }
          }
        });

        setBookedDates(dates);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setFetchingBookings(false);
      }
    };

    if (location.state?.property) {
      setMaxGuests(location.state.property.guestCapacity || 1);
      setPropertyDetails({
        pricePerNight: location.state.property.pricePerNight || 0,
        currency: location.state.property.currency || "USD",
        title: location.state.property.title || "Property",
        rooms: location.state.property.bedrooms || 1,
        type: location.state.property.type || "", // Added property type
      });
    } else if (propertyId) {
      loadProperty();
    }

    fetchBookings();
  }, [propertyId, location.state]);

  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate) {
      const nights = calculateNights(
        formData.checkInDate,
        formData.checkOutDate
      );

      if (nights >= 0) {
        // Allow 0 as a valid result during calculation
        setFormData((prev) => ({ ...prev, nights }));
      }
    }
  }, [formData.checkInDate, formData.checkOutDate]);

  const handleSelectCheckInDate = (date) => {
    setFormData((prev) => ({
      ...prev,
      checkInDate: date,
      // Clear check-out date if it's now invalid
      checkOutDate:
        prev.checkOutDate && prev.checkOutDate <= date ? "" : prev.checkOutDate,
    }));
    setError("");
  };

  const handleSelectCheckOutDate = (date) => {
    if (!formData.checkInDate) return;

    const start = new Date(formData.checkInDate);
    const end = new Date(date);

    // Clear previous error immediately
    setError("");

    // Check if end date is before or equal to start
    if (end <= start) {
      setError("Check-out date must be after check-in date");
      return;
    }

    // Format date for consistent checking
    const formatDateString = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Check each date in the range excluding end date
    let currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + 1); // Start from day after check-in

    // Changed condition to check up to end date (not including)
    while (currentDate < end) {
      const dateStr = formatDateString(currentDate);
      if (bookedDates.includes(dateStr)) {
        setError("Selected range contains unavailable dates");
        return;
      }

      if (isPastDate(currentDate)) {
        setError("Selected range contains past dates");
        return;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setFormData((prev) => ({ ...prev, checkOutDate: date }));
  };

  const isDateDisabled = (date) => {
    // Ensure the date is in the YYYY-MM-DD format for comparison
    let dateString;

    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      dateString = `${year}-${month}-${day}`;
    } else {
      // If it's already a string, ensure it's in the correct format
      dateString = date;
    }

    return bookedDates.includes(dateString);
  };

  if (authLoading || (!isInitialized && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        <span className="ml-2 text-lg text-gray-700 font-medium">
          Verifying authentication...
        </span>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (authLoading) {
      setError("Please wait while we verify your session...");
      return;
    }

    if (!user?._id) {
      setError("Authentication required. Redirecting...");
      navigate("/auth");
      return;
    }

    // Check if dates are selected
    if (!formData.checkInDate || !formData.checkOutDate) {
      setError("Please select both check-in and check-out dates");
      return;
    }

    // Check if check-out date is after check-in date
    const checkInDate = new Date(formData.checkInDate);
    const checkOutDate = new Date(formData.checkOutDate);

    if (checkOutDate <= checkInDate) {
      setError("Check-out date must be after check-in date");
      return;
    }

    // Check if any date in the selected range is already booked
    const daysDifference = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    for (let i = 0; i < daysDifference; i++) {
      const currentDate = new Date(checkInDate);
      currentDate.setDate(checkInDate.getDate() + i);
      const dateStr = currentDate.toISOString().split("T")[0];

      if (bookedDates.includes(dateStr)) {
        setError(
          `Your stay includes date ${dateStr} which is already booked. Please select different dates.`
        );
        return;
      }
    }

    try {
      const propertyData = await api.get(
        `/api/properties/${formData.property}`
      );

      if (formData.rooms > propertyData.bedrooms) {
        throw new Error(
          `This property only has ${propertyData.bedrooms} rooms available`
        );
      }

      const requiredFields = [
        "checkInDate",
        "checkOutDate",
        "rooms",
        "adults",
        "guestName",
        "email",
        "phone",
        "nationality",
        "property",
      ];

      if (!formData.property) {
        setError("Property information is missing. Please refresh the page.");
        return;
      }

      if (formData.adults > propertyData.guestCapacity) {
        throw new Error(
          `Maximum occupancy exceeded. This property accommodates up to ${propertyData.guestCapacity} adults`
        );
      }

      const missing = requiredFields.filter((field) => !formData[field]);

      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(", ")}`);
      }

      setShowConfirmation(true);
    } catch (err) {
      setError(err.message || "Please fill in all required fields");
    }
  };

  const submitBooking = async () => {
    setLoading(true);
    setError("");

    if (isNaN(calculatedPrice)) {
      setError("Invalid price calculation");
      setLoading(false);
      return;
    }

    if (calculatedPrice <= 0) {
      setError("Total price must be greater than 0");
      setLoading(false);
      return;
    }

    const bookingData = {
      ...formData,
      totalPrice: calculatedPrice,
      pricePerNight: propertyDetails.pricePerNight,
      currency: propertyDetails.currency,
      user: user._id,
      status: "pending",
      checkInDate: new Date(formData.checkInDate).toISOString(),
      checkOutDate: new Date(formData.checkOutDate).toISOString(),
      bookingAgent: formData.bookingAgent || undefined,
      bookingSource: formData.bookingAgent ? "agent" : "direct",
      commissionPercentage: formData.commissionPercentage || 0,
      property: propertyId || location.state?.propertyId,
    };

    try {
      const response = await api.post("/api/bookings", bookingData);
      websocketService.emit("newBooking", response.data);
      navigate("/my-bookings", {
        state: { success: "Booking request submitted successfully!" },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to submit booking"
      );
      if (err.response?.status === 401) {
        navigate("/auth?session=expired");
      }
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "checkInDate" || name === "checkOutDate") {
      // First update the form value
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Check if date is booked
      if (value && isDateDisabled(value)) {
        setError(
          `The selected date (${value}) is already booked. Please choose another date.`
        );
        return;
      }

      // If check-out date is earlier than check-in date, show error
      if (
        name === "checkOutDate" &&
        formData.checkInDate &&
        new Date(value) <= new Date(formData.checkInDate)
      ) {
        setError("Check-out date must be after check-in date");
        return;
      }

      // If check-in date is selected and later than existing check-out date, reset check-out date
      if (
        name === "checkInDate" &&
        formData.checkOutDate &&
        new Date(value) >= new Date(formData.checkOutDate)
      ) {
        setFormData((prev) => ({ ...prev, checkOutDate: "" }));
      }

      setError(""); // Clear any previous errors
    } else if (name === "adults") {
      // Allow empty input temporarily when user is typing
      if (value === "") {
        setFormData((prev) => ({ ...prev, [name]: value }));
        return;
      }

      let newValue = parseInt(value, 10);
      // Only apply constraints if it's a valid number
      if (!isNaN(newValue)) {
        newValue = Math.max(1, newValue);

        if (newValue > maxGuests) {
          setFormData((prev) => ({ ...prev, adults: maxGuests }));
          setError(`Maximum ${maxGuests} adults allowed`);
        } else {
          setFormData((prev) => ({ ...prev, adults: newValue }));
          setError("");
        }
      }
    } else if (name === "children") {
      // Allow empty input temporarily when user is typing
      if (value === "") {
        setFormData((prev) => ({ ...prev, [name]: value }));
        return;
      }

      let newValue = parseInt(value, 10);
      // Only apply constraints if it's a valid number
      if (!isNaN(newValue)) {
        newValue = Math.max(0, newValue);
        setFormData((prev) => ({ ...prev, children: newValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

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

  return (
    <div className="w-full max-w-4xl mx-auto my-4 sm:my-8 md:my-12 bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden px-4 sm:px-0">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 sm:p-6 md:p-8 text-white">
        <div className="flex items-center space-x-3">
          <Hotel className="h-6 w-6 sm:h-8 sm:w-8" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
            {propertyDetails.title || "Book Your Stay"}
          </h2>
        </div>
        <p className="mt-2 opacity-90 max-w-md text-sm sm:text-base">
          Complete the form below to make your reservation. We look forward to
          hosting you!
        </p>
      </div>

      <div className="p-4 sm:p-6 md:p-8">
        {error && (
          <div className="bg-red-50 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 md:mb-8 flex items-center gap-3 border border-red-200 text-sm sm:text-base">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-blue-100 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 font-medium text-sm sm:text-base">
                  Nights
                </span>
                <span className="text-base sm:text-lg font-semibold">
                  {formData.nights}
                </span>
              </div>
              {dailyRateBreakdown.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Price Breakdown
                  </h4>
                  <div className="max-h-48 overflow-y-auto bg-white rounded-lg p-3 border border-blue-100">
                    {dailyRateBreakdown.map((item, index) =>
                      item.source === "seasonal" ? (
                        <div
                          key={`price-${index}`}
                          className="flex justify-between items-center text-sm py-1 border-b border-blue-50 last:border-0"
                        >
                          <span className="text-gray-600 flex items-center">
                            <span className="w-2 h-2 inline-block bg-purple-500 rounded-full mr-2"></span>
                            Seasonal Fee
                          </span>
                          <span className="font-medium">
                            {currencySymbols[propertyDetails.currency]}{" "}
                            {item.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div
                          key={`price-${index}`}
                          className="flex justify-between items-center text-sm py-1 border-b border-blue-50 last:border-0"
                        >
                          <span className="text-gray-600 flex items-center">
                            <span className="w-2 h-2 inline-block bg-blue-500 rounded-full mr-2"></span>
                            {new Date(item.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="font-medium">
                            {currencySymbols[propertyDetails.currency]}{" "}
                            {item.price.toFixed(2)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
              <div className="border-t border-blue-200 my-3 pt-3 flex justify-between items-center">
                <span className="text-gray-900 font-semibold text-sm sm:text-base">
                  Total Price
                </span>
                <span className="text-xl sm:text-2xl font-bold text-blue-700">
                  {currencySymbols[propertyDetails.currency]}{" "}
                  {calculatedPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2 text-gray-800 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Availability Calendar
            </h3>
            {fetchingBookings ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">
                  Loading availability...
                </span>
              </div>
            ) : (
              <AvailabilityCalendar
                bookedDates={bookedDates}
                onSelectCheckIn={handleSelectCheckInDate}
                onSelectCheckOut={handleSelectCheckOutDate}
                checkInDate={formData.checkInDate}
                checkOutDate={formData.checkOutDate}
              />
            )}

            <p className="text-xs text-gray-500 mt-2">
              Dates with cross lines are already booked and not available for
              reservation.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <input type="hidden" name="property" value={formData.property} />

          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Guest Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Guest Name *
                </label>
                <input
                  type="text"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  placeholder="Full Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  placeholder="+1 (234) 567-8900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Nationality *
                </label>
                <div className="relative">
                  <Globe className="absolute left-2 sm:left-3 top-2 sm:top-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                  <select
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full pl-8 sm:pl-10 p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white text-sm sm:text-base"
                    required
                  >
                    <option value="">Select Nationality</option>
                    {nationalities.map((nation) => (
                      <option key={nation} value={nation}>
                        {nation}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Currency
                </label>
                <div className="relative">
                  <Coins className="absolute left-2 sm:left-3 top-2 sm:top-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full pl-8 sm:pl-10 p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white text-sm sm:text-base"
                    required
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Stay Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Check-in Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2 sm:left-3 top-2 sm:top-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                  <input
                    type="date"
                    name="checkInDate"
                    value={formData.checkInDate}
                    onChange={handleChange}
                    className="w-full pl-8 sm:pl-10 p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Check-out Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2 sm:left-3 top-2 sm:top-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                  <input
                    type="date"
                    name="checkOutDate"
                    value={formData.checkOutDate}
                    onChange={handleChange}
                    className="w-full pl-8 sm:pl-10 p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                    required
                    min={
                      formData.checkInDate ||
                      new Date().toISOString().split("T")[0]
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Arrival Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-2 sm:left-3 top-2 sm:top-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                  <input
                    type="time"
                    name="arrivalTime"
                    value={formData.arrivalTime}
                    onChange={handleChange}
                    className="w-full pl-8 sm:pl-10 p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Rooms *
                </label>
                <div className="relative">
                  <Bed className="absolute left-2 sm:left-3 top-2 sm:top-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                  <input
                    type="number"
                    name="rooms"
                    min="1"
                    max={propertyDetails.rooms || 1}
                    value={formData.rooms}
                    onChange={handleChange}
                    className="w-full pl-8 sm:pl-10 p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                    required
                  />
                </div>
                {propertyDetails.rooms && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Maximum {propertyDetails.rooms} rooms available
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Booking Channel
                </label>
                <div className="relative">
                  <Users className="absolute left-2 sm:left-3 top-2 sm:top-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                  <select
                    name="bookingAgent"
                    value={formData.bookingAgent}
                    onChange={(e) => {
                      const selectedAgent = agents.find(
                        (a) => a._id === e.target.value
                      );
                      setFormData((prev) => ({
                        ...prev,
                        bookingAgent: e.target.value,
                        commissionPercentage:
                          selectedAgent?.commissionPercentage || 0,
                      }));
                    }}
                    className="w-full pl-8 sm:pl-10 p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white text-sm sm:text-base"
                  >
                    <option value="">Select Booking Channel</option>
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name} ({agent.commissionPercentage}% commission)
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Commission Percentage
                </label>
                <input
                  type="number"
                  name="commissionPercentage"
                  value={formData.commissionPercentage}
                  readOnly
                  className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Adults * ({formData.adults}/{maxGuests} maximum)
                </label>
                <div className="relative">
                  <Users className="absolute left-2 sm:left-3 top-2 sm:top-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                  <input
                    type="number"
                    name="adults"
                    min="1"
                    value={formData.adults}
                    onChange={handleChange}
                    className="w-full pl-8 sm:pl-10 p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Children
                </label>
                <div className="relative">
                  <Users className="absolute left-2 sm:left-3 top-2 sm:top-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                  <input
                    type="number"
                    name="children"
                    value={formData.children}
                    onChange={handleChange}
                    className="w-full pl-8 sm:pl-10 p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Payment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, paymentMethod: "cash" })
                }
                className={`p-3 sm:p-4 border rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${
                  formData.paymentMethod === "cash"
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <DollarSign
                  className={`h-4 sm:h-5 w-4 sm:w-5 mr-2 ${
                    formData.paymentMethod === "cash"
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                />
                <span
                  className={`font-medium text-sm sm:text-base ${
                    formData.paymentMethod === "cash"
                      ? "text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  Cash
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, paymentMethod: "stripe" })
                }
                className={`p-3 sm:p-4 border rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${
                  formData.paymentMethod === "stripe"
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <img
                  src="/stripe.png"
                  className="h-4 sm:h-5 mr-2"
                  alt="Stripe"
                />
                <span
                  className={`font-medium text-sm sm:text-base ${
                    formData.paymentMethod === "stripe"
                      ? "text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  Stripe
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Remarks
            </label>
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleChange}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-24 sm:h-32 text-sm sm:text-base"
              placeholder="Remarks (Optional)..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || authLoading || formData.adults > maxGuests}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-800 flex items-center justify-center gap-2 disabled:opacity-70 shadow-md font-medium text-base sm:text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 sm:h-5 w-4 sm:w-5" />
                Complete Reservation
              </>
            )}
          </button>
        </form>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full mx-auto shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Confirm Your Booking
              </h3>
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 sm:h-6 w-5 sm:w-6" />
              </button>
            </div>

            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 border border-blue-100">
              <div className="flex items-center mb-3 sm:mb-4 text-blue-700">
                <Hotel className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                <h4 className="font-semibold text-sm sm:text-base truncate">
                  {propertyDetails.title}
                </h4>
              </div>

              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium text-gray-900">
                    {formData.checkInDate}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium text-gray-900">
                    {formData.checkOutDate}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-medium text-gray-900">
                    {formData.adults} Adult{formData.adults > 1 ? "s" : ""}
                    {formData.children > 0
                      ? `, ${formData.children} Child${
                          formData.children > 1 ? "ren" : ""
                        }`
                      : ""}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Rooms</span>
                  <span className="font-medium text-gray-900">
                    {formData.rooms}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="text-gray-900 font-medium">Total Price</span>
                  <span className="font-bold text-blue-700">
                    {propertyDetails.currency} {calculatedPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl mb-6 border border-gray-200">
              <span className="text-gray-700">Payment Method</span>
              <span className="font-medium capitalize flex items-center">
                {formData.paymentMethod === "stripe" ? (
                  <>
                    <img src="/stripe.png" className="h-5 mr-2" alt="Stripe" />
                    Stripe
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 mr-1 text-green-600" />
                    Cash
                  </>
                )}
              </span>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Go Back
              </button>

              <button
                type="button"
                onClick={submitBooking}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 disabled:opacity-70 flex items-center justify-center gap-2 font-medium shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                {loading ? "Processing..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReservationForm;
