// frontend/src/components/OwnerDashboard.jsx
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from "../context/AuthContext";
import { Loader2, Home, Calendar, AlertCircle, MapPin,Bed, Bath } from 'lucide-react';

const OwnerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
   const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const [propsResponse, booksResponse] = await Promise.all([
          api.get('/api/properties/owned'),
          api.get('/api/bookings/owner')
        ]);
        
        setProperties(propsResponse);
        setBookings(booksResponse);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    const fetchOwnerData = async () => {
      const properties = await api.get(`/api/properties/owner/${user._id}`);
      const bookings = await api.get(`/api/bookings/owner/${user._id}`);
      setProperties(properties);
      setBookings(bookings);
    };
    fetchOwnerData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Owner Dashboard</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Home className="h-6 w-6 text-blue-600" />
          My Properties ({properties.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(property => (
            <div key={property._id} className="bg-white rounded-xl shadow-sm border p-6">
              <img 
                src={property.photos?.[0]?.url || '/placeholder-property.jpg'} 
                alt={property.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">{property.title}</h3>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <MapPin className="h-4 w-4" />
                <p>{property.location.city}, {property.location.country}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  {property.bedrooms} beds
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  {property.bathrooms} baths
                </div>
              </div>
            </div>
          ))}
          {properties.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No properties listed yet
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          Recent Bookings ({bookings.length})
        </h2>
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Property</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dates</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Guests</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map(booking => (
                <tr key={booking._id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={booking.property.photos?.[0]?.url || '/placeholder-property.jpg'} 
                        alt={booking.property.title}
                        className="h-12 w-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium">{booking.property.title}</p>
                        <p className="text-sm text-gray-600">{booking.guestName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(booking.startDate).toLocaleDateString()} -{' '}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">{booking.numberOfGuests}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    ${booking.totalPrice?.toFixed(2)}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default OwnerDashboard;