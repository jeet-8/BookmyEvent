import React, { Fragment, useCallback, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaDownload,
  FaMapMarkerAlt,
  FaQrcode,
  FaTag,
  FaTimes,
} from "react-icons/fa";
import { BiChevronDown, BiTargetLock } from "react-icons/bi";
import { QRCodeSVG } from "qrcode.react";
import {
  createBooking,
  applyCouponApi,
  getBookedSeatsApi,
  getTicketPdfUrl,
} from "../../services/bookingApi";
import {
  cityCinemas,
  popularCities,
  distanceInKm,
  getStoredCity,
  setStoredCity,
} from "../../services/cityData";
import CitySelectorModal from "../Modal/CitySelectorModal.Component";

const showTimes = ["10:30 AM", "01:45 PM", "04:30 PM", "07:15 PM", "10:10 PM"];
const seatRows = ["A", "B", "C", "D", "E"];
const initialBookedSeats = new Set(["A3", "A4", "B7", "C2", "C3", "D8", "E5"]);
const rowPrices = { A: 180, B: 180, C: 220, D: 220, E: 260 };

const makeShowDates = () =>
  Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      value: date.toISOString().slice(0, 10),
      day:
        index === 0
          ? "Today"
          : index === 1
          ? "Tomorrow"
          : date.toLocaleDateString("en-IN", { weekday: "short" }),
      date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    };
  });

export const BookTicketModal = ({ isOpen, onClose, movie }) => {
  const dates = makeShowDates();
  const [city, setCity] = useState(() => getStoredCity());
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dates[0].value);
  const [cinema, setCinema] = useState(null);
  const [showTime, setShowTime] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [dbBookedSeats, setDbBookedSeats] = useState([]);
  const [step, setStep] = useState("shows"); // "shows" | "seats" | "payment" | "qr_payment" | "confirmation"
  const [bookingId, setBookingId] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestTheatre, setNearestTheatre] = useState(null);
  const [locationStatus, setLocationStatus] = useState("");

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount, finalAmount, message }
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // QR Payment countdown timer (5 minutes)
  const [qrTimeLeft, setQrTimeLeft] = useState(300);

  // Pricing calculations
  const ticketTotal = selectedSeats.reduce(
    (total, seat) => total + (rowPrices[seat[0]] || 200),
    0
  );
  const convenienceFee = selectedSeats.length > 0 ? selectedSeats.length * 25 : 0;
  const subtotal = ticketTotal + convenienceFee;
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const finalPayableAmount = Math.max(0, subtotal - discountAmount);

  // Fetch real-time booked seats from MongoDB for the selected show
  const fetchShowBookedSeats = useCallback(async () => {
    if (!movie?.title || !cinema?.name || !selectedDate || !showTime) return;
    try {
      const data = await getBookedSeatsApi({
        movieTitle: movie.title,
        showDate: selectedDate,
        showTime,
        cinemaName: cinema.name,
      });
      if (Array.isArray(data?.bookedSeats)) {
        setDbBookedSeats(data.bookedSeats);
      }
    } catch (err) {
      console.warn("Could not fetch real-time booked seats:", err);
    }
  }, [movie?.title, cinema?.name, selectedDate, showTime]);

  useEffect(() => {
    if (step === "seats" && cinema && showTime) {
      fetchShowBookedSeats();
    }
  }, [step, cinema, showTime, fetchShowBookedSeats]);

  // QR timer countdown
  useEffect(() => {
    if (step !== "qr_payment") return;
    setQrTimeLeft(300);
    const interval = setInterval(() => {
      setQrTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleCitySelect = (newCity) => {
    setCity(newCity);
    setStoredCity(newCity);
    setCinema(null);
    setShowTime("");
    setSelectedSeats([]);
    setLocationStatus("");
  };

  const chooseShow = (selectedCinema, time) => {
    setCinema(selectedCinema);
    setShowTime(time);
    setSelectedSeats([]);
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError("");
    setBookingError("");
    setStep("seats");
  };

  const toggleSeat = (seat) => {
    const isTaken = initialBookedSeats.has(seat) || dbBookedSeats.includes(seat);
    if (isTaken) return;
    setSelectedSeats((current) =>
      current.includes(seat)
        ? current.filter((selected) => selected !== seat)
        : current.length < 8
        ? [...current, seat]
        : current
    );
  };

  // Check if current user is logged in
  const isUserAuthenticated = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return Boolean(user && user.token);
    } catch {
      return false;
    }
  };

  // Continue to Checkout with Authentication Check
  const handleContinueToCheckout = () => {
    setBookingError("");

    if (!selectedSeats.length) return;

    // Check if user is authenticated
    if (!isUserAuthenticated()) {
      setBookingError(
        "Please sign in to proceed to checkout. Your selected seats are saved!"
      );
      // Trigger/open the Auth/Login Modal
      window.dispatchEvent(new CustomEvent("bookmyevent:open-auth"));
      return;
    }

    // Proceed directly to the UPI payment modal as normal
    setStep("payment");
  };

  // Advance automatically if user signs in while waiting on seat selection
  useEffect(() => {
    const handleUserSignedIn = () => {
      setBookingError("");
      if (step === "seats" && selectedSeats.length > 0) {
        setStep("payment");
      }
    };

    window.addEventListener("bookmyevent:user-signed-in", handleUserSignedIn);
    return () => window.removeEventListener("bookmyevent:user-signed-in", handleUserSignedIn);
  }, [step, selectedSeats.length]);

  // Apply Coupon Handler
  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    setCouponError("");
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const result = await applyCouponApi({
        code,
        totalAmount: subtotal,
      });

      if (result.valid) {
        setAppliedCoupon({
          code: result.code,
          discountAmount: result.discountAmount,
          finalAmount: result.finalAmount,
          message: result.message,
        });
        setCouponCodeInput("");
      } else {
        setCouponError(result.message || "Invalid coupon code.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Invalid coupon code or does not meet criteria.";
      setCouponError(msg);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    setCouponCodeInput("");
  };

  // Confirm booking & seat lock request
  const confirmBooking = async () => {
    setBookingError("");
    let user;
    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      setBookingError("Your sign-in session is invalid. Please sign in again.");
      return;
    }
    if (!user?.token) {
      setBookingError("Please sign in to BookMyEvent before booking tickets.");
      return;
    }

    setIsCreatingBooking(true);
    try {
      const result = await createBooking({
        movieTitle: movie.title || "Movie",
        seats: selectedSeats.length,
        seatNumbers: selectedSeats,
        showDate: selectedDate,
        showTime,
        cinema: {
          name: cinema?.name || "Cinema Partner",
          area: cinema?.area || "",
          city: city || "Ahmedabad",
        },
        totalPrice: finalPayableAmount,
        couponCode: appliedCoupon?.code || null,
        paymentMethod: "UPI_QR",
        token: user.token,
      });

      setBookingId(result.booking?._id || result.booking?.id || "");
      setStep("confirmation");
    } catch (error) {
      console.error("Booking error:", error);
      if (error.response?.status === 409) {
        // Seat Conflict Error
        setBookingError(
          error.response?.data?.message ||
            "One or more selected seats were just booked by someone else! Please choose different seats."
        );
        // Refresh taken seats and return to seat map
        await fetchShowBookedSeats();
        setStep("seats");
      } else {
        setBookingError(
          error.response?.data?.message ||
            "Could not complete your booking. Please try again."
        );
      }
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const findNearbyTheatre = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not available in this browser.");
      return;
    }

    setLocationStatus("Checking your location...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { latitude: coords.latitude, longitude: coords.longitude };
        const closest = Object.entries(cityCinemas)
          .flatMap(([cityName, venues]) =>
            venues.map((venue) => ({
              ...venue,
              city: cityName,
              distance: distanceInKm(location, venue),
            }))
          )
          .sort(
            (first, second) =>
              (first.distance ?? Infinity) - (second.distance ?? Infinity)
          )[0];

        setUserLocation(location);
        setNearestTheatre(closest);
        if (!localStorage.getItem("preferredLocation") && closest?.city) {
          setCity(closest.city);
        }
        setLocationStatus("");
      },
      (error) => {
        setLocationStatus(
          error.code === error.PERMISSION_DENIED
            ? "Location access is blocked. Allow Location in site settings, or pick a city below."
            : "Could not get your location. Please pick a city below."
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setStep("shows");
    setCinema(null);
    setShowTime("");
    setSelectedSeats([]);
    setBookingId("");
    setBookingError("");
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError("");
    setLocationStatus("");

    const stored = getStoredCity();
    if (stored) {
      setCity(stored);
    }

    if (!userLocation) {
      findNearbyTheatre();
    }
  }, [findNearbyTheatre, isOpen, userLocation]);

  useEffect(() => {
    const handleLocationChange = (event) => {
      if (event.detail) {
        setCity(event.detail);
        setCinema(null);
        setShowTime("");
        setSelectedSeats([]);
      }
    };
    window.addEventListener("bookmyevent:location-changed", handleLocationChange);
    return () =>
      window.removeEventListener("bookmyevent:location-changed", handleLocationChange);
  }, []);

  const nearbyTheatres = (cityCinemas[city] || [])
    .map((venue) => ({
      ...venue,
      distance: userLocation ? distanceInKm(userLocation, venue) : null,
    }))
    .sort((first, second) => {
      if (first.distance !== null && second.distance !== null) {
        return first.distance - second.distance;
      }
      return 0;
    });

  const chosenDate = dates.find((date) => date.value === selectedDate);

  // Dynamic UPI URI string
  const upiUri = `upi://pay?pa=bookmyevent@upi&pn=BookMyEvent&am=${finalPayableAmount}&cu=INR&tn=Ticket_${
    movie?.title ? movie.title.replace(/\s+/g, "_") : "Booking"
  }`;

  return (
    <>
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
            <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-2 sm:p-5">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between bg-[#1f253a] px-4 py-3.5 text-white sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      {step !== "shows" && step !== "confirmation" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (step === "qr_payment") setStep("payment");
                            else if (step === "payment") setStep("seats");
                            else if (step === "seats") setStep("shows");
                          }}
                          className="rounded-lg p-2 hover:bg-white/10 transition"
                          aria-label="Go back"
                        >
                          <FaArrowLeft />
                        </button>
                      )}
                      <div className="min-w-0">
                        <Dialog.Title className="truncate text-base font-bold sm:text-lg">
                          {movie?.title || "Book Movie Tickets"}
                        </Dialog.Title>
                        <p className="text-xs text-white/75">
                          {step === "shows" && "Select cinema & showtime"}
                          {step === "seats" && `${cinema?.name} · ${showTime}`}
                          {step === "payment" && "Apply coupons & select payment"}
                          {step === "qr_payment" && "Scan & Pay via UPI QR"}
                          {step === "confirmation" && "Booking Confirmed"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
                      aria-label="Close booking"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  {/* STEP 1: Shows & Cinemas */}
                  {step === "shows" && (
                    <div className="max-h-[78vh] overflow-y-auto p-4 sm:p-6">
                      {/* Manual City Selector Header */}
                      <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50/80 p-3.5 sm:p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <FaMapMarkerAlt className="text-red-600 text-sm shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                              City:
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsCityModalOpen(true)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1 text-sm font-bold text-red-600 shadow-xs hover:border-red-400 hover:bg-red-50 transition"
                            >
                              <span>{city || "Select City"}</span>
                              <BiChevronDown className="text-base" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsCityModalOpen(true)}
                              className="text-xs font-semibold text-gray-600 hover:text-red-600 underline"
                            >
                              Change
                            </button>
                            {nearestTheatre && nearestTheatre.city === city && (
                              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                Near {nearestTheatre.area}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={findNearbyTheatre}
                            disabled={locationStatus === "Checking your location..."}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-red-600 disabled:opacity-50 transition"
                          >
                            <BiTargetLock
                              className={`text-sm ${
                                locationStatus === "Checking your location..."
                                  ? "animate-spin text-red-600"
                                  : ""
                              }`}
                            />
                            <span>
                              {locationStatus === "Checking your location..."
                                ? "Locating..."
                                : "Auto-detect location"}
                            </span>
                          </button>
                        </div>

                        {/* Quick City Pills */}
                        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                          <span className="text-gray-400 shrink-0 text-[11px] font-medium mr-1">
                            Popular:
                          </span>
                          {popularCities.slice(0, 7).map((popularCity) => (
                            <button
                              key={popularCity}
                              type="button"
                              onClick={() => handleCitySelect(popularCity)}
                              className={`shrink-0 rounded-full px-2.5 py-1 font-medium transition ${
                                city === popularCity
                                  ? "bg-red-600 text-white font-semibold shadow-xs"
                                  : "bg-white border border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50"
                              }`}
                            >
                              {popularCity}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Date Tabs */}
                      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                        {dates.map((date) => (
                          <button
                            key={date.value}
                            type="button"
                            onClick={() => setSelectedDate(date.value)}
                            className={`min-w-20 rounded-xl p-2.5 text-center transition ${
                              selectedDate === date.value
                                ? "bg-red-600 text-white shadow-sm"
                                : "border border-gray-200 bg-white text-gray-700 hover:border-red-300"
                            }`}
                          >
                            <span className="block text-xs font-medium">{date.day}</span>
                            <span className="block text-base font-bold">{date.date}</span>
                          </button>
                        ))}
                      </div>

                      {/* Theatres List */}
                      <div className="space-y-4">
                        {nearbyTheatres.length === 0 ? (
                          <div className="py-10 text-center text-sm text-gray-500">
                            No cinemas available in {city}. Try selecting another city above.
                          </div>
                        ) : (
                          nearbyTheatres.map((venue) => (
                            <section
                              key={venue.name}
                              className="rounded-xl border border-gray-200 p-4 transition hover:border-gray-300 sm:flex sm:items-center sm:justify-between"
                            >
                              <div className="mb-3 sm:mb-0 sm:min-w-48">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-bold text-gray-900">{venue.name}</h3>
                                  {nearestTheatre?.name === venue.name &&
                                    nearestTheatre?.city === city && (
                                      <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                                        Nearest · {venue.distance.toFixed(1)} km
                                      </span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  {venue.area} · {venue.formats}
                                  {venue.distance !== null &&
                                    ` · ${venue.distance.toFixed(1)} km away`}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {showTimes.map((time, index) => (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => chooseShow(venue, time)}
                                    className="rounded-lg border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 transition"
                                  >
                                    {time}
                                    <span className="mt-0.5 block text-[10px] font-normal text-gray-500">
                                      {index < 2 ? "Available" : "Filling fast"}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </section>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Seat Selection */}
                  {step === "seats" && (
                    <div className="max-h-[78vh] overflow-y-auto p-4 sm:p-6">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <span className="font-semibold text-gray-900">
                          {chosenDate?.day}, {chosenDate?.date} · {cinema?.name} ({showTime})
                        </span>
                        <span className="text-gray-500">Choose up to 8 seats</span>
                      </div>

                      {bookingError && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                          {bookingError}
                        </div>
                      )}

                      <div className="mx-auto max-w-xl overflow-x-auto pb-2">
                        <div className="mb-6 min-w-[340px]">
                          <div className="mx-auto mb-4 h-5 w-4/5 rounded-t-[50%] border-t-4 border-gray-400 text-center text-[10px] tracking-[0.3em] text-gray-500">
                            SCREEN THIS WAY
                          </div>
                          <div className="space-y-3">
                            {seatRows.map((row) => (
                              <div key={row} className="flex items-center justify-center gap-2">
                                <span className="w-4 text-xs font-bold text-gray-400">{row}</span>
                                <div className="grid grid-cols-10 gap-1.5">
                                  {Array.from({ length: 10 }, (_, index) => {
                                    const seat = `${row}${index + 1}`;
                                    const isBooked =
                                      initialBookedSeats.has(seat) ||
                                      dbBookedSeats.includes(seat);
                                    const isSelected = selectedSeats.includes(seat);
                                    return (
                                      <button
                                        key={seat}
                                        type="button"
                                        disabled={isBooked}
                                        onClick={() => toggleSeat(seat)}
                                        aria-label={`${seat}${
                                          isBooked
                                            ? ", unavailable"
                                            : isSelected
                                            ? ", selected"
                                            : ", available"
                                        }`}
                                        className={`h-7 w-7 rounded-t-md border text-[9px] font-bold transition ${
                                          isBooked
                                            ? "cursor-not-allowed border-gray-200 bg-gray-200 text-gray-400"
                                            : isSelected
                                            ? "border-green-700 bg-green-600 text-white shadow-xs"
                                            : "border-green-600 text-green-700 hover:bg-green-100"
                                        }`}
                                      >
                                        {index + 1}
                                      </button>
                                    );
                                  })}
                                </div>
                                <span className="w-4 text-xs font-bold text-gray-400">{row}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="mb-5 flex flex-wrap justify-center gap-x-5 gap-y-2 border-y border-gray-100 py-3 text-xs text-gray-600">
                        <span>
                          <i className="mr-1.5 inline-block h-3.5 w-3.5 rounded-sm border border-green-600 align-middle" />
                          Available
                        </span>
                        <span>
                          <i className="mr-1.5 inline-block h-3.5 w-3.5 rounded-sm bg-green-600 align-middle" />
                          Selected
                        </span>
                        <span>
                          <i className="mr-1.5 inline-block h-3.5 w-3.5 rounded-sm bg-gray-200 align-middle" />
                          Unavailable (Booked)
                        </span>
                      </div>

                      {bookingError && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex flex-wrap items-center justify-between gap-2">
                          <span>{bookingError}</span>
                          <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent("bookmyevent:open-auth"))}
                            className="rounded-lg bg-red-600 px-3 py-1 font-bold text-white hover:bg-red-700 transition"
                          >
                            Sign In
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-800">
                          {selectedSeats.length
                            ? `${selectedSeats.length} seat${
                                selectedSeats.length > 1 ? "s" : ""
                              } (${selectedSeats.join(", ")}) · ₹${ticketTotal}`
                            : "Select at least 1 seat to continue"}
                        </p>
                        <button
                          type="button"
                          disabled={!selectedSeats.length}
                          onClick={handleContinueToCheckout}
                          className="w-full rounded-xl bg-red-600 px-6 py-2.5 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto transition"
                        >
                          Continue to Checkout
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Payment & Coupon Checkout */}
                  {step === "payment" && (
                    <div className="max-h-[78vh] overflow-y-auto p-4 sm:p-6 space-y-5">
                      {/* Booking Summary Box */}
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                          <div>
                            <h3 className="font-bold text-base text-gray-900">
                              {movie?.title || "Movie"}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {cinema?.name} ({city}) · {showTime}
                            </p>
                          </div>
                          <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                            {chosenDate?.day}, {chosenDate?.date}
                          </span>
                        </div>

                        <div className="pt-3 text-xs text-gray-600 space-y-1.5">
                          <div className="flex justify-between">
                            <span>Selected Seats ({selectedSeats.length})</span>
                            <span className="font-bold text-gray-800">{selectedSeats.join(", ")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Coupon Code Section */}
                      <div className="rounded-2xl border border-dashed border-red-200 bg-red-50/50 p-4">
                        <div className="flex items-center gap-2 mb-2.5">
                          <FaTag className="text-red-600 text-sm" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                            Apply Promo / Coupon Code
                          </h4>
                        </div>

                        {appliedCoupon ? (
                          <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 p-3 text-xs">
                            <div className="flex items-center gap-2">
                              <FaCheckCircle className="text-green-600 text-base shrink-0" />
                              <div>
                                <p className="font-bold text-green-900">
                                  Coupon &quot;{appliedCoupon.code}&quot; Applied!
                                </p>
                                <p className="text-[11px] text-green-700">
                                  You saved ₹{appliedCoupon.discountAmount} on this booking.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveCoupon}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 underline ml-2"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <form noValidate onSubmit={handleApplyCoupon} className="flex gap-2">
                            <input
                              type="text"
                              value={couponCodeInput}
                              onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                              placeholder="Enter coupon (e.g. WELCOME50, FLAT100)"
                              className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-gray-800 placeholder:text-gray-400 placeholder:normal-case outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                            <button
                              type="submit"
                              disabled={isApplyingCoupon || !couponCodeInput.trim()}
                              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition"
                            >
                              {isApplyingCoupon ? "Checking..." : "Apply"}
                            </button>
                          </form>
                        )}

                        {couponError && (
                          <p className="mt-2 text-xs text-red-600 font-medium">{couponError}</p>
                        )}
                      </div>

                      {/* Bill Breakdown */}
                      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-2 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Tickets ({selectedSeats.length} seats)</span>
                          <span className="font-medium text-gray-900">₹{ticketTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Convenience Fee & Taxes</span>
                          <span className="font-medium text-gray-900">₹{convenienceFee}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-green-700 font-semibold">
                            <span>Coupon Discount ({appliedCoupon.code})</span>
                            <span>-₹{discountAmount}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-gray-900">
                          <span>Final Payable Amount</span>
                          <span className="text-red-600">₹{finalPayableAmount}</span>
                        </div>
                      </div>

                      {/* Payment Method - UPI QR Only */}
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-600">
                          Payment Method
                        </p>
                        <div className="flex items-center gap-3.5 rounded-xl border border-red-200 bg-red-50/70 p-3.5 shadow-2xs">
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-600 text-white shrink-0 shadow-xs">
                            <FaQrcode className="text-xl" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-xs text-gray-900">UPI QR Code Payment</p>
                              <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                                Instant
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600 mt-0.5">
                              Scan and pay instantly using Google Pay, PhonePe, Paytm, BHIM, or any UPI app.
                            </p>
                          </div>
                        </div>
                      </div>

                      {bookingError && (
                        <p role="alert" className="text-xs text-red-600 font-semibold">
                          {bookingError}
                        </p>
                      )}

                      {/* Proceed to QR / Pay Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setBookingError("");
                          setStep("qr_payment");
                        }}
                        className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition"
                      >
                        Proceed to Pay ₹{finalPayableAmount}
                      </button>
                    </div>
                  )}

                  {/* STEP 4: QR Code Payment Screen */}
                  {step === "qr_payment" && (
                    <div className="max-h-[78vh] overflow-y-auto p-4 sm:p-6 text-center space-y-5">
                      <div className="max-w-md mx-auto">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-700 mb-2">
                          <FaQrcode />
                          <span>Scan UPI QR Code</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Scan with Any UPI App to Pay
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Open Google Pay, PhonePe, Paytm, or BHIM and scan the code below.
                        </p>

                        {/* QR Box */}
                        <div className="my-5 inline-block rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-lg">
                          <QRCodeSVG
                            value={upiUri}
                            size={190}
                            level="H"
                            includeMargin={true}
                            className="mx-auto"
                          />
                          <div className="mt-3 border-t border-gray-100 pt-2 text-xs">
                            <span className="text-gray-500">Payable Amount: </span>
                            <strong className="text-base font-bold text-red-600">
                              ₹{finalPayableAmount}
                            </strong>
                          </div>
                        </div>

                        {/* UPI Details & Timer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-xs text-gray-600">
                          <div>
                            <span>UPI ID: </span>
                            <code className="font-mono font-bold text-gray-900">bookmyevent@upi</code>
                          </div>
                          <div className="flex items-center gap-1 text-red-600 font-semibold">
                            <span>Expires in:</span>
                            <span className="font-mono">{formatTimer(qrTimeLeft)}</span>
                          </div>
                        </div>

                        {/* Order Confirmation Error */}
                        {bookingError && (
                          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 text-left">
                            {bookingError}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => setStep("payment")}
                            disabled={isCreatingBooking}
                            className="w-full sm:w-auto rounded-xl border border-gray-200 px-5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={confirmBooking}
                            disabled={isCreatingBooking}
                            className="w-full sm:flex-1 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                          >
                            {isCreatingBooking ? (
                              <span>Verifying & Confirming Booking...</span>
                            ) : (
                              <>
                                <FaCheckCircle className="text-base" />
                                <span>Next (I Have Paid)</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="mt-4 text-[11px] text-gray-400">
                          🔒 256-Bit SSL Encrypted. Seats are locked upon payment verification.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Success Confirmation Screen */}
                  {step === "confirmation" && (
                    <div className="p-6 text-center sm:p-10 space-y-6">
                      <div className="grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600 mx-auto">
                        <FaCheckCircle className="text-4xl" />
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          You&apos;re going to the movies!
                        </h3>
                        <p className="mt-1.5 text-xs text-gray-500">
                          Booking confirmed! We have dispatched your official PDF ticket to your registered email.
                        </p>
                      </div>

                      {/* Ticket Card Details */}
                      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-gray-50/70 p-5 text-left text-xs text-gray-700 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                          <span className="font-bold text-sm text-gray-900">
                            {movie?.title || "Movie"}
                          </span>
                          <span className="rounded bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">
                            Confirmed
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-500">Cinema:</span>
                          <span className="font-semibold text-gray-900">
                            {cinema?.name} ({city})
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-500">Date & Showtime:</span>
                          <span className="font-semibold text-gray-900">
                            {chosenDate?.day}, {chosenDate?.date} · {showTime}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-500">Confirmed Seats:</span>
                          <span className="font-bold text-red-600">
                            {selectedSeats.join(", ")}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Paid:</span>
                          <span className="font-bold text-gray-900">₹{finalPayableAmount}</span>
                        </div>

                        <div className="border-t border-gray-200 pt-2.5 flex items-center justify-between">
                          <span className="text-gray-500">Booking Reference:</span>
                          <code className="font-mono font-bold text-xs text-gray-900">
                            {bookingId}
                          </code>
                        </div>
                      </div>

                      {/* Download PDF & Done Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                        {bookingId && (
                          <a
                            href={getTicketPdfUrl(bookingId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={`Ticket-${bookingId}.pdf`}
                            className="inline-flex w-full sm:flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-800 shadow-xs hover:border-red-300 hover:text-red-600 transition"
                          >
                            <FaDownload className="text-red-600" />
                            <span>Download PDF Ticket</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full sm:flex-1 rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        selectedCity={city}
        onSelectCity={handleCitySelect}
      />
    </>
  );
};

export default BookTicketModal;