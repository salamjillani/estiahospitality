import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import {
  Loader2,
  Trash2,
  Plus,
  Eye,
  Building2,
  MapPin,
  Bath,
  Bed,
  Edit,
  Droplet,
  Wifi,
  Car,
  Home,
} from "lucide-react";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import PropTypes from "prop-types";

const DeleteDialog = ({ isOpen, onClose, onConfirm, propertyTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-3xl p-8 w-full max-w-md m-4 shadow-2xl transform transition-all animate-in slide-in-from-bottom duration-300">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-5">
            <div className="p-4 bg-red-100 rounded-full">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Delete {propertyTitle || "Property"}
              </h3>
              <p className="text-gray-600 mt-2">
                Are you sure you want to delete{" "}
                {propertyTitle ? (
                  <span className="font-medium">
                    &quot;{propertyTitle}&quot;
                  </span>
                ) : (
                  "this property"
                )}
                ? This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-end mt-2">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:shadow-md"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all duration-200 flex items-center gap-2 hover:shadow-lg shadow-md"
            >
              <Trash2 className="w-4 h-4" />
              Delete Property
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    propertyId: null,
    propertyTitle: null,
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
  };

  const fetchProperties = async () => {
    try {
      const data = await api.get("/api/properties");
      setProperties(data || []); // Ensure data is an array
    } catch (err) {
      if (err.message.includes("401")) {
        navigate("/auth");
        return;
      }
      setError("Failed to load properties: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth", { state: { from: "/properties" } });
    }
  }, [user, loading, navigate]);

  const handleDeleteClick = (id, title) => {
    setDeleteDialog({
      isOpen: true,
      propertyId: id,
      propertyTitle: title,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/properties/${deleteDialog.propertyId}`);
      setProperties((prev) =>
        prev.filter((p) => p._id !== deleteDialog.propertyId)
      );
      setDeleteDialog({ isOpen: false, propertyId: null });
    } catch (err) {
      setError("Failed to delete property: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="mt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-6 p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
            <Loader2 className="animate-spin w-16 h-16 text-blue-600" />
            <p className="text-lg text-gray-600 font-medium animate-pulse">
              Loading your properties...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({
            isOpen: false,
            propertyId: null,
            propertyTitle: null,
          })
        }
        onConfirm={handleDeleteConfirm}
        propertyTitle={deleteDialog.propertyTitle}
      />

      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <main className="pt-24 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-16">
        <div className="fixed top-0 left-0 w-full h-screen bg-[url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-[0.04] z-0"></div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Your Properties
            </h1>
            <p className="text-gray-600">
              Manage and browse all your property listings
            </p>
          </div>
          {user?.role === "admin" && (
            <Link
              to="/properties/new"
              className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-full hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 w-full sm:w-auto justify-center shadow-lg"
            >
              <div className="bg-white/20 p-2 rounded-lg">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <span className="font-medium">Add New Property</span>
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-2xl mb-10 animate-slide-in shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-3">
                <svg
                  className="h-6 w-6 text-red-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property, index) => (
            <div
              key={property._id}
              className="bg-white rounded-3xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden group">
                {property.photos?.[0] ? (
                  <img
                    src={property.photos[0].url}
                    alt={property.title}
                    className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <Home className="w-16 h-16 text-blue-400" />
                  </div>
                )}

                <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
                  {Object.entries(property.amenities || {})
                    .filter(([_, value]) => value)
                    .slice(0, 3) // Show first 3 key amenities
                    .map(([amenity]) => (
                      <div
                        key={amenity}
                        className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm"
                      >
                        {amenity === "swimmingPool" && (
                          <Droplet className="w-4 h-4 text-blue-500" />
                        )}
                        {amenity === "wifi" && (
                          <Wifi className="w-4 h-4 text-green-500" />
                        )}
                        {amenity === "parking" && (
                          <Car className="w-4 h-4 text-purple-500" />
                        )}
                        {amenity === "airConditioning" && (
                          <Car className="w-4 h-4 text-purple-500" />
                        )}
                        {amenity === "kitchen" && (
                          <Car className="w-4 h-4 text-purple-500" />
                        )}
                        {amenity === "tv" && (
                          <Car className="w-4 h-4 text-purple-500" />
                        )}
                        {amenity === "washer" && (
                          <Car className="w-4 h-4 text-purple-500" />
                        )}
                        {amenity === "balcony" && (
                          <Car className="w-4 h-4 text-purple-500" />
                        )}

                        <span className="capitalize text-gray-700">
                          {amenity.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </div>
                    ))}
                  {Object.values(property.amenities || {}).filter((v) => v)
                    .length > 3 && (
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-gray-500">
                      +
                      {Object.values(property.amenities).filter((v) => v)
                        .length - 3}{" "}
                      more
                    </div>
                  )}
                </div>
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/90 text-blue-700 shadow-lg backdrop-blur-sm">
                    {property.type}
                  </span>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-blue-600/90 text-white shadow-lg backdrop-blur-sm">
                    {currencySymbols[property.bankDetails?.currency] || "$"}
                    {property.pricePerNight}
                    <span className="text-xs font-normal ml-1">/night</span>
                  </span>
                </div>
              </div>

              <div className="p-8 space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-700 mb-1">
                    <div className="bg-blue-100 p-1.5 rounded-lg">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-sm truncate font-medium">
                      {property.location?.address || "No address specified"}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 pl-8">
                    {property.location?.city}, {property.location?.country}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                      <Bed className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        {property.bedrooms}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                      <Bath className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        {property.bathrooms}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user?.role === "admin" && (
                      <Link
                        to={`/properties/${property._id}/edit`}
                        className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors duration-300 group flex items-center justify-center"
                        title="Edit property"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                    )}
                    <Link
                      to={`/properties/${property._id}`}
                      className="p-2.5 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors duration-300 group flex items-center justify-center"
                      title="View property"
                    >
                      <Eye className="w-5 h-5 text-blue-700 group-hover:scale-110 transition-transform duration-300" />
                    </Link>
                    {user?.role === "admin" && (
                      <button
                        onClick={() =>
                          handleDeleteClick(property._id, property.title)
                        }
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-300 group flex items-center justify-center"
                        title="Delete property"
                      >
                        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {properties.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl p-12 max-w-lg mx-auto shadow-xl">
              <div className="bg-blue-100 p-6 rounded-full inline-flex mb-6">
                <Building2 className="w-16 h-16 text-blue-600 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No properties yet
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Start building your portfolio by adding your first property
                listing!
              </p>
              <Link
                to="/properties/new"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Your First Property</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

DeleteDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  propertyTitle: PropTypes.string,
};

export default Properties;
