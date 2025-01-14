//frontend/src/components/Dashboard.jsx
import  { useState } from 'react';
import { Calendar, Clock, DollarSign, Home, CheckSquare, Star, Settings, Users, BarChart2, Globe, Inbox } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

// New style imports for latest versions
import '@fullcalendar/core';
import '@fullcalendar/resource-timeline';
import '@fullcalendar/daygrid';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Calendar');

  const sidebarItems = [
    { icon: <div className="grid grid-cols-2 gap-0.5 w-4 h-4"><div className="bg-current"></div><div className="bg-current"></div><div className="bg-current"></div><div className="bg-current"></div></div>, label: 'Dashboard' },
    { icon: <Inbox size={18} />, label: 'Inbox' },
    { icon: <Calendar size={18} />, label: 'Calendar' },
    { icon: <DollarSign size={18} />, label: 'Price' },
    { icon: <Home size={18} />, label: 'Properties' },
    { icon: <CheckSquare size={18} />, label: 'Tasks' },
    { icon: <Star size={18} />, label: 'Reviews' },
    { icon: <Settings size={18} />, label: 'Automation' },
    { icon: <Clock size={18} />, label: 'Owner Connect' },
    { icon: <Users size={18} />, label: 'Guests' },
    { icon: <BarChart2 size={18} />, label: 'Metrics' },
    { icon: <Globe size={18} />, label: 'Booking Site' }
  ];

  const resources = [
    { id: 'c009', title: 'Cottage 009' },
    { id: 'c015', title: 'Cottage 015' },
    { id: 'r1206', title: 'Double Room 1206' },
    { id: 'r1209', title: 'Double Room 1209' },
    { id: 'r1211', title: 'Double Room 1211' }
  ];

  const events = [
    {
      id: '1',
      resourceId: 'c009',
      title: 'Roger Helms (Vrbo - 7 Nights)',
      start: '2024-07-20',
      end: '2024-07-27',
      backgroundColor: '#ec4899',
      borderColor: '#ec4899'
    },
    {
      id: '2',
      resourceId: 'c015',
      title: 'Michelle (Booking.com - 6 Nights)',
      start: '2024-07-27',
      end: '2024-08-02',
      backgroundColor: '#22c55e',
      borderColor: '#22c55e'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
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
            <button
              key={index}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center px-4 py-2.5 text-sm ${
                activeTab === item.label ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      {activeTab === 'Calendar' && (
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-semibold">Calendar</h1>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Property name"
                  className="px-3 py-1 border rounded-md text-sm"
                />
                <button className="px-4 py-1 text-sm text-blue-600 bg-white border border-blue-600 rounded-md">
                  Subscribe
                </button>
              </div>
            </div>
            
            {/* FullCalendar Integration */}
            <div className="bg-white rounded-lg shadow p-4">
              <FullCalendar
                plugins={[resourceTimelinePlugin, dayGridPlugin, interactionPlugin]}
                initialView="resourceTimelineMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
                }}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                resources={resources}
                events={events}
                resourceAreaWidth="15%"
                height="calc(100vh - 180px)"
                slotMinWidth={70}
                resourceAreaHeaderContent="Properties"
                resourceLabelDidMount={(info) => {
                  info.el.style.fontSize = '0.875rem';
                }}
                eventDidMount={(info) => {
                  info.el.style.fontSize = '0.75rem';
                }}
                slotLabelDidMount={(info) => {
                  info.el.style.fontSize = '0.75rem';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;