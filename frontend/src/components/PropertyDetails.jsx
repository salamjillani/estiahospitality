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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Property Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The property you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          to="/properties"
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Return to Properties
        </Link>
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
      <div className="bg-gray-50 p-6 rounded-2xl hover:shadow-md transition-shadow">
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
                  className="flex justify-between items-center border-b border-gray-200 pb-3"
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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-8">
            Please sign in to view property details
          </p>
          <Link
            to="/auth"
            state={{ from: `/properties/${id}` }}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go to Sign In
          </Link>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 p-6 rounded-2xl hover:shadow-md transition-shadow">
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
                  className="flex justify-between items-center border-b border-gray-200 pb-3"
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/properties"
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Properties</span>
          </Link>
          {user?.role === "admin" && (
            <Link
              to={`/properties/${property._id}/edit`}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 group"
              title="Edit property"
            >
              <Edit className="w-5 h-5" />
            </Link>
          )}
        </div>

        {user?.role === "client" && (
        <Link
        to={`/properties/${property._id}/book`}
        state={{ 
          property: {
            _id: property._id,
            pricePerNight: property.pricePerNight,
            currency: property.currency,
            ...property
          } 
        }}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
      >
        Book Now
      </Link>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-8">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Image Gallery */}
          {property.photos && property.photos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 bg-gray-50">
              {property.photos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-video rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <img
                    src={photo.url}
                    alt={`Property ${index + 1}`}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Property Details */}
          <div className="p-8">
            <h1 className="text-4xl font-bold mb-6 text-gray-900 flex items-center gap-3">
              <Home className="w-10 h-10 text-indigo-600" />
              {property.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full">
                <BedDouble className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-gray-800">
                  {property.bedrooms} Bedrooms
                </span>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full">
                <Bath className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-gray-800">
                  {property.bathrooms} Bathrooms
                </span>
              </div>
              <span className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full font-medium">
                {property.type}
              </span>
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-800">
                  {property.currency} {property.pricePerNight}/night
                </span>
              </div>
            </div>

            {property.description && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  Description
                </h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {property.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {renderLocationDetails()}
              {renderBankDetails()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
