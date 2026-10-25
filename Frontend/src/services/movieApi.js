import API from "../api/axios";

const getMovieList = (data) => {
  const movies = Array.isArray(data) ? data : data?.movies;
  if (!Array.isArray(movies)) {
    throw new Error("The movies endpoint returned an invalid response.");
  }
  return movies.map((movie) => ({
    ...movie,
    id: movie._id || movie.id,
  }));
};

export const getMovies = async () => {
  const { data } = await API.get("/api/movies");
  return getMovieList(data);
};

export const getMovieById = async (id) => {
  const { data } = await API.get(`/api/movies/${encodeURIComponent(id)}`);
  const movie = data?.movie || data;
  if (!movie || typeof movie !== "object" || Array.isArray(movie)) {
    throw new Error("The movie endpoint returned an invalid response.");
  }
  return {
    ...movie,
    id: movie._id || movie.id,
  };
};

export const getMovieGenres = (movie) => {
  const genres = Array.isArray(movie?.genre)
    ? movie.genre
    : movie?.genre
      ? [movie.genre]
      : [];

  return genres
    .flatMap((genre) =>
      (typeof genre === "string" ? genre : genre?.name || "")
        .split(",")
        .map((name) => name.trim())
    )
    .filter(Boolean);
};
