import { Routes, Route } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import HomePage from "./pages/Home.Page";
import MoviePage from "./pages/Movie.Page";
import PlayPage from "./pages/Play.Page";
import ErrorPage from "./pages/404";
import AdminPage from "./pages/Admin.Page";
import SearchPage from "./pages/Search.Page";
import AboutPage from "./pages/About.Page";
import HelpPage from "./pages/Help.Page";
import SettingsPage from "./pages/Settings.Page";
import AllMoviesPage from "./pages/AllMovies.Page";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/movie/:id" element={<MoviePage />} />
      <Route path="/plays" element={<PlayPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/movies" element={<AllMoviesPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/coupons" element={<AdminPage initialView="coupons" />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

export default App;
