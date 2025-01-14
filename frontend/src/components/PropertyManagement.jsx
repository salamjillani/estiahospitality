import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PropertyManagement = () => {
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'cottage',
    identifier: '',
    managers: []
  });

  const { user } = useAuth();

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/properties', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      if (user?.role === 'admin') {
        const response = await fetch('http://localhost:5000/api/auth/users', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchUsers();
  }, [user]);

  const handleDelete = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/properties/${propertyId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          setProperties(properties.filter(p => p._id !== propertyId));
        } else {
          throw new Error('Failed to delete property');
        }
      } catch (error) {
        console.error('Failed to delete property:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const url = selectedProperty 
        ? `http://localhost:5000/api/properties/${selectedProperty._id}`
        : 'http://localhost:5000/api/properties';

      const method = selectedProperty ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${selectedProperty ? 'update' : 'create'} property`);
      }

      setShowModal(false);
      setSelectedProperty(null);
      setFormData({ title: '', type: 'cottage', identifier: '', managers: [] });
      fetchProperties();
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center text-red-600">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Property Management</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={20} className="mr-2" />
            Add Property
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(property => (
          <div key={property._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{property.title}</h3>
                <p className="text-gray-600">{property.identifier}</p>
                <p className="text-sm text-gray-500 capitalize">{property.type}</p>
              </div>
              {user?.role === 'admin' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedProperty(property);
                      setFormData({
                        title: property.title,
                        type: property.type,
                        identifier: property.identifier,
                        managers: property.managers
                      });
                      setShowModal(true);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(property._id)}
                    className="p-2 text-gray-600 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            {user?.role === 'admin' && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center text-sm text-gray-600">
                  <Users size={16} className="mr-2" />
                  <span>{property.managers?.length || 0} managers assigned</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedProperty ? 'Edit Property' : 'Add New Property'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
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
                  <option value="cottage">Cottage</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="room">Room</option>
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
              {user?.role === 'admin' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Assign Managers</label>
                  <select
                    multiple
                    value={formData.managers}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({ ...formData, managers: selectedOptions });
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedProperty(null);
                    setFormData({ title: '', type: 'cottage', identifier: '', managers: [] });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {selectedProperty ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {showDeleteModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
          <p>Are you sure you want to delete this property?</p>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(selectedProperty._id)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default PropertyManagement;
