import React, { useCallback, useEffect, useState } from "react";
import {
  FaStar,
  FaCheckCircle,
  FaUserCircle,
  FaCommentAlt,
  FaSyncAlt,
} from "react-icons/fa";
import axios from "axios";

const apiBaseUrl =
  process.env.REACT_APP_AUTH_API_URL?.replace(/\/auth\/?$/, "") ||
  "http://localhost:5000/api";

const ratingLabels = {
  1: "Disappointing",
  2: "Below Average",
  3: "Average / Decent",
  4: "Good / Worth Watching",
  5: "Masterpiece / Must Watch!",
};

const MovieReviews = ({ movieId, movieTitle }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Review submission state
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Check signed-in user
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  // Fetch reviews for this movie
  const fetchReviews = useCallback(async () => {
    if (!movieId) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/movies/${movieId}/reviews`);
      if (response.data?.success) {
        setReviews(response.data.reviews || []);
        setAverageRating(response.data.averageRating || 0);
        setTotalReviews(response.data.totalReviews || 0);
      }
    } catch (err) {
      console.warn("Failed to load reviews:", err);
      // Non-critical, just keep empty reviews list
    } finally {
      setIsLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!currentUser?.token) {
      setSubmitError("Please sign in to rate and review this movie.");
      return;
    }

    if (!userRating || userRating < 1 || userRating > 5) {
      setSubmitError("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (!comment.trim()) {
      setSubmitError("Please write a review comment before submitting.");
      return;
    }

    if (comment.trim().length < 5) {
      setSubmitError("Review comment must be at least 5 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${apiBaseUrl}/reviews`,
        {
          movieId,
          rating: userRating,
          comment: comment.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser.token}`,
          },
        }
      );

      setSubmitSuccess(response.data?.message || "Review submitted successfully!");
      setComment("");
      setUserRating(5);
      await fetchReviews();
    } catch (err) {
      console.error("Submit review error:", err);
      setSubmitError(
        err.response?.data?.message ||
          "Failed to submit your review. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStar = hoverRating || userRating;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <span>User Reviews & Ratings</span>
            <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-bold text-red-700">
              {totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real feedback from verified moviegoers for {movieTitle || "this movie"}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReviews}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          title="Refresh reviews"
        >
          <FaSyncAlt className={isLoading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Top Rating Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-6 shadow-xs">
        {/* Big Average Score */}
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 pb-5 md:pb-0 md:pr-5">
          <span className="text-5xl font-black text-gray-900 tracking-tight">
            {averageRating > 0 ? averageRating.toFixed(1) : "—"}
          </span>
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`text-lg ${
                  star <= Math.round(averageRating)
                    ? "text-amber-400"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-500">
            Based on {totalReviews} {totalReviews === 1 ? "rating" : "ratings"}
          </span>
        </div>

        {/* Community Highlight */}
        <div className="md:col-span-2 flex flex-col justify-center">
          <h3 className="font-bold text-sm text-gray-900 mb-1">
            Community Sentiment
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            {totalReviews === 0
              ? "There are no ratings yet for this title. Be the first to share your movie review with the community!"
              : averageRating >= 4
              ? "Audiences are loving this movie! The overwhelming majority gave it 4 and 5-star ratings."
              : averageRating >= 3
              ? "Decent viewer reception with balanced reviews on story and performance."
              : "Mixed audience reactions. Read viewer comments below to see what they liked and disliked."}
          </p>
        </div>
      </div>

      {/* Write a Review Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs">
        <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <FaCommentAlt className="text-red-600 text-sm" />
          <span>Write a Review</span>
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Share your experience to help fellow moviegoers decide what to watch.
        </p>

        {submitError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-800 font-semibold">
            <FaCheckCircle className="text-green-600 text-sm shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {currentUser?.token ? (
          <form noValidate onSubmit={handleSubmitReview} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-700">
                Reviewing as: <strong>{currentUser.given_name || currentUser.username || "Moviegoer"}</strong>
              </span>

              {/* Star Rating Picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium mr-1">Your Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125"
                      aria-label={`${star} star`}
                    >
                      <FaStar
                        className={`text-xl transition-colors ${
                          star <= activeStar ? "text-amber-400" : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-800 ml-1.5 min-w-28">
                  {ratingLabels[activeStar]}
                </span>
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you think of the story, acting, direction, and music? (minimum 5 characters)"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500 transition"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Post Review"}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <FaUserCircle className="text-3xl text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">
              Please sign in to rate and review this movie.
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Sign in with your email to leave reviews and book tickets.
            </p>
          </div>
        )}
      </div>

      {/* Existing Reviews List */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-gray-900">
          User Comments ({reviews.length})
        </h3>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-500">
            <FaSyncAlt className="mx-auto mb-2 text-base animate-spin text-red-600" />
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
            No reviews yet. Share your thoughts above to be the first!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => {
              const dateStr = rev.createdAt
                ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Recent";

              return (
                <div
                  key={rev._id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition flex flex-col justify-between"
                >
                  <div>
                    {/* User info & Rating row */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-red-100 font-bold text-xs text-red-700 uppercase">
                          {rev.userName ? rev.userName.slice(0, 2) : "U"}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-gray-900">
                            {rev.userName || "Verified Viewer"}
                          </p>
                          <span className="text-[10px] text-gray-400">{dateStr}</span>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                        <FaStar className="text-amber-500 text-[11px]" />
                        <span>{rev.rating}/5</span>
                      </div>
                    </div>

                    {/* Comment text */}
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieReviews;
