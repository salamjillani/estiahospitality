import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { calculateNights } from '../utils/dateUtils';

import {
  Loader2,
  Calendar,
  Users,
  AlertCircle,
  Bed,
  Globe,
  Coins,
  Clock,
} from "lucide-react";

import { websocketService } from "../services/websocketService";

const ReservationForm = () => {
  const { propertyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
 
  
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
    property: propertyId || location.state?.propertyId,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [propertyDetails, setPropertyDetails] = useState({
    pricePerNight: 0,
    currency: 'USD'
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle socket connection
  useEffect(() => {
    websocketService.connect();
    
  }, [user?.token]);

  // Check authentication first
  useEffect(() => {
    // Only run this once when auth state is settled
    if (!authLoading && !isInitialized) {
      setIsInitialized(true);
      
      if (!user) {
        // Redirect to auth page with return URL
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/auth?returnTo=${returnUrl}`);
      }
    }
  }, [authLoading, user, navigate, isInitialized]);

  // Load property details
  useEffect(() => {
    const loadProperty = async () => {
      try {
        const data = await api.get(`/api/properties/${propertyId}`);
        setPropertyDetails({
          pricePerNight: data.pricePerNight,
          currency: data.currency || data.bankDetails?.currency || 'USD'
        });
      } catch (err) {
        setError('Failed to load property details');
        console.error("Error fetching property:", err);
      }
    };
  
    if (location.state?.property) {
      setPropertyDetails({
        pricePerNight: location.state.property.pricePerNight,
        currency: location.state.property.currency || location.state.property.bankDetails?.currency || 'USD'
      });
    } else if (propertyId) {
      loadProperty();
    }
  }, [propertyId, location.state]);

  // Calculate price when dates change
  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate) {
      const nights = calculateNights(
        formData.checkInDate, 
        formData.checkOutDate
      );
      
      if (nights > 0) {
        const total = nights * propertyDetails.pricePerNight;
        setFormData(prev => ({ ...prev, nights }));
        setCalculatedPrice(total);
      }
    }
  }, [formData.checkInDate, formData.checkOutDate, propertyDetails.pricePerNight]);

  // If still loading auth or no user is set yet, show loading
  if (authLoading || (!isInitialized && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        <span className="ml-2">Verifying authentication...</span>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!user?._id) {
      setError("User authentication required");
      // Redirect to login instead of just showing error
      navigate("/auth");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const requiredFields = [
        "checkInDate",
        "checkOutDate",
        "rooms",
        "adults",
        "guestName",
        "email",
        "phone",
        "nationality",
      ];
      
      const missing = requiredFields.filter((field) => !formData[field]);

      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(", ")}`);
      }

      const bookingData = {
        ...formData,
        totalPrice: calculatedPrice,
        currency: propertyDetails.currency,
        user: user._id,
        status: "pending",
        source: "direct",
      };

      const response = await api.post("/api/bookings", bookingData);

      websocketService.emit("newBooking", response.data);

      navigate("/my-bookings", {
        state: { success: "Booking request submitted successfully!" },
      });
    } catch (err) {
      console.error('Booking submission error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        "Failed to submit booking"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // List of common currencies and nationalities
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border my-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Calendar className="h-6 w-6 text-blue-600" />
        Book Property
      </h2>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="property" value={formData.property} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guest Name *
            </label>
            <input
              type="text"
              name="guestName"
              value={formData.guestName}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>

          {/* Dates Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="checkInDate"
                value={formData.checkInDate}
                onChange={handleChange}
                className="w-full pl-10 p-3 border rounded-lg"
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="checkOutDate"
                value={formData.checkOutDate}
                onChange={handleChange}
                className="w-full pl-10 p-3 border rounded-lg"
                required
                min={
                  formData.checkInDate || new Date().toISOString().split("T")[0]
                }
              />
            </div>
          </div>

          {/* Rooms and Guests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rooms *
            </label>
            <div className="relative">
              <Bed className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="rooms"
                min="1"
                max="10"
                value={formData.rooms}
                onChange={handleChange}
                className="w-full pl-10 p-3 border rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nights
            </label>
            <div className="relative">
              <input
                type="number"
                name="nights"
                min="1"
                value={formData.nights}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Price:</span>
              <span className="text-xl font-bold">
                {propertyDetails.currency} {calculatedPrice.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              ({formData.nights} nights × {propertyDetails.currency}{" "}
              {propertyDetails.pricePerNight})
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adults *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="adults"
                min="1"
                value={formData.adults}
                onChange={handleChange}
                className="w-full pl-10 p-3 border rounded-lg"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Children
            </label>
            <div className="relative">
              <input
                type="number"
                name="children"
                min="0"
                value={formData.children}
                onChange={handleChange}
                className="w-full pl-10 p-3 border rounded-lg"
              />
            </div>
          </div>

          {/* Additional Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nationality *
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className="w-full pl-10 p-3 border rounded-lg appearance-none"
                required
              >
                <option value="">Select Nationality</option>
                {nationalities.map((nation) => (
                  <option key={nation} value={nation}>
                    {nation}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arrival Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="time"
                name="arrivalTime"
                value={formData.arrivalTime}
                onChange={handleChange}
                className="w-full pl-10 p-3 border rounded-lg"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <div className="relative">
            <Coins className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full pl-10 p-3 border rounded-lg appearance-none"
              required
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests
          </label>
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg h-32"
            placeholder="Any special requirements or notes..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Booking Request"
          )}
        </button>
      </form>
    </div>
  );
};

export default ReservationForm;