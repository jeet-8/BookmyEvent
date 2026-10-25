import React, { useState, createContext } from "react";
export const MovieContext = createContext();

const MovieProvider = ({ children }) => {
  const [movie, setMovie] = useState({
    id: "",
    title: "",
    description: "",
    genre: [],
    releaseDate: "",
    duration: 0,
    posterImage: { url: "" },
    bannerImage: { url: "" },
  });
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const openBookTickets = () => {
    setIsBookingOpen(true);
  };
  return (
    <MovieContext.Provider
      value={{
        movie,
        setMovie,
        isBookingOpen,
        setIsBookingOpen,
        openBookTickets,
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

export default MovieProvider;
