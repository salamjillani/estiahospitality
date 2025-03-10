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
  Grid,
  List,
  Filter,
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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('properties');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

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

  // Updated categories with exact pricing and descriptions as requested
  const categories = [
    {
      type: "Short Term Rental",
      description: "Short Term Rental (≤80 sq.m)",
      lowSeason: 8, // Nov-Mar: less than 10 euros
      highSeason: 12, // Apr-Oct: more than 10, less than 20 euros
      sqm: 80
    },
    {
      type: "Short Term Rental >80 sq.m",
      description: "Short Term Rental (>80 sq.m)",
      lowSeason: 9,
      highSeason: 15,
      sqm: 81
    },
    {
      type: "Self Sustained Villa",
      description: "Self Sustained Villa",
      lowSeason: 9,
      highSeason: 18,
      sqm: null
    },
    {
      type: "Self Sustained Residency <=80sq.m",
      description: "Self Sustained Residency (≤80sq.m)",
      lowSeason: 8,
      highSeason: 14,
      sqm: 80
    },
    {
      type: "Self Sustained Residency >80sq.m",
      description: "Self Sustained Residency (>80sq.m)",
      lowSeason: 9,
      highSeason: 19,
      sqm: 81
    },
  ];

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

  const getSeasonalPrice = (propertyType, currency = "EUR") => {
    const currentMonth = new Date().getMonth() + 1;
    const isHighSeason = currentMonth >= 4 && currentMonth <= 10;
    const category = categories.find((cat) => cat.type === propertyType);
    
    if (!category) return "N/A";
  
    const price = isHighSeason ? category.highSeason : category.lowSeason;
    return `${currencySymbols[currency] || currencySymbols.EUR}${price}`;
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

  const toggleCategoryFilter = () => {
    setShowCategoryFilter(!showCategoryFilter);
  };

  const handleCategorySelect = (categoryType) => {
    setSelectedCategory(categoryType === selectedCategory ? null : categoryType);
    setShowCategoryFilter(false);
  };

  const clearCategoryFilter = () => {
    setSelectedCategory(null);
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

  // Revised CategoriesTable component to match your requested format
  const CategoriesTable = () => (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Pricing Categories</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="text-left py-4 px-4">Category</th>
              <th className="text-center py-4 px-4">Low Season (Nov-Mar)</th>
              <th className="text-center py-4 px-4">High Season (Apr-Oct)</th>
              <th className="text-left py-4 px-4">Description</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <tr 
                key={category.type} 
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <td className="py-4 px-4 font-medium">{category.type}</td>
                <td className="text-center py-4 px-4 text-blue-600 font-medium">€{category.lowSeason}/night</td>
                <td className="text-center py-4 px-4 text-blue-600 font-medium">€{category.highSeason}/night</td>
                <td className="py-4 px-4">{category.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 bg-blue-50 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-blue-700 mb-2">Seasonal Pricing Notes</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600 mt-2"></span>
            <span>Low Season (November to March): Prices range from €8 to €9 per night</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600 mt-2"></span>
            <span>High Season (April to October): Prices range from €12 to €19 per night</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600 mt-2"></span>
            <span>Property cards display exact current seasonal price based on today&apos;s date</span>
          </li>
        </ul>
      </div>
    </div>
  );

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Your Properties
            </h1>
            <p className="text-gray-600">
              Manage and browse all your property listings
            </p>
          </div>
          <div className="flex items-center gap-4">
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

        {/* View mode switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-xl flex">
            <button
              onClick={() => setViewMode('properties')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                viewMode === 'properties'
                  ? 'bg-white shadow-md text-blue-600'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Grid className="w-5 h-5" />
              <span>Properties</span>
            </button>
            <button
              onClick={() => setViewMode('categories')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                viewMode === 'categories'
                  ? 'bg-white shadow-md text-blue-600'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="w-5 h-5" />
              <span>Categories</span>
            </button>
          </div>
        </div>

        {viewMode === 'categories' ? (
          <CategoriesTable />
        ) : (
          <>
            {/* Add category filter */}
            <div className="mb-8 flex justify-between items-center">
              <div className="relative">
                <button 
                  onClick={toggleCategoryFilter}
                  className="flex items-center gap-2 px-4 py-3 bg-white shadow-md rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">
                    {selectedCategory ? `Category: ${selectedCategory}` : "Filter by Category"}
                  </span>
                  {selectedCategory && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearCategoryFilter();
                      }}
                      className="ml-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  )}
                </button>
                
                {showCategoryFilter && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg z-10 py-2 animate-in slide-in-from-top duration-200">
                    <div className="p-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-500">Select a category</p>
                    </div>
                    {categories.map((category) => (
                      <button
                        key={category.type}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                          selectedCategory === category.type ? "bg-blue-50 text-blue-700" : ""
                        }`}
                        onClick={() => handleCategorySelect(category.type)}
                      >
                        <div className="font-medium">{category.type}</div>
                        <div className="text-sm text-gray-500">{category.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedCategory && (
                <div className="text-sm text-gray-600">
                  Showing {properties.filter(p => p.type === selectedCategory).length} of {properties.length} properties
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties
                .filter(
                  (property) =>
                    !selectedCategory || property.type === selectedCategory
                )
                .map((property, index) => (
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
                          .slice(0, 3)
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
                          {getSeasonalPrice(property.type, property.currency || "EUR")}
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

            {/* No properties or filtered message */}
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
            
            {properties.length > 0 && selectedCategory && properties.filter(p => p.type === selectedCategory).length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl shadow-md">
                <div className="p-4 bg-blue-100 rounded-full inline-flex mb-4">
                  <Filter className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No properties in this category</h3>
                <p className="text-gray-600 mb-6">Try selecting a different category or clear the filter</p>
                <button
                  onClick={clearCategoryFilter}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </>
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