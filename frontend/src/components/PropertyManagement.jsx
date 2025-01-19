import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Loader2,
  Link as LinkIcon,
  Trash2,
  Edit,
  AlertCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import PropTypes from "prop-types";
import { websocketService } from "../services/webSocketService";
import { useAuth } from "../context/AuthContext";

const PropertyManagement = () => {
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("properties");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewPropertyModal, setShowNewPropertyModal] = useState(false);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const { user, token } = useAuth(); // Added token from auth context

  const [formData, setFormData] = useState({
    title: "",
    type: "separate_room",
    identifier: "",
    listingUrls: [],
  });

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("http://localhost:5000/api/properties", {
        credentials: "include",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`, // Use token from context
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch properties");
      }

      const data = await response.json();
      setProperties(data.properties || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProperties();
    const unsubscribe = websocketService.subscribe(
      "property_created",
      (newProperty) => {
        setProperties((prev) => {
          if (prev.some((p) => p._id === newProperty._id)) {
            return prev;
          }
          return [...prev, newProperty];
        });
      }
    );

    return () => unsubscribe();
  }, [fetchProperties]);

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
      setError("");

      if (!formData.title || !formData.type || !formData.identifier) {
        throw new Error("Please fill in all required fields");
      }

      const response = await fetch("http://localhost:5000/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`, // Use token from context
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add property");
      }

      const newProperty = await response.json();
      setProperties((prev) => [...prev, newProperty]);
      setShowNewPropertyModal(false);
      setFormData({
        title: "",
        type: "separate_room",
        identifier: "",
        listingUrls: [],
      });
    } catch (err) {
      setError(err.message);
      console.error("Error adding property:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProperty = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      if (!editingProperty.title || !editingProperty.type || !editingProperty.identifier) {
        throw new Error("Please fill in all required fields");
      }

      const response = await fetch(
        `http://localhost:5000/api/properties/${editingProperty._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`, // Use token from context
          },
          credentials: "include",
          body: JSON.stringify(editingProperty),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update property");
      }

      const updatedProperty = await response.json();
      setProperties((prev) =>
        prev.map((p) => (p._id === updatedProperty._id ? updatedProperty : p))
      );
      setShowEditPropertyModal(false);
      setEditingProperty(null);
    } catch (err) {
      setError(err.message);
      console.error("Error updating property:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/properties/${propertyToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`, // Use token from context
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete property");
      }

      setProperties((prev) =>
        prev.filter((p) => p._id !== propertyToDelete._id)
      );
      setShowDeleteDialog(false);
      setPropertyToDelete(null);
    } catch (err) {
      setError(err.message);
      console.error("Error deleting property:", err);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (property) => {
    return user && (
      user.role === 'admin' ||
      user.role === 'manager' ||
      (property.managers && property.managers.some(manager => manager._id === user._id))
    );
  };

  const openEditModal = (property) => {
    setEditingProperty({ ...property });
    setShowEditPropertyModal(true);
  };

  const openDeleteDialog = (property) => {
    setPropertyToDelete(property);
    setShowDeleteDialog(true);
  };

  // Added PropTypes for renderPropertyActions

  const PropertyActions = ({ property }) => (
    <div className="flex items-center space-x-2">
      {hasPermission(property) && (
        <>
          <button
            onClick={() => openEditModal(property)}
            className="p-1 text-gray-400 hover:text-blue-600"
            title="Edit property"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => openDeleteDialog(property)}
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

  PropertyActions.propTypes = {
    property: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      managers: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string.isRequired,
      })),
    }).isRequired,
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

  const canAddProperty = user && ["admin", "manager"].includes(user.role);

  const filteredProperties = properties.filter((property) =>
    property.title.toLowerCase().includes(searchQuery.toLowerCase())
  );


// Add function to check if user has permission

// Update renderPropertyActions to check permissions
const renderPropertyActions = (property) => (
  <div className="flex items-center space-x-2">
    {hasPermission(property) && (
      <>
        <button
          onClick={() => openEditModal(property)}
          className="p-1 text-gray-400 hover:text-blue-600"
          title="Edit property"
        >
          <Edit size={18} />
        </button>
        <button
          onClick={() => openDeleteDialog(property)}
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

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded relative">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span className="block sm:inline">{error}</span>
          </div>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError("")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <div className="flex items-center space-x-2">
          <button className="text-blue-600 px-4 py-2 border rounded-md hover:bg-blue-50">
            Subscribe
          </button>
        </div>
      </div>

      <div className="border-b mb-6">
        <div className="flex space-x-8">
          <button
            className={`pb-4 px-1 ${
              activeTab === "properties"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("properties")}
          >
            Properties
          </button>
          <button
            className={`pb-4 px-1 ${
              activeTab === "roomTypes"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("roomTypes")}
          >
            Room Types
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        {canAddProperty && (
          <button
            onClick={() => setShowNewPropertyModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ml-auto flex items-center gap-2"
          >
            <Plus size={18} />
            New property
          </button>
        )}
        <button className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50">
          Groups
        </button>
        <button className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50">
          Room Types
        </button>
        <button className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50">
          Tag
        </button>
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
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Linked Listings</div>
          <div className="col-span-3">Groups</div>
          <div className="col-span-2">Actions</div>
        </div>

        {loading && (
          <div className="px-6 py-8 text-center text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading properties...</p>
          </div>
        )}

        {!loading && filteredProperties.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            <p className="font-medium">No properties found</p>
            <p className="mt-1">Get started by adding a new property</p>
          </div>
        )}

        {!loading &&
          filteredProperties.map((property) => (
            <div
              key={property._id}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b hover:bg-gray-50"
            >
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedProperties.some(
                    (p) => p._id === property._id
                  )}
                  onChange={() => handlePropertySelect(property)}
                  className="rounded border-gray-300"
                />
              </div>
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-12 h-8 bg-gray-200 rounded">
                  <img
                    src="/api/placeholder/48/32"
                    alt=""
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {property.title}
                  </div>
                  <div className="text-sm text-gray-500">{property.type}</div>
                </div>
              </div>
              <div className="col-span-3 flex items-center">
                {property.listingUrls && property.listingUrls.length > 0 ? (
                  <div className="flex gap-2">
                    {property.listingUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <LinkIcon size={18} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <button className="text-blue-600 hover:text-blue-700">
                    <Plus size={18} />
                  </button>
                )}
              </div>
              <div className="col-span-3 flex items-center text-gray-500">
                -
              </div>
              <div className="col-span-2 flex items-center justify-between">
                {renderPropertyActions(property)}
              </div>
            </div>
          ))}
      </div>

      {/* Edit Property Modal */}
      {showEditPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Property</h2>
              <button
                onClick={() => {
                  setShowEditPropertyModal(false);
                  setEditingProperty(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditProperty}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editingProperty.title}
                    onChange={(e) =>
                      setEditingProperty({
                        ...editingProperty,
                        title: e.target.value,
                      })
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
                    value={editingProperty.type}
                    onChange={(e) =>
                      setEditingProperty({
                        ...editingProperty,
                        type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="separate_room">Separate Room</option>
                    <option value="entire_property">Entire Property</option>
                    <option value="cottage">Cottage</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identifier *
                  </label>
                  <input
                    type="text"
                    value={editingProperty.identifier}
                    onChange={(e) =>
                      setEditingProperty({
                        ...editingProperty,
                        identifier: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPropertyModal(false);
                    setEditingProperty(null);
                  }}
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
      )}

      {/* New Property Modal */}
      {showNewPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add New Property</h2>
              <button
                onClick={() => setShowNewPropertyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleNewProperty}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
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
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="separate_room">Separate Room</option>
                    <option value="entire_property">Entire Property</option>
                    <option value="cottage">Cottage</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identifier *
                  </label>
                  <input
                    type="text"
                    value={formData.identifier}
                    onChange={(e) =>
                      setFormData({ ...formData, identifier: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Unique identifier for the property"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewPropertyModal(false)}
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
                  Add Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setPropertyToDelete(null);
        }}
        onConfirm={handleDeleteProperty}
        propertyTitle={propertyToDelete?.title}
      />
    </div>
  );
};

export default PropertyManagement;
