import React, { useEffect, useState } from "react";
import { FaPlay } from "react-icons/fa";

// HOC
import DefaultlayoutHoc from "../layout/Default.layout";

// Components
import HeroCarousel from "../components/HeroCarousel/HeroCarousel.Component";
import LazyPosterSlider from "../components/PosterSlider/LazyPosterSlider.Component";
import Home from "./Home";
import { getCurrentUser } from "../services/authApi";
import { getMovieGenres, getMovies } from "../services/movieApi";

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [latestMovies, setLatestMovies] = useState([]);
  const [hindiMovies, setHindiMovies] = useState([]);
  const [gujaratiMovies, setGujaratiMovies] = useState([]);
  const [englishMovies, setEnglishMovies] = useState([]);
  const [premierMovies, setPremierMovies] = useState([]);
  const [onlineStreamEvents, setOnlineStreamEvents] = useState([]);
  const [movies, setMovies] = useState([]);
  const [isMoviesLoading, setIsMoviesLoading] = useState(true);
  const [movieError, setMovieError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      let savedUser;
      try {
        savedUser = JSON.parse(localStorage.getItem("user") || "null");
      } catch {
        localStorage.removeItem("user");
        return;
      }

      if (!savedUser) {
        return;
      }

      setUser(savedUser);
      if (!savedUser.token) {
        return;
      }

      try {
        const currentUser = await getCurrentUser(savedUser.token);
        if (isMounted) {
          setUser({ ...savedUser, ...currentUser });
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error.response?.status === 401) {
          localStorage.removeItem("user");
          setUser(null);
        }
        setAuthError(
          error.response?.data?.message ||
            "Unable to verify your account with the server."
        );
      }
    };

    loadCurrentUser();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const requestMovies = async () => {
      try {
        const allMovies = await getMovies();
        if (!isMounted) {
          return;
        }

        const now = new Date();
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const getReleaseDate = (movie) => {
          const date = new Date(movie.releaseDate);
          return Number.isNaN(date.valueOf()) ? null : date;
        };
        const newestFirst = (first, second) =>
          (getReleaseDate(second)?.valueOf() || 0) -
          (getReleaseDate(first)?.valueOf() || 0);
        const languageMatches = (movie, language) => {
          const movieLanguages = [
            movie.language,
            ...(Array.isArray(movie.languages) ? movie.languages : []),
            ...getMovieGenres(movie),
          ]
            .filter(Boolean)
            .map((value) => String(value).toLowerCase());

          return movieLanguages.some((value) => value.includes(language));
        };
        const getLatestMoviesForLanguage = (language) =>
          allMovies
            .filter((movie) => languageMatches(movie, language))
            .sort(newestFirst);

        setMovies(allMovies);
        setRecommendedMovies([...allMovies].sort(newestFirst));
        setLatestMovies(
          allMovies
            .filter((movie) => {
              const releaseDate = getReleaseDate(movie);
              return releaseDate && releaseDate >= oneYearAgo && releaseDate <= now;
            })
            .sort(newestFirst)
        );
        setHindiMovies(getLatestMoviesForLanguage("hindi"));
        setGujaratiMovies(getLatestMoviesForLanguage("gujarati"));
        setEnglishMovies(getLatestMoviesForLanguage("english"));
        setPremierMovies([...allMovies].sort(newestFirst));
        setOnlineStreamEvents(
          allMovies
            .filter((movie) => {
              const releaseDate = getReleaseDate(movie);
              return releaseDate && releaseDate > now;
            })
            .sort(newestFirst)
        );
      } catch (error) {
        if (isMounted) {
          setMovieError(
            error.response?.data?.message ||
              error.message ||
              "Could not load movies. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setIsMoviesLoading(false);
        }
      }
    };

    requestMovies();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    }
  }, [movies]);

  return (
    <>
      <Home user={user} error={authError} />
      {movieError && (
        <p role="alert" className="container mx-auto px-4 py-3 text-red-600 md:px-12">
          {movieError}
        </p>
      )}
      <HeroCarousel movies={movies} />
      <div id="movies" className="container mx-auto px-4 md:px-12 my-8 scroll-mt-6">
        <LazyPosterSlider
          title="Recommended Movies"
          subtitle="List of Recommended Movies"
          posters={recommendedMovies}
          isDark={false}
          isLoading={isMoviesLoading}
        />
      </div>
      <div className="container mx-auto px-4 md:px-12 my-8">
        <LazyPosterSlider
          title="Latest Movies"
          subtitle="Recent Indian releases across all languages"
          posters={latestMovies}
          isDark={false}
          isLoading={isMoviesLoading}
        />
      </div>
      <div className="container mx-auto px-4 md:px-12 my-8">
        <LazyPosterSlider
          title="Hindi Movies"
          subtitle="Latest Hindi movies"
          posters={hindiMovies}
          isDark={false}
          isLoading={isMoviesLoading}
          maxItems={8}
        />
      </div>
      <div className="container mx-auto px-4 md:px-12 my-8">
        <LazyPosterSlider
          title="Gujarati Movies"
          subtitle="Latest Gujarati movies"
          posters={gujaratiMovies}
          isDark={false}
          isLoading={isMoviesLoading}
          maxItems={8}
        />
      </div>
      <div className="container mx-auto px-4 md:px-12 my-8">
        <LazyPosterSlider
          title="English Movies"
          subtitle="Latest English movies"
          posters={englishMovies}
          isDark={false}
          isLoading={isMoviesLoading}
          maxItems={8}
        />
      </div>
      <div className="bg-premier-800 py-12">
        <div id="streaming" className="container mx-auto px-4 md:px-12 my-8 flex flex-col gap-3 scroll-mt-6">
          <div className="flex items-center gap-4 py-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
              <FaPlay className="ml-0.5 text-base" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wider text-white">PREMIERE</h2>
              <p className="text-xs sm:text-sm text-gray-300">Watch new movies at home, every Friday</p>
            </div>
          </div>
          <LazyPosterSlider
            title="Premiers"
            subtitle="Brand new release every Friday"
            posters={premierMovies}
            isDark={true}
            isLoading={isMoviesLoading}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-12 my-8 flex flex-col gap-3">
        <LazyPosterSlider
          title="Online Streaming Events"
          subtitle="Online Streaming Events"
          posters={onlineStreamEvents}
          isDark={false}
          isLoading={isMoviesLoading}
        />
      </div>
    </>
  );
};

export default DefaultlayoutHoc(HomePage);
