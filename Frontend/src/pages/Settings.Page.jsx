import React, { useState } from "react";
import DefaultlayoutHoc from "../layout/Default.layout";

const SettingsPage = () => {
  const [location, setLocation] = useState(
    () => localStorage.getItem("preferredLocation") || ""
  );
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const updateLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Location is not available in this browser.");
      return;
    }

    setIsLoading(true);
    setStatus("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const params = new URLSearchParams({
            format: "jsonv2",
            lat: String(coords.latitude),
            lon: String(coords.longitude),
            zoom: "14",
            addressdetails: "1",
          });
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
          if (!response.ok) {
            throw new Error(`Location lookup failed (${response.status}).`);
          }
          const data = await response.json();
          const address = data.address || {};
          const area = address.suburb || address.neighbourhood || address.city_district;
          const city = address.city || address.town || address.village || address.municipality || address.state_district;
          const formattedLocation = [area, city]
            .filter((part, index, parts) => part && parts.indexOf(part) === index)
            .join(", ");
          if (!formattedLocation) {
            throw new Error("Could not determine your city from your current location.");
          }
          localStorage.setItem("preferredLocation", formattedLocation);
          setLocation(formattedLocation);
          window.dispatchEvent(
            new CustomEvent("bookmyevent:location-changed", { detail: formattedLocation })
          );
          setStatus("Location preference saved.");
        } catch (error) {
          setStatus(error.message || "Could not update location.");
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setStatus(
          error.code === error.PERMISSION_DENIED
            ? "Location access was denied. Allow it in your browser settings and try again."
            : "Could not get your location. Please try again."
        );
        setIsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <main className="container mx-auto min-h-[60vh] max-w-4xl px-4 py-12 md:px-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Preferences</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">Settings</h1>
      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900">Location</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Use your device location to set the location preference for your account on this browser.
        </p>
        {location && <p className="mt-3 text-sm font-medium text-gray-800">Current preference: {location}</p>}
        {status && <p role="status" className="mt-3 text-sm text-gray-600">{status}</p>}
        <button
          type="button"
          onClick={updateLocation}
          disabled={isLoading}
          className="mt-5 rounded bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isLoading ? "Updating location..." : "Use my current location"}
        </button>
      </section>
    </main>
  );
};

export default DefaultlayoutHoc(SettingsPage);
