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
      photos: property.photos.map(photo => ({
        ...photo,
        url: photo.url.startsWith('/') ? photo.url : `/${photo.url}`
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
      const maxFileSize = 5 * 1024 * 1024; // 5MB limit

      // Validate file size and type
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {mode === "add"
              ? "Add New Property"
              : `Edit ${property?.title || "Property"}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Image size={20} />
              Property Images
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${photo.url}`}
                    alt={photo.caption || `Property ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          photos: prev.photos.filter((_, i) => i !== index),
                        }));
                      }}
                      className="text-white bg-red-500 p-2 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <label className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <Image size={24} className="text-gray-400" />
                <span className="mt-2 text-sm text-gray-500">Add Photos</span>
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

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Describe your property..."
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Map size={20} />
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
                className="w-full px-3 py-2 border rounded-md"
              />
              <div className="grid grid-cols-3 gap-4">
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
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard size={20} />
              Banking Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
                className="w-full px-3 py-2 border rounded-md"
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
                className="w-full px-3 py-2 border rounded-md"
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
                className="w-full px-3 py-2 border rounded-md"
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
                className="w-full px-3 py-2 border rounded-md"
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
                className="w-full px-3 py-2 border rounded-md"
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
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white pt-4 pb-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
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
  setError: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["add", "edit"]).isRequired,
  property: propertyShape,
  handleImageUpload: PropTypes.func.isRequired,
};

const PropertyDetailsModal = ({ property, onClose }) => {
  if (!property) return null;

 
  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((acc, part) => {
      return acc && acc[part] ? acc[part] : "-";
    }, obj);
  };

  const getPropertyImages = () => {
    return property.photos || [];
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
                    src={`${import.meta.env.VITE_API_BASE_URL}${photo.url}`}
                    alt={photo.caption || `Property ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
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
  // Add this in the PropertyManagement component's functions
  const handleImageUpload = (e) => {
    try {
      const files = Array.from(e.target.files);
      const maxFileSize = 5 * 1024 * 1024;

      // Filter invalid files
      const validFiles = files.filter(
        (file) => file.size <= maxFileSize && file.type.startsWith("image/")
      );

      if (validFiles.length !== files.length) {
        setError("Some files were rejected (max 5MB, images only)");
      }

      const newPhotos = validFiles.map((file) => ({
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
      setError("Image upload failed", error);
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

      // Create a proper payload that includes all necessary fields
      const payload = {
        ...editForm,
        type: editForm.type, // Ensure type is included
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Edit Property</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={editForm.type}
                onChange={(e) =>
                  setEditForm({ ...editForm, type: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="villa">Villa</option>
                <option value="holiday_apartment">Holiday Apartment</option>
                <option value="hotel">Hotel</option>
                <option value="cottage">Cottage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Type
              </label>
              <select
                value={editForm.vendorType}
                onChange={(e) =>
                  setEditForm({ ...editForm, vendorType: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identifier
              </label>
              <input
                type="text"
                value={editForm.identifier}
                onChange={(e) =>
                  setEditForm({ ...editForm, identifier: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Unique identifier for the property"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
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
    property: propertyShape,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
  };

  // Update the fetchProperties function:
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/properties");

      // Handle different response structures
      const propertiesData =
        response.properties || response.data?.properties || [];

      const validProperties = propertiesData.filter(
        (p) => p && p._id && p.title && p.type
      );

      setProperties(validProperties);
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

      // Validate type before sending
      const validTypes = ["villa", "holiday_apartment", "hotel", "cottage"];
      if (!validTypes.includes(formData.type)) {
        setError("Invalid property type selection");
        return;
      }

      const formPayload = new FormData();

      // Append basic fields
      formPayload.append("type", formData.type.toLowerCase().trim());
      formPayload.append("title", formData.title);
      formPayload.append("description", formData.description);
      formPayload.append("vendorType", formData.vendorType);
      formPayload.append("location", JSON.stringify(formData.location));
      formPayload.append("bankDetails", JSON.stringify(formData.bankDetails));

      // Handle photos correctly
      if (formData.photos && formData.photos.length > 0) {
        formData.photos.forEach((photo, index) => {
          if (photo.file) {
            // Append each photo with a unique field name
            formPayload.append("photos", photo.file);
            // Append additional photo metadata if needed
            formPayload.append(
              `photoData[${index}]`,
              JSON.stringify({
                caption: photo.caption || "",
                isPrimary: photo.isPrimary || false,
              })
            );
          }
        });
      }

      // Validate required fields
      if (!formData.title || !formData.type) {
        setError("Property name and type are required");
        return;
      }

      console.log("Location data:", formData.location);
      console.log("Bank details:", formData.bankDetails);

      const response = await api.post("/api/properties", formPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response?.data?.property) { // Modified to check response.data
        throw new Error("Invalid response from server");
      }
  
      // Update form data with persisted photos from server
      setFormData(prev => ({
        ...prev,
        photos: response.data.property.photos.map(photo => ({
          url: photo.url,
          caption: photo.caption,
          isPrimary: photo.isPrimary
        }))
      }));
  
      // Update properties list and close modal
      setProperties(prev => [...prev, response.data.property]);
      setShowNewPropertyModal(false);
      resetFormData();
      await fetchProperties();
      
    } catch (err) {
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
          formData.append(`photos`, photo.file);
          formData.append(`captions[${index}]`, photo.caption);
          formData.append(`isPrimary[${index}]`, photo.isPrimary);
        });

        const data = await api.post(
          `/api/properties/${propertyId}/photos`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return data.photos;
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
      }
    };
   
    return (
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
          <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold">Property Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Image size={20} />
                Property Images
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${photo.url}`}
                      alt={photo.caption || `Property ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            photos: prev.photos.filter((_, i) => i !== index),
                          }));
                        }}
                        className="text-white bg-red-500 p-2 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <label className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                  <Image size={24} className="text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">Add Photos</span>
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

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building size={20} />
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Name
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="villa">Villa</option>
                    <option value="holiday_apartment">Holiday Apartment</option>
                    <option value="hotel">Hotel</option>
                    <option value="cottage">Cottage</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Describe your property..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Map size={20} />
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
                  className="w-full px-3 py-2 border rounded-md"
                />
                <div className="grid grid-cols-3 gap-4">
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
                    className="w-full px-3 py-2 border rounded-md"
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
                    className="w-full px-3 py-2 border rounded-md"
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
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard size={20} />
                Banking Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
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
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white pt-4 pb-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
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
    property: propertyShape,
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Generate Invoice</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {generatedInvoice ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-medium text-green-800">
                  Invoice Generated Successfully
                </h3>
                <p className="text-sm text-green-600 mt-1">
                  Invoice #{generatedInvoice.invoiceNumber}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{generatedInvoice.amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
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
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download Invoice
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => generateInvoice(property._id, "airbnb")}
                disabled={loading}
                className="w-full px-4 py-3 text-left bg-white border rounded-md hover:bg-gray-50 flex items-center gap-3"
              >
                <Receipt className="text-blue-600" size={20} />
                <div>
                  <div className="font-medium">Airbnb Invoice</div>
                  <div className="text-sm text-gray-500">
                    Generate invoice with Airbnb tax details
                  </div>
                </div>
              </button>

              <button
                onClick={() => generateInvoice(property._id, "booking")}
                disabled={loading}
                className="w-full px-4 py-3 text-left bg-white border rounded-md hover:bg-gray-50 flex items-center gap-3"
              >
                <Receipt className="text-blue-600" size={20} />
                <div>
                  <div className="font-medium">Booking.com Invoice</div>
                  <div className="text-sm text-gray-500">
                    Generate invoice with Booking.com tax details
                  </div>
                </div>
              </button>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {generatedInvoice ? "Close" : "Cancel"}
            </button>
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
        location: updatedData.location
      };
  
      // Stringify nested objects
      formPayload.append("profile", JSON.stringify(profileData));
      formPayload.append("bankDetails", JSON.stringify(updatedData.bankDetails));
      
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
      <div className="flex items-center space-x-2">
        {hasPermission(property) && (
          <>
            <button
              onClick={() => onProfile(property)}
              className="p-1 text-gray-400 hover:text-green-600"
              title="Edit profile"
            >
              <Building size={18} />
            </button>
            <button
              onClick={() => onInvoice(property)}
              className="p-1 text-gray-400 hover:text-blue-600"
              title="Generate invoice"
            >
              <Receipt size={18} />
            </button>
            <button
              onClick={() => onDelete(property)}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Delete property"
            >
              <Trash2 size={18} />
            </button>
          </>
        )}
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={18} />
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
}) => {

  const getPropertyImage = () => {
  const photo = property.photos?.[0];
  if (!photo) return "";
  return `${import.meta.env.VITE_API_BASE_URL}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
};

    return (
      <div
        className="grid grid-cols-12 gap-4 px-6 py-4 border-b hover:bg-gray-50 cursor-pointer"
        onClick={() => {
          setActiveProperty(property);
          setShowDetailsModal(true);
        }}
      >
        <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(property)}
            className="rounded border-gray-300"
          />
        </div>

        <div className="col-span-4 flex items-center gap-3">
          <div className="w-12 h-8 relative bg-gray-200 rounded group">
            <img
              src={getPropertyImage()}
              alt={property.title}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.JPG';
              }}
            />
            <button className="absolute inset-0 bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Image size={16} />
            </button>
          </div>
          <div>
            <div className="font-medium text-gray-900">{property.title}</div>
            <div className="text-sm text-gray-500">{property.type}</div>
          </div>
        </div>
        <div className="col-span-5 flex items-center space-x-2">
          {property.location?.address && (
            <Map size={18} className="text-gray-400" />
          )}
          <div className="text-sm text-gray-500">
            {property.profile?.location?.city &&
            property.profile?.location?.country
              ? `${property.profile.location.city}, ${property.profile.location.country}`
              : "-"}
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-end space-x-2">
          <PropertyActions
            property={property}
            onDelete={onDelete}
            onProfile={onProfile}
            onInvoice={onInvoice}
          />
        </div>
      </div>
    );
  };
  const filteredProperties = properties.filter((property) =>
    property.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  PropertyCard.propTypes = {
    property: propertyShape,
    onSelect: PropTypes.func.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onDelete: PropTypes.func.isRequired,
    onProfile: PropTypes.func.isRequired,
    onInvoice: PropTypes.func.isRequired,
  };

  const DeleteDialog = ({ isOpen, onClose, onConfirm, propertyTitle }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold">Delete Property</h2>
          </div>

          <p className="mb-6 text-gray-600">
            Are you sure you want to delete &quot;{propertyTitle}&quot;? This
            action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
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
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md"
            />
          </div>
          <button
            onClick={() => setShowNewPropertyModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Property
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b text-sm font-medium text-gray-500">
          <div className="col-span-1">
            <input
              type="checkbox"
              className="rounded border-gray-300"
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
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Actions</div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties
              .filter((property) => property && property._id)
              .map((property) => (
                <PropertyCard
                  key={property?._id || Math.random()} // Fallback key
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
