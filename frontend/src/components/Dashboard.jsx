import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { websocketService } from '../services/webSocketService';
import { Loader2 } from 'lucide-react';

import { 
  Inbox, Calendar, DollarSign, Home, CheckSquare, 
  Star, Settings, Clock, Users, BarChart2, Globe 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newEvent, setNewEvent] = useState({
    propertyId: '',
    guestName: '',
    source: 'direct',
    startDate: '',
    endDate: '',
    notes: ''
  });

  const sidebarItems = [
    { icon: <Inbox size={18} />, label: "Inbox" },
    { icon: <Calendar size={18} />, label: "Calendar", active: true },
    { icon: <DollarSign size={18} />, label: "Price" },
    { icon: <Home size={18} />, label: "Properties", path: "/properties" },
    { icon: <CheckSquare size={18} />, label: "Tasks" },
    { icon: <Star size={18} />, label: "Reviews" },
    { icon: <Settings size={18} />, label: "Automation" },
    { icon: <Clock size={18} />, label: "Owner Connect" },
    { icon: <Users size={18} />, label: "Guests" },
    { icon: <BarChart2 size={18} />, label: "Metrics" },
    { icon: <Globe size={18} />, label: "Booking Site" }
  ];

  const getSourceColor = (source) => {
    const colors = {
      direct: '#3B82F6',
      airbnb: '#FF5A5F',
      'booking.com': '#003580',
      vrbo: '#3D9B35'
    };
    return colors[source] || '#666666';
  };

  useEffect(() => {
    fetchProperties();
    fetchBookings();
    
    // Subscribe to property updates
    const unsubscribe = websocketService.subscribe('property_created', (newProperty) => {
      setProperties(prev => [...prev, newProperty]);
    });

    return () => unsubscribe();
  }, []);

  const fetchProperties = async () => {
    try {
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
      setError('Error fetching properties: ' + err.message);
      console.error('Error fetching properties:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/bookings', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      
      const bookings = await response.json();
      const formattedEvents = bookings.map(booking => ({
        id: booking._id,
        title: `${booking.guestName} - ${booking.property.title}`,
        start: new Date(booking.startDate),
        end: new Date(booking.endDate),
        backgroundColor: getSourceColor(booking.source),
        extendedProps: {
          propertyId: booking.property._id,
          guestName: booking.guestName,
          source: booking.source,
          notes: booking.notes,
          status: booking.status
        }
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      setError('Error fetching bookings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (selectInfo) => {
    const startDate = new Date(selectInfo.start);
    const endDate = new Date(selectInfo.end);
    
    const formatDate = (date) => {
      return date.toISOString().slice(0, 16);
    };

    setNewEvent({
      ...newEvent,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    });
    setShowEventModal(true);
  };

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    setNewEvent({
      propertyId: event.extendedProps.propertyId,
      guestName: event.extendedProps.guestName,
      source: event.extendedProps.source,
      startDate: event.start.toISOString().slice(0, 16),
      endDate: event.end.toISOString().slice(0, 16),
      notes: event.extendedProps.notes
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    try {
      setLoading(true);
      setError('');

      if (!newEvent.propertyId || !newEvent.guestName || !newEvent.startDate || !newEvent.endDate) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          property: newEvent.propertyId,
          guestName: newEvent.guestName,
          source: newEvent.source,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          notes: newEvent.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save booking');
      }

      await fetchBookings();
      setShowEventModal(false);
      setNewEvent({
        propertyId: '',
        guestName: '',
        source: 'direct',
        startDate: '',
        endDate: '',
        notes: ''
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Modal click handler to prevent event bubbling
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex-shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
            </div>
            <span className="ml-2 text-xl font-semibold">Estia Hospitality</span>
          </div>
        </div>
        <nav className="mt-4">
          {sidebarItems.map((item, index) => (
            item.path ? (
              <Link
                key={index}
                to={item.path}
                className="px-4 py-2.5 flex items-center text-gray-700 hover:bg-gray-50"
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            ) : (
              <button
                key={index}
                className={`w-full flex items-center px-4 py-2.5 text-sm ${
                  item.active ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </button>
            )
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="h-full flex flex-col relative">
          {error && (
            <div onClick={() => setError('')} className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4 cursor-pointer">
              <p>{error}</p>
            </div>
          )}
          
          <div className="flex-1 p-4">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={events}
              select={handleDateSelect}
              eventClick={handleEventClick}
              height="100%"
            />
          </div>

          {/* Modal with improved interaction handling */}
          {showEventModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
              style={{ zIndex: 9999 }}
            >
              <div 
                className="bg-white rounded-lg w-full max-w-md relative"
                onClick={handleModalClick}
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    {newEvent.id ? 'Edit Booking' : 'New Booking'}
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Property *
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={newEvent.propertyId}
                        onChange={(e) => setNewEvent({ ...newEvent, propertyId: e.target.value })}
                      >
                        <option value="">Select Property</option>
                        {properties.map((property) => (
                          <option key={property._id} value={property._id}>
                            {property.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Guest Name *
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={newEvent.guestName}
                        onChange={(e) => setNewEvent({ ...newEvent, guestName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={newEvent.source}
                        onChange={(e) => setNewEvent({ ...newEvent, source: e.target.value })}
                      >
                        <option value="direct">Direct</option>
                        <option value="airbnb">Airbnb</option>
                        <option value="booking.com">Booking.com</option>
                        <option value="vrbo">VRBO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={newEvent.startDate}
                        onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={newEvent.endDate}
                        onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={newEvent.notes}
                        onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 bg-white"
                      onClick={() => setShowEventModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${
                        loading ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                      onClick={handleSaveEvent}
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {newEvent.id ? 'Update' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;