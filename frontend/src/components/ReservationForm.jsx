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
} from "lucide-react";

import { websocketService } from "../services/websocketService";

const ReservationForm = () => {
  const { propertyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
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
    paymentMethod: "cash",
    property: propertyId || location.state?.propertyId,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [propertyDetails, setPropertyDetails] = useState({
    pricePerNight: 0,
    currency: "USD",
    title: "",
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
        const returnUrl = encodeURIComponent(
          window.location.pathname + window.location.search
        );
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
          currency: data.currency || data.bankDetails?.currency || "USD",
          title: data.title || "Property",
        });
      } catch (err) {
        setError("Failed to load property details");
        console.error("Error fetching property:", err);
      }
    };

    if (location.state?.property) {
      setPropertyDetails({
        pricePerNight: location.state.property.pricePerNight,
        currency:
          location.state.property.currency ||
          location.state.property.bankDetails?.currency ||
          "USD",
        title: location.state.property.title || "Property",
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
        setFormData((prev) => ({ ...prev, nights }));
        setCalculatedPrice(total);
      }
    }
  }, [
    formData.checkInDate,
    formData.checkOutDate,
    propertyDetails.pricePerNight,
  ]);

  // If still loading auth or no user is set yet, show loading
  if (authLoading || (!isInitialized && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        <span className="ml-2 text-lg text-gray-700 font-medium">Verifying authentication...</span>
      </div>
    );
  }

  // Form validation only, doesn't submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?._id) {
      setError("User authentication required");
      navigate("/auth");
      return;
    }

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
      
      // Show confirmation popup
      setShowConfirmation(true);
      
    } catch (err) {
      console.error("Validation error:", err);
      setError(err.message || "Please fill in all required fields");
    }
  };

  // Actual booking submission
  const submitBooking = async () => {
    setLoading(true);
    setError("");

    try {
      const bookingData = {
        ...formData,
        totalPrice: calculatedPrice,
        currency: propertyDetails.currency,
        user: user._id,
        status: "pending",
        source: "direct",
      };

      const response = await api.post("/api/bookings", bookingData);
      
      // Emit websocket event
      websocketService.emit("newBooking", response.data);
      
      // Only navigate after successful API response
      navigate("/my-bookings", {
        state: { success: "Booking request submitted successfully!" },
      });
    } catch (err) {
      console.error("Booking submission error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to submit booking"
      );
      // Keep the confirmation dialog open if there's an error
      setShowConfirmation(false);
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
    <div className="max-w-4xl mx-auto my-12 bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Form Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
        <div className="flex items-center space-x-3">
          <Hotel className="h-8 w-8" />
          <h2 className="text-3xl font-bold">{propertyDetails.title || "Book Your Stay"}</h2>
        </div>
        <p className="mt-2 opacity-90 max-w-md">Complete the form below to make your reservation. We look forward to hosting you!</p>
      </div>

      {/* Form Content */}
      <div className="p-8">
        {error && (
          <div className="bg-red-50 p-4 rounded-xl mb-8 flex items-center gap-3 border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <input type="hidden" name="property" value={formData.property} />
          
          {/* Pricing Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-700 font-medium">Price per night</span>
              <span className="text-lg font-semibold">{propertyDetails.currency} {propertyDetails.pricePerNight}</span>
            </div>
            
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-700 font-medium">Nights</span>
              <span className="text-lg font-semibold">{formData.nights}</span>
            </div>
            
            <div className="border-t border-blue-200 my-3 pt-3 flex justify-between items-center">
              <span className="text-gray-900 font-semibold">Total Price</span>
              <span className="text-2xl font-bold text-blue-700">
                {propertyDetails.currency} {calculatedPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Guest Information Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Guest Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guest Name *
                </label>
                <input
                  type="text"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Full Name"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="your.email@example.com"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="+1 (234) 567-8900"
                  required
                />
              </div>

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
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
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
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
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
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                    required
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stay Details Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Stay Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                    min={
                      formData.checkInDate || new Date().toISOString().split("T")[0]
                    }
                  />
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
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

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
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
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
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Children
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="children"
                    min="0"
                    value={formData.children}
                    onChange={handleChange}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Payment Method
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: "cash" })}
                className={`p-4 border rounded-xl flex items-center justify-center transition-all ${
                  formData.paymentMethod === "cash"
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <DollarSign className={`h-5 w-5 mr-2 ${formData.paymentMethod === "cash" ? "text-blue-600" : "text-gray-500"}`} />
                <span className={`font-medium ${formData.paymentMethod === "cash" ? "text-blue-700" : "text-gray-700"}`}>Cash</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: "stripe" })}
                className={`p-4 border rounded-xl flex items-center justify-center transition-all ${
                  formData.paymentMethod === "stripe"
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <img src="/stripe.png" className="h-5 mr-2" alt="Stripe" />
                <span className={`font-medium ${formData.paymentMethod === "stripe" ? "text-blue-700" : "text-gray-700"}`}>Stripe</span>
              </button>
            </div>
          </div>

          {/* Special Requests Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests
            </label>
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-32"
              placeholder="Let us know if you have any special requirements..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-xl hover:from-blue-700 hover:to-indigo-800 flex items-center justify-center gap-2 disabled:opacity-70 shadow-md font-medium text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Complete Reservation
              </>
            )}
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Confirm Your Booking
              </h3>
              <button 
                onClick={() => setShowConfirmation(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100">
              <div className="flex items-center mb-4 text-blue-700">
                <Hotel className="h-5 w-5 mr-2" />
                <h4 className="font-semibold">{propertyDetails.title}</h4>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium text-gray-900">{formData.checkInDate}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium text-gray-900">{formData.checkOutDate}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-medium text-gray-900">
                    {formData.adults} Adult{formData.adults > 1 ? "s" : ""}{formData.children > 0 ? `, ${formData.children} Child${formData.children > 1 ? "ren" : ""}` : ""}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Rooms</span>
                  <span className="font-medium text-gray-900">{formData.rooms}</span>
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