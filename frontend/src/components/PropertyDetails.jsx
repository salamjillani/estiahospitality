import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const { user } = useAuth();

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <p className="text-indigo-700 font-medium">
            Loading property details...
          </p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
            Property Not Found
          </h2>
          <p className="text-gray-600 mb-8 text-center">
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
      <div className="bg-white p-6 rounded-2xl hover:shadow-lg transition-shadow border border-gray-100">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
          <MapPin className="w-6 h-6 text-indigo-600" />
          Location Details
        </h3>
        <dl className="space-y-4">
          {Object.entries(property.location).map(
            ([key, value]) =>
              value && (
                <div
                  key={key}
                  className="flex justify-between items-center border-b border-gray-100 pb-3"
                >
                  <dt className="text-gray-600 capitalize font-medium">
                    {key}
                  </dt>
                  <dd className="text-gray-900 font-semibold">{value}</dd>
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

    return (
      <div className="bg-white p-6 rounded-2xl hover:shadow-lg transition-shadow border border-gray-100 mt-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
          <ClipboardList className="w-6 h-6 text-indigo-600" />
          Facilities & Amenities
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(property.amenities || {})
            .filter(([_, value]) => value)
            .map(([amenity]) => (
              <div
                key={amenity}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {amenity === "swimmingPool" && (
                  <Droplet className="w-5 h-5 text-blue-500" />
                )}
                {amenity === "wifi" && (
                  <Wifi className="w-5 h-5 text-green-500" />
                )}
                {amenity === "parking" && (
                  <Car className="w-5 h-5 text-purple-500" />
                )}
                {amenity === "airConditioning" && (
                  <Car className="w-5 h-5 text-purple-500" />
                )}
                {amenity === "kitchen" && (
                  <Car className="w-5 h-5 text-purple-500" />
                )}
                {amenity === "tv" && (
                  <Car className="w-5 h-5 text-purple-500" />
                )}
                {amenity === "washer" && (
                  <Car className="w-5 h-5 text-purple-500" />
                )}
                {amenity === "balcony" && (
                  <Car className="w-5 h-5 text-purple-500" />
                )}
                <span className="capitalize text-gray-700">
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

    // Add authentication check at the top
    if (!user) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-8 text-center">
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
      <div className="bg-white p-6 rounded-2xl hover:shadow-lg transition-shadow border border-gray-100">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
          <Banknote className="w-6 h-6 text-indigo-600" />
          Bank Information
        </h3>
        <dl className="space-y-4">
          {Object.entries(property.bankDetails).map(
            ([key, value]) =>
              value && (
                <div
                  key={key}
                  className="flex justify-between items-center border-b border-gray-100 pb-3"
                >
                  <dt className="text-gray-600 font-medium">
                    {bankDetailsMapping[key] || key}
                  </dt>
                  <dd className="text-gray-900 font-semibold">{value}</dd>
                </div>
              )
          )}
        </dl>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/properties"
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors bg-white py-2 px-4 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Properties</span>
          </Link>
          {user?.role === "admin" && (
            <Link
              to={`/properties/${property._id}/edit`}
              className="p-3 text-indigo-600 bg-white hover:bg-indigo-50 rounded-full shadow-sm transition-colors duration-200 group"
              title="Edit property"
            >
              <Edit className="w-5 h-5" />
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-8 shadow-md">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Photos and Main Info */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {/* Image Gallery */}
              {property.photos && property.photos.length > 0 ? (
                <div className="relative h-96">
                  <img
                    src={property.photos[currentPhotoIndex].url}
                    alt={`Property ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {property.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/75 hover:bg-white rounded-full p-2 shadow-lg text-gray-800 hover:text-indigo-600 transition-all focus:outline-none"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/75 hover:bg-white rounded-full p-2 shadow-lg text-gray-800 hover:text-indigo-600 transition-all focus:outline-none"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Photo indicators */}
                  {property.photos.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {property.photos.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={`w-2.5 h-2.5 rounded-full ${
                            currentPhotoIndex === index
                              ? "bg-indigo-600"
                              : "bg-white/60"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-96 bg-gray-100 flex items-center justify-center">
                  <Home className="w-20 h-20 text-gray-300" />
                </div>
              )}

              {/* Thumbnail preview */}
              {property.photos && property.photos.length > 1 && (
                <div className="flex overflow-x-auto p-4 space-x-2 bg-gray-50">
                  {property.photos.map((photo, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`cursor-pointer flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        currentPhotoIndex === index
                          ? "border-indigo-600 shadow-md"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Property Details */}
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5" />
                    <span className="ml-2 text-gray-700 font-medium">
                      4.8 (42 reviews)
                    </span>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Available Now
                  </span>
                </div>

                <h1 className="text-3xl font-bold mb-4 text-gray-900">
                  {property.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                    <BedDouble className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-gray-800">
                      {property.bedrooms} Bedrooms
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                    <Bath className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-gray-800">
                      {property.bathrooms} Bathrooms
                    </span>
                  </div>
                  <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-medium">
                    {property.type}
                  </span>
                </div>

                {property.description && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                      About This Property
                    </h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
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
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {property.currency} {property.pricePerNight}
                  </span>
                  <span className="text-gray-600">/night</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 mb-4">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4" />
                  <span className="ml-1 text-gray-700 text-sm">4.8 (42)</span>
                </div>

                {user?.role === "client" && (
                  <Link
                    to={`/properties/${property._id}/book`}
                    state={{
                      property: {
                        _id: property._id,
                        pricePerNight: property.pricePerNight,
                        currency: property.currency,
                        ...property,
                      },
                    }}
                    className="bg-indigo-600 text-white w-full py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium text-lg"
                  >
                    <Calendar className="w-5 h-5" />
                    Book Now
                  </Link>
                )}
              </div>

              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">
                  Property Highlights
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-gray-600">
                      {property.bedrooms} bedrooms and {property.bathrooms}{" "}
                      bathrooms
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-gray-600">
                      Premium {property.type} property
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-gray-600">
                      Great location in {property.location?.city || "the area"}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-gray-600">
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