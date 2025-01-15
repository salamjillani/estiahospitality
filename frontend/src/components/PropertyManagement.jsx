import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  const { user } = useAuth();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/properties', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setProperties(data.properties || []);
    } catch (err) {
      setError(err.message);
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
      const response = await fetch('http://localhost:5000/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to add property');
      
      await fetchProperties();
      setShowNewPropertyModal(false);
      setFormData({ title: '', type: 'separate_room', identifier: '', listingUrls: [] });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <div className="flex items-center space-x-2">
          <button className="text-blue-600 px-4 py-2 border rounded-md">
            Subscribe
          </button>
          <div className="flex space-x-3">
            {['info', 'edit', 'notification', 'globe', 'user'].map((icon, index) => (
              <button key={index} className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">{icon}</span>
                <div className="w-5 h-5" />
              </button>
            ))}
          </div>
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
            placeholder="Property name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        <button className="px-4 py-2 text-gray-700 border rounded-md">
          Groups
        </button>
        <button className="px-4 py-2 text-gray-700 border rounded-md">
          Room Types
        </button>
        <button className="px-4 py-2 text-gray-700 border rounded-md">
          Tag
        </button>
        <button
          onClick={() => setShowNewPropertyModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ml-auto"
        >
          New property
        </button>
      </div>

      {/* Properties List */}
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b text-sm font-medium text-gray-500">
          <div className="col-span-1">
            <input type="checkbox" className="rounded" />
          </div>
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Linked Listings</div>
          <div className="col-span-3">Groups</div>
          <div className="col-span-2">Tags</div>
        </div>

        {/* Property Items */}
        {properties.map((property) => (
          <div 
            key={property._id}
            className="grid grid-cols-12 gap-4 px-6 py-4 border-b hover:bg-gray-50"
          >
            <div className="col-span-1">
              <input 
                type="checkbox"
                checked={selectedProperties.some(p => p._id === property._id)}
                onChange={() => handlePropertySelect(property)}
                className="rounded"
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
                <div className="font-medium">{property.title}</div>
                <div className="text-sm text-gray-500">Separate room</div>
              </div>
            </div>
            <div className="col-span-3 flex items-center">
              <button className="text-blue-600 hover:text-blue-700">
                <Plus size={18} />
              </button>
            </div>
            <div className="col-span-3 flex items-center">-</div>
            <div className="col-span-2 flex items-center justify-between">
              <span>.</span>
              <button>
                <MoreHorizontal size={18} className="text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Property Modal */}
      {showNewPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Property</h2>
            <form onSubmit={handleNewProperty}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="separate_room">Separate Room</option>
                    <option value="entire_property">Entire Property</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Identifier</label>
                  <input
                    type="text"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewPropertyModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
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