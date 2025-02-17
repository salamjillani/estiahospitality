import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../utils/api";
import {
  Loader2,
  X,
  Image,
  MapPin,
  Banknote,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import PropTypes from "prop-types";

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [property, setProperty] = useState({
    title: "",
    type: "Apartment",
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
    photos: [],
  });

  useEffect(() => {
    if (id) {
      const fetchProperty = async () => {
        try {
          const data = await api.get(`/api/properties/${id}`);
          // Initialize with correct casing for bank details
          setProperty({
            ...data,
            location: {
              address: "",
              city: "",
              country: "",
              postalCode: "",
              ...data.location,
            },
            bankDetails: {
              accountHolder: data.bankDetails?.accountHolder || "",
              accountNumber: data.bankDetails?.accountNumber || "",
              bankName: data.bankDetails?.bankName || "",
              swiftCode: data.bankDetails?.swiftCode || "",
              iban: data.bankDetails?.iban || "",
              currency: data.bankDetails?.currency || "USD",
            },
            photos: data.photos || [],
          });
        } catch (err) {
          setError(
            "Failed to load property data: " + (err.message || "Unknown error")
          );
        }
      };
      fetchProperty();
    }
  }, [id]);

  const bankDetailsFields = [
    { key: "accountHolder", label: "Account Holder" },
    { key: "accountNumber", label: "Account Number" },
    { key: "bankName", label: "Bank Name" },
    { key: "swiftCode", label: "Swift Code" },
    { key: "iban", label: "IBAN" },
    {
      key: "currency",
      label: "Currency",
      options: [
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "CAD",
        "AUD",
        "CHF",
        "CNY",
        "SEK",
        "NZD",
      ],
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
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {options ? (
          <div className="relative">
            <select
              value={value}
              onChange={(e) => onChange(name, e.target.value, section)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white appearance-none"
              {...props}
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500"
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
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
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            {id ? "Edit Property" : "Create New Property"}
          </h2>
          <button
            onClick={() => navigate("/properties")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Property Title"
                required
                name="title"
                value={property.title}
                onChange={handleInputChange}
                placeholder="Enter property title"
              />

              <div className="relative">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={property.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white appearance-none"
                >
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Villa">Villa</option>
                  <option value="Cabin">Cabin</option>
                </select>
                <div className="absolute right-4 top-10 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-500"
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

              <InputField
                label="Bedrooms"
                type="number"
                required
                name="bedrooms"
                min="1"
                value={property.bedrooms}
                onChange={handleInputChange}
              />

              <InputField
                label="Bathrooms"
                type="number"
                required
                name="bathrooms"
                min="1"
                value={property.bathrooms}
                onChange={handleInputChange}
              />

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Description
                </label>
                <textarea
                  value={property.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-32"
                  placeholder="Describe the property features and amenities..."
                />
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" /> Location Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Bank Information */}
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Banknote className="w-6 h-6 text-blue-600" /> Bank Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bankDetailsFields.map(({ key, label, options }) => (
                <InputField
                  key={key}
                  label={label}
                  name={key}
                  value={property.bankDetails[key]}
                  onChange={handleInputChange}
                  section="bankDetails"
                  options={options}
                  placeholder={`Select ${label}`}
                />
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Image className="w-6 h-6 text-blue-600" /> Property Photos
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {property.photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative group rounded-xl overflow-hidden"
                >
                  <img
                    src={photo.url}
                    alt={`Property ${index + 1}`}
                    className="w-full h-32 object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setProperty((prev) => ({
                        ...prev,
                        photos: prev.photos.filter((_, i) => i !== index),
                      }))
                    }
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <label className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-colors duration-200 shadow-sm hover:shadow">
              <Upload className="w-5 h-5 mr-2" />
              {uploading ? "Uploading..." : "Upload Photos"}
              <input
                type="file"
                multiple
                onChange={handleUpload}
                className="hidden"
                accept="image/*"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Upload high-quality photos (JPEG, PNG, WEBP). Max 10 files.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 sticky bottom-4">
            {id && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 w-full sm:w-auto transition-colors duration-200"
              >
                <Trash2 className="w-5 h-5" />
                Delete Property
              </button>
            )}
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 w-full sm:w-auto transition-colors duration-200 shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
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
