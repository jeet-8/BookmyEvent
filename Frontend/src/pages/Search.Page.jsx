import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DefaultlayoutHoc from "../layout/Default.layout";
import Poster from "../components/Poster/Poster.Component";
import { getMovies } from "../services/movieApi";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() || "";
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCurrentRequest = true;

    const searchMovies = async () => {
      if (!query) {
        setMovies([]);
        setError("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const allMovies = await getMovies();
        if (isCurrentRequest) {
          setMovies(
            allMovies.filter((movie) =>
              (movie.title || "").toLowerCase().includes(query.toLowerCase())
            )
          );
        }
      } catch (requestError) {
        if (isCurrentRequest) {
          setMovies([]);
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Could not search movies. Please try again."
          );
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    };

    searchMovies();
    return () => {
      isCurrentRequest = false;
    };
  }, [query]);

  return (
    <main className="container mx-auto min-h-[60vh] px-4 py-8 md:px-12">
      <h1 className="text-2xl font-bold text-gray-900">
        {query ? `Search results for "${query}"` : "Search movies"}
      </h1>
      {isLoading && <p className="mt-6 text-gray-500">Searching movies...</p>}
      {error && <p role="alert" className="mt-6 text-red-600">{error}</p>}
      {!isLoading && !error && query && movies.length === 0 && (
        <p className="mt-6 text-gray-500">No movies found. Try another title.</p>
      )}
      {!query && <p className="mt-6 text-gray-500">Enter a movie title in the search box above.</p>}
      {movies.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {movies.filter((movie) => movie.posterImage?.url).map((movie) => (
            <Poster {...movie} key={movie.id} />
          ))}
        </div>
      )}
    </main>
  );
};

export default DefaultlayoutHoc(SearchPage);
