import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { BiSearch, BiTargetLock, BiX, BiCheck } from "react-icons/bi";
import { FaCity } from "react-icons/fa";
import {
  allCities,
  popularCities,
  setStoredCity,
  normalizeCityName,
} from "../../services/cityData";

const CitySelectorModal = ({ isOpen, onClose, selectedCity, onSelectCity }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const filteredCities = allCities.filter((city) =>
    city.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSelect = (city) => {
    setStoredCity(city);
    if (onSelectCity) {
      onSelectCity(city);
    }
    setSearchQuery("");
    setLocationError("");
    onClose();
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=14&addressdetails=1`
          );
          if (!response.ok) {
            throw new Error("Failed to detect location coordinates.");
          }
          const data = await response.json();
          const address = data.address || {};
          const cityCandidate =
            address.city ||
            address.town ||
            address.state_district ||
            address.suburb ||
            address.state ||
            "";
          const detectedCity = normalizeCityName(cityCandidate);
          handleSelect(detectedCity);
        } catch (err) {
          console.error("Auto detect location failed:", err);
          setLocationError("Could not detect city automatically. Please select from the list below.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Please pick a city manually."
            : "Could not fetch current location. Please pick a city manually."
        );
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600">
                      <FaCity className="text-base" />
                    </div>
                    <Dialog.Title className="text-lg font-bold text-gray-900">
                      Select Your City
                    </Dialog.Title>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    aria-label="Close"
                  >
                    <BiX className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6">
                  {/* Search bar & Detect Button */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for your city (e.g. Ahmedabad, Mumbai...)"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100/70 disabled:opacity-60"
                    >
                      <BiTargetLock className={`text-lg ${isLocating ? "animate-spin" : ""}`} />
                      <span>{isLocating ? "Detecting..." : "Auto Detect"}</span>
                    </button>
                  </div>

                  {locationError && (
                    <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg p-2.5 border border-red-100">
                      {locationError}
                    </p>
                  )}

                  {/* Popular Cities */}
                  {!searchQuery && (
                    <div className="mt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Popular Cities
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {popularCities.map((city) => {
                          const isSelected = selectedCity === city;
                          return (
                            <button
                              key={city}
                              type="button"
                              onClick={() => handleSelect(city)}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                                isSelected
                                  ? "border-red-600 bg-red-50/80 text-red-700 font-bold shadow-xs"
                                  : "border-gray-200 bg-white hover:border-red-300 hover:bg-gray-50 text-gray-800 font-medium"
                              }`}
                            >
                              <span className="text-sm truncate w-full">{city}</span>
                              {isSelected && (
                                <span className="mt-1 flex items-center gap-1 text-[11px] text-red-600 font-semibold">
                                  <BiCheck className="text-base -ml-1" /> Selected
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Search Results / All Cities List */}
                  <div className="mt-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                      {searchQuery ? `Search Results (${filteredCities.length})` : "All Cities"}
                    </h4>

                    {filteredCities.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-500">
                        No cinemas found for &quot;{searchQuery}&quot;. Try Ahmedabad, Mumbai, Delhi-NCR, Bengaluru, etc.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                        {filteredCities.map((city) => {
                          const isSelected = selectedCity === city;
                          return (
                            <button
                              key={city}
                              type="button"
                              onClick={() => handleSelect(city)}
                              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-left transition ${
                                isSelected
                                  ? "bg-red-50 text-red-700 font-bold border border-red-200"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <span className="truncate">{city}</span>
                              {isSelected && <BiCheck className="text-red-600 text-lg shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-3 text-right">
                  <span className="text-xs text-gray-500">
                    Theatres and showtimes will update automatically for your selected city.
                  </span>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CitySelectorModal;
