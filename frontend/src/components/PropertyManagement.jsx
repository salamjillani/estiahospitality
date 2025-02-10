import { useState, useEffect, useCallback } from "react";
import {
  Map,
  CreditCard,
  Image,
  Plus,
  Search,
  MoreHorizontal,
  Loader2,
  Trash2,
  Building,
  Receipt,
  Download,
  X,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext";
import { api, setAuthToken } from "../utils/api";

const propertyShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  description: PropTypes.string,
  identifier: PropTypes.string,
  vendorType: PropTypes.string,
  profile: PropTypes.shape({
    description: PropTypes.string,
    location: PropTypes.shape({
      address: PropTypes.string,
      city: PropTypes.string,
      country: PropTypes.string,
      postalCode: PropTypes.string,
    }),
  }),
  location: PropTypes.shape({
    city: PropTypes.string,
    country: PropTypes.string,
    address: PropTypes.string,
    postalCode: PropTypes.string,
    coordinates: PropTypes.shape({
      lat: PropTypes.string,
      lng: PropTypes.string,
    }),
  }),
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string,
      caption: PropTypes.string,
      isPrimary: PropTypes.bool,
    })
  ),
  managers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
    })
  ),
  bankDetails: PropTypes.shape({
    accountHolder: PropTypes.string,
    accountNumber: PropTypes.string,
    bankName: PropTypes.string,
    swiftCode: PropTypes.string,
    iban: PropTypes.string,
    currency: PropTypes.string,
  }),
  taxDetails: PropTypes.shape({
    airbnb: PropTypes.shape({
      vatNumber: PropTypes.string,
      taxId: PropTypes.string,
      taxRate: PropTypes.string,
    }),
    booking: PropTypes.shape({
      vatNumber: PropTypes.string,
      taxId: PropTypes.string,
      taxRate: PropTypes.string,
    }),
  }),
}).isRequired;

const PropertyFormModal = ({
  onClose,
  onSubmit,
  formData,
  setFormData,
  loading,
  mode,
  property,
  setError,
}) => {
  useEffect(() => {
    if (mode === "edit" && property) {
      const profileData = property.profile || {};
      const locationData = profileData.location || {};
      const bankDetailsData = property.bankDetails || {};

      setFormData({
        title: property.title || "",
        type: property.type || "villa",
        identifier: property.identifier || "",
        vendorType: property.vendorType || "individual",
        description: profileData.description || "",
        location: {
          address: locationData.address || "",
          city: locationData.city || "",
          country: locationData.country || "",
          postalCode: locationData.postalCode || "",
        },
        photos: property.photos.map((photo) => ({
          ...photo,
          url: photo.url.startsWith("/") ? photo.url : `/${photo.url}`,
        })),
        bankDetails: {
          accountHolder: bankDetailsData.accountHolder || "",
          accountNumber: bankDetailsData.accountNumber || "",
          bankName: bankDetailsData.bankName || "",
          swiftCode: bankDetailsData.swiftCode || "",
          iban: bankDetailsData.iban || "",
          currency: bankDetailsData.currency || "USD",
        },
      });
    }
  }, [mode, property, setFormData]);

  const handleImageUpload = (e) => {
    try {
      const files = Array.from(e.target.files);
      const maxFileSize = 5 * 1024 * 1024;

      const invalidFiles = files.filter((file) => {
        const isValidSize = file.size <= maxFileSize;
        const isValidType = file.type.startsWith("image/");
        return !isValidSize || !isValidType;
      });

      if (invalidFiles.length > 0) {
        setError("Some files were not added. Files must be images under 5MB.");
        return;
      }

      const newPhotos = files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        caption: "",
        isPrimary: false,
      }));

      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos],
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
      setError("Failed to upload images");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            {mode === "add"
              ? "Add New Property"
              : `Edit ${property?.title || "Property"}`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-10">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
              <Image size={20} className="text-blue-600" />
              Property Images
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {formData.photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative group aspect-video rounded-xl overflow-hidden shadow-md"
                >
                  <img
                    src={
                      photo.url.startsWith("/uploads") ||
                      photo.url.startsWith("http")
                        ? `${import.meta.env.VITE_API_BASE_URL}${photo.url}`
                        : photo.url
                    }
                    className="w-full h-full object-cover"
                    alt={`Property photo ${index + 1}`}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          photos: prev.photos.filter((_, i) => i !== index),
                        }));
                      }}
                      className="text-white bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <label className="border-2 border-dashed border-gray-200 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 group">
                <Image
                  size={24}
                  className="text-gray-400 group-hover:text-blue-500 transition-colors"
                />
                <span className="mt-2 text-sm text-gray-500 group-hover:text-blue-600">
                  Add Photos
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
              <Building size={20} className="text-blue-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Property Name *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Property Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="villa">Villa</option>
                  <option value="holiday_apartment">Holiday Apartment</option>
                  <option value="hotel">Hotel</option>
                  <option value="cottage">Cottage</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Describe your property..."
            />
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
              <Map size={20} className="text-blue-600" />
              Location
            </h3>
            <div className="space-y-6">
              <input
                type="text"
                placeholder="Street Address"
                value={formData.location.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...formData.location,
                      address: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <div className="grid grid-cols-3 gap-6">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.location.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        city: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={formData.location.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        country: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={formData.location.postalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        postalCode: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
              <CreditCard size={20} className="text-blue-600" />
              Banking Details
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Account Holder"
                value={formData.bankDetails.accountHolder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: {
                      ...formData.bankDetails,
                      accountHolder: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <input
                type="text"
                placeholder="Account Number"
                value={formData.bankDetails.accountNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: {
                      ...formData.bankDetails,
                      accountNumber: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <input
                type="text"
                placeholder="Bank Name"
                value={formData.bankDetails.bankName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: {
                      ...formData.bankDetails,
                      bankName: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <input
                type="text"
                placeholder="SWIFT Code"
                value={formData.bankDetails.swiftCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: {
                      ...formData.bankDetails,
                      swiftCode: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <input
                type="text"
                placeholder="IBAN"
                value={formData.bankDetails.iban}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: {
                      ...formData.bankDetails,
                      iban: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <select
                value={formData.bankDetails.currency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: {
                      ...formData.bankDetails,
                      currency: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white pt-6 mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {mode === "add" ? "Add Property" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

PropertyFormModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  setError: PropTypes.func,
  loading: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["add", "edit"]).isRequired,
  property: PropTypes.shape({
    title: PropTypes.string,
    type: PropTypes.string,
    identifier: PropTypes.string,
    vendorType: PropTypes.string,
    profile: PropTypes.shape({
      description: PropTypes.string,
      location: PropTypes.shape({
        address: PropTypes.string,
        city: PropTypes.string,
        country: PropTypes.string,
        postalCode: PropTypes.string,
      }),
    }),
    photos: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string,
        caption: PropTypes.string,
        isPrimary: PropTypes.bool,
      })
    ),
    bankDetails: PropTypes.shape({
      accountHolder: PropTypes.string,
      accountNumber: PropTypes.string,
      bankName: PropTypes.string,
      swiftCode: PropTypes.string,
      iban: PropTypes.string,
      currency: PropTypes.string,
    }),
  }),
};

const PropertyDetailsModal = ({ property, onClose }) => {
  if (!property) return null;

  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((acc, part) => {
      return acc && acc[part] ? acc[part] : "-";
    }, obj);
  };

  const getPropertyImages = () => {
    return (
      property.photos?.map((photo) => ({
        ...photo,
        url: photo.url.startsWith("/uploads")
          ? `${import.meta.env.VITE_API_BASE_URL}${photo.url}`
          : photo.url,
      })) || []
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl m-4 min-h-[200px]">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">{property.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Property Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Image size={20} />
              Property Images
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {getPropertyImages().map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={
                      photo.url.startsWith("/uploads") ||
                      photo.url.startsWith("http")
                        ? `${import.meta.env.VITE_API_BASE_URL}${photo.url}`
                        : photo.url
                    }
                  />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm rounded-b-lg">
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Property Name
                </label>
                <div className="mt-1">{property?.title || "-"}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Property Type
                </label>
                <div className="mt-1">{property.type}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Description
                </label>
                <div className="mt-1">
                  {getNestedValue(property, "profile.description")}
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Map size={20} />
              Location
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500">
                  Address
                </label>
                <div className="mt-1">
                  {getNestedValue(property, "profile.location.address")}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  City
                </label>
                <div className="mt-1">
                  {getNestedValue(property, "profile.location.city")}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Country
                </label>
                <div className="mt-1">
                  {getNestedValue(property, "profile.location.country")}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Postal Code
                </label>
                <div className="mt-1">
                  {getNestedValue(property, "profile.location.postalCode")}
                </div>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard size={20} />
              Banking Details
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {property.bankDetails?.accountHolder && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Account Holder
                  </label>
                  <div className="mt-1">
                    {property.bankDetails.accountHolder}
                  </div>
                </div>
              )}
              {property.bankDetails?.accountNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Account Number
                  </label>
                  <div className="mt-1">
                    {property.bankDetails.accountNumber}
                  </div>
                </div>
              )}
              {property.bankDetails?.bankName && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Bank Name
                  </label>
                  <div className="mt-1">{property.bankDetails.bankName}</div>
                </div>
              )}
              {property.bankDetails?.swiftCode && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    SWIFT Code
                  </label>
                  <div className="mt-1">{property.bankDetails.swiftCode}</div>
                </div>
              )}
              {property.bankDetails?.iban && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    IBAN
                  </label>
                  <div className="mt-1">{property.bankDetails.iban}</div>
                </div>
              )}
              {property.bankDetails?.currency && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Currency
                  </label>
                  <div className="mt-1">{property.bankDetails.currency}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

PropertyDetailsModal.propTypes = {
  property: PropTypes.shape({
    title: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    photos: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        caption: PropTypes.string,
      })
    ),
    profile: PropTypes.shape({
      description: PropTypes.string,
      location: PropTypes.shape({
        address: PropTypes.string,
        city: PropTypes.string,
        country: PropTypes.string,
        postalCode: PropTypes.string,
      }),
    }),
    bankDetails: PropTypes.shape({
      accountHolder: PropTypes.string,
      accountNumber: PropTypes.string,
      bankName: PropTypes.string,
      swiftCode: PropTypes.string,
      iban: PropTypes.string,
      currency: PropTypes.string,
    }),
  }),
  onClose: PropTypes.func.isRequired,
};

const PropertyManagement = () => {
  const { token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewPropertyModal, setShowNewPropertyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeProperty, setActiveProperty] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "villa",
    vendorType: "individual",
    description: "",
    location: {
      address: "",
      city: "",
      country: "",
      postalCode: "",
    },
    photos: [],
    bankDetails: {
      accountHolder: "",
      accountNumber: "",
      bankName: "",
      swiftCode: "",
      iban: "",
      currency: "USD",
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        setAuthToken(token);
        fetchProperties();
      } catch (err) {
        console.error("Token setup failed:", err);
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        setAuthToken(token);
        await fetchProperties();
      } catch (err) {
        console.error("Initial load error:", err);
      }
    };
    loadData();
  }, []);

  const resetFormData = () => {
    setFormData({
      title: "",
      type: "villa",
      vendorType: "individual",
      description: "",
      location: { address: "", city: "", country: "", postalCode: "" },
      photos: [],
      bankDetails: {
        accountHolder: "",
        accountNumber: "",
        bankName: "",
        swiftCode: "",
        iban: "",
        currency: "USD",
      },
    });
  };

  const handleImageUpload = (e) => {
    try {
      const files = Array.from(e.target.files);
      console.log("Selected files:", files);
      if (!files.length) return;

      const validFiles = files.filter(
        (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
      );

      if (validFiles.length !== files.length) {
        console.warn(
          "Invalid files:",
          files.filter((f) => !validFiles.includes(f))
        ); // 🔍 Warn about invalid files
        setError("Some files were rejected (max 5MB, images only)");
      }

      const newPhotos = validFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        caption: "",
        isPrimary: false,
      }));
      console.log(
        "Processed Image URLs:",
        newPhotos.map((photo) => photo.url)
      );
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos],
      }));
    } catch (error) {
      setError("Image upload failed: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;

    try {
      setLoading(true);
      await api.delete(`/api/properties/${propertyToDelete._id}`);
      await fetchProperties(); // Refresh the list
      setShowDeleteDialog(false);
    } catch (err) {
      setError(err.message || "Failed to delete property");
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyDelete = (property) => {
    setPropertyToDelete(property);
    setShowDeleteDialog(true);
  };

  const EditPropertyModal = ({ property, onClose, onSave, loading }) => {
    const [editForm, setEditForm] = useState({
      title: property?.title || "",
      type: property?.type || "villa",
      vendorType: property?.vendorType || "individual",
      identifier: property?.identifier || "",
      description: property?.description || "",
      location: {
        address: property?.location?.address || "",
        city: property?.location?.city || "",
        country: property?.location?.country || "",
        postalCode: property?.location?.postalCode || "",
      },
      bankDetails: {
        accountHolder: property?.bankDetails?.accountHolder || "",
        accountNumber: property?.bankDetails?.accountNumber || "",
        bankName: property?.bankDetails?.bankName || "",
        swiftCode: property?.bankDetails?.swiftCode || "",
        iban: property?.bankDetails?.iban || "",
        currency: property?.bankDetails?.currency || "USD",
      },
    });

    const handleSubmit = async (e) => {
      e.preventDefault();

      const payload = {
        ...editForm,
        type: editForm.type,
        location: JSON.stringify(editForm.location),
        bankDetails: JSON.stringify(editForm.bankDetails),
      };

      try {
        await onSave(payload);
      } catch (error) {
        console.error("Error updating property:", error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative transform transition-all duration-300 ease-in-out">
          <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Property
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Type *
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, type: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 bg-white"
                  required
                >
                  <option value="villa">Villa</option>
                  <option value="holiday_apartment">Holiday Apartment</option>
                  <option value="hotel">Hotel</option>
                  <option value="cottage">Cottage</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 min-h-[120px] resize-y"
                placeholder="Describe your property..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Vendor Type
                </label>
                <select
                  value={editForm.vendorType}
                  onChange={(e) =>
                    setEditForm({ ...editForm, vendorType: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 bg-white"
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Identifier
                </label>
                <input
                  type="text"
                  value={editForm.identifier}
                  onChange={(e) =>
                    setEditForm({ ...editForm, identifier: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                  placeholder="Unique identifier for the property"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 -mx-6 -mb-6 p-6 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                disabled={loading}
              >
                {loading && <Loader2 className="animate-spin" size={18} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  EditPropertyModal.propTypes = {
    property: PropTypes.shape({
      title: PropTypes.string,
      type: PropTypes.string,
      vendorType: PropTypes.string,
      identifier: PropTypes.string,
      description: PropTypes.string,
      location: PropTypes.shape({
        address: PropTypes.string,
        city: PropTypes.string,
        country: PropTypes.string,
        postalCode: PropTypes.string,
      }),
      bankDetails: PropTypes.shape({
        accountHolder: PropTypes.string,
        accountNumber: PropTypes.string,
        bankName: PropTypes.string,
        swiftCode: PropTypes.string,
        iban: PropTypes.string,
        currency: PropTypes.string,
      }),
    }),
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
  };

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/properties");
      console.log("Fetched Properties Response:", response);
      setProperties(response.properties || []);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError("Failed to fetch properties");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      fetchProperties();
    }
  }, [token, fetchProperties]);

  console.log("Token from useAuth:", token);
  console.log("Token from localStorage:", localStorage.getItem("token"));

  const handlePropertySelect = (property) => {
    setSelectedProperties((prev) => {
      const isSelected = prev.find((p) => p._id === property._id);
      if (isSelected) {
        return prev.filter((p) => p._id !== property._id);
      }
      return [...prev, property];
    });
  };

  const handleNewProperty = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const validTypes = ["villa", "holiday_apartment", "hotel", "cottage"];
      if (!validTypes.includes(formData.type)) {
        setError("Invalid property type selection");
        return;
      }

      const formPayload = new FormData();
      formData.photos.forEach((photo, index) => {
        if (photo.file) {
          formPayload.append("photos", photo.file);
          formPayload.append(
            `photoData[${index}]`,
            JSON.stringify({
              caption: photo.caption,
              isPrimary: photo.isPrimary,
            })
          );
        }
      });

      formPayload.append("type", formData.type.toLowerCase().trim());
      formPayload.append("title", formData.title);
      formPayload.append("description", formData.description);
      formPayload.append("vendorType", formData.vendorType);
      formPayload.append("location", JSON.stringify(formData.location));
      formPayload.append("bankDetails", JSON.stringify(formData.bankDetails));

      if (!formData.title || !formData.type) {
        setError("Property name and type are required");
        return;
      }

      const response = await api.post("/api/properties", formPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response || !response.success || !response.property) {
        throw new Error("Invalid server response format");
      }

      setFormData((prev) => ({
        ...prev,
        photos:
          response.property.photos?.map((photo) => ({
            url: photo.url,
            caption: photo.caption || "",
            isPrimary: photo.isPrimary || false,
          })) || [],
      }));

      setProperties((prev) => [...prev, response.property]);
      setShowNewPropertyModal(false);
      resetFormData();
      await fetchProperties();
    } catch (err) {
      console.error("Error adding property:", err);
      setError(err.message || "Failed to add property");
    } finally {
      setLoading(false);
    }
  };

  const PropertyProfileModal = ({
    property,
    onClose,
    onSave,
    loading,
    token,
  }) => {
    const [formData, setFormData] = useState({
      title: property?.title || "",
      description: property?.description || "",
      type: property?.type || "villa",
      vendorType: property?.vendorType || "individual",
      location: {
        address: property?.profile?.location?.address || "",
        city: property?.profile?.location?.city || "",
        country: property?.profile?.location?.country || "",
        postalCode: property?.profile?.location?.postalCode || "",
      },
      bankDetails: {
        accountHolder: property?.bankDetails?.accountHolder || "",
        accountNumber: property?.bankDetails?.accountNumber || "",
        bankName: property?.bankDetails?.bankName || "",
        swiftCode: property?.bankDetails?.swiftCode || "",
        iban: property?.bankDetails?.iban || "",
        currency: property?.bankDetails?.currency || "USD",
      },
      photos: property?.profile?.photos || [],
    });

    const handleImageUpload = (e) => {
      try {
        const files = Array.from(e.target.files);
        const newPhotos = files.map((file) => ({
          file,
          url: URL.createObjectURL(file),
          caption: "",
          isPrimary: false,
        }));

        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...newPhotos],
        }));
      } catch (error) {
        console.error("Error uploading images:", error);
        setError("Failed to upload images");
      }
    };

    const uploadImages = async (propertyId, photos) => {
      try {
        const formData = new FormData();

        photos.forEach((photo, index) => {
          if (photo.file) {
            formData.append("photos", photo.file);
            formData.append(`captions[${index}]`, photo.caption || "");
            formData.append(`isPrimary[${index}]`, photo.isPrimary || false);
          }
        });

        const response = await api.post(
          `/api/properties/${propertyId}/photos`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        return response.data.photos;
      } catch (error) {
        console.error("Error uploading images:", error);
        throw error;
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await onSave(property._id, formData, token);

        const newPhotos = formData.photos.filter((photo) => photo.file);
        if (newPhotos.length > 0) {
          await uploadImages(property._id, newPhotos);
        }
      } catch (error) {
        console.error("Submission error:", error);
        setError("Failed to save property or upload images");
      }
    };

    const inputClasses =
      "w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200";
    const sectionClasses =
      "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4";
    const headingClasses =
      "text-lg font-semibold flex items-center gap-2 text-gray-800";

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4 shadow-2xl">
          <div className="sticky top-0 bg-white/90 backdrop-blur-sm px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Property Profile
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className={sectionClasses}>
              <h3 className={headingClasses}>
                <Image size={20} className="text-blue-500" />
                Property Images
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group aspect-video">
                    <img
                      src={
                        photo.url.startsWith("blob:")
                          ? photo.url
                          : `${import.meta.env.VITE_API_BASE_URL}${photo.url}`
                      }
                      alt={photo.caption || `Property ${index + 1}`}
                      className="w-full h-full object-cover rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            photos: prev.photos.filter((_, i) => i !== index),
                          }));
                        }}
                        className="text-white bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <label className="border-2 border-dashed border-gray-300 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200">
                  <Image size={24} className="text-blue-500 mb-2" />
                  <span className="text-sm text-gray-600 font-medium">
                    Add Photos
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    Click or drag images
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className={sectionClasses}>
              <h3 className={headingClasses}>
                <Building size={20} className="text-blue-500" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Property Name
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Property Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className={inputClasses}
                  >
                    <option value="villa">Villa</option>
                    <option value="holiday_apartment">Holiday Apartment</option>
                    <option value="hotel">Hotel</option>
                    <option value="cottage">Cottage</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className={`${inputClasses} resize-y min-h-[120px]`}
                  placeholder="Describe your property..."
                />
              </div>
            </div>

            <div className={sectionClasses}>
              <h3 className={headingClasses}>
                <Map size={20} className="text-blue-500" />
                Location
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Street Address"
                  value={formData.location.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        address: e.target.value,
                      },
                    })
                  }
                  className={inputClasses}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.location.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          city: e.target.value,
                        },
                      })
                    }
                    className={inputClasses}
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={formData.location.country}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          country: e.target.value,
                        },
                      })
                    }
                    className={inputClasses}
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={formData.location.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          postalCode: e.target.value,
                        },
                      })
                    }
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>

            <div className={sectionClasses}>
              <h3 className={headingClasses}>
                <CreditCard size={20} className="text-blue-500" />
                Banking Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Account Holder"
                  value={formData.bankDetails.accountHolder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        accountHolder: e.target.value,
                      },
                    })
                  }
                  className={inputClasses}
                />
                <input
                  type="text"
                  placeholder="Account Number"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        accountNumber: e.target.value,
                      },
                    })
                  }
                  className={inputClasses}
                />
                <input
                  type="text"
                  placeholder="Bank Name"
                  value={formData.bankDetails.bankName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        bankName: e.target.value,
                      },
                    })
                  }
                  className={inputClasses}
                />
                <input
                  type="text"
                  placeholder="SWIFT Code"
                  value={formData.bankDetails.swiftCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        swiftCode: e.target.value,
                      },
                    })
                  }
                  className={inputClasses}
                />
                <input
                  type="text"
                  placeholder="IBAN"
                  value={formData.bankDetails.iban}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        iban: e.target.value,
                      },
                    })
                  }
                  className={inputClasses}
                />
                <select
                  value={formData.bankDetails.currency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        currency: e.target.value,
                      },
                    })
                  }
                  className={inputClasses}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm -mx-6 -mb-6 p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                disabled={loading}
              >
                {loading && <Loader2 className="animate-spin" size={18} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  PropertyProfileModal.propTypes = {
    property: PropTypes.shape({
      _id: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      type: PropTypes.string,
      vendorType: PropTypes.string,
      profile: PropTypes.shape({
        location: PropTypes.shape({
          address: PropTypes.string,
          city: PropTypes.string,
          country: PropTypes.string,
          postalCode: PropTypes.string,
        }),
        photos: PropTypes.arrayOf(
          PropTypes.shape({
            url: PropTypes.string,
            caption: PropTypes.string,
            isPrimary: PropTypes.bool,
          })
        ),
      }),
      bankDetails: PropTypes.shape({
        accountHolder: PropTypes.string,
        accountNumber: PropTypes.string,
        bankName: PropTypes.string,
        swiftCode: PropTypes.string,
        iban: PropTypes.string,
        currency: PropTypes.string,
      }),
    }),
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    token: PropTypes.string.isRequired,
  };

  const InvoiceModal = ({ property, onClose }) => {
    const [generatedInvoice, setGeneratedInvoice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { token } = useAuth();

    const generateInvoice = async (propertyId, platform) => {
      if (!token) {
        setError("Authentication token is missing");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/properties/${propertyId}/invoice`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({ platform }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to generate invoice");
        }

        const invoice = await response.json();
        setGeneratedInvoice(invoice);

        if (invoice.downloadUrl) {
          const link = document.createElement("a");
          link.href = invoice.downloadUrl;
          link.download = `${platform}-invoice-${property.title}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Generate Invoice
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-red-600 text-sm font-medium flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </p>
              </div>
            )}

            {generatedInvoice ? (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border border-green-100 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Receipt className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">
                        Invoice Generated Successfully
                      </h3>
                      <p className="text-sm text-green-600">
                        Invoice #{generatedInvoice.invoiceNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-semibold text-lg">
                      {generatedInvoice.amount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium">
                      {new Date(generatedInvoice.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {generatedInvoice.downloadUrl && (
                  <button
                    onClick={() =>
                      window.open(generatedInvoice.downloadUrl, "_blank")
                    }
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transform transition-all duration-200 hover:scale-[1.02] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
                  >
                    <Download size={18} />
                    <span>Download Invoice</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => generateInvoice(property._id, "airbnb")}
                  disabled={loading}
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                      <Receipt className="text-blue-600" size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900 mb-1">
                        Airbnb Invoice
                      </div>
                      <div className="text-sm text-gray-600">
                        Generate invoice with Airbnb tax details
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => generateInvoice(property._id, "booking")}
                  disabled={loading}
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                      <Receipt className="text-blue-600" size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900 mb-1">
                        Booking.com Invoice
                      </div>
                      <div className="text-sm text-gray-600">
                        Generate invoice with Booking.com tax details
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <Loader2
                    className="animate-spin text-blue-600 mb-2"
                    size={32}
                  />
                  <p className="text-sm text-gray-600">Generating invoice...</p>
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              >
                {generatedInvoice ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  InvoiceModal.propTypes = {
    property: propertyShape,
    onClose: PropTypes.func.isRequired,
  };

  const handleProfileUpdate = async (propertyId, updatedData) => {
    try {
      setLoading(true);
      setError("");

      const formPayload = new FormData();

      // Properly structure nested data
      const profileData = {
        description: updatedData.description,
        location: updatedData.location,
      };

      // Stringify nested objects
      formPayload.append("profile", JSON.stringify(profileData));
      formPayload.append(
        "bankDetails",
        JSON.stringify(updatedData.bankDetails)
      );

      // Append other fields
      formPayload.append("title", updatedData.title);
      formPayload.append("type", updatedData.type);
      formPayload.append("vendorType", updatedData.vendorType);
      formPayload.append("identifier", updatedData.identifier || "");

      // Handle photos
      updatedData.photos.forEach((photo) => {
        if (photo.file) formPayload.append("photos", photo.file);
      });

      const response = await api.put(
        `/api/properties/${propertyId}`,
        formPayload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token || localStorage.getItem("token")}`,
          },
        }
      );

      setProperties((prev) =>
        prev.map((p) => (p._id === propertyId ? response.property : p))
      );
      setShowProfileModal(false);
      await fetchProperties();
    } catch (err) {
      setError(err.message || "Failed to update property");
    } finally {
      setLoading(false);
    }
  };

  const PropertyActions = ({ property, onDelete, onProfile, onInvoice }) => {
    const { user } = useAuth();

    const hasPermission = (property) => {
      return (
        user &&
        (user.role === "admin" ||
          user.role === "manager" ||
          (property.managers &&
            property.managers.some((manager) => manager._id === user._id)))
      );
    };

    return (
      <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-lg bg-white/50 backdrop-blur-sm">
        {hasPermission(property) && (
          <>
            <button
              onClick={() => onProfile(property)}
              className="relative group flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all duration-200 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
              title="Edit profile"
            >
              <Building
                size={18}
                className="text-gray-400 group-hover:text-green-600 transition-colors duration-200"
              />
              <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Edit profile
              </span>
            </button>

            <button
              onClick={() => onInvoice(property)}
              className="relative group flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              title="Generate invoice"
            >
              <Receipt
                size={18}
                className="text-gray-400 group-hover:text-blue-600 transition-colors duration-200"
              />
              <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Generate invoice
              </span>
            </button>

            <button
              onClick={() => onDelete(property)}
              className="relative group flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all duration-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              title="Delete property"
            >
              <Trash2
                size={18}
                className="text-gray-400 group-hover:text-red-600 transition-colors duration-200"
              />
              <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Delete property
              </span>
            </button>
          </>
        )}

        <button className="relative group flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">
          <MoreHorizontal
            size={18}
            className="text-gray-400 group-hover:text-gray-600 transition-colors duration-200"
          />
          <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            More options
          </span>
        </button>
      </div>
    );
  };

  PropertyActions.propTypes = {
    property: propertyShape,
    onDelete: PropTypes.func.isRequired,
    onProfile: PropTypes.func.isRequired,
    onInvoice: PropTypes.func.isRequired,
  };

  const PropertyCard = ({
    property,
    onSelect,
    isSelected,
    onDelete,
    onProfile,
    onInvoice,
    setActiveProperty,
    setShowDetailsModal,
  }) => {
    const getPropertyImageUrl = () => {
      if (!property.photos?.length) return "";
      const photo = property.photos[0];
      return photo.url.startsWith("/uploads")
        ? `${import.meta.env.VITE_API_BASE_URL}${photo.url}`
        : photo.url;
    };

    return (
      <div 
      className="group bg-white border border-gray-100 rounded-xl transition-all duration-200 hover:shadow-lg hover:border-gray-200 overflow-hidden cursor-pointer"
      onClick={() => {
        setActiveProperty(property);
        setShowDetailsModal(true);
      }}
    >
        <div className="p-4 sm:p-6">
          {/* Remove stopPropagation from this wrapper div */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left Side - Checkbox, Image, and Title */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelect(property);
                  }}
                  className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200 cursor-pointer"
                />
              </div>

              {/* Image Container */}
              <div
                className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden group/image"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={getPropertyImageUrl()}
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                  }}
                />
                <button className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <Image size={20} className="text-white" />
                </button>
              </div>

              {/* Title and Type */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {property.title}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {property.type}
                </span>
              </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onProfile(property)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                Edit
              </button>
              <button
                onClick={() => onInvoice(property)}
                className="px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
              >
                Invoice
              </button>
              <button
                onClick={() => onDelete(property)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Location Section */}
          {property.location?.address && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
              <Map size={18} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                {property.profile?.location?.city &&
                property.profile?.location?.country
                  ? `${property.profile.location.city}, ${property.profile.location.country}`
                  : "-"}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredProperties = properties.filter((property) =>
    property.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  PropertyCard.propTypes = {
    property: PropTypes.shape({
      title: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      photos: PropTypes.arrayOf(
        PropTypes.shape({
          url: PropTypes.string.isRequired,
        })
      ),
      location: PropTypes.shape({
        address: PropTypes.string,
      }),
      profile: PropTypes.shape({
        location: PropTypes.shape({
          city: PropTypes.string,
          country: PropTypes.string,
        }),
      }),
    }),
    onSelect: PropTypes.func.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onDelete: PropTypes.func.isRequired,
    onProfile: PropTypes.func.isRequired,
    onInvoice: PropTypes.func.isRequired,
    setActiveProperty: PropTypes.func.isRequired,
    setShowDetailsModal: PropTypes.func.isRequired,
  };

  const DeleteDialog = ({ isOpen, onClose, onConfirm, propertyTitle }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div
          className="relative bg-white rounded-2xl w-full max-w-md transform transition-all duration-300 scale-in-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Delete Property
                </h2>
                <p className="text-gray-600">
                  Are you sure you want to delete &quot;{propertyTitle}&quot;?
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={onConfirm}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform hover:scale-[1.02]"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  DeleteDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    propertyTitle: PropTypes.string,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl shadow-sm animate-in slide-in-from-top duration-300 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500" />
          <span className="font-medium">{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto p-1 hover:bg-red-100 rounded-full transition-colors duration-200"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Properties
        </h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <button
            onClick={() => setShowNewPropertyModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-sm hover:from-blue-700 hover:to-blue-800 transform transition-all duration-200 hover:scale-[1.02] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus size={20} />
            <span className="font-medium">Add Property</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="col-span-1">
            <div className="relative">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-gray-300 text-blue-600 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onChange={() => {
                  if (selectedProperties.length === properties.length) {
                    setSelectedProperties([]);
                  } else {
                    setSelectedProperties([...properties]);
                  }
                }}
                checked={
                  selectedProperties.length === properties.length &&
                  properties.length > 0
                }
              />
            </div>
          </div>
          <div className="col-span-4 font-medium text-gray-600">Name</div>
          <div className="col-span-2 font-medium text-gray-600">Actions</div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-gray-500 font-medium">Loading properties...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProperties
              .filter((property) => property && property._id)
              .map((property) => (
                <PropertyCard
                  key={property?._id}
                  property={property}
                  isSelected={selectedProperties.some(
                    (p) => p?._id === property?._id
                  )}
                  onSelect={handlePropertySelect}
                  onDelete={handlePropertyDelete}
                  onProfile={(p) => {
                    setActiveProperty(p);
                    setShowProfileModal(true);
                  }}
                  onInvoice={(p) => {
                    setActiveProperty(p);
                    setShowInvoiceModal(true);
                  }}
                  setActiveProperty={setActiveProperty}
                  setShowDetailsModal={setShowDetailsModal}
                />
              ))}
          </div>
        )}

        {showNewPropertyModal && (
          <PropertyFormModal
            onClose={() => setShowNewPropertyModal(false)}
            onSubmit={handleNewProperty}
            formData={formData}
            setFormData={setFormData}
            loading={loading}
            setError={setError}
            mode="add"
            handleImageUpload={handleImageUpload}
          />
        )}
        {showDetailsModal && activeProperty && (
          <PropertyDetailsModal
            property={activeProperty}
            onClose={() => {
              setShowDetailsModal(false);
              setActiveProperty(null);
            }}
          />
        )}
        {showProfileModal && activeProperty && (
          <PropertyFormModal
            onClose={() => {
              setShowProfileModal(false);
              setActiveProperty(null);
            }}
            onSubmit={(e) => {
              e.preventDefault();
              handleProfileUpdate(activeProperty._id, formData);
            }}
            formData={formData}
            setFormData={setFormData}
            loading={loading}
            mode="edit"
            property={activeProperty}
            
          />
        )}

        {showInvoiceModal && activeProperty && (
          <InvoiceModal
            property={activeProperty}
            onClose={() => setShowInvoiceModal(false)}
          />
        )}

        {showDeleteDialog && (
          <DeleteDialog
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setPropertyToDelete(null);
            }}
            onConfirm={handleDelete}
            propertyTitle={propertyToDelete?.title}
          />
        )}
      </div>
    </div>
  );
};
export default PropertyManagement;
