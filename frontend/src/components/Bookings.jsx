import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { api } from "../utils/api";
import { Search, Users, CreditCard, Home, Clock, MapPin, BedDouble, ChevronRight, Bath, Calendar, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";
import Modal from "react-modal";

Modal.setAppElement("#root");

const Booking = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [formData, setFormData] = useState({
    property: "",
    guestName: "",
    email: "",
    phone: "",
    channel: "direct",
    guests: 1,
    adults: 1,
    commission: 10,
    currency: "USD",
    remarks: "",
    nationality: "",
    arrivalTime: "",
    paymentMethod: "cash",
    rooms: 1,
    children: 0
  });
  const { user } = useAuth();
  const [availableProperties, setAvailableProperties] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stayDuration, setStayDuration] = useState(0);

  const fetchProperties = useCallback(async () => {
    try {
      const response = await api.get("/api/properties");
      setProperties(response);
      setFilteredProperties(response);
      setAvailableProperties(response);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  }, []);

  const fetchBookings = useCallback(async (propertyId) => {
    try {
      const response = await api.get(`/api/bookings?property=${propertyId}`);
      setBookings(response);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  }, []);

  const fetchAllBookings = useCallback(async () => {
    try {
      const response = await api.get("/api/bookings");
      setBookings(response);
    } catch (err) {
      console.error("Error fetching all bookings:", err);
    }
  }, []);

  const checkAvailability = useCallback(() => {
    if (selectedDates.start && selectedDates.end) {
      const available = properties.filter(property => {
        const propertyBookings = bookings.filter(b => b.property === property._id);
        return !propertyBookings.some(booking => 
          new Date(selectedDates.start) < new Date(booking.checkOutDate) &&
          new Date(selectedDates.end) > new Date(booking.checkInDate)
        );
      });
      setAvailableProperties(available);
    }
  }, [properties, bookings, selectedDates]);

  useEffect(() => {
    fetchProperties();
    fetchAllBookings();
  }, [fetchProperties, fetchAllBookings]);

  useEffect(() => {
    if (selectedProperty) fetchBookings(selectedProperty._id);
  }, [selectedProperty, fetchBookings]);

  useEffect(() => {
    const filtered = properties.filter((property) =>
      property.title.toLowerCase().includes(propertySearchQuery.toLowerCase())
    );
    setFilteredProperties(filtered);
  }, [propertySearchQuery, properties]);

  useEffect(() => {
    if (selectedDates.start && selectedDates.end) {
      const nights = Math.ceil((new Date(selectedDates.end) - new Date(selectedDates.start)) / (1000 * 60 * 60 * 24));
      setStayDuration(nights);
      checkAvailability();
    }
  }, [selectedDates, checkAvailability]);

  const handleDateSelect = (selectInfo) => {
    setSelectedDates({ start: selectInfo.startStr, end: selectInfo.endStr });
    setIsModalOpen(true);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!formData.property) {
      alert("Please select a property");
      return;
    }
    
    try {
      const newBooking = await api.post('/api/bookings', {
        ...formData,
        checkInDate: selectedDates.start,
        checkOutDate: selectedDates.end,
        status: "confirmed",
        adults: formData.adults || 1,
        nationality: formData.nationality || "",
        arrivalTime: formData.arrivalTime || "",
        paymentMethod: formData.paymentMethod || "cash",
        rooms: formData.rooms || 1,
        children: formData.children || 0
      });
      
      setBookings([...bookings, newBooking]);
      setIsModalOpen(false);
      setFormData({
        property: "",
        guestName: "",
        email: "",
        phone: "",
        channel: "direct",
        guests: 1,
        adults: 1,
        commission: 10,
        currency: "USD",
        remarks: "",
        nationality: "",
        arrivalTime: "",
        paymentMethod: "cash",
        rooms: 1,
        children: 0
      });
      await fetchAllBookings();
      checkAvailability();
    } catch (err) {
      console.error("Booking failed:", err);
      alert("Booking failed: " + err.message);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const getCurrencySymbol = (currency) => {
    const symbols = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "CA$", AUD: "A$", INR: "₹", SGD: "S$" };
    return symbols[currency] || currency;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} user={user} />
      
      {user && (
        <div className="pt-16 px-6 bg-white/70 shadow-sm border-b border-blue-100">
          <div className="flex items-center py-2">
            <User className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm text-gray-700">Welcome, <span className="font-medium">{user.name || user.email}</span></span>
          </div>
        </div>
      )}
      
      <div className="pt-4 h-screen flex flex-col lg:flex-row overflow-hidden">
        <div className={`fixed lg:static w-full max-w-full lg:max-w-xs bg-white/90 border-r border-gray-100 h-full overflow-hidden transform transition-transform duration-300 ease-in-out z-40 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="p-6 overflow-y-auto h-full">
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                <Search className="h-4 w-4 text-gray-600" />
              </div>
              <input
                type="text"
                placeholder="Search properties..."
                value={propertySearchQuery}
                onChange={(e) => setPropertySearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 bg-white/70 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 placeholder-gray-600 shadow-sm text-sm"
              />
            </div>
            
            {selectedDates.start && selectedDates.end && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Available Properties
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 rounded-full text-xs">
                    {stayDuration} night{stayDuration !== 1 ? 's' : ''}
                  </span>
                </h3>
                {availableProperties.length === 0 ? (
                  <p className="text-sm text-gray-600 italic">No properties available for selected dates</p>
                ) : (
                  <p className="text-sm text-gray-600">{availableProperties.length} properties available</p>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              {filteredProperties.map((property) => (
                <div
                  key={property._id}
                  onClick={() => setSelectedProperty(property)}
                  className={`group block p-4 bg-white rounded-xl border ${selectedProperty?._id === property._id ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-100 hover:border-blue-200"} hover:shadow-xl transition-all duration-200 cursor-pointer`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 shadow-md">
                      {property.photos?.[0] ? (
                        <img src={property.photos[0].url} alt={property.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-8 h-8 text-blue-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{property.title}</h3>
                      <p className="flex items-center gap-1 mt-1 text-sm text-blue-500 truncate">
                        <MapPin className="w-4 h-4" />
                        {property.location?.city || "Location not specified"}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg text-xs text-blue-600">
                          <BedDouble className="w-4 h-4" /> {property.bedrooms}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-lg text-xs text-purple-600">
                          <Bath className="w-4 h-4" /> {property.bathrooms}
                        </span>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 bg-transparent h-full overflow-hidden">
          <div className="h-full bg-white rounded-xl shadow-xl border border-blue-100/30 overflow-hidden">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{ left: "prev,next", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
              selectable={true}
              select={handleDateSelect}
              events={bookings.map((booking) => ({
                title: "Booked",
                start: booking.checkInDate,
                end: booking.checkOutDate,
                display: "background",
                className: "line-through-booked"
              }))}
              height="100%"
              selectAllow={(selectInfo) => {
                const start = new Date(selectInfo.startStr);
                const end = new Date(selectInfo.endStr);
                return !bookings.some(booking => 
                  start < new Date(booking.checkOutDate) && 
                  end > new Date(booking.checkInDate)
              );
              }}
            />
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50"
        >
          <h2 className="text-2xl font-bold mb-4">
            New Reservation 
            {selectedDates.start && selectedDates.end && (
              <span className="text-sm font-normal ml-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {stayDuration} night{stayDuration !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
          
          <form onSubmit={handleSubmitBooking} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Check-in</label>
                <div className="flex items-center border rounded-lg p-2 bg-gray-50">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <input
                    type="date"
                    value={selectedDates.start}
                    onChange={(e) => setSelectedDates(prev => ({...prev, start: e.target.value}))}
                    className="w-full bg-transparent outline-none"
                  />
                </div>
                {selectedDates.start && <p className="text-xs text-gray-500 mt-1">{formatDate(selectedDates.start)}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Check-out</label>
                <div className="flex items-center border rounded-lg p-2 bg-gray-50">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <input
                    type="date"
                    value={selectedDates.end}
                    onChange={(e) => setSelectedDates(prev => ({...prev, end: e.target.value}))}
                    className="w-full bg-transparent outline-none"
                  />
                </div>
                {selectedDates.end && <p className="text-xs text-gray-500 mt-1">{formatDate(selectedDates.end)}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Property</label>
              <select
                value={formData.property}
                onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Select a property</option>
                {selectedDates.start && selectedDates.end 
                  ? availableProperties.map((property) => (
                      <option key={property._id} value={property._id}>{property.title}</option>
                    ))
                  : properties.map((property) => (
                      <option key={property._id} value={property._id}>{property.title}</option>
                    ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Guest Name</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded-lg"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                placeholder={user ? `${user.name || user.email}` : "Full Name"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={user ? user.email : "Email Address"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Adults</label>
                <input
                  type="number"
                  min="1"
                  value={formData.adults}
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value), guests: parseInt(e.target.value) + (formData.children || 0) })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Children</label>
                <input
                  type="number"
                  min="0"
                  value={formData.children}
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value), guests: (formData.adults || 1) + parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nationality</label>
              <select
                value={formData.nationality || ""}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Select Nationality</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="India">India</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="China">China</option>
                <option value="Japan">Japan</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Channel</label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="direct">Direct</option>
                  <option value="airbnb">Airbnb</option>
                  <option value="booking">Booking.com</option>
                  <option value="vrbo">VRBO</option>
                  <option value="expedia">Expedia</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <div className="relative">
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full p-2 border rounded-lg pl-8"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (CA$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="SGD">SGD (S$)</option>
                  </select>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    {getCurrencySymbol(formData.currency)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rooms</label>
                <input
                  type="number"
                  min="1"
                  value={formData.rooms || 1}
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({ ...formData, rooms: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Commission %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commission}
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({ ...formData, commission: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Arrival Time</label>
              <div className="flex items-center border rounded-lg p-2">
                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                <input
                  type="time"
                  value={formData.arrivalTime || ""}
                  className="w-full bg-transparent outline-none"
                  onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: "cash" })}
                  className={`p-2 border rounded-lg flex items-center justify-center ${formData.paymentMethod === "cash" ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                >
                  <CreditCard className={`h-4 w-4 mr-2 ${formData.paymentMethod === "cash" ? "text-blue-600" : "text-gray-500"}`} />
                  <span className={formData.paymentMethod === "cash" ? "text-blue-700" : "text-gray-700"}>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: "stripe" })}
                  className={`p-2 border rounded-lg flex items-center justify-center ${formData.paymentMethod === "stripe" ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                >
                  <CreditCard className={`h-4 w-4 mr-2 ${formData.paymentMethod === "stripe" ? "text-blue-600" : "text-gray-500"}`} />
                  <span className={formData.paymentMethod === "stripe" ? "text-blue-700" : "text-gray-700"}>Stripe</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <textarea
                value={formData.remarks}
                className="w-full p-2 border rounded-lg"
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book Now
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Booking;