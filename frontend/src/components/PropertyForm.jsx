import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  Loader2,
  X,
  Image,
  MapPin,
  Banknote,
  Save,
  Trash2,
  Upload,
  ArrowLeft,
  Home,
  BedDouble,
  Bath,
  DollarSign,
  FileText,
  Cloud,
  Star,
} from "lucide-react";
import PropTypes from "prop-types";

const categories = [
  {
    type: "Short Term Rental",
    description: "Short Term Rental (≤80 sq.m)",
    lowSeason: 8,
    highSeason: 12,
    sqm: 80,
  },
  {
    type: "Short Term Rental >80 sq.m",
    description: "Short Term Rental (>80 sq.m)",
    lowSeason: 9,
    highSeason: 15,
    sqm: 81,
  },
  {
    type: "Self Sustained Villa",
    description: "Self Sustained Villa",
    lowSeason: 9,
    highSeason: 18,
    sqm: null,
  },
  {
    type: "Self Sustained Residency <=80sq.m",
    description: "Self Sustained Residency (≤80sq.m)",
    lowSeason: 8,
    highSeason: 14,
    sqm: 80,
  },
  {
    type: "Self Sustained Residency >80sq.m",
    description: "Self Sustained Residency (>80sq.m)",
    lowSeason: 9,
    highSeason: 19,
    sqm: 81,
  },
];

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(!!id);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const [property, setProperty] = useState({
    title: "",
    type: "Short Term Rental",
    description: "",
    bedrooms: 1,
    bathrooms: 1,
    location: {
      address: "",
      city: "",
      country: "",
      postalCode: "",
    },
    bankDetails: {
      accountHolder: "",
      accountNumber: "",
      bankName: "",
      swiftCode: "",
      iban: "",
      currency: "USD",
    },
    amenities: {
      swimmingPool: false,
      wifi: false,
      parking: false,
      airConditioning: false,
      kitchen: false,
      tv: false,
      washer: false,
      balcony: false,
    },
    pricePerNight: "",
    photos: [],
  });

  const bankDetailsFields = [
    { key: "accountHolder", label: "Account Holder" },
    { key: "accountNumber", label: "Account Number" },
    { key: "bankName", label: "Bank Name" },
    { key: "swiftCode", label: "Swift Code" },
    { key: "iban", label: "IBAN" },
    {
      key: "currency",
      label: "Currency",
      options: ["USD", "EUR", "GBP", "JPY", "INR"],
    },
  ];

  const handleInputChange = useCallback((field, value, section = null) => {
    if (section) {
      setProperty((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setProperty((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  }, []);

  const InputField = useCallback(
    ({
      label,
      value,
      onChange,
      name,
      section = null,
      type = "text",
      required = false,
      options,
      ...props
    }) => (
      <div className="relative">
        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          {label} {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {options ? (
          <div className="relative group">
            <select
              value={value}
              onChange={(e) => onChange(name, e.target.value, section)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 bg-white appearance-none shadow-sm hover:border-indigo-400 group-hover:border-indigo-400"
              required={required}
              {...props}
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500 transition-transform duration-300 group-hover:scale-110">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(name, e.target.value, section)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 bg-white shadow-sm hover:border-indigo-400"
            required={required}
            {...props}
          />
        )}
      </div>
    ),
    []
  );

  InputField.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    section: PropTypes.string,
    type: PropTypes.string,
    required: PropTypes.bool,
    options: PropTypes.array,
  };

  useEffect(() => {
    const currentMonth = new Date().getMonth() + 1;
    const isHighSeason = currentMonth >= 4 && currentMonth <= 10;
    const selectedCategory = categories.find(
      (cat) => cat.type === property.type
    );

    if (selectedCategory) {
      const price = isHighSeason
        ? selectedCategory.highSeason
        : selectedCategory.lowSeason;
      setProperty((prev) => ({
        ...prev,
        pricePerNight: price,
        currency: "EUR",
      }));
    } else {
      setProperty((prev) => ({
        ...prev,
        pricePerNight: "",
        currency: "EUR",
      }));
    }
  }, [property.type]);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoadingProperty(true);
        if (!id) return;
        const data = await api.get(`/api/properties/${id}`);
        setProperty({
          ...data,
          location: {
            address: data.location?.address || "",
            city: data.location?.city || "",
            country: data.location?.country || "",
            postalCode: data.location?.postalCode || "",
          },
          bankDetails: {
            accountHolder: data.bankDetails?.accountHolder || "",
            accountNumber: data.bankDetails?.accountNumber || "",
            bankName: data.bankDetails?.bankName || "",
            swiftCode: data.bankDetails?.swiftCode || "",
            iban: data.bankDetails?.iban || "",
            currency: data.bankDetails?.currency || "USD",
          },
          amenities: {
            swimmingPool: data.amenities?.swimmingPool || false,
            wifi: data.amenities?.wifi || false,
            parking: data.amenities?.parking || false,
            airConditioning: data.amenities?.airConditioning || false,
            kitchen: data.amenities?.kitchen || false,
            tv: data.amenities?.tv || false,
            washer: data.amenities?.washer || false,
            balcony: data.amenities?.balcony || false,
          },
          photos: data.photos || [],
        });
      } catch (err) {
        setError(err.message || "Failed to load property");
      } finally {
        setLoadingProperty(false);
      }
    };
    if (id) fetchProperty();
  }, [id]);

  if (loadingProperty) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <Loader2 className="animate-spin h-16 w-16 text-indigo-600" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-t-4 border-indigo-200 animate-pulse"></div>
          </div>
          <p className="text-indigo-800 font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Loading property details...
          </p>
        </div>
      </div>
    );
  }

  if (error && id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white text-red-700 p-6 sm:p-8 rounded-2xl mb-6 shadow-xl border border-red-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-xl font-bold mb-2 text-gray-900">
              Error Loading Property
            </h3>
            <p className="text-gray-700">{error}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 bg-white py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 mx-auto font-medium group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="text-center bg-white p-6 sm:p-10 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden border border-gray-100">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full text-red-600 mb-6 ring-4 ring-red-50">
            <X className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-8">
            You need admin privileges to access this page.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-8 rounded-xl hover:shadow-lg transition-all duration-300 font-medium transform hover:-translate-y-1 w-full sm:w-auto"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const handleUpload = async (e) => {
    try {
      setUploading(true);
      const files = Array.from(e.target.files);
      const formData = new FormData();
      files.forEach((file) => formData.append("photos", file));
      const { photoUrls } = await api.post("/api/properties/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProperty((prev) => ({
        ...prev,
        photos: [...prev.photos, ...photoUrls],
      }));
    } catch (err) {
      setError("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!property.bankDetails?.currency) {
      setError("Currency selection is required");
      setLoading(false);
      return;
    }
    try {
      if (id) {
        await api.put(`/api/properties/${id}`, property);
      } else {
        await api.post("/api/properties", property);
      }
      navigate("/properties");
    } catch (err) {
      setError(err.message || "Failed to save property");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await api.delete(`/api/properties/${id}`);
        navigate("/properties");
      } catch (err) {
        setError("Delete failed: " + err.message);
      }
    }
  };

  // Helper function to get icon color based on section
  const getSectionColor = (section) => {
    const colors = {
      basic: "text-indigo-600",
      amenities: "text-purple-600",
      location: "text-emerald-600",
      bank: "text-amber-600",
      photos: "text-pink-600",
    };
    return colors[section] || "text-indigo-600";
  };

  // Helper function to get background color based on section
  const getSectionBgColor = (section) => {
    const colors = {
      basic: "bg-indigo-100",
      amenities: "bg-purple-100",
      location: "bg-emerald-100",
      bank: "bg-amber-100",
      photos: "bg-pink-100",
    };
    return colors[section] || "bg-indigo-100";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-4 sm:py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <button
              onClick={() => navigate("/properties")}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-2 sm:mb-3 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Back to Properties</span>
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent relative">
              {id ? "Edit Property" : "Create New Property"}
              <div className="absolute -bottom-2 left-0 w-20 sm:w-24 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div>
            </h2>
          </div>
          <button
            onClick={() => navigate("/properties")}
            className="p-2 bg-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:rotate-90 self-end sm:self-auto"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-white border-l-4 border-red-500 p-4 sm:p-5 rounded-r-xl shadow-lg relative overflow-hidden animate-pulse">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-700 font-medium text-sm sm:text-base">
                {error}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Basic Information Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8 transition-all duration-300 hover:shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div
                className={`${getSectionBgColor(
                  "basic"
                )} p-2 sm:p-3 rounded-xl shadow-sm transition-all duration-300 group-hover:shadow-md`}
              >
                <Home
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${getSectionColor(
                    "basic"
                  )}`}
                />
              </div>
              <span className="relative">
                Basic Information
                <span className="absolute -bottom-1 left-0 w-10 sm:w-12 h-0.5 bg-indigo-600 rounded-full"></span>
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <InputField
                label="Property Title"
                required
                name="title"
                value={property.title}
                onChange={handleInputChange}
                placeholder="Enter property title"
              />
              <div className="relative">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Property Type <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative group">
                  <select
                    value={property.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 bg-white appearance-none shadow-sm hover:border-indigo-400 group-hover:border-indigo-400"
                  >
                    <option value="Short Term Rental">
                      Short Term Rental (≤80 sq.m)
                    </option>
                    <option value="Short Term Rental >80 sq.m">
                      Short Term Rental ({">"}80 sq.m)
                    </option>
                    <option value="Self Sustained Villa">
                      Self Sustained Villa
                    </option>
                    <option value="Self Sustained Residency <=80sq.m">
                      Self Sustained Residency (≤80sq.m)
                    </option>
                    <option value="Self Sustained Residency >80sq.m">
                      Self Sustained Residency ({">"}80sq.m)
                    </option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500 transition-transform duration-300 group-hover:scale-110">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Rooms <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                    <BedDouble className="w-5 h-5" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={property.bedrooms}
                    onChange={(e) =>
                      handleInputChange("bedrooms", e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 bg-white shadow-sm hover:border-indigo-400"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Bathrooms <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                    <Bath className="w-5 h-5" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={property.bathrooms}
                    onChange={(e) =>
                      handleInputChange("bathrooms", e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 bg-white shadow-sm hover:border-indigo-400"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Price Per Night <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={property.pricePerNight}
                    readOnly
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 cursor-not-allowed shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Description
                </label>
                <textarea
                  value={property.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 min-h-24 sm:min-h-32 shadow-sm hover:border-indigo-400"
                  placeholder="Describe the property features and amenities..."
                />
              </div>
            </div>
          </div>

          {/* Amenities Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8 transition-all duration-300 hover:shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div
                className={`${getSectionBgColor(
                  "amenities"
                )} p-2 sm:p-3 rounded-xl shadow-sm transition-all duration-300 group-hover:shadow-md`}
              >
                <Star
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${getSectionColor(
                    "amenities"
                  )}`}
                />
              </div>
              <span className="relative">
                Key Amenities
                <span className="absolute -bottom-1 left-0 w-10 sm:w-12 h-0.5 bg-purple-600 rounded-full"></span>
              </span>
            </h3>

            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {Object.keys(property.amenities || {}).map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl border border-gray-100 hover:bg-purple-50 hover:border-purple-200 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <input
                    type="checkbox"
                    checked={property.amenities[amenity]}
                    onChange={(e) =>
                      setProperty((prev) => ({
                        ...prev,
                        amenities: {
                          ...prev.amenities,
                          [amenity]: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <span className="capitalize text-gray-700 font-medium text-sm sm:text-base">
                    {amenity.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Location Details Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 transition-all duration-300 hover:shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div
                className={`${getSectionBgColor(
                  "location"
                )} p-2 sm:p-3 rounded-xl shadow-sm transition-all duration-300 group-hover:shadow-md`}
              >
                <MapPin
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${getSectionColor(
                    "location"
                  )}`}
                />
              </div>
              <span className="relative">
                Location Details
                <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-emerald-600 rounded-full"></span>
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {Object.entries(property.location).map(([key, value]) => (
                <InputField
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  name={key}
                  value={value}
                  onChange={handleInputChange}
                  section="location"
                  placeholder={`Enter ${key}`}
                />
              ))}
            </div>
          </div>

          {/* Bank Information Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 md:p-8 transition-all duration-200 hover:shadow-lg overflow-hidden relative group">
            <div className="absolute -right-16 -top-16 bg-amber-50 w-32 h-32 rounded-full opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
            <div className="absolute -left-16 -bottom-16 bg-amber-50 w-32 h-32 rounded-full opacity-30 group-hover:opacity-50 transition-all duration-300"></div>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-2 rounded-lg shadow-sm">
                <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <span className="relative">
                Bank Information
                <div className="absolute h-1 w-1/3 bg-amber-300 bottom-0 left-0 rounded-full opacity-70"></div>
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {bankDetailsFields.map(({ key, label, options }) => (
                <InputField
                  key={key}
                  label={label}
                  name={key}
                  value={property.bankDetails[key]}
                  onChange={handleInputChange}
                  section="bankDetails"
                  options={options}
                  required={key === "currency"}
                  placeholder={`Select ${label}`}
                />
              ))}
            </div>
          </div>

          {/* Property Photos Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 md:p-8 transition-all duration-200 hover:shadow-lg overflow-hidden relative group">
            <div className="absolute -right-16 -top-16 bg-purple-50 w-32 h-32 rounded-full opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
            <div className="absolute -left-16 -bottom-16 bg-purple-50 w-32 h-32 rounded-full opacity-30 group-hover:opacity-50 transition-all duration-300"></div>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-2 rounded-lg shadow-sm">
                <Image className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <span className="relative">
                Property Photos
                <div className="absolute h-1 w-1/3 bg-purple-300 bottom-0 left-0 rounded-full opacity-70"></div>
              </span>
            </h3>

            {property.photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {property.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative group rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <img
                      src={photo.url}
                      alt={`Property ${index + 1}`}
                      className="w-full h-32 sm:h-40 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    <button
                      type="button"
                      onClick={() =>
                        setProperty((prev) => ({
                          ...prev,
                          photos: prev.photos.filter((_, i) => i !== index),
                        }))
                      }
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 hover:scale-110 shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-6 sm:mb-8 border-2 border-dashed border-gray-200 transition-all duration-300 hover:border-purple-200">
                <Cloud className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-3 sm:mb-4 drop-shadow-md" />
                <p className="text-gray-500 text-center font-medium">
                  No photos uploaded yet
                </p>
                <p className="text-xs sm:text-sm text-gray-400 text-center mt-1">
                  Upload high-quality photos to showcase this property
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <label className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 w-full sm:w-auto justify-center">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {uploading ? "Uploading..." : "Upload Photos"}
                <input
                  type="file"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                  accept="image/*"
                />
              </label>
              <p className="text-xs sm:text-sm text-gray-500">
                Upload high-quality photos (JPEG, PNG, WEBP). Max 10 files.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 sticky bottom-4 z-10">
            {id && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 sm:px-6 py-3 sm:py-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 w-full sm:w-auto transition-all duration-200 shadow-sm hover:shadow border border-red-100"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Delete Property
              </button>
            )}
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center gap-2 w-full sm:w-auto transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1 relative overflow-hidden group"
            >
              <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-10 transition-opacity"></span>
              {loading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              {id ? "Save Changes" : "Create Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default PropertyForm;
