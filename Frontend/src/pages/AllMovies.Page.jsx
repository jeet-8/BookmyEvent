import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import DefaultlayoutHoc from "../layout/Default.layout";
import Poster from "../components/Poster/Poster.Component";
import SliderSkeleton from "../components/PosterSlider/SliderSkeleton.Component";
import { getMovies } from "../services/movieApi";

const AllMoviesPage = () => {
  const location = useLocation();
  const navigationState = location.state;
  const [movies, setMovies] = useState(
    Array.isArray(navigationState?.posters) ? navigationState.posters : []
  );
  const [isLoading, setIsLoading] = useState(
    !Array.isArray(navigationState?.posters)
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;

    if (Array.isArray(navigationState?.posters)) {
      setMovies(navigationState.posters);
      setIsLoading(false);
      setError("");
      return () => {
        isCurrentRequest = false;
      };
    }

    const loadMovies = async () => {
      setIsLoading(true);
      setError("");
      try {
        const allMovies = await getMovies();
        if (isCurrentRequest) {
          setMovies(allMovies);
        }
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Could not load movies. Please try again."
          );
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    };

    loadMovies();
    return () => {
      isCurrentRequest = false;
    };
  }, [navigationState]);

  const title = navigationState?.title || "All Movies";

  return (
    <main className="container mx-auto min-h-[60vh] px-4 py-8 md:px-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link
            to="/"
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            ‹ Back to home
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>

      {isLoading && <SliderSkeleton />}
      {error && (
        <p role="alert" className="py-6 text-red-600">
          {error}
        </p>
      )}
      {!isLoading && !error && movies.length === 0 && (
        <p className="py-6 text-gray-500">No movies available yet.</p>
      )}
      {!isLoading && !error && movies.length > 0 && (
        <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {movies.map((movie, index) => (
            <Poster
              {...movie}
              key={movie.id || movie._id || `${movie.title}-${index}`}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default DefaultlayoutHoc(AllMoviesPage);
