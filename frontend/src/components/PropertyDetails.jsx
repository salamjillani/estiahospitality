import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Loader2, Edit, MapPin, Home, Banknote, BedDouble, Bath, ArrowLeft } from 'lucide-react';

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await api.get(`/api/properties/${id}`);
        setProperty(data);
      } catch (err) {
        setError('Failed to load property details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Property not found</p>
        <Link to="/properties" className="text-blue-600 mt-4 inline-block">
          Back to Properties
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/properties"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Properties
        </Link>
        <Link
          to={`/properties/${id}/edit`}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Edit className="w-5 h-5" />
          Edit Property
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {property.photos.map((photo, index) => (
            <div key={index} className="aspect-video">
              <img
                src={photo.url}
                alt={`Property ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ))}
        </div>

        {/* Property Details */}
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            <Home className="w-8 h-8" />
            {property.title}
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
              <BedDouble className="w-5 h-5 text-blue-600" />
              <span>{property.bedrooms} Bedrooms</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
              <Bath className="w-5 h-5 text-blue-600" />
              <span>{property.bathrooms} Bathrooms</span>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
              {property.type}
            </span>
          </div>

          {property.description && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{property.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Location Details */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6" />
                Location Details
              </h3>
              <dl className="space-y-3">
                {Object.entries(property.location).map(([key, value]) => (
                  value && (
                    <div key={key} className="flex justify-between border-b border-gray-200 pb-2">
                      <dt className="text-gray-600 capitalize">{key}</dt>
                      <dd className="text-gray-900 font-medium">{value}</dd>
                    </div>
                  )
                ))}
              </dl>
            </div>

            {/* Bank Details */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Banknote className="w-6 h-6" />
                Bank Information
              </h3>
              <dl className="space-y-3">
                {Object.entries(property.bankDetails).map(([key, value]) => (
                  value && (
                    <div key={key} className="flex justify-between border-b border-gray-200 pb-2">
                      <dt className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                      <dd className="text-gray-900 font-medium">{value}</dd>
                    </div>
                  )
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;