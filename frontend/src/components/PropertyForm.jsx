import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { Loader2, X, Image, MapPin, Banknote, Home, Save, Trash2, Upload } from 'lucide-react';

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [property, setProperty] = useState({
    title: '',
    type: 'Apartment',
    description: '',
    bedrooms: 1,
    bathrooms: 1,
    location: {
      address: '',
      city: '',
      country: '',
      postalCode: ''
    },
    bankDetails: {
      accountHolder: '',
      accountNumber: '',
      bankName: '',
      swiftCode: '',
      iban: '',
      currency: 'USD'
    },
    photos: []
  });

  useEffect(() => {
    if (id) {
      const fetchProperty = async () => {
        try {
          const data = await api.get(`/api/properties/${id}`);
          setProperty(data);
        } catch (err) {
          setError('Failed to load property data', err);
        }
      };
      fetchProperty();
    }
  }, [id]);

  const handleUpload = async (e) => {
    try {
      setUploading(true);
      const files = Array.from(e.target.files);
      const formData = new FormData();
      files.forEach(file => formData.append('photos', file));

      const { photoUrls } = await api.post('/api/properties/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProperty(prev => ({
        ...prev,
        photos: [...prev.photos, ...photoUrls]
      }));
    } catch (err) {
      setError('Image upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await api.put(`/api/properties/${id}`, property);
      } else {
        await api.post('/api/properties', property);
      }
      navigate(`/properties/${id || ''}`);
    } catch (err) {
      setError(err.message || 'Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.delete(`/api/properties/${id}`);
        navigate(`/properties/${id || ''}`);
      } catch (err) {
        setError('Delete failed: ' + err.message);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Home className="w-6 h-6" />
          {id ? 'Edit Property' : 'Create New Property'}
        </h2>
        <button
          onClick={() => navigate(`/properties/${id || ''}`)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-6">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Property Title*</label>
              <input
                type="text"
                required
                value={property.title}
                onChange={e => setProperty({ ...property, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Property Type*</label>
              <select
                value={property.type}
                onChange={e => setProperty({ ...property, type: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="Cabin">Cabin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bedrooms*</label>
              <input
                type="number"
                min="1"
                required
                value={property.bedrooms}
                onChange={e => setProperty({ ...property, bedrooms: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bathrooms*</label>
              <input
                type="number"
                min="1"
                required
                value={property.bathrooms}
                onChange={e => setProperty({ ...property, bathrooms: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={property.description}
                onChange={e => setProperty({ ...property, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg h-32"
                placeholder="Describe the property features and amenities..."
              />
            </div>
          </div>
        </div>

        {/* Location Details Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Location Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(property.location).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2 capitalize">{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={e => setProperty({
                    ...property,
                    location: { ...property.location, [key]: e.target.value }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bank Information Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Banknote className="w-5 h-5" /> Bank Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(property.bankDetails).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  type="text"
                  value={value}
                  onChange={e => setProperty({
                    ...property,
                    bankDetails: { ...property.bankDetails, [key]: e.target.value }
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Image className="w-5 h-5" /> Property Photos
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {property.photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo.url}
                  alt={`Property ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setProperty({
                    ...property,
                    photos: property.photos.filter((_, i) => i !== index)
                  })}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            <Upload className="w-5 h-5 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Photos'}
            <input
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
              accept="image/*"
            />
          </label>
          <p className="text-sm text-gray-500 mt-2">
            Upload high-quality photos (JPEG, PNG, WEBP). Max 10 files.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4">
          {id && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Trash2 className="w-5 h-5" />
              Delete Property
            </button>
          )}
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {id ? 'Save Changes' : 'Create Property'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;