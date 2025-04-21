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
  Currency,
} from "lucide-react";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import PropTypes from "prop-types";
import CategoriesTable from "./CategoriesTable";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DeleteDialog = ({ isOpen, onClose, onConfirm, propertyTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl p-4 sm:p-8 w-full max-w-md mx-4 shadow-2xl transform transition-all animate-in slide-in-from-bottom duration-300">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex items-start gap-3 sm:gap-5">
            <div className="p-3 sm:p-4 bg-red-100 rounded-full">
              <Trash2 className="w-5 h-5 sm:w-7 sm:h-7 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Delete {propertyTitle || "Property"}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
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

          <div className="flex gap-3 sm:gap-4 justify-end mt-2">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:shadow-md"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all duration-200 flex items-center gap-2 hover:shadow-lg shadow-md"
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
  const [categories, setCategories] = useState([]);
  const [pricings, setPricings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState("properties");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    propertyId: null,
    propertyTitle: null,
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    lowSeason: "",
    highSeason: "",
    currency: "EUR",
    description: "",
  });
  const [categoryUpdateLoading, setCategoryUpdateLoading] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [pricingForm, setPricingForm] = useState({
    type: "monthly",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    blockPrices: [{ startDay: 1, endDay: 1, price: 300 }],
    datePrices: [],
    applyToAllProperties: false,
    property: "",
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
      setProperties(data || []);
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

  const fetchCategories = async () => {
    try {
      const data = await api.get("/api/category-prices");
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        const initialData = await api.post("/api/category-prices/initialize");
        setCategories(initialData || []);
      }
    } catch (err) {
      setError("Failed to load categories: " + err.message);
    }
  };


  const fetchPricings = async () => {
    try {
      const response = await api.get("/api/pricings");
      
 
      const data = Array.isArray(response) ? response : (response.data || []);
      
      const processed = data.map((pricing) => {
        return {
          ...pricing,
          datePrices: pricing.datePrices?.map(dp => ({
            ...dp,
            date: dp.date ? new Date(dp.date).toISOString().split('T')[0] : ''
          })) || []
        };
      });
      
      setPricings(processed);
      return processed;
    } catch (err) {
      setError("Failed to load pricings: " + err.message);
      return [];
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchCategories();
    fetchPricings();
  }, []);

  useEffect(() => {
    fetchPricings().then(() => {
      console.log("Loaded pricings:", pricings);
    });
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
    return `${
      currencySymbols[category.currency || currency] || currencySymbols.EUR
    }${price}`;
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
    setSelectedCategory(
      categoryType === selectedCategory ? null : categoryType
    );
    setShowCategoryFilter(false);
  };

  const clearCategoryFilter = () => {
    setSelectedCategory(null);
  };

  const handleStartEdit = (category) => {
    setEditingCategory(category.type);
    setCategoryForm({
      lowSeason: category.lowSeason,
      highSeason: category.highSeason,
      currency: category.currency,
      description: category.description,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateCategory = async (type) => {
    try {
      setCategoryUpdateLoading(true);
      const category = categories.find((c) => c.type === type);
      if (!category) return;

      const updatedCategory = {
        ...category,
        lowSeason: parseFloat(categoryForm.lowSeason),
        highSeason: parseFloat(categoryForm.highSeason),
        currency: categoryForm.currency,
        description: categoryForm.description,
      };

      await api.put(`/api/category-prices/${type}`, updatedCategory);

      setCategories((prev) =>
        prev.map((c) => (c.type === type ? updatedCategory : c))
      );

      setEditingCategory(null);
    } catch (err) {
      setError("Failed to update category: " + err.message);
    } finally {
      setCategoryUpdateLoading(false);
    }
  };
  const handlePricingTypeChange = (e) => {
    const newType = e.target.value;
    setPricingForm({
      ...pricingForm,
      type: newType,
      // Automatically set applyToAllProperties to true for date pricing
      applyToAllProperties:
        newType === "date" ? true : pricingForm.applyToAllProperties,
      // Clear property selection when switching to date pricing
      property: newType === "date" ? "" : pricingForm.property,
    });
  };

  const handleSavePricing = async () => {
    try {
      const isDatePricing = pricingForm.type === "date";

      // For date pricing, force applyToAllProperties to be true
      const applyToAll = isDatePricing
        ? true
        : pricingForm.applyToAllProperties;

      // Validation
      if (!applyToAll && !pricingForm.property && !isDatePricing) {
        throw new Error("Please select a property for monthly pricing");
      }

      if (isDatePricing) {
        // Date pricing validations
        if (pricingForm.datePrices.length === 0) {
          throw new Error("Please add at least one date price");
        }

        for (const datePrice of pricingForm.datePrices) {
          if (!datePrice.date) {
            throw new Error("Please select a date for all date prices");
          }

          const date = new Date(datePrice.date);
          if (isNaN(date.getTime())) {
            throw new Error("Invalid date format detected");
          }
          if (datePrice.price < 1) {
            throw new Error("Price must be at least 1");
          }
          if (date < new Date()) {
            throw new Error("Cannot set pricing for past dates");
          }
        }
      } else {
        // Monthly pricing validations
        for (const block of pricingForm.blockPrices) {
          if (block.endDay < block.startDay) {
            throw new Error("End day cannot be before start day");
          }
          if (block.startDay < 1 || block.endDay > 31) {
            throw new Error("Days must be between 1-31");
          }
          if (block.price < 1) {
            throw new Error("Price must be at least 1");
          }
        }
      }

      const payload = {
        ...pricingForm,
        isGlobalTemplate: applyToAll,
        datePrices: isDatePricing
          ? pricingForm.datePrices.map((dp) => ({
              date: new Date(dp.date),
              price: Number(dp.price),
            }))
          : [],
      };

      let response;

      if (selectedPricing) {
        // Update existing pricing
        response = await api.put(
          `/api/pricings/${selectedPricing._id}`,
          payload
        );
        setPricings((prev) =>
          prev.map((p) => (p._id === response._id ? response : p))
        );
      } else {
        // Create new pricing
        response = await api.post("/api/pricings", payload);
        setPricings((prev) => [...prev, response]);
      }

      // Reset form to initial state
      setSelectedPricing(null);
      setPricingForm({
        type: "monthly",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        blockPrices: [{ startDay: 1, endDay: 1, price: 300 }],
        datePrices: [],
        applyToAllProperties: false,
        property: "",
      });
    } catch (err) {
      setError(
        "Failed to save pricing: " +
          (err.response?.data?.message || err.message)
      );
      setTimeout(() => setError(""), 5000);
    }
  };

  const renderPricingForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <select
          value={pricingForm.type}
          onChange={handlePricingTypeChange}
          className="w-full p-2 border rounded-lg"
        >
          <option value="monthly">Monthly Block Pricing</option>
          <option value="date">Custom Date Pricing</option>
        </select>

        {/* Show property selector and "apply to all" checkbox only for monthly pricing */}
        {pricingForm.type === "monthly" && (
          <>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="applyToAll"
                checked={pricingForm.applyToAllProperties}
                onChange={(e) => {
                  setPricingForm({
                    ...pricingForm,
                    applyToAllProperties: e.target.checked,
                    property: e.target.checked ? "" : pricingForm.property,
                  });
                }}
                className="mr-2"
              />
              <label htmlFor="applyToAll" className="text-sm font-medium">
                Apply to all properties
              </label>
            </div>

            {!pricingForm.applyToAllProperties && (
              <select
                value={pricingForm.property}
                onChange={(e) =>
                  setPricingForm({
                    ...pricingForm,
                    property: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg"
                required={!pricingForm.applyToAllProperties}
              >
                <option value="">Select a property</option>
                {properties.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.title}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        {/* For date pricing, add a notice that it applies to all properties */}
        {pricingForm.type === "date" && (
          <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
            Note: Date pricing will automatically apply to all properties.
          </div>
        )}

        {pricingForm.type === "monthly" ? (
          <>
            <input
              type="month"
              value={`${pricingForm.year}-${String(pricingForm.month).padStart(
                2,
                "0"
              )}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-");
                setPricingForm({
                  ...pricingForm,
                  year: parseInt(year),
                  month: parseInt(month),
                });
              }}
              className="w-full p-2 border rounded-lg"
            />
            <div className="space-y-2">
              {pricingForm.blockPrices.map((block, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Start day"
                    value={block.startDay}
                    min="1"
                    max="31"
                    onChange={(e) => {
                      const newBlocks = [...pricingForm.blockPrices];
                      newBlocks[index].startDay = Math.min(
                        31,
                        Math.max(1, parseInt(e.target.value))
                      );
                      setPricingForm({
                        ...pricingForm,
                        blockPrices: newBlocks,
                      });
                    }}
                    className="p-2 border rounded-lg w-20"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="End day"
                    value={block.endDay}
                    min="1"
                    max="31"
                    onChange={(e) => {
                      const newBlocks = [...pricingForm.blockPrices];
                      newBlocks[index].endDay = Math.min(
                        31,
                        Math.max(1, parseInt(e.target.value))
                      );
                      setPricingForm({
                        ...pricingForm,
                        blockPrices: newBlocks,
                      });
                    }}
                    className="p-2 border rounded-lg w-20"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={block.price}
                    min="1"
                    onChange={(e) => {
                      const newBlocks = [...pricingForm.blockPrices];
                      newBlocks[index].price = parseInt(e.target.value);
                      setPricingForm({
                        ...pricingForm,
                        blockPrices: newBlocks,
                      });
                    }}
                    className="p-2 border rounded-lg w-28"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPricingForm({
                        ...pricingForm,
                        blockPrices: pricingForm.blockPrices.filter(
                          (_, i) => i !== index
                        ),
                      })
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setPricingForm({
                    ...pricingForm,
                    blockPrices: [
                      ...pricingForm.blockPrices,
                      { startDay: 1, endDay: 1, price: 300 },
                    ],
                  })
                }
                className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Add Block
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {pricingForm.datePrices.map((datePrice, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="date"
                  value={datePrice.date ? datePrice.date.split("T")[0] : ""}
                  onChange={(e) => {
                    const newDates = [...pricingForm.datePrices];
                    newDates[index].date = e.target.value;
                    setPricingForm({
                      ...pricingForm,
                      datePrices: newDates,
                    });
                  }}
                  className="p-2 border rounded-lg flex-1"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={datePrice.price}
                  onChange={(e) => {
                    const newDates = [...pricingForm.datePrices];
                    newDates[index].price = e.target.value;
                    setPricingForm({
                      ...pricingForm,
                      datePrices: newDates,
                    });
                  }}
                  className="p-2 border rounded-lg flex-1"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPricingForm({
                      ...pricingForm,
                      datePrices: pricingForm.datePrices.filter(
                        (_, i) => i !== index
                      ),
                    })
                  }
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setPricingForm({
                  ...pricingForm,
                  datePrices: [
                    ...pricingForm.datePrices,
                    { date: "", price: "" },
                  ],
                })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Add Date
            </button>
          </div>
        )}

        <button
          onClick={handleSavePricing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          {selectedPricing ? "Update Pricing" : "Create Pricing"}
        </button>
      </div>
    </div>
  );

  const handleEditPricing = (pricing) => {
    setSelectedPricing(pricing);
    setPricingForm({
      ...pricing,
      datePrices: pricing.datePrices.map((dp) => {
        let dateValue;
   
        if (dp.date) {
          if (typeof dp.date === 'string') {
      
            dateValue = dp.date.split('T')[0];
          } else if (dp.date instanceof Date) {
        
            dateValue = dp.date.toISOString().split('T')[0];
          } else {
          
            try {
              dateValue = new Date(dp.date).toISOString().split('T')[0];
            } catch {
              dateValue = '';
            }
          }
        } else {
          dateValue = '';
        }
        
        return {
          ...dp,
          date: dateValue
        };
      }),
    });
  };

  const handleDeletePricing = async (id) => {
    try {
      await api.delete(`/api/pricings/${id}`);
      setPricings((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError("Failed to delete pricing: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="mt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-6 p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-100">
            <Loader2 className="animate-spin w-16 h-16 text-blue-600" />
            <p className="text-lg text-gray-600 font-medium animate-pulse">
              Loading your properties...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const PricingTable = ({ pricings, onEdit, onDelete }) => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {(Array.isArray(pricings) ? pricings : []).map((pricing) => (
          <div key={pricing._id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">
                {pricing.type === "monthly"
                  ? `${monthNames[pricing.month - 1]} ${pricing.year}`
                  : "Custom Date Pricing"}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(pricing)}
                  className="text-blue-600"
                  aria-label="Edit pricing"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(pricing._id)}
                  className="text-red-600"
                  aria-label="Delete pricing"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {pricing.type === "monthly" ? (
              <div className="grid grid-cols-3 gap-2">
                {(pricing.blockPrices || []).map((block, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded">
                    Days {block.startDay}-{block.endDay}: €{block.price}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(pricing.datePrices || []).map((datePrice, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {datePrice.date &&
                        new Date(datePrice.date).toLocaleDateString()}
                    </span>
                    <span>€{datePrice.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
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
      <main className="pt-16 sm:pt-20 md:pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              All Listings
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage and browse all your property listings
            </p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {user?.role === "admin" && (
              <Link
                to="/properties/new"
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-full hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center shadow-lg text-sm sm:text-base"
              >
                <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
                </div>
                <span className="font-medium">Add New Property</span>
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-5 rounded-2xl mb-6 sm:mb-10 animate-slide-in shadow-lg">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-2 sm:p-3">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 text-red-600"
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
              <p className="text-sm sm:text-base text-red-800 font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-white p-1 rounded-xl flex shadow-md border border-blue-100">
            <button
              onClick={() => setViewMode("properties")}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                viewMode === "properties"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Properties</span>
            </button>
            <button
              onClick={() => setViewMode("categories")}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                viewMode === "categories"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Categories</span>
            </button>
            {user?.role === "admin" && (
              <button
                onClick={() => setViewMode("pricing")}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                  viewMode === "pricing"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Currency className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Pricing</span>
              </button>
            )}
          </div>
        </div>

        {viewMode === "categories" ? (
          <CategoriesTable
            categories={categories}
            user={user}
            editingCategory={editingCategory}
            categoryForm={categoryForm}
            categoryUpdateLoading={categoryUpdateLoading}
            onStartEdit={handleStartEdit}
            onCancelEdit={() => setEditingCategory(null)}
            onUpdateCategory={handleUpdateCategory}
            onInputChange={handleInputChange}
            setCategories={setCategories}
          />
        ) : viewMode === "pricing" ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold mb-4">Manage Pricing</h2>
              {renderPricingForm()}
            </div>

            <PricingTable
              pricings={pricings}
              onEdit={handleEditPricing}
              onDelete={handleDeletePricing}
            />
          </div>
        ) : (
          <>
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0">
              <div className="relative">
                <button
                  onClick={toggleCategoryFilter}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white shadow-md rounded-xl hover:bg-gray-50 transition-colors border border-blue-100 text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="font-medium truncate">
                    {selectedCategory
                      ? `Category: ${selectedCategory}`
                      : "Filter by Category"}
                  </span>
                  {selectedCategory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearCategoryFilter();
                      }}
                      className="ml-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  )}
                </button>

                {showCategoryFilter && (
                  <div className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-white rounded-xl shadow-lg z-10 py-2 animate-in slide-in-from-top duration-200 border border-blue-100">
                    <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <p className="text-xs sm:text-sm font-medium text-indigo-700">
                        Select a category
                      </p>
                    </div>
                    {categories.map((category) => (
                      <button
                        key={category.type}
                        className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-blue-50 transition-colors text-xs sm:text-sm ${
                          selectedCategory === category.type
                            ? "bg-blue-50 text-blue-700"
                            : ""
                        }`}
                        onClick={() => handleCategorySelect(category.type)}
                      >
                        <div className="font-medium">{category.type}</div>
                        <div className="text-xs text-gray-500">
                          {category.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedCategory && (
                <div className="text-xs sm:text-sm text-gray-600 bg-white/70 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm">
                  Showing{" "}
                  {properties.filter((p) => p.type === selectedCategory).length}{" "}
                  of {properties.length} properties
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {properties
                .filter(
                  (property) =>
                    !selectedCategory || property.type === selectedCategory
                )
                .map((property, index) => (
                  <div
                    key={property._id}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-blue-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative overflow-hidden group">
                      {property.photos?.[0] ? (
                        <img
                          src={property.photos[0].url}
                          alt={property.title}
                          className="w-full h-48 sm:h-56 md:h-64 object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
                          <Home className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                        </div>
                      )}

                      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 flex gap-1.5 sm:gap-2 flex-wrap">
                        {Object.entries(property.amenities || {})
                          .filter(([_, value]) => value)
                          .slice(0, 3)
                          .map(([amenity]) => (
                            <div
                              key={amenity}
                              className="bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs flex items-center gap-1 sm:gap-2 shadow-sm border border-blue-100"
                            >
                              {amenity === "swimmingPool" && (
                                <Droplet className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                              )}
                              {amenity === "wifi" && (
                                <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                              )}
                              {amenity === "parking" && (
                                <Car className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                              )}
                              <span className="capitalize text-gray-700 hidden sm:inline">
                                {amenity.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                            </div>
                          ))}
                        {Object.values(property.amenities || {}).filter(
                          (v) => v
                        ).length > 3 && (
                          <div className="bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs text-gray-500 border border-blue-100">
                            +
                            {Object.values(property.amenities).filter((v) => v)
                              .length - 3}{" "}
                            more
                          </div>
                        )}
                      </div>

                      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-between">
                        <span className="inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-white/90 text-blue-700 shadow-lg backdrop-blur-sm border border-blue-100">
                          {property.type}
                        </span>
                        <span className="inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg backdrop-blur-sm">
                          {getSeasonalPrice(
                            property.type,
                            property.currency || "EUR"
                          )}
                          <span className="text-xs font-normal ml-1">
                            /night
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
                      <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-1 hover:text-blue-700 transition-colors">
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-700 mb-1">
                          <div className="bg-blue-100 p-1 sm:p-1.5 rounded-lg">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                          </div>
                          <p className="text-xs sm:text-sm truncate font-medium">
                            {property.location?.address ||
                              "No address specified"}
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 pl-6 sm:pl-8">
                          {property.location?.city},{" "}
                          {property.location?.country}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-4 sm:pt-5">
                        <div className="flex items-center gap-3 sm:gap-5">
                          <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-gray-100">
                            <Bed className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                            <span className="text-xs sm:text-sm font-medium">
                              {property.bedrooms}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-gray-100">
                            <Bath className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                            <span className="text-xs sm:text-sm font-medium">
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
                            className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl transition-colors duration-300 group flex items-center justify-center"
                            title="View property"
                          >
                            <Eye className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
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
                <div className="bg-white rounded-3xl p-12 max-w-lg mx-auto shadow-xl border border-blue-100">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-full inline-flex mb-6">
                    <Building2 className="w-16 h-16 text-white mx-auto" />
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

            {properties.length > 0 &&
              selectedCategory &&
              properties.filter((p) => p.type === selectedCategory).length ===
                0 && (
                <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-blue-100">
                  <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full inline-flex mb-4">
                    <Filter className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No properties in this category
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try selecting a different category or clear the filter
                  </p>
                  <button
                    onClick={clearCategoryFilter}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md hover:shadow-lg"
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
