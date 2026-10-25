import React, { useContext } from "react";
import { MovieContext } from "../../context/Movie.context";
import { getMovieGenres } from "../../services/movieApi";

const MovieInfo = () => {
  const { openBookTickets, movie } = useContext(MovieContext);

  const genres = getMovieGenres(movie).join(", ");

  return (
    <div className="flex flex-col gap-3 px-4 my-3">
      <h1 className="text-5xl font-bold text-white font-poppins">{movie.title || "Movie details"}</h1>
      <div className="text-black flex flex-col gap-2 md:px-4">
        <h4 className="font-semibold text-white font-poppins">4.2k rating</h4>
        <h4 className="font-semibold text-white font-poppins">
          Kannada, English, Hindi, Telegu, Tamil
        </h4>
        <h4 className="font-semibold text-white font-poppins">
          {movie.duration} min | {genres}
        </h4>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="w-full rounded-lg bg-red-600 py-3 pl-2 font-poppins font-semibold text-white"
          onClick={openBookTickets}
        >
          Book Tickets
        </button>
      </div>
    </div>
  );
};

export default MovieInfo;
