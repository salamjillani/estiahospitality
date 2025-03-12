import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import {
  Loader2,
  Edit,
  MapPin,
  Home,
  Banknote,
  BedDouble,
  Bath,
  ArrowLeft,
  Calendar,
  Star,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Wifi,
  Droplet,
  Car,
  Tv,
  WashingMachine,
  AirVent,
  X,
  Check,
  ZoomIn,
  Maximize,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { MdBalcony, MdKitchen } from "react-icons/md";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const { user } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  
  // State for fullscreen image viewer
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await api.get(`/api/properties/${id}`);
        const response =
          user?.role === "admin"
            ? data
            : {
                ...data,
                bankDetails: null,
              };
        setProperty({
          ...response,
          ...data,
          location: {
            address: "",
            city: "",
            country: "",
            postalCode: "",
            ...data.location,
          },
          bankDetails: {
            accountHolder: "",
            accountNumber: "",
            bankName: "",
            swiftCode: "",
            iban: "",
            currency: "USD",
            ...data.bankDetails,
          },
          photos: data.photos || [],
        });
      } catch (err) {
        setError("Failed to load property details: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, user]);

  const nextPhoto = () => {
    if (property?.photos?.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % property.photos.length);
    }
  };

  const prevPhoto = () => {
    if (property?.photos?.length > 0) {
      setCurrentPhotoIndex((prev) =>
        prev === 0 ? property.photos.length - 1 : prev - 1
      );
    }
  };

  // Image viewer navigation functions
  const nextViewerPhoto = (e) => {
    e.stopPropagation();
    if (property?.photos?.length > 0) {
      setViewerPhotoIndex((prev) => (prev + 1) % property.photos.length);
    }
  };

  const prevViewerPhoto = (e) => {
    e.stopPropagation();
    if (property?.photos?.length > 0) {
      setViewerPhotoIndex((prev) =>
        prev === 0 ? property.photos.length - 1 : prev - 1
      );
    }
  };

  // Open image viewer
  const openImageViewer = (index) => {
    setViewerPhotoIndex(index);
    setShowImageViewer(true);
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Close image viewer
  const closeImageViewer = () => {
    setShowImageViewer(false);
    // Re-enable scrolling
    document.body.style.overflow = 'auto';
  };

  const handleBookNowClick = (e) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirmBooking = async () => {
    setBookingInProgress(true);
    setShowConfirmation(false);
    
    // Simulate a small delay before navigation
    setTimeout(() => {
      navigate(`/properties/${property._id}/book`, {
        state: {
          property: {
            _id: property._id,
            pricePerNight: property.pricePerNight,
            currency: property.currency,
            ...property,
          },
        },
      });
    }, 1000);
  };

  const handleCancelBooking = () => {
    setShowConfirmation(false);
  };

  // Handle keyboard events for image viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showImageViewer) return;
      
      if (e.key === 'Escape') {
        closeImageViewer();
      } else if (e.key === 'ArrowRight') {
        if (property?.photos?.length > 0) {
          setViewerPhotoIndex((prev) => (prev + 1) % property.photos.length);
        }
      } else if (e.key === 'ArrowLeft') {
        if (property?.photos?.length > 0) {
          setViewerPhotoIndex((prev) =>
            prev === 0 ? property.photos.length - 1 : prev - 1
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showImageViewer, property?.photos?.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center bg-white p-4 sm:p-8 rounded-2xl shadow-lg w-full max-w-md">
          <Loader2 className="animate-spin w-10 h-10 sm:w-14 sm:h-14 text-indigo-600 mx-auto mb-4 sm:mb-6" />
          <p className="text-indigo-800 font-semibold text-base sm:text-lg">
            Loading amazing property details...
          </p>
        </div>
      </div>
    );
  }

  if (bookingInProgress) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center bg-white p-4 sm:p-8 rounded-2xl shadow-lg w-full max-w-md">
          <Loader2 className="animate-spin w-10 h-10 sm:w-14 sm:h-14 text-indigo-600 mx-auto mb-4 sm:mb-6" />
          <p className="text-indigo-800 font-semibold text-base sm:text-lg">
            Preparing your reservation form...
          </p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl max-w-md w-full border border-indigo-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 text-center">
            Property Not Found
          </h2>
          <p className="text-gray-600 mb-6 sm:mb-8 text-center">
            The property you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            to="/properties"
            className="flex items-center justify-center gap-2 text-white bg-indigo-600 hover:bg-indigo-700 font-medium transition-colors py-3 px-6 rounded-xl w-full"
          >
            <ArrowLeft className="w-5 h-5" />
            Return to Properties
          </Link>
        </div>
      </div>
    );
  }

  const renderLocationDetails = () => {
    if (!property.location) return null;

    const hasAnyLocation = Object.values(property.location).some(
      (value) => value
    );

    if (!hasAnyLocation) return null;

    return (
      <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-50">
        <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 text-gray-900">
          <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
          </div>
          Location Details
        </h3>
        <dl className="space-y-3 sm:space-y-4">
          {Object.entries(property.location).map(
            ([key, value]) =>
              value && (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 pb-3 sm:pb-4"
                >
                  <dt className="text-gray-600 capitalize font-medium text-sm sm:text-base">
                    {key}
                  </dt>
                  <dd className="text-gray-900 font-semibold mt-1 sm:mt-0">{value}</dd>
                </div>
              )
          )}
        </dl>
      </div>
    );
  };

  const renderAmenities = () => {
    if (!property.amenities) return null;

    const hasAnyAmenities = Object.values(property.amenities).some(
      (value) => value
    );

    if (!hasAnyAmenities) return null;

    const amenityIcons = {
      swimmingPool: <Droplet className="w-5 h-5 text-blue-500" />,
      wifi: <Wifi className="w-5 h-5 text-green-500" />,
      parking: <Car className="w-5 h-5 text-purple-500" />,
      airConditioning: <AirVent className="w-5 h-5 text-cyan-500" />,
      kitchen: <MdKitchen className="w-5 h-5 text-amber-500" />,
      tv: <Tv className="w-5 h-5 text-red-500" />,
      washer: <WashingMachine className="w-5 h-5 text-emerald-500" />,
      balcony: <MdBalcony className="w-5 h-5 text-indigo-500" />,
    };

    return (
      <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-50 mt-6">
        <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 text-gray-900">
          <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
          </div>
          Facilities & Amenities
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {Object.entries(property.amenities || {})
            .filter(([_, value]) => value)
            .map(([amenity]) => (
              <div
                key={amenity}
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors duration-200"
              >
                <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
                  {amenityIcons[amenity] || <Car className="w-5 h-5 text-purple-500" />}
                </div>
                <span className="capitalize text-gray-700 font-medium text-sm sm:text-base">
                  {amenity.replace(/([A-Z])/g, " $1").trim()}
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderBankDetails = () => {
    if (!property?.bankDetails || user?.role !== "admin") return null;

    const bankDetailsMapping = {
      accountHolder: "Account Holder",
      accountNumber: "Account Number",
      bankName: "Bank Name",
      swiftCode: "Swift Code",
      iban: "IBAN",
      currency: "Currency",
    };

    const hasAnyBankDetails = Object.values(property.bankDetails).some(
      (value) => value
    );

    if (!hasAnyBankDetails) return null;

    if (!user) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl max-w-md w-full">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 text-center">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-center">
              Please sign in to view property details
            </p>
            <Link
              to="/auth"
              state={{ from: `/properties/${id}` }}
              className="flex items-center justify-center gap-2 text-white bg-indigo-600 hover:bg-indigo-700 font-medium transition-colors py-3 px-6 rounded-xl w-full"
            >
              <ArrowLeft className="w-5 h-5" />
              Go to Sign In
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-50">
        <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 text-gray-900">
          <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
            <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
          </div>
          Bank Information
        </h3>
        <dl className="space-y-3 sm:space-y-4">
          {Object.entries(property.bankDetails).map(
            ([key, value]) =>
              value && (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 pb-3 sm:pb-4"
                >
                  <dt className="text-gray-600 font-medium text-sm sm:text-base">
                    {bankDetailsMapping[key] || key}
                  </dt>
                  <dd className="text-gray-900 font-semibold mt-1 sm:mt-0 break-all">{value}</dd>
                </div>
              )
          )}
        </dl>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      {/* Booking Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Confirm Reservation</h3>
              <button 
                onClick={handleCancelBooking}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-8">
              Are you sure you want to reserve <span className="font-semibold text-gray-800">{property.title}</span> for {property.currency} {property.pricePerNight}/night?
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={handleCancelBooking}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                No, Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Yes, Reserve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {showImageViewer && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={closeImageViewer}
        >
          <button 
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 sm:p-3 text-white transition-all duration-200 z-10"
            onClick={closeImageViewer}
          >
            <X className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={property.photos[viewerPhotoIndex].url}
              alt={`Property ${viewerPhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              onClick={(e) => e.stopPropagation()}
            />
            
            {property.photos.length > 1 && (
              <>
                <button
                  onClick={prevViewerPhoto}
                  className="absolute left-2 sm:left-6 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2 sm:p-4 text-white transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-8 sm:h-8" />
                </button>
                <button
                  onClick={nextViewerPhoto}
                  className="absolute right-2 sm:right-6 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2 sm:p-4 text-white transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5 sm:w-8 sm:h-8" />
                </button>
              </>
            )}
            
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm font-medium">
              {viewerPhotoIndex + 1} / {property.photos.length}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Link
            to="/properties"
            className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-indigo-600 transition-colors bg-white py-1.5 sm:py-2 px-3 sm:px-5 rounded-full shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium">Back to Properties</span>
          </Link>
          {user?.role === "admin" && (
            <Link
              to={`/properties/${property._id}/edit`}
              className="p-2 sm:p-3 text-indigo-600 bg-white hover:bg-indigo-50 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
              title="Edit property"
            >
              <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-6 rounded-lg mb-6 sm:mb-8 shadow-md">
            <p className="text-red-700 font-medium text-sm sm:text-base">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column: Photos and Main Info */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {/* Image Gallery */}
              {property.photos && property.photos.length > 0 ? (
                <div className="relative h-64 sm:h-80 md:h-96">
                  <img
                    src={property.photos[currentPhotoIndex].url}
                    alt={`Property ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => openImageViewer(currentPhotoIndex)}
                  />

                  {/* Zoom indicator overlay */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300"
                    onClick={() => openImageViewer(currentPhotoIndex)}
                  >
                    <div className="bg-white/80 p-2 rounded-full">
                      <Maximize className="w-6 h-6 text-gray-800" />
                    </div>
                  </div>

                  {property.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg text-gray-800 hover:text-indigo-600 transition-all focus:outline-none"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg text-gray-800 hover:text-indigo-600 transition-all focus:outline-none"
                      >
                        <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                      </button>
                    </>
                  )}

                  {/* Photo indicators */}
                  {property.photos.length > 1 && (
                    <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3">
                      {property.photos.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                            currentPhotoIndex === index
                              ? "bg-indigo-600 scale-125"
                              : "bg-white/80 hover:bg-white"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64 sm:h-80 md:h-96 bg-gray-100 flex items-center justify-center">
                  <Home className="w-16 h-16 sm:w-24 sm:h-24 text-gray-300" />
                </div>
              )}

              {/* Thumbnail preview */}
              {property.photos && property.photos.length > 1 && (
                <div className="flex overflow-x-auto p-4 sm:p-6 space-x-2 sm:space-x-3 bg-gray-50">
                  {property.photos.map((photo, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`cursor-pointer flex-shrink-0 w-16 h-12 sm:w-24 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 relative group ${
                        currentPhotoIndex === index
                          ? "border-indigo-600 shadow-lg scale-105"
                          : "border-transparent hover:border-indigo-300"
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Property Details */}
              <div className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="ml-2 text-gray-700 font-medium text-sm sm:text-base">
                      4.8 (42 reviews)
                    </span>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold w-fit">
                    Available Now
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 break-words">
                  {property.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
                  <div className="flex items-center gap-1 sm:gap-2 bg-indigo-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base">
                    <BedDouble className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    <span className="font-medium text-gray-800">
                      {property.bedrooms} Rooms
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 bg-indigo-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base">
                    <Bath className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    <span className="font-medium text-gray-800">
                      {property.bathrooms} Bathrooms
                    </span>
                  </div>
                  <span className="bg-indigo-100 text-indigo-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-sm sm:text-base">
                    {property.type}
                  </span>
                </div>

                {property.description && (
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 flex items-center gap-2 sm:gap-3">
                      <div className="w-1.5 h-5 sm:h-6 bg-indigo-600 rounded-full"></div>
                      About This Property
                    </h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                      {property.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities Section - Moved outside the image gallery */}
            {renderAmenities()}

            {/* Location Details */}
            <div className="mt-6">{renderLocationDetails()}</div>
          </div>

          {/* Right Column: Booking and Additional Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Price and Booking Widget */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden sticky top-6">
              <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-indigo-100/30">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {property.currency} {property.pricePerNight}
                  </span>
                  <span className="text-gray-600 text-sm sm:text-base">/night</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 mb-4 sm:mb-6">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="ml-1 text-gray-700 text-xs sm:text-sm">4.8 (42)</span>
                </div>

                {user?.role === "client" && (
                  <button
                    onClick={handleBookNowClick}
                    className="bg-indigo-600 text-white w-full py-3 sm:py-4 px-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 sm:gap-3 font-medium text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    Book Now
                  </button>
                )}
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                <h3 className="font-bold text-gray-900 mb-4 sm:mb-6 text-base sm:text-lg">
                  Property Highlights
                </h3>
                <ul className="space-y-3 sm:space-y-4">
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0 shadow-sm text-xs sm:text-sm">
                      ✓
                    </span>
                    <span className="text-gray-600 text-sm sm:text-base">
                      {property.bedrooms} bedrooms and {property.bathrooms}{" "}
                      bathrooms
                    </span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0 shadow-sm text-xs sm:text-sm">
                      ✓
                    </span>
                    <span className="text-gray-600 text-sm sm:text-base">
                      Premium {property.type} property
                    </span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0 shadow-sm text-xs sm:text-sm">
                      ✓
                    </span>
                    <span className="text-gray-600 text-sm sm:text-base">
                      Great location in {property.location?.city || "the area"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0 shadow-sm text-xs sm:text-sm">
                      ✓
                    </span>
                    <span className="text-gray-600 text-sm sm:text-base">
                      Top-rated property (4.8/5)
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Admin section with bank details */}
            {renderBankDetails()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;