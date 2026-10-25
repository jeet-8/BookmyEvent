export const cityCinemas = {
  Ahmedabad: [
    { name: "Cinepolis Alpha One", area: "Vastrapur", formats: "Dolby Atmos", latitude: 23.039, longitude: 72.531 },
    { name: "PVR Acropolis", area: "Thaltej", formats: "IMAX · 4K Laser", latitude: 23.0395, longitude: 72.5093 },
    { name: "PVR Arved Transcube", area: "Ranip", formats: "Premium Large Screen", latitude: 23.0704, longitude: 72.5795 },
    { name: "INOX Himalaya Mall", area: "Drive-In Road", formats: "Dolby 7.1 · 4K", latitude: 23.0538, longitude: 72.5325 },
    { name: "Wide Angle Cinemas", area: "S.G. Highway", formats: "Dolby Atmos", latitude: 23.0238, longitude: 72.5074 },
  ],
  Mumbai: [
    { name: "PVR ICON Phoenix", area: "Lower Parel", formats: "IMAX · 4K Laser", latitude: 18.9948, longitude: 72.8258 },
    { name: "INOX Nariman Point", area: "Marine Drive", formats: "Dolby Atmos", latitude: 18.9256, longitude: 72.8242 },
    { name: "Cinepolis Andheri", area: "Andheri West", formats: "Premium Large Screen", latitude: 19.1365, longitude: 72.8296 },
    { name: "PVR Dynamix Mall", area: "Juhu", formats: "4K Laser · Dolby Atmos", latitude: 19.1075, longitude: 72.8263 },
  ],
  "Delhi-NCR": [
    { name: "PVR Select Citywalk", area: "Saket", formats: "IMAX · 4K Laser", latitude: 28.5285, longitude: 77.2197 },
    { name: "INOX Nehru Place", area: "Nehru Place", formats: "Dolby Atmos", latitude: 28.5494, longitude: 77.2519 },
    { name: "Cinepolis Janak Place", area: "Janakpuri", formats: "Premium Large Screen", latitude: 28.6219, longitude: 77.0878 },
    { name: "PVR Logix City Centre", area: "Noida Sector 32", formats: "IMAX · 4DX", latitude: 28.5744, longitude: 77.3539 },
  ],
  Bengaluru: [
    { name: "PVR Orion Mall", area: "Rajajinagar", formats: "IMAX · 4K Laser", latitude: 13.0108, longitude: 77.555 },
    { name: "INOX Garuda Mall", area: "Magrath Road", formats: "Dolby Atmos", latitude: 12.9716, longitude: 77.601 },
    { name: "Cinepolis Forum Mall", area: "Koramangala", formats: "Premium Large Screen", latitude: 12.9345, longitude: 77.6113 },
    { name: "PVR Vega City", area: "Bannerghatta Road", formats: "IMAX 3D", latitude: 12.9081, longitude: 77.6012 },
  ],
  Hyderabad: [
    { name: "PVR Next Galleria", area: "Panjagutta", formats: "IMAX · 4K Laser", latitude: 17.4255, longitude: 78.4513 },
    { name: "INOX GVK One", area: "Banjara Hills", formats: "Dolby Atmos", latitude: 17.4156, longitude: 78.4482 },
    { name: "Cinepolis Manjeera", area: "Kukatpally", formats: "Premium Large Screen", latitude: 17.4926, longitude: 78.3997 },
    { name: "Prasads Multiplex", area: "Necklace Road", formats: "Large Screen · Dolby", latitude: 17.4124, longitude: 78.4682 },
  ],
  Chennai: [
    { name: "PVR Grand Galada", area: "Pallavaram", formats: "IMAX · 4K Laser", latitude: 12.9817, longitude: 80.165 },
    { name: "INOX Chennai Citi Centre", area: "Mylapore", formats: "Dolby Atmos", latitude: 13.0339, longitude: 80.2691 },
    { name: "Cinepolis BSR Mall", area: "Thoraipakkam", formats: "Premium Large Screen", latitude: 12.9363, longitude: 80.2368 },
    { name: "SPI Sathyam Cinemas", area: "Royapettah", formats: "Dolby Atmos", latitude: 13.0569, longitude: 80.2573 },
  ],
  Pune: [
    { name: "PVR Phoenix Marketcity", area: "Viman Nagar", formats: "IMAX · 4K Laser", latitude: 18.562, longitude: 73.9167 },
    { name: "Cinepolis Seasons Mall", area: "Magarpatta", formats: "Dolby Atmos", latitude: 18.5196, longitude: 73.9312 },
    { name: "INOX Bund Garden", area: "Sangam Courtyard", formats: "Premium Large Screen", latitude: 18.5308, longitude: 73.8774 },
  ],
  Kolkata: [
    { name: "PVR Mani Square", area: "EM Bypass", formats: "IMAX · 4K Laser", latitude: 22.5804, longitude: 88.3986 },
    { name: "INOX South City", area: "Jadavpur", formats: "Dolby Atmos", latitude: 22.4996, longitude: 88.3629 },
    { name: "Cinepolis Acropolis Mall", area: "Kasba", formats: "Premium Large Screen", latitude: 22.5146, longitude: 88.3927 },
  ],
  Chandigarh: [
    { name: "PVR Elante Mall", area: "Industrial Area Phase 1", formats: "IMAX · 4K Laser", latitude: 30.7055, longitude: 76.8013 },
    { name: "Cinepolis Jagat Mall", area: "Sector 17", formats: "Dolby Atmos", latitude: 30.7398, longitude: 76.7827 },
  ],
  Jaipur: [
    { name: "INOX GT Central", area: "Malviya Nagar", formats: "Dolby Atmos", latitude: 26.8524, longitude: 75.8055 },
    { name: "Cinepolis World Trade Park", area: "JLN Marg", formats: "Premium Large Screen", latitude: 26.8538, longitude: 75.805 },
  ],
};

export const popularCities = [
  "Ahmedabad",
  "Mumbai",
  "Delhi-NCR",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Chandigarh",
  "Jaipur",
];

export const allCities = Object.keys(cityCinemas);

export const distanceInKm = (origin, destination) => {
  if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
    return null;
  }
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(destination.latitude - origin.latitude);
  const longitudeDelta = radians(destination.longitude - origin.longitude);
  const distance =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(origin.latitude)) *
      Math.cos(radians(destination.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(distance), Math.sqrt(1 - distance));
};

const areaToCityKeywords = {
  Ahmedabad: ["ahmedabad", "sarkhej", "jodhpur", "vastrapur", "thaltej", "ranip", "bopal", "navrangpura", "prahlad"],
  Mumbai: ["mumbai", "bombay", "andheri", "bandra", "parel", "juhu", "borivali", "thane", "navi mumbai", "dadar"],
  "Delhi-NCR": ["delhi", "new delhi", "noida", "gurgaon", "gurugram", "saket", "janakpuri", "faridabad", "ghaziabad"],
  Bengaluru: ["bengaluru", "bangalore", "koramangala", "indiranagar", "whitefield", "rajajinagar", "marathahalli"],
  Hyderabad: ["hyderabad", "secunderabad", "hitec", "gachibowli", "kukatpally", "panjagutta", "banjara"],
  Chennai: ["chennai", "madras", "mylapore", "pallavaram", "thoraipakkam", "velachery", "t nagar", "adyar"],
  Pune: ["pune", "viman nagar", "magarpatta", "kothrud", "wakad", "hinjewadi", "shivajinagar"],
  Kolkata: ["kolkata", "calcutta", "howrah", "salt lake", "jadavpur", "kasba", "new town"],
  Chandigarh: ["chandigarh", "mohali", "panchkula"],
  Jaipur: ["jaipur", "malviya nagar", "vaishali", "mansarovar"],
};

export const normalizeCityName = (rawString) => {
  if (!rawString || typeof rawString !== "string") return "Ahmedabad";
  const cleaned = rawString.toLowerCase().trim();

  // 1. Direct match with supported cities
  for (const city of allCities) {
    if (cleaned === city.toLowerCase()) return city;
    if (city === "Delhi-NCR" && (cleaned === "delhi" || cleaned === "ncr")) return "Delhi-NCR";
  }

  // 2. Keyword/area mapping check
  for (const [cityName, keywords] of Object.entries(areaToCityKeywords)) {
    if (keywords.some((keyword) => cleaned.includes(keyword))) {
      return cityName;
    }
  }

  // 3. Fallback check for partial name in string
  for (const city of allCities) {
    if (cleaned.includes(city.toLowerCase())) return city;
  }

  return "Ahmedabad";
};

export const getStoredCity = () => {
  try {
    const raw = localStorage.getItem("preferredLocation");
    if (raw) return normalizeCityName(raw);
  } catch {
    // Ignore storage errors
  }
  return "Ahmedabad";
};

export const setStoredCity = (city) => {
  try {
    localStorage.setItem("preferredLocation", city);
    window.dispatchEvent(
      new CustomEvent("bookmyevent:location-changed", { detail: city })
    );
  } catch (error) {
    console.error("Failed to store city preference:", error);
  }
};
