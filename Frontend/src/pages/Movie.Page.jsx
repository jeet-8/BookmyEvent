import React, { useEffect, useState, useContext } from "react";
import MovieLayoutHoc from "../layout/Movie.layout";
import { useParams } from "react-router-dom";
import { MovieContext } from "../context/Movie.context";
import {
  getMovieById,
  getMovieGenres,
  getMovies,
} from "../services/movieApi";
import Slider from "react-slick";
import { FaTag, FaCopy, FaCheck } from "react-icons/fa";
import LazyPosterSlider from "../components/PosterSlider/LazyPosterSlider.Component";
import MovieHero from "../components/MovieHero/MovieHero.Component";
import Cast from "../components/Cast/Cast.Component";
import MovieReviews from "../components/Review/MovieReviews";
import Loader from "../components/Loader/Loader";
import Footer from "../components/Footer/Footer.Component";

const MoviePage = () => {
  const { id } = useParams();
  const { movie, setMovie } = useContext(MovieContext);

  const [cast, setCast] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const handleCopyCode = (code) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [movieData, allMovies] = await Promise.all([
          getMovieById(id),
          getMovies(),
        ]);
        if (!isCurrentRequest) {
          return;
        }

        const movieGenres = getMovieGenres(movieData).map((genre) => genre.toLowerCase());
        const otherMovies = allMovies.filter((candidate) => candidate.id !== movieData.id);
        const matchingMovies = otherMovies.filter((candidate) =>
          getMovieGenres(candidate).some((genre) => movieGenres.includes(genre.toLowerCase()))
        );

        setMovie(movieData);
        setCast(Array.isArray(movieData.cast) ? movieData.cast : []);
        setSimilarMovies(matchingMovies);
        setRecommendedMovies(otherMovies);
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Could not load this movie. Please try again."
          );
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    };

    window.scrollTo(0, 0);
    fetchData();
    return () => {
      isCurrentRequest = false;
    };
  }, [id, setMovie]);

  const settingsCast = {
    arrows: true,
    slidesToShow: 4,
    infinite: true,
    dots: false,
    // speed: 500,
    slidesToScroll: 1,

    autoplay: true,
    speed: 2000,
    autoplaySpeed: 2000,
    cssEase: "linear",
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
          dots: false,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          initialSlide: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  const settings = {
    arrows: true,
    slidesToShow: 3,
    infinite: true,
    dots: true,
    // speed: 500,
    slidesToScroll: 1,

    autoplay: true,
    speed: 2000,
    autoplaySpeed: 2000,
    cssEase: "linear",
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          initialSlide: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : error ? (
        <main role="alert" className="container mx-auto min-h-[60vh] px-4 py-12 text-center text-red-600">
          {error}
        </main>
      ) : (
        <>
          <MovieHero />
          <div className="my-12 container px-4 lg:ml-20 lg:w-2/1">
            <div className="flex flex-col items-start gap-3">
              <h1 className="text-gray-800 font-bold text-2xl">
                About the movie
              </h1>
              <p>{movie.description}</p>
            </div>

            <div className="my-8">
              <hr />
            </div>

            <div className="my-8">
              <h2 className="text-gray-800 font-bold text-2xl mb-3">
                Applicable Offers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coupon 1: BME20 */}
                <div className="flex items-start justify-between gap-3 bg-red-50/50 p-4 border-2 border-dashed border-red-300 rounded-xl transition hover:border-red-400">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FaTag className="text-base" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">BME20</span>
                        <span className="bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          % Percentage
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs mt-1">
                        20% off on all weekend tickets
                      </p>
                      <p className="text-gray-500 text-[11px] mt-1 font-medium">
                        20% discount (Capped at ₹100) · Min. order ₹150
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode("BME20")}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 transition shrink-0"
                    title="Copy code"
                  >
                    {copiedCode === "BME20" ? (
                      <>
                        <FaCheck className="text-green-600 text-xs" />
                        <span className="text-green-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <FaCopy className="text-xs" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Coupon 2: FLAT100 */}
                <div className="flex items-start justify-between gap-3 bg-red-50/50 p-4 border-2 border-dashed border-red-300 rounded-xl transition hover:border-red-400">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FaTag className="text-base" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">FLAT100</span>
                        <span className="bg-emerald-100 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          Flat Amount
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs mt-1">
                        Flat ₹100 off on minimum purchase of ₹300
                      </p>
                      <p className="text-gray-500 text-[11px] mt-1 font-medium">
                        Flat ₹100 discount · Min. order ₹300
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode("FLAT100")}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 transition shrink-0"
                    title="Copy code"
                  >
                    {copiedCode === "FLAT100" ? (
                      <>
                        <FaCheck className="text-green-600 text-xs" />
                        <span className="text-green-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <FaCopy className="text-xs" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="my-8">
              <hr />
            </div>

            {cast.length > 0 && (
              <>
                <div className="my-8">
                  <hr />
                </div>

                <div className="my-8">
                  <h2 className="text-gray-800 font-bold text-2xl mb-4">
                    Cast and Crew
                  </h2>
                  <Slider {...settingsCast}>
                    {cast.map((castData, index) => (
                      <Cast
                        key={castData.id || castData._id || index}
                        image={
                          castData.image?.url ||
                          castData.profileImage?.url ||
                          castData.image
                        }
                        castName={castData.name}
                        role={castData.character}
                      />
                    ))}
                  </Slider>
                </div>
              </>
            )}

            <div className="my-10">
              <MovieReviews movieId={id} movieTitle={movie?.title} />
            </div>

            <div className="my-8">
              <hr />
            </div>

            <div className="my-8">
              <LazyPosterSlider
                config={settings}
                title="Recommended Movies"
                posters={recommendedMovies}
                isDark={false}
              />
            </div>

            <div className="my-8">
              <hr />
            </div>

            {/* Movies */}
            <div className="my-8">
              <LazyPosterSlider
                config={settings}
                title="Similar Movies"
                posters={similarMovies}
                isDark={false}
              />
            </div>

            <div className="my-8">
              <hr />
            </div>
          </div>
          <Footer />
        </>
      )}
    </>
  );
};

export default MovieLayoutHoc(MoviePage);
