// frontend/src/components/Notifications.jsx
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user?.role === 'admin') {
        const data = await api.get('/api/notifications');
        setNotifications(data);
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  const handleStatusUpdate = async (notificationId, status) => {
    try {
      await api.patch(`/api/notifications/${notificationId}`, { status });
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, status } : n
        )
      );
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">Pending Notifications</h2>
        
        {loading ? (
          <Loader2 className="animate-spin mx-auto" />
        ) : (
          <div className="space-y-4">
            {notifications.map(notification => (
              notification.status === 'pending' && (
                <div key={notification._id} className="bg-white p-6 rounded-lg shadow">
                  <p className="text-gray-700 mb-4">{notification.message}</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleStatusUpdate(notification._id, 'approved')}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      <CheckCircle className="inline mr-2" /> Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(notification._id, 'rejected')}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <XCircle className="inline mr-2" /> Reject
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;