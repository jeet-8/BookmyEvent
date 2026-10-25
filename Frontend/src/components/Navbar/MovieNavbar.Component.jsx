import React, { useEffect, useState } from "react";
import { BiChevronDown, BiMenu, BiSearch } from "react-icons/bi";
import { FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import CitySelectorModal from "../Modal/CitySelectorModal.Component";
import { getStoredCity, normalizeCityName, setStoredCity } from "../../services/cityData";

function NavSm({ location, onOpenCityModal }) {
  return (
    <div className="text-white flex items-center justify-between">
      <div>
        <h3 className="text-xl font-bold">It All Starts Here!</h3>
        <button
          type="button"
          onClick={onOpenCityModal}
          className="text-gray-300 text-xs flex items-center gap-1 cursor-pointer hover:text-white transition"
        >
          <FaMapMarkerAlt className="text-red-500 text-[11px]" />
          <span>{location || "Select City"}</span>
          <BiChevronDown />
        </button>
      </div>
      <div className="w-8 h-8 flex items-center justify-center">
        <BiSearch className="w-6 h-6" />
      </div>
    </div>
  );
}

function NavMd() {
  return (
    <div className="w-full flex items-center gap-3 bg-white px-3 py-1 rounded-md">
      <BiSearch className="text-gray-500" />
      <input
        type="search"
        placeholder="Search for movies, events, plays, sports and activities"
        className="w-full bg-transparent border-none focus:outline-none text-sm"
      />
    </div>
  );
}

function NavLg({ location, onOpenCityModal }) {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  return (
    <div className="container flex mx-auto px-4 items-center justify-between">
      <div className="flex items-center w-1/2 gap-3">
        <Link to="/" className="h-9 shrink-0 flex items-center">
          <img
            src="/bookmyevent-logo-white.png"
            alt="BookMyEvent"
            className="h-8 md:h-9 w-auto max-w-[150px] object-contain"
          />
        </Link>
        <div className="w-full flex items-center gap-3 bg-white px-3 py-1.5 rounded-md">
          <BiSearch className="text-gray-500" />
          <input
            type="search"
            className="w-full bg-transparent border-none focus:outline-none text-sm"
            placeholder="Search for movies, events, plays, sports and activities"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenCityModal}
          className="text-gray-200 text-sm flex items-center gap-1 cursor-pointer hover:text-white transition"
        >
          <FaMapMarkerAlt className="text-red-500 text-xs" />
          <span>{location || "Select City"}</span>
          <BiChevronDown className="text-base" />
        </button>
        <button className="bg-red-600 text-white px-3 py-1.5 text-sm rounded font-medium hover:bg-red-700 transition">
          {user?.given_name ? `Hi, ${user.given_name}` : "Sign In"}
        </button>
        <div className="w-8 h-8 text-white flex items-center justify-center">
          <BiMenu className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

const MovieNavbar = () => {
  const [location, setLocation] = useState(() => getStoredCity());
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  const handleCitySelect = (newCity) => {
    setLocation(newCity);
    setStoredCity(newCity);
  };

  useEffect(() => {
    const handleLocationChange = (event) => {
      if (event.detail) {
        setLocation(event.detail);
      }
    };
    window.addEventListener("bookmyevent:location-changed", handleLocationChange);
    return () => window.removeEventListener("bookmyevent:location-changed", handleLocationChange);
  }, []);

  return (
    <>
      <nav className="bg-darkBackground-700 px-4 py-3">
        {/* Mobile Screen Navbar */}
        <div className="md:hidden">
          <NavSm location={location} onOpenCityModal={() => setIsCityModalOpen(true)} />
        </div>
        {/* Medium Screen Size */}
        <div className="hidden md:flex lg:hidden">
          <NavMd />
        </div>
        {/* Large Screen Size */}
        <div className="hidden md:hidden lg:flex">
          <NavLg location={location} onOpenCityModal={() => setIsCityModalOpen(true)} />
        </div>
      </nav>
      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        selectedCity={normalizeCityName(location)}
        onSelectCity={handleCitySelect}
      />
    </>
  );
};

export default MovieNavbar;
