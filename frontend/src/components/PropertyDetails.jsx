import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import {
  Loader2,
  Edit,
  Home,
  BedDouble,
  Bath,
  ArrowLeft,
  Star,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Droplet,
  Car,
  Tv,
  WashingMachine,
  AirVent,
  X,
  Check,
  Maximize,
  FileText,
  Share2,
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
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [generatingPresentation, setGeneratingPresentation] = useState(false);
  const [presentationText, setPresentationText] = useState("");
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await api.get(`/api/properties/${id}`);
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

  const openImageViewer = (index) => {
    setViewerPhotoIndex(index);
    setShowImageViewer(true);
    document.body.style.overflow = 'hidden';
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    document.body.style.overflow = 'auto';
  };

  const handleBookNowClick = (e) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirmBooking = async () => {
    setBookingInProgress(true);
    setShowConfirmation(false);
    
    setTimeout(() => {
      navigate(`/properties/${property._id}/book`, {
        state: {
          property: {
            _id: property._id,
            pricings: property.pricings,
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

  const toggleMoreDetails = () => {
    setShowMoreDetails(!showMoreDetails);
  };

  const generatePropertyPresentation = () => {
    setGeneratingPresentation(true);
    
    setTimeout(() => {
      const propertyType = property.type || "property";
      const location = property.location.city ? `in ${property.location.city}` : "";
      const bedrooms = property.bedrooms ? `${property.bedrooms} bedroom` : "";
      const bathrooms = property.bathrooms ? `${property.bathrooms} bathroom` : "";
      const amenitiesList = property.amenities ? 
        Object.entries(property.amenities)
          .filter(([_, value]) => value)
          .map(([key]) => key.replace(/([A-Z])/g, " $1").trim().toLowerCase())
          .join(", ") : "";
      
      const presentation = `This ${propertyType} ${location} offers ${bedrooms} and ${bathrooms} accommodations.
      
Property Overview:
${property.description || "A beautiful property with amazing features."}

Amenities:
${amenitiesList}

Location:
${property.location.address ? `Address: ${property.location.address}` : ""} 
${property.location.postalCode ? `Postal Code: ${property.location.postalCode}` : ""}`;
      
      setPresentationText(presentation);
      setGeneratingPresentation(false);
    }, 1500);
  };

  const copyPresentationToClipboard = () => {
    navigator.clipboard.writeText(presentationText);
    alert("Presentation copied to clipboard!");
  };

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
            Loading property details...
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
            Preparing reservation...
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
            The requested property doesn&apos;t exist.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
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
              Are you sure you want to reserve <span className="font-semibold text-gray-800">{property.title}</span>?
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={handleCancelBooking}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Link
            to="/properties"
            className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-indigo-600 transition-colors bg-white py-1.5 sm:py-2 px-3 sm:px-5 rounded-full shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium">Back</span>
          </Link>
          {user?.role === "admin" && (
            <Link
              to={`/properties/${property._id}/edit`}
              className="p-2 sm:p-3 text-indigo-600 bg-white hover:bg-indigo-50 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {property.photos && property.photos.length > 0 ? (
                <div className="relative h-64 sm:h-80 md:h-96">
                  <img
                    src={property.photos[currentPhotoIndex].url}
                    alt={`Property ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => openImageViewer(currentPhotoIndex)}
                  />

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

              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-gray-700">
                      {property.rating || "New"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                  {property.bedrooms && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <BedDouble className="w-5 h-5 text-indigo-600" />
                      <span>{property.bedrooms} Beds</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Bath className="w-5 h-5 text-indigo-600" />
                      <span>{property.bathrooms} Baths</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mt-6">
                  <button
                    onClick={handleBookNowClick}
                    className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                  >
                    Book Now
                  </button>
                  <button
                    onClick={toggleMoreDetails}
                    className="flex-1 sm:flex-none bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-medium py-3 px-6 rounded-xl transition-colors"
                  >
                    {showMoreDetails ? "Hide Details" : "More Details"}
                  </button>
                </div>

                {showMoreDetails && (
                  <div className="mt-8 space-y-6">
                    <div className="bg-indigo-50 p-4 rounded-xl">
                      <h3 className="text-lg font-semibold mb-4">Description</h3>
                      <p className="text-gray-600">{property.description}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow">
                      <h3 className="text-lg font-semibold mb-4">Amenities</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(property.amenities || {})
                          .filter(([_, value]) => value)
                          .map(([amenity]) => (
                            <div key={amenity} className="flex items-center gap-2">
                              <div className="p-1.5 bg-indigo-100 rounded-lg">
                                {{
                                  swimmingPool: <Droplet className="w-5 h-5 text-blue-500" />,
                                  wifi: <Wifi className="w-5 h-5 text-green-500" />,
                                  parking: <Car className="w-5 h-5 text-purple-500" />,
                                  airConditioning: <AirVent className="w-5 h-5 text-cyan-500" />,
                                  kitchen: <MdKitchen className="w-5 h-5 text-amber-500" />,
                                  tv: <Tv className="w-5 h-5 text-red-500" />,
                                  washer: <WashingMachine className="w-5 h-5 text-emerald-500" />,
                                  balcony: <MdBalcony className="w-5 h-5 text-indigo-500" />,
                                }[amenity] || <Car className="w-5 h-5 text-purple-500" />}
                              </div>
                              <span className="capitalize">
                                {amenity.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {user?.role === "admin" && (
                      <div className="bg-white p-4 rounded-xl shadow">
                        <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
                        <div className="space-y-3">
                          {Object.entries(property.bankDetails || {}).map(([key, value]) => (
                            value && (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600 capitalize">{key}:</span>
                                <span className="text-gray-900 font-medium">{value}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl sticky top-6">
              <div className="flex flex-col gap-4">
                <button
                  onClick={generatePropertyPresentation}
                  disabled={generatingPresentation}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {generatingPresentation ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                  Generate Presentation
                </button>

                {presentationText && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Property Overview</h3>
                      <button
                        onClick={copyPresentationToClipboard}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm">{presentationText}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;