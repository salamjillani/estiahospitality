import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Loader2, Trash2, Plus,  ViewIcon } from 'lucide-react';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await api.get('/api/properties');
        setProperties(data);
      } catch (err) {
        setError('Failed to load properties', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.delete(`/api/properties/${id}`);
        setProperties(prev => prev.filter(p => p._id !== id));
      } catch (err) {
        setError('Failed to delete property: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
        <Link
          to="/properties/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" /> Add New Property
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div key={property._id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{property.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{property.type}</p>
                  <div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      🛏️ {property.bedrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      🚿 {property.bathrooms}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Link
                    to={`/properties/${property._id}`}
                    className="p-2 hover:bg-gray-100 rounded-lg flex-1"
                    title="View property"
                  >
                    <ViewIcon className="w-5 h-5 text-blue-600" />
                  </Link>
                  <button
                    onClick={() => handleDelete(property._id)}
                    className="p-2 hover:bg-red-100 rounded-lg"
                    title="Delete property"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
              
              {property.photos?.[0] && (
                <img
                  src={property.photos[0].url}
                  alt={property.title}
                  className="mt-4 w-full h-48 object-cover rounded-lg"
                />
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 truncate">
                  📍 {property.location?.address || 'No address specified'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {property.location?.city}, {property.location?.country}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No properties found. Create your first property!</p>
        </div>
      )}
    </div>
  );
};

export default Properties;