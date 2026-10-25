import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FaStar, FaTimes, FaCheckCircle, FaCommentDots } from "react-icons/fa";
import axios from "axios";

const apiBaseUrl =
  process.env.REACT_APP_AUTH_API_URL?.replace(/\/auth\/?$/, "") ||
  "http://localhost:5000/api";

const ratingLabels = {
  1: "Poor experience",
  2: "Needs improvement",
  3: "Average / Okay",
  4: "Good experience",
  5: "Excellent! Loved it",
};

const FeedbackModal = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setError("");
    setIsSuccess(false);
    setRating(5);
    setHoverRating(0);
    setFeedback("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Custom client-side validation (no native popups)
    if (!rating || rating < 1 || rating > 5) {
      setError("Please select a star rating from 1 to 5.");
      return;
    }

    if (!feedback.trim()) {
      setError("Please write a few words about your experience.");
      return;
    }

    if (feedback.trim().length < 5) {
      setError("Feedback must be at least 5 characters long.");
      return;
    }

    // Get current user auth token from localStorage if present
    let token = null;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      token = user?.token || null;
    } catch {
      token = null;
    }

    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    setIsSubmitting(true);
    try {
      await axios.post(
        `${apiBaseUrl}/feedback`,
        {
          rating,
          feedback: feedback.trim(),
        },
        { headers }
      );

      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2200);
    } catch (err) {
      console.error("Feedback submit error:", err);
      setError(
        err.response?.data?.message ||
          "Could not submit your feedback right now. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/70">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600">
                      <FaCommentDots className="text-base" />
                    </div>
                    <Dialog.Title className="text-base font-bold text-gray-900">
                      Share Your Feedback
                    </Dialog.Title>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
                    aria-label="Close"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Body Content */}
                {isSuccess ? (
                  <div className="p-8 text-center space-y-3">
                    <FaCheckCircle className="text-5xl text-green-500 mx-auto animate-bounce" />
                    <h3 className="text-xl font-bold text-gray-900">Thank You!</h3>
                    <p className="text-xs text-gray-600">
                      Your feedback has been submitted successfully. We appreciate your thoughts!
                    </p>
                  </div>
                ) : (
                  <form noValidate onSubmit={handleSubmit} className="p-6 space-y-5">
                    <p className="text-xs text-gray-500">
                      We value your thoughts! Tell us about your experience using BookMyEvent.
                    </p>

                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
                        {error}
                      </div>
                    )}

                    {/* Star Rating Picker */}
                    <div className="text-center py-2 bg-gray-50/80 rounded-xl border border-gray-100">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        How would you rate your experience?
                      </label>
                      <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= activeRating;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 focus:outline-none transition-transform hover:scale-110"
                              aria-label={`${star} star`}
                            >
                              <FaStar
                                className={`text-2xl transition-colors ${
                                  isFilled ? "text-amber-400" : "text-gray-200"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-gray-700 min-h-4">
                        {ratingLabels[activeRating] || ""}
                      </p>
                    </div>

                    {/* Feedback Textarea */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Your Feedback / Suggestions *
                      </label>
                      <textarea
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Tell us what you liked, or how we can improve BookMyEvent..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500 transition"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition disabled:opacity-60"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Feedback"}
                      </button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default FeedbackModal;
