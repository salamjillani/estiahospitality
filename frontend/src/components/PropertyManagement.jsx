import  { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Loader2, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { websocketService } from '../services/webSocketService';

const PropertyManagement = () => {
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState('properties');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPropertyModal, setShowNewPropertyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProperties, setSelectedProperties] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    type: 'separate_room',
    identifier: '',
    listingUrls: []
  });

  useEffect(() => {
    fetchProperties();
    const unsubscribe = websocketService.subscribe('property_created', (newProperty) => {
      setProperties(prev => [...prev, newProperty]);
    });

    return () => unsubscribe();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:5000/api/properties', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch properties');
      }
      
      const data = await response.json();
      setProperties(data.properties || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelect = (property) => {
    setSelectedProperties(prev => {
      const isSelected = prev.find(p => p._id === property._id);
      if (isSelected) {
        return prev.filter(p => p._id !== property._id);
      }
      return [...prev, property];
    });
  };

  const handleNewProperty = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      if (!formData.title || !formData.type || !formData.identifier) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch('http://localhost:5000/api/properties', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add property');
      }
      
      const newProperty = await response.json();
      setProperties(prev => [...prev, newProperty]);
      setShowNewPropertyModal(false);
      setFormData({ 
        title: '', 
        type: 'separate_room', 
        identifier: '', 
        listingUrls: [] 
      });
    } catch (err) {
      setError(err.message);
      console.error('Error adding property:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property =>
    property.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded relative">
          <span className="block sm:inline">{error}</span>
          <span
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setError('')}
          >
            <svg className="h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <div className="flex items-center space-x-2">
          <button className="text-blue-600 px-4 py-2 border rounded-md hover:bg-blue-50">
            Subscribe
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex space-x-8">
          <button
            className={`pb-4 px-1 ${
              activeTab === 'properties'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('properties')}
          >
            Properties
          </button>
          <button
            className={`pb-4 px-1 ${
              activeTab === 'roomTypes'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('roomTypes')}
          >
            Room Types
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        <button className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50">
          Groups
        </button>
        <button className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50">
          Room Types
        </button>
        <button className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50">
          Tag
        </button>
        <button
          onClick={() => setShowNewPropertyModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ml-auto flex items-center gap-2"
        >
          <Plus size={18} />
          New property
        </button>
      </div>

      {/* Properties List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* List Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b text-sm font-medium text-gray-500">
          <div className="col-span-1">
            <input 
              type="checkbox" 
              className="rounded border-gray-300"
              onChange={() => {
                if (selectedProperties.length === properties.length) {
                  setSelectedProperties([]);
                } else {
                  setSelectedProperties([...properties]);
                }
              }}
              checked={selectedProperties.length === properties.length && properties.length > 0}
            />
          </div>
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Linked Listings</div>
          <div className="col-span-3">Groups</div>
          <div className="col-span-2">Tags</div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="px-6 py-8 text-center text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading properties...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProperties.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            <p className="font-medium">No properties found</p>
            <p className="mt-1">Get started by adding a new property</p>
          </div>
        )}

        {/* Property Items */}
        {!loading && filteredProperties.map((property) => (
          <div 
            key={property._id}
            className="grid grid-cols-12 gap-4 px-6 py-4 border-b hover:bg-gray-50"
          >
            <div className="col-span-1">
              <input 
                type="checkbox"
                checked={selectedProperties.some(p => p._id === property._id)}
                onChange={() => handlePropertySelect(property)}
                className="rounded border-gray-300"
              />
            </div>
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-12 h-8 bg-gray-200 rounded">
                <img 
                  src="/api/placeholder/48/32"
                  alt=""
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <div>
                <div className="font-medium text-gray-900">{property.title}</div>
                <div className="text-sm text-gray-500">{property.type}</div>
              </div>
            </div>
            <div className="col-span-3 flex items-center">
              {property.listingUrls && property.listingUrls.length > 0 ? (
                <div className="flex gap-2">
                  {property.listingUrls.map((url, index) => (
                    <a 
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <LinkIcon size={18} />
                    </a>
                  ))}
                </div>
              ) : (
                <button className="text-blue-600 hover:text-blue-700">
                  <Plus size={18} />
                </button>
              )}
            </div>
            <div className="col-span-3 flex items-center text-gray-500">-</div>
            <div className="col-span-2 flex items-center justify-between">
              <span className="text-gray-500">-</span>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Property Modal */}
      {showNewPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Property</h2>
            <form onSubmit={handleNewProperty}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="separate_room">Separate Room</option>
                    <option value="entire_property">Entire Property</option>
                    <option value="cottage">Cottage</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identifier *
                  </label>
                  <input
                    type="text"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Unique identifier for the property"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewPropertyModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading && <Loader2 className="animate-spin" size={18} />}
                  Add Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;