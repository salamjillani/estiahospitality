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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md m-4 shadow-2xl transform transition-all animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Delete {propertyTitle || 'Property'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete {propertyTitle ? `"${propertyTitle}"` : 'this property'}? This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
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
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({ 
    isOpen: false, 
    propertyId: null,
    propertyTitle: null 
  });
  const navigate = useNavigate();
  const { user } = useAuth();
 // In fetchProperties function
const fetchProperties = async () => {
  try {
    const data = await api.get("/api/properties");
    setProperties(data || []); // Ensure data is an array
  } catch (err) {
    if (err.message.includes('401')) {
      navigate('/auth');
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
      navigate('/auth', { state: { from: '/properties' } });
    }
  }, [user, loading, navigate]);

  const handleDeleteClick = (id, title) => {
    setDeleteDialog({ 
      isOpen: true, 
      propertyId: id,
      propertyTitle: title 
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="mt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin w-12 h-12 text-blue-600" />
            <p className="text-gray-600 animate-pulse">Loading properties...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
     <DeleteDialog 
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, propertyId: null, propertyTitle: null })}
        onConfirm={handleDeleteConfirm}
        propertyTitle={deleteDialog.propertyTitle}
      />

      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <main className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">All Listings</h1>
          </div>
          <Link
            to="/properties/new"
            className="group bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            <span>Add Property</span>
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-8 animate-slide-in">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                <svg
                  className="h-5 w-5 text-red-500"
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
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property, index) => (
            <div
              key={property._id}
              className={`bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden rounded-t-2xl group">
                {property.photos?.[0] ? (
                  <img
                    src={property.photos[0].url}
                    alt={property.title}
                    className="w-full h-56 object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/90 text-blue-700 shadow-lg backdrop-blur-sm">
                    {property.type}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-800">
                    <MapPin className="w-4 h-4" />
                    <p className="text-sm truncate">
                      {property.location?.address || "No address specified"}
                    </p>
                  </div>
                  <p className="text-sm text-gray-800">
                    {property.location?.city}, {property.location?.country}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-gray-700" />
                      <span className="text-sm text-gray-700">
                        {property.bedrooms}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="w-4 h-4 text-gray-700" />
                      <span className="text-sm text-gray-700">
                        {property.bathrooms}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/properties/${property._id}`}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200 group"
                      title="View property"
                    >
                      <Eye className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                    </Link>
                    <button
                      onClick={() =>
                        handleDeleteClick(property._id, property.title)
                      }
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200 group"
                      title="Delete property"
                    >
                      <Trash2 className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform duration-200" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {properties.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-auto shadow-lg">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No properties yet
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first property!
              </p>
              <Link
                to="/properties/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Property</span>
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
