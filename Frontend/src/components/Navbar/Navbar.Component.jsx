import { BiChevronDown, BiMenu, BiSearch, BiX } from "react-icons/bi";
import { FaMapMarkerAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import CustomModal from "../Modal/Modal.Component";
import CitySelectorModal from "../Modal/CitySelectorModal.Component";
import FeedbackModal from "../Modal/FeedbackModal";
import { normalizeCityName, setStoredCity } from "../../services/cityData";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

function SearchBox({ className = "" }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const submitSearch = (event) => {
    event.preventDefault();
    const searchTerm = query.trim();
    if (!searchTerm) return;
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    setQuery("");
  };

  return (
    <form noValidate onSubmit={submitSearch} className={`flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 ${className}`}>
      <BiSearch className="shrink-0" />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search movies"
        aria-label="Search movies"
        className="w-full bg-transparent text-sm outline-none"
      />
      <button type="submit" className="sr-only">Search</button>
    </form>
  );
}

function LocationDisplay({ location, isLoading, onOpenCityModal, onRetry, className = "" }) {
  return (
    <div className={`flex items-center ${className}`}>
      {isLoading ? (
        <span aria-live="polite" className="text-xs text-gray-500 animate-pulse">Detecting...</span>
      ) : (
        <button
          type="button"
          onClick={onOpenCityModal}
          className="group inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-gray-700 hover:bg-gray-100 hover:text-red-600 transition"
          title="Click to select or change city"
        >
          <FaMapMarkerAlt className="text-red-600 text-xs shrink-0" />
          <span className="truncate max-w-[130px] sm:max-w-[180px] font-medium text-xs sm:text-sm">
            {location || "Select City"}
          </span>
          <BiChevronDown className="text-gray-400 group-hover:text-red-600 text-base shrink-0" />
        </button>
      )}
    </div>
  );
}

function NavSm({ location, isLoading, onOpenCityModal, onRetry }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  return (
    <>
      <div className="flex items-center justify-between text-gray-900">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Go to homepage" className="shrink-0 flex items-center">
            <img src="/bookmyevent-logo.png" alt="BookMyEvent" className="h-8 w-auto max-w-[130px] object-contain" />
          </Link>
          <LocationDisplay location={location} isLoading={isLoading} onOpenCityModal={onOpenCityModal} onRetry={onRetry} className="text-xs text-gray-600" />
        </div>
        <div className="flex items-center gap-3">
          <CustomModal />
          <button
            type="button"
            onClick={() => setIsSearchOpen((current) => !current)}
            aria-label={isSearchOpen ? "Close search" : "Search movies"}
            className="text-gray-700"
          >
            <BiSearch className="h-6 w-6" />
          </button>
        </div>
      </div>
      {isSearchOpen && <SearchBox className="mt-3 w-full" />}
    </>
  );
}

function NavMd({ location, isLoading, onOpenCityModal, onRetry }) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link to="/" aria-label="Go to homepage" className="shrink-0 flex items-center">
          <img src="/bookmyevent-logo.png" alt="BookMyEvent" className="h-9 w-auto max-w-[150px] object-contain" />
        </Link>
        <SearchBox className="min-w-0 flex-1" />
        <LocationDisplay location={location} isLoading={isLoading} onOpenCityModal={onOpenCityModal} onRetry={onRetry} className="shrink-0 text-gray-700 text-sm" />
        <CustomModal />
      </div>
    </>
  );
}

function NavLg({ location, isLoading, onOpenCityModal, onRetry, onOpenFeedback }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-4">
        <div className="flex items-center w-1/2 gap-3">
          <Link to="/" aria-label="Go to homepage" className="h-10 shrink-0 flex items-center">
            <img
              src="/bookmyevent-logo.png"
              alt="BookMyEvent"
              className="h-10 w-auto max-w-[170px] object-contain"
            />
          </Link>
          <SearchBox className="w-full" />
        </div>
        <div className="flex items-center gap-3">
          <LocationDisplay location={location} isLoading={isLoading} onOpenCityModal={onOpenCityModal} onRetry={onRetry} className="max-w-48 truncate text-gray-700 text-sm" />

          <CustomModal />

          {/* Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              className="h-8 w-8 text-gray-800 hover:text-red-600 transition flex items-center justify-center"
            >
              {isMenuOpen ? (
                <BiX className="w-full h-full" />
              ) : (
                <BiMenu className="w-full h-full" />
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg z-50 w-48 border border-gray-100 py-1">
                <Link to="/about" onClick={() => setIsMenuOpen(false)} className="block w-full px-4 py-2 text-sm text-gray-800 transition hover:bg-gray-100">
                  About
                </Link>
                <Link to="/help" onClick={() => setIsMenuOpen(false)} className="block w-full px-4 py-2 text-sm text-gray-800 transition hover:bg-gray-100">
                  Help
                </Link>
                <Link to="/settings" onClick={() => setIsMenuOpen(false)} className="block w-full px-4 py-2 text-sm text-gray-800 transition hover:bg-gray-100">
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onOpenFeedback) onOpenFeedback();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-800 transition hover:bg-gray-100"
                >
                  Feedback
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Main NavBar Component
const Navbar = () => {
  const [location, setLocation] = useState(
    () => localStorage.getItem("preferredLocation") || ""
  );
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const initialRequestStarted = useRef(false);

  const handleCitySelect = (newCity) => {
    setLocation(newCity);
    setStoredCity(newCity);
  };

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation("");
      setIsLocationLoading(false);
      return;
    }

    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
            params: {
              format: "jsonv2",
              lat: coords.latitude,
              lon: coords.longitude,
              zoom: 14,
              addressdetails: 1,
            },
          });
          const address = response.data.address || {};
          const area = address.suburb || address.neighbourhood || address.city_district;
          const city = address.city || address.town || address.village || address.municipality || address.state_district;
          const formattedLocation = [area, city].filter((part, index, parts) => part && parts.indexOf(part) === index).join(", ");

          setLocation(formattedLocation);
        } catch (error) {
          console.error("Could not determine the current city and area:", error);
          setLocation("");
        } finally {
          setIsLocationLoading(false);
        }
      },
      (error) => {
        console.error("Error getting user location:", error);
        setLocation("");
        setIsLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (initialRequestStarted.current) return;
    initialRequestStarted.current = true;
    if (localStorage.getItem("preferredLocation")) {
      setIsLocationLoading(false);
      return;
    }
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    const handleLocationChange = (event) => {
      setLocation(event.detail || "");
      setIsLocationLoading(false);
    };
    window.addEventListener("bookmyevent:location-changed", handleLocationChange);
    return () => window.removeEventListener("bookmyevent:location-changed", handleLocationChange);
  }, []);

  return (
    <>
      <nav className="border-b border-gray-200 bg-white px-4 py-3">
        {/* Mobile Screen Navbar */}
        <div className="md:hidden">
          <NavSm
            location={location}
            isLoading={isLocationLoading}
            onOpenCityModal={() => setIsCityModalOpen(true)}
            onRetry={requestLocation}
          />
        </div>
        {/* Medium Screen Size */}
        <div className="hidden md:flex lg:hidden">
          <NavMd
            location={location}
            isLoading={isLocationLoading}
            onOpenCityModal={() => setIsCityModalOpen(true)}
            onRetry={requestLocation}
          />
        </div>
        {/* Large Screen Size */}
        <div className="hidden md:hidden lg:flex">
          <NavLg
            location={location}
            isLoading={isLocationLoading}
            onOpenCityModal={() => setIsCityModalOpen(true)}
            onOpenFeedback={() => setIsFeedbackModalOpen(true)}
            onRetry={requestLocation}
          />
        </div>
      </nav>
      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        selectedCity={normalizeCityName(location)}
        onSelectCity={handleCitySelect}
      />
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
