import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation  } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import {
  FaSwimmingPool,
  FaConciergeBell,
  FaHotTub,
  FaWineGlassAlt,
  FaUmbrellaBeach,
} from "react-icons/fa";
import {
  Home,
  User,
  LogIn,
  LogOut,
  MapPin,
  Bed,
  Bath,
  Wifi,
  Car,
  Star,
  ShieldCheck,
  Heart,
  ChefHat,
  Snowflake,
  PawPrint,
  Clock,
  Activity,
  Globe,
  Award,
} from "lucide-react";
import {
  GiFireplace,
  GiPartyFlags,
  GiTheater,
  GiMountainCave,
} from "react-icons/gi";
import { IoMdFitness } from "react-icons/io";
import {
  MdCleaningServices,
  MdSecurity,
  MdBreakfastDining,
} from "react-icons/md";


const LandingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [properties, setProperties] = useState([]);

  const scrollToSection = (sectionId) => {
    if (location.pathname === "/") {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/", { state: { scrollTo: sectionId }, replace: true });
    }
  };

  useEffect(() => {
    if (location.state?.scrollTo) {
      const section = document.getElementById(location.state.scrollTo);
      if (section) {
        setTimeout(() => {
          section.scrollIntoView({ behavior: "smooth" });
        }, 100); // Small delay to ensure component mounts
      }
      // Clear the scroll state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.scrollTo, navigate, location.pathname]);

  const handleAuthNavigation = (path) => {
    if (!user) {
      navigate("/auth", { state: { from: path } });
    } else {
      navigate(path);
    }
  };

  const handleBookingClick = () => {
    handleAuthNavigation("/dashboard");
  };

  // Enhanced amenities
  const featuredAmenities = [
    { icon: <FaSwimmingPool className="h-8 w-8" />, label: "Infinity Pool" },
    { icon: <FaHotTub className="h-8 w-8" />, label: "Spa & Sauna" },
    { icon: <Wifi className="h-8 w-8" />, label: "5G WiFi" },
    { icon: <GiFireplace className="h-8 w-8" />, label: "Fireplace" },
    { icon: <Car className="h-8 w-8" />, label: "EV Charging" },
    { icon: <ChefHat className="h-8 w-8" />, label: "Private Chef" },
    { icon: <Snowflake className="h-8 w-8" />, label: "A/C" },
    { icon: <PawPrint className="h-8 w-8" />, label: "Pet Friendly" },
    { icon: <GiTheater className="h-8 w-8" />, label: "Home Theater" },
    { icon: <IoMdFitness className="h-8 w-8" />, label: "Fitness Center" },
  ];

  // Enhanced testimonials
  const testimonials = [
    {
      name: "Sarah J.",
      role: "Travel Blogger",
      text: "Absolutely stunning properties with top-notch amenities. The infinity pool was breathtaking, and the concierge service made our stay unforgettable.",
      photo: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    {
      name: "Mike R.",
      role: "Business Traveler",
      text: "Best service I've experienced in vacation rentals. The high-speed internet and dedicated workspace made it perfect for remote work while enjoying luxury.",
      photo: "https://randomuser.me/api/portraits/men/2.jpg",
    },
    {
      name: "Emma L.",
      role: "Family Vacationer",
      text: "Perfect for families with amazing facilities. The kids loved the pool, and we loved the gourmet kitchen and spacious living areas.",
      photo: "https://randomuser.me/api/portraits/women/3.jpg",
    },
    {
      name: "James T.",
      role: "Luxury Traveler",
      text: "The attention to detail in these properties is unmatched. From the designer furniture to the smart home features, everything was perfect.",
      photo: "https://randomuser.me/api/portraits/men/4.jpg",
    },
  ];

  // Host benefits enhancements
  const hostBenefits = [
    {
      icon: <GiPartyFlags className="h-12 w-12" />,
      title: "Premium Listing",
      description:
        "Showcase your property to high-quality guests seeking luxury experiences.",
    },
    {
      icon: <FaConciergeBell className="h-12 w-12" />,
      title: "24/7 Support",
      description:
        "Our dedicated support team ensures both hosts and guests have a seamless experience.",
    },
    {
      icon: <ShieldCheck className="h-12 w-12" />,
      title: "Insurance Protection",
      description: "Comprehensive protection and peace of mind.",
    },
    {
      icon: <Star className="h-12 w-12" />,
      title: "Premium Stay",
      description:
        "Maximize your rental experience with our dynamic environment.",
    },
    {
      icon: <MdCleaningServices className="h-12 w-12" />,
      title: "Cleaning Service",
      description: "Access to our network of trusted cleaning professionals.",
    },
    {
      icon: <MdSecurity className="h-12 w-12" />,
      title: "Secure Verification",
      description: "All guests undergo our rigorous verification process.",
    },
    {
      icon: <Globe className="h-12 w-12" />,
      title: "Global Exposure",
      description: "Our properties showcased to luxury travelers worldwide.",
    },
    {
      icon: <Award className="h-12 w-12" />,
      title: "Host Recognition",
      description: "Exclusive perks for our guests.",
    },
  ];

  // Featured Locations
  const featuredLocations = [
    {
      city: "Santorini",
      country: "Greece",
      image:
        "https://images.unsplash.com/photo-1531572753322-ad063cecc140?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    },
    {
      city: "Bali",
      country: "Indonesia",
      image:
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    },
    {
      city: "Amalfi Coast",
      country: "Italy",
      image:
        "https://plus.unsplash.com/premium_photo-1677359734743-231e33b5c7d3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8QU1BTEZJJTIwQ09BU1QlMjBJVEFMWXxlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      city: "New York",
      country: "United States",
      image:
        "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8TmV3JTIwWW9ya3xlbnwwfHwwfHx8MA%3D%3D",
    },
  ];

  // Premium services
  const premiumServices = [
    {
      icon: <FaWineGlassAlt className="h-6 w-6" />,
      title: "Juicy Drinks",
      description: "Curated selection of local and international drinks",
    },
    {
      icon: <MdBreakfastDining className="h-6 w-6" />,
      title: "Gourmet Breakfast",
      description: "Daily breakfast prepared by professional chefs",
    },
    {
      icon: <FaUmbrellaBeach className="h-6 w-6" />,
      title: "Beach Setup",
      description: "Private beach access with luxury loungers",
    },
    {
      icon: <GiMountainCave className="h-6 w-6" />,
      title: "Adventure Tours",
      description: "Exclusive guided excursions to hidden gems",
    },
  ];
  const fetchProperties = async () => {
    try {
      const data = await api.get("/api/properties/public");
      setProperties(data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Background Image - Fixed Position */}
      <div className="fixed top-0 left-0 w-full h-screen bg-[url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-[0.04] z-0"></div>

      {/* Navigation Bar with Glass Effect */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm fixed w-full z-50 transition-all duration-300">
      
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-12 w-auto transition-transform group-hover:rotate-12 duration-500"
              />
            </Link>

            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-8">
                <button
                  onClick={() => scrollToSection("curated-collection")}
                  className="text-gray-600 hover:text-blue-600 transition-colors font-medium flex items-center space-x-2"
                >
                  <Home className="h-5 w-5" />
                  <span>Properties</span>
                </button>
                <button
                  onClick={() => scrollToSection("popular-destinations")}
                  className="text-gray-600 hover:text-blue-600 transition-colors font-medium flex items-center space-x-2"
                >
                  <MapPin className="h-5 w-5" />
                  <span>Destinations</span>
                </button>
                <button
                  onClick={() => scrollToSection("guest-experiences")}
                  className="text-gray-600 hover:text-blue-600 transition-colors font-medium flex items-center space-x-2"
                >
                  <Activity className="h-5 w-5" />
                  <span>Experiences</span>
                </button>
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-blue-600 transition-colors font-medium flex items-center space-x-2"
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span>Become our Guest</span>
                </Link>
              </div>

              {user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 bg-blue-50 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100 group-hover:border-blue-200">
                    <User className="h-6 w-6 text-blue-600" />
                    <span className="font-medium text-gray-700">
                      {user.name}
                    </span>
                  </button>
                  <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                    <Link
                      to="/profile"
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    >
                      <User className="h-5 w-5 text-blue-600" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/bookings"
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    >
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span>My Bookings</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    >
                      <LogOut className="h-5 w-5 text-red-600" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/auth"
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all font-medium group"
                  >
                    <LogIn className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>Get Started</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        {/* Hero Section with Animated Elements */}
        <div className="text-center mb-24 relative">
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-blue-400 rounded-full filter blur-[100px] opacity-20"></div>
          <div className="absolute top-20 left-1/4 w-20 h-20 bg-purple-400 rounded-full filter blur-[80px] opacity-20 animate-pulse"></div>
          <div className="absolute top-10 right-1/4 w-24 h-24 bg-pink-400 rounded-full filter blur-[90px] opacity-20 animate-pulse animation-delay-1000"></div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            Experience Luxury{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover handpicked luxury properties with exceptional amenities and
            personalized service for the discerning traveler
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/properties"
              onClick={(e) => {
                e.preventDefault();
                handleAuthNavigation("/properties");
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all font-medium flex items-center justify-center space-x-2 group"
            >
              <Star className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              <span>Explore Properties</span>
            </Link>
          </div>
        </div>

        {/* Featured Locations Section */}
        <section id="popular-destinations" className="mb-24">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Popular Destinations
          </h2>
          <p className="text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Explore our collection of luxury properties in the world&apos;s most
            sought-after locations
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredLocations.map((location, index) => (
              <Link
                key={index}
                to={`/properties?location=${location.city}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                <img
                  src={location.image}
                  alt={`${location.city}, ${location.country}`}
                  className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h3 className="text-white text-xl font-bold mb-1">
                    {location.city}
                  </h3>
                  <p className="text-white/80 text-sm">{location.country}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Amenities with Animation */}
        <div className="mb-24 relative overflow-hidden">
          <div className="absolute -right-20 top-1/4 w-48 h-48 bg-blue-400 rounded-full filter blur-[100px] opacity-10 animate-pulse"></div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Signature Amenities
          </h2>
          <p className="text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Our properties feature these exclusive amenities for the ultimate
            luxury experience
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-6">
            {featuredAmenities.map((amenity, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-blue-50 group"
              >
                <div className="text-blue-600 mb-3 flex justify-center group-hover:scale-110 transition-transform">
                  {amenity.icon}
                </div>
                <span className="text-gray-700 font-semibold text-center block">
                  {amenity.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Property Listings with Enhanced UI */}
        <section id="curated-collection" className="mb-24">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Curated Collections
          </h2>
          <p className="text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Handpicked properties that define luxury living in the world&apos;s
            most beautiful locations
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.slice(0, 3).map((property, index) => (
              <div
                key={property._id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                {property.bankDetails && delete property.bankDetails}
                <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>4.98</span>
                </div>
                <div className="absolute top-4 left-4 z-10 bg-blue-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-white">
                  Featured
                </div>
                <div className="h-72 overflow-hidden">
                  <img
                    src={
                      property.photos?.[0]?.url || "/placeholder-property.jpg"
                    }
                    alt={property.title}
                    className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-center space-x-2 text-xs text-blue-600 font-semibold mb-2">
                    <Award className="h-4 w-4" />
                    <span>VERIFIED LUXURY</span>
                  </div>

                  <h2 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                    {property.title}
                  </h2>
                  <div className="flex items-center space-x-2 text-gray-600 mb-4">
                    <MapPin className="h-5 w-5" />
                    <span>
                      {property.location.city}, {property.location.country}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Bed className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700">
                        {property.bedrooms} Bedrooms
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bath className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700">
                        {property.bathrooms} Bathrooms
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t pt-4">
                    <span className="text-lg font-bold text-blue-600">
                      ${property.pricePerNight}
                      <span className="text-sm font-normal text-gray-600">
                        /night
                      </span>
                    </span>
                    <Link
                      to={`/properties/${property._id}`}
                      className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
                    >
                      <Heart className="h-4 w-4" />
                      <span>View Details</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/properties"
              className="inline-flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-800 transition-colors group"
            >
              <span>View All Properties</span>
              <span className="group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </Link>
          </div>
        </section>

        {/* Premium Services Section */}
        <section className="mb-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-blue-400 rounded-full filter blur-[50px] opacity-20"></div>
          <div className="absolute right-16 top-16 w-16 h-16 bg-purple-400 rounded-full filter blur-[40px] opacity-20"></div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center relative z-10">
            Premium Services
          </h2>
          <p className="text-gray-600 mb-12 text-center max-w-3xl mx-auto relative z-10">
            Elevate your stay with our exclusive services available at select
            properties
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {premiumServices.map((service, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all group"
              >
                <div className="bg-blue-100 rounded-xl p-3 inline-flex mb-4 text-blue-600 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials with Enhanced Design */}
        <section id="guest-experiences" className="mb-24">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Guest Experiences
          </h2>
          <p className="text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Hear what our guests have to say about their unforgettable stays
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all relative group"
              >
                <div className="absolute -top-6 -right-6 text-8xl font-serif text-blue-200 opacity-70 select-none">
                  &quot;
                </div>
                <div className="flex items-center space-x-4 mb-6 relative z-10">
                  <img
                    src={testimonial.photo}
                    alt={testimonial.name}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-100 p-1"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic relative z-10">
                  {testimonial.text}
                </p>
                <div className="mt-4 flex space-x-1 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Host Benefits with Grid Layout */}
        <section className="mb-24 relative">
          <div className="absolute -left-40 top-1/3 w-80 h-80 bg-purple-400 rounded-full filter blur-[120px] opacity-5"></div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Become an Estia Guest
          </h2>
          <p className="text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Visit our luxury properties and enjoy your time
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {hostBenefits.slice(0, 4).map((benefit, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all group"
              >
                <div className="text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {hostBenefits.slice(4).map((benefit, index) => (
              <div
                key={index + 4}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all group"
              >
                <div className="text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={handleBookingClick}
              className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full overflow-hidden shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="relative z-10 flex items-center">
                <span>Start Booking Today</span>
                <svg
                  className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
              <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all duration-300"></div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
