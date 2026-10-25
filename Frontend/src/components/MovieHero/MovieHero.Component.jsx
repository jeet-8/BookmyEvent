import React, { useContext, useEffect } from "react";
import { MovieContext } from "../../context/Movie.context";
import MovieInfo from "./MovieInfo.Component";
import BookTicketModal from "../Booking/BookTicket.Component";
import { getMovieGenres } from "../../services/movieApi";
import { getCloudinaryUrl } from "../../services/cloudinary";

const MovieHero = () => {
  const { movie, isBookingOpen, setIsBookingOpen, openBookTickets } = useContext(MovieContext);
  // const { movie } = useContext(MovieContext)
  const genres = getMovieGenres(movie).join(", ");
  const posterUrl = getCloudinaryUrl(movie.posterUrl || movie.posterImage?.url);
  const bannerUrl = getCloudinaryUrl(
    movie.bannerUrl ||
      movie.bannerImage?.url ||
      movie.posterUrl ||
      movie.posterImage?.url
  );
  // console.log(genres);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div>
        {/* mobile or tab screen size */}
        <div className="lg:hidden w-full">
          {posterUrl && (
            <img
              src={posterUrl}
              alt="cover pic"
              loading="lazy"
              className=" rounded responsive-img my-2 py-2"
              style={{ width: "calc(100%-2rem)" }}
            />
          )}
        </div>
        <div className="flex flex-col gap-3 lg:hidden">
          <div className="flex flex-col-reverse gap-3 px-4 my-3">
            <div className="text-black flex flex-col gap-2 md:px-4">
              <h4>4.2k rating</h4>
              <h4>Kannada, English, Hindi, Telegu, Tamil</h4>
              <h4>
                {movie.duration} min | {genres}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-3 md:px-4 md:w-screen text-xl px-4">
            <button
              onClick={openBookTickets}
              className="bg-red-600 w-full py-3 text-white font-semibold rounded-lg"
            >
              Book Tickets
            </button>
          </div>
        </div>

        {/* Large Screen Device */}
        <div
          className="relative hidden w-full lg:block"
          style={{ height: "36rem" }}
        >
          {bannerUrl && (
            <img
              src={bannerUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full scale-105 object-cover object-center opacity-50 blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/25" />
          <div className="relative z-10 flex h-full items-center gap-10 px-24">
            <div className="h-96 w-64 shrink-0">
              {posterUrl && (
              <img
                src={posterUrl}
                alt="Movie Poster"
                loading="lazy"
                className="h-full w-full rounded-lg object-cover"
              />
              )}
            </div>
            <MovieInfo movie={movie} />
          </div>
        </div>
      </div>
      <BookTicketModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        movie={movie}
      />
    </>
  );
};

export default MovieHero;
