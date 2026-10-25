import React, { useCallback, useEffect, useState } from "react";
import {
  FaChartLine,
  FaEdit,
  FaFilm,
  FaPlus,
  FaTrash,
  FaSearch,
  FaSignOutAlt,
  FaSyncAlt,
  FaTicketAlt,
  FaTimes,
  FaUsers,
  FaTag,
} from "react-icons/fa";
import { adminApi } from "../services/adminApi";
import AdminAiChat from "../components/AdminAiChat";
import AdminCoupons from "../components/Admin/AdminCoupons";

const navigation = [
  { id: "overview", label: "Overview", icon: FaChartLine },
  { id: "movies", label: "Movies", icon: FaFilm },
  { id: "users", label: "Users", icon: FaUsers },
  { id: "bookings", label: "Bookings", icon: FaTicketAlt },
  { id: "coupons", label: "Coupons", icon: FaTag },
];

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getMovieForm = (movie = {}) => ({
  title: movie.title || "",
  language: movie.language || "",
  genre: Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre || "",
  description: movie.description || "",
  releaseDate: movie.releaseDate
    ? new Date(movie.releaseDate).toISOString().slice(0, 10)
    : "",
  duration: movie.duration || 0,
  posterUrl: movie.posterUrl || movie.posterImage?.url || "",
  bannerUrl: movie.bannerUrl || movie.bannerImage?.url || "",
});

const getAdminEmail = () => {
  try {
    return JSON.parse(localStorage.getItem("adminUser") || "null")?.email || "Admin workspace";
  } catch {
    return "Admin workspace";
  }
};

const AdminPage = ({ initialView = "overview" }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("adminToken"))
  );
  const [activeView, setActiveView] = useState(initialView);
  const [dashboard, setDashboard] = useState({});
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieForm, setMovieForm] = useState(getMovieForm());
  const [isSavingMovie, setIsSavingMovie] = useState(false);
  const [uploadingImage, setUploadingImage] = useState({ poster: false, banner: false });
  const [uploadedImage, setUploadedImage] = useState({ poster: false, banner: false });
  const [movieUploadError, setMovieUploadError] = useState("");
  const [userForm, setUserForm] = useState({ username: "", email: "", role: "user" });
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    movieTitle: "",
    seats: 1,
    totalPrice: 0,
    status: "Confirmed",
  });
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [movieFormError, setMovieFormError] = useState("");
  const [userFormError, setUserFormError] = useState("");
  const [bookingFormError, setBookingFormError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const results = await Promise.allSettled([
      adminApi.getDashboard(),
      adminApi.getMovies(),
      adminApi.getUsers(),
      adminApi.getBookings(),
    ]);

    const errors = [];
    if (results[0].status === "fulfilled") {
      setDashboard(results[0].value || {});
    } else {
      errors.push(results[0].reason.message || "Could not load dashboard data.");
    }
    if (results[1].status === "fulfilled") {
      setMovies(results[1].value || []);
    } else {
      errors.push(results[1].reason.message || "Could not load movies.");
    }
    if (results[2].status === "fulfilled") {
      setUsers(results[2].value?.users || []);
    } else {
      const requestError = results[2].reason;
      if (requestError.status === 401 || requestError.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setIsAuthenticated(false);
      }
      errors.push(requestError.message || "Could not load registered users.");
    }
    if (results[3].status === "fulfilled") {
      setBookings(results[3].value?.bookings || []);
    } else {
      const requestError = results[3].reason;
      if (requestError.status === 401 || requestError.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setIsAuthenticated(false);
      }
      errors.push(requestError.message || "Could not load bookings.");
    }

    setError(errors.join(" "));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const signIn = async (event) => {
    event.preventDefault();
    setLoginError("");

    if (!email.trim()) {
      setLoginError("Please enter your admin email address.");
      return;
    }
    if (!password) {
      setLoginError("Please enter your password.");
      return;
    }

    setIsSigningIn(true);
    try {
      const result = await adminApi.login({ email: email.trim(), password });
      localStorage.setItem("adminToken", result.token);
      localStorage.setItem("adminUser", JSON.stringify(result.admin));
      setIsAuthenticated(true);
      setPassword("");
    } catch (requestError) {
      setLoginError(requestError.message || "Admin sign-in failed.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setIsAuthenticated(false);
    setDashboard({});
    setMovies([]);
    setUsers([]);
    setBookings([]);
  };

  const openUserEditor = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username || "",
      email: user.email || "",
      role: user.role || "user",
    });
    setUserFormError("");
    setError("");
  };

  const openMovieEditor = (movie = null) => {
    setEditingMovie(movie || {});
    setMovieForm(getMovieForm(movie || {}));
    setUploadedImage({ poster: false, banner: false });
    setMovieUploadError("");
    setMovieFormError("");
    setError("");
  };

  const uploadMovieImage = async (field, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMovieUploadError("Choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMovieUploadError("Image must be 5 MB or smaller.");
      return;
    }

    setUploadingImage((current) => ({ ...current, [field]: true }));
    setUploadedImage((current) => ({ ...current, [field]: false }));
    setMovieUploadError("");
    try {
      const result = await adminApi.uploadImage(file);
      if (!result.success || !result.url) {
        throw new Error("Cloudinary did not return an image URL.");
      }
      const formField = field === "poster" ? "posterUrl" : "bannerUrl";
      setMovieForm((current) => ({ ...current, [formField]: result.url }));
      setUploadedImage((current) => ({ ...current, [field]: true }));
    } catch (uploadError) {
      setMovieUploadError(uploadError.message || "Could not upload image.");
    } finally {
      setUploadingImage((current) => ({ ...current, [field]: false }));
    }
  };

  const saveMovie = async (event) => {
    event.preventDefault();
    setMovieFormError("");

    if (!movieForm.title.trim()) {
      setMovieFormError("Please enter a movie title.");
      return;
    }
    if (!movieForm.language.trim()) {
      setMovieFormError("Please enter the movie language.");
      return;
    }
    if (movieForm.duration !== "" && (isNaN(Number(movieForm.duration)) || Number(movieForm.duration) < 0)) {
      setMovieFormError("Please enter a valid movie duration in minutes.");
      return;
    }

    setIsSavingMovie(true);
    setError("");
    const payload = {
      ...movieForm,
      genre: movieForm.genre.split(",").map((genre) => genre.trim()).filter(Boolean),
      duration: Number(movieForm.duration) || 0,
    };
    if (payload.releaseDate) {
      payload.releaseDate = new Date(`${payload.releaseDate}T00:00:00`).toISOString();
    } else {
      delete payload.releaseDate;
    }

    try {
      const result = editingMovie?._id
        ? await adminApi.updateMovie(editingMovie._id, payload)
        : await adminApi.createMovie(payload);
      const savedMovie = { ...result.movie, id: result.movie._id || result.movie.id };
      setMovies((currentMovies) =>
        editingMovie?._id
          ? currentMovies.map((movie) =>
              (movie._id || movie.id) === editingMovie._id ? savedMovie : movie
            )
          : [savedMovie, ...currentMovies]
      );
      setEditingMovie(null);
    } catch (requestError) {
      setMovieFormError(requestError.message || "Could not save this movie.");
    } finally {
      setIsSavingMovie(false);
    }
  };

  const deleteMovie = async (movie) => {
    if (!window.confirm(`Delete "${movie.title}"? This cannot be undone.`)) return;

    setError("");
    try {
      await adminApi.deleteMovie(movie._id || movie.id);
      setMovies((currentMovies) =>
        currentMovies.filter(
          (currentMovie) => (currentMovie._id || currentMovie.id) !== (movie._id || movie.id)
        )
      );
    } catch (requestError) {
      setError(requestError.message || "Could not delete this movie.");
    }
  };

  const saveUser = async (event) => {
    event.preventDefault();
    if (!editingUser) return;
    setUserFormError("");

    if (!userForm.username.trim()) {
      setUserFormError("Please enter a username.");
      return;
    }
    if (!userForm.email.trim()) {
      setUserFormError("Please enter an email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email.trim())) {
      setUserFormError("Please enter a valid email address.");
      return;
    }

    setIsSavingUser(true);
    setError("");
    try {
      const result = await adminApi.updateUser(
        editingUser._id || editingUser.id,
        userForm
      );
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          (user._id || user.id) === (editingUser._id || editingUser.id)
            ? result.user
            : user
        )
      );
      setEditingUser(null);
    } catch (requestError) {
      setUserFormError(requestError.message || "Could not update this user.");
    } finally {
      setIsSavingUser(false);
    }
  };

  const deleteUser = async (user) => {
    const confirmed = window.confirm(
      `Delete user ${user.username || user.email}? This cannot be undone.`
    );
    if (!confirmed) return;

    setError("");
    try {
      await adminApi.deleteUser(user._id || user.id);
      setUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) => (currentUser._id || currentUser.id) !== (user._id || user.id)
        )
      );
    } catch (requestError) {
      setError(requestError.message || "Could not delete this user.");
    }
  };

  const openBookingEditor = (booking) => {
    setEditingBooking(booking);
    setBookingForm({
      movieTitle: booking.movieTitle || "",
      seats: booking.seats || 1,
      totalPrice: booking.totalPrice || 0,
      status: booking.status || "Confirmed",
    });
    setBookingFormError("");
    setError("");
  };

  const saveBooking = async (event) => {
    event.preventDefault();
    if (!editingBooking) return;
    setBookingFormError("");

    if (!bookingForm.movieTitle.trim()) {
      setBookingFormError("Please enter a movie title.");
      return;
    }
    if (bookingForm.seats === "" || isNaN(Number(bookingForm.seats)) || Number(bookingForm.seats) < 1) {
      setBookingFormError("Please enter a valid number of seats (at least 1).");
      return;
    }
    if (bookingForm.totalPrice === "" || isNaN(Number(bookingForm.totalPrice)) || Number(bookingForm.totalPrice) < 0) {
      setBookingFormError("Please enter a valid total price (₹0 or greater).");
      return;
    }

    setIsSavingBooking(true);
    setError("");
    try {
      const result = await adminApi.updateBooking(
        editingBooking._id || editingBooking.id,
        {
          ...bookingForm,
          seats: Number(bookingForm.seats),
          totalPrice: Number(bookingForm.totalPrice),
        }
      );
      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          (booking._id || booking.id) === (editingBooking._id || editingBooking.id)
            ? result.booking
            : booking
        )
      );
      setEditingBooking(null);
    } catch (requestError) {
      setBookingFormError(requestError.message || "Could not update this booking.");
    } finally {
      setIsSavingBooking(false);
    }
  };

  const filteredMovies = movies.filter((movie) =>
    `${movie.title || ""} ${Array.isArray(movie.genre) ? movie.genre.join(" ") : movie.genre || ""} ${movie.description || ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );
  const filteredUsers = users.filter((user) =>
    `${user.username || ""} ${user.email || ""}`.toLowerCase().includes(query.toLowerCase())
  );
  const filteredBookings = bookings.filter((booking) =>
    `${booking.movieTitle || ""} ${booking.user?.username || ""} ${booking.user?.email || ""} ${booking.status || ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f5f7] px-4 text-gray-900">
        <form noValidate onSubmit={signIn} className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-7 shadow-sm">
          <div className="mb-6 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded bg-red-600 text-xl font-bold text-white">my</span>
            <h1 className="mt-4 text-2xl font-bold">Admin sign in</h1>
            <p className="mt-1 text-sm text-gray-500">This sign-in is separate from customer accounts.</p>
          </div>
          {loginError && (
            <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="leading-snug">{loginError}</span>
            </div>
          )}
          <label className="mb-4 block text-sm font-medium">
            Admin email
            <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>
          <label className="mb-6 block text-sm font-medium">
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>
          <button type="submit" disabled={isSigningIn} className="w-full rounded bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {isSigningIn ? "Signing in..." : "Sign in to admin"}
          </button>
        </form>
      </main>
    );
  }

  const totalUsers = dashboard.metrics?.totalUsers ?? users.length;

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-gray-900">
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-7">
        <a href="/" className="flex items-center gap-3 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded bg-red-600 text-lg text-white">my</span>
          <span className="hidden sm:inline">BookMyEvent <span className="font-normal text-gray-400">/ Admin</span></span>
        </a>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-500 sm:inline">{getAdminEmail()}</span>
          <button type="button" onClick={loadData} className="grid h-9 w-9 place-items-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50" aria-label="Refresh data"><FaSyncAlt /></button>
          <button type="button" onClick={signOut} className="flex h-9 items-center gap-2 rounded border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50"><FaSignOutAlt /> Sign out</button>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="border-b border-gray-200 bg-white p-3 lg:border-b-0 lg:border-r lg:p-5">
          <p className="hidden px-3 pb-3 text-xs font-semibold uppercase text-gray-400 lg:block">Workspace</p>
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {navigation.map((item) => (
              <button key={item.id} type="button" onClick={() => { setActiveView(item.id); setQuery(""); }} className={`flex shrink-0 items-center gap-3 rounded px-3 py-2.5 text-sm font-medium ${activeView === item.id ? "bg-red-50 text-red-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                <item.icon className="text-base" />{item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 p-4 sm:p-7">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm text-gray-500">Manage the data connected to your website</p><h1 className="mt-1 text-2xl font-bold">{navigation.find((item) => item.id === activeView)?.label}</h1></div>
            {(activeView === "movies" || activeView === "users" || activeView === "bookings") && (
              <div className="flex items-center gap-2">
                <label className="flex h-10 items-center gap-2 rounded border border-gray-300 bg-white px-3">
                  <FaSearch className="text-sm text-gray-400" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${activeView}`} className="w-36 bg-transparent text-sm outline-none sm:w-52" />
                </label>
                {activeView === "movies" && (
                  <button type="button" onClick={() => openMovieEditor()} className="inline-flex h-10 items-center gap-2 rounded bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700">
                    <FaPlus /> Add movie
                  </button>
                )}
              </div>
            )}
          </div>

          {error && <div role="alert" className="mb-5 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}
          {isLoading ? <div className="rounded border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Loading admin data...</div> : (
            <>
              {activeView === "overview" && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    { label: "Registered users", value: totalUsers, icon: FaUsers, tone: "bg-green-50 text-green-700" },
                    { label: "Movies on website", value: movies.length, icon: FaFilm, tone: "bg-blue-50 text-blue-700" },
                    { label: "Bookings", value: dashboard.metrics?.totalBookings ?? bookings.length, icon: FaTicketAlt, tone: "bg-red-50 text-red-600" },
                    { label: "Booking revenue", value: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(dashboard.metrics?.revenue || 0), icon: FaChartLine, tone: "bg-amber-50 text-amber-700" },
                  ].map((metric) => (
                    <article key={metric.label} className="rounded-md border border-gray-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div><p className="text-sm text-gray-500">{metric.label}</p><p className="mt-2 text-2xl font-bold text-gray-900">{metric.value}</p></div>
                        <span className={`grid h-10 w-10 place-items-center rounded-md ${metric.tone}`}><metric.icon /></span>
                      </div>
                    </article>
                  ))}
                  <section className="rounded-md border border-gray-200 bg-white p-5 sm:col-span-2 xl:col-span-3">
                    <h2 className="font-semibold">Recent registered users</h2>
                    <UserTable users={users.slice(0, 5)} onEdit={openUserEditor} onDelete={deleteUser} />
                    <h2 className="mt-7 font-semibold">Recent bookings</h2>
                    <BookingTable bookings={bookings.slice(0, 5)} onEdit={openBookingEditor} />
                  </section>
                </div>
              )}

              {activeView === "movies" && (
                <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Movie</th><th className="px-5 py-3">Language</th><th className="px-5 py-3">Genre</th><th className="px-5 py-3">Release date</th><th className="px-5 py-3">Duration</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredMovies.map((movie) => (
                          <tr key={movie._id || movie.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3"><div className="flex items-center gap-3">{movie.posterUrl || movie.posterImage?.url ? <img src={movie.posterUrl || movie.posterImage.url} alt="" className="h-12 w-9 rounded object-cover" /> : <span className="grid h-12 w-9 place-items-center rounded bg-gray-100 text-gray-400"><FaFilm /></span>}<span className="font-semibold text-gray-900">{movie.title}</span></div></td>
                            <td className="px-5 py-3 text-gray-600">{movie.language || "—"}</td>
                            <td className="px-5 py-3 text-gray-600">{Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre || "—"}</td>
                            <td className="px-5 py-3 text-gray-600">{formatDate(movie.releaseDate)}</td>
                            <td className="px-5 py-3 text-gray-600">{movie.duration ? `${movie.duration} min` : "—"}</td>
                            <td className="px-5 py-3 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => openMovieEditor(movie)} className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100"><FaEdit /> Edit</button><button type="button" onClick={() => deleteMovie(movie)} className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"><FaTrash /> Delete</button></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredMovies.length === 0 && <p className="p-8 text-center text-sm text-gray-500">No movies to show.</p>}
                  </div>
                  <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">Changes are saved to the movie database and appear on the public website.</p>
                </section>
              )}

              {activeView === "users" && (
                <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
                  <UserTable users={filteredUsers} onEdit={openUserEditor} onDelete={deleteUser} />
                  {filteredUsers.length === 0 && <p className="p-8 text-center text-sm text-gray-500">No users to show.</p>}
                </section>
              )}

              {activeView === "bookings" && (
                <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
                  <BookingTable bookings={filteredBookings} onEdit={openBookingEditor} />
                </section>
              )}

              {activeView === "coupons" && (
                <AdminCoupons />
              )}
            </>
          )}
        </main>
      </div>

      {editingMovie && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSavingMovie) setEditingMovie(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-movie-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="edit-movie-title" className="text-xl font-bold">{editingMovie._id ? "Edit movie" : "Add movie"}</h2>
              <button type="button" onClick={() => setEditingMovie(null)} disabled={isSavingMovie} aria-label="Close" className="grid h-8 w-8 place-items-center rounded hover:bg-gray-100 disabled:opacity-50"><FaTimes /></button>
            </div>
            <form noValidate onSubmit={saveMovie} className="space-y-4">
              {movieFormError && (
                <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="leading-snug">{movieFormError}</span>
                </div>
              )}
              {movieUploadError && <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{movieUploadError}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Title<input value={movieForm.title} onChange={(event) => setMovieForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
                <label className="block text-sm font-medium">Language<input value={movieForm.language} onChange={(event) => setMovieForm((current) => ({ ...current, language: event.target.value }))} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
              </div>
              <label className="block text-sm font-medium">Genres <span className="font-normal text-gray-500">(comma separated)</span><input value={movieForm.genre} onChange={(event) => setMovieForm((current) => ({ ...current, genre: event.target.value }))} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
              <label className="block text-sm font-medium">Description<textarea rows="3" value={movieForm.description} onChange={(event) => setMovieForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Release date<input type="date" value={movieForm.releaseDate} onChange={(event) => setMovieForm((current) => ({ ...current, releaseDate: event.target.value }))} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
                <label className="block text-sm font-medium">Duration (minutes)<input type="number" min="0" step="1" value={movieForm.duration} onChange={(event) => setMovieForm((current) => ({ ...current, duration: event.target.value }))} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
              </div>
              {[
                { field: "poster", label: "Poster image", url: movieForm.posterUrl },
                { field: "banner", label: "Banner image", url: movieForm.bannerUrl },
              ].map(({ field, label, url }) => (
                <label key={field} className="block text-sm font-medium">
                  {label}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      uploadMovieImage(field, event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    disabled={uploadingImage[field]}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5"
                  />
                  <span className="mt-1 block text-xs text-gray-500">Upload an image up to 5 MB.</span>
                  {uploadingImage[field] && <span role="status" className="mt-1 block text-sm text-gray-600">Uploading to Cloudinary...</span>}
                  {uploadedImage[field] && <span role="status" className="mt-1 block text-sm font-medium text-green-700">Image uploaded successfully.</span>}
                  {url && <img src={url} alt={`${label} preview`} className="mt-2 max-h-32 rounded border border-gray-200 object-contain" />}
                </label>
              ))}
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setEditingMovie(null)} disabled={isSavingMovie} className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSavingMovie || uploadingImage.poster || uploadingImage.banner} className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isSavingMovie ? "Saving..." : "Save movie"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSavingUser) setEditingUser(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="edit-user-title" className="text-xl font-bold">Edit user</h2>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={isSavingUser}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <FaTimes />
              </button>
            </div>
            <form noValidate onSubmit={saveUser} className="space-y-4">
              {userFormError && (
                <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="leading-snug">{userFormError}</span>
                </div>
              )}
              <label className="block text-sm font-medium">
                Username
                <input
                  value={userForm.username}
                  onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium">
                Email
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium">
                Role
                <select
                  value={userForm.role}
                  onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={isSavingUser}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSavingUser ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {editingBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSavingBooking) setEditingBooking(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-booking-title"
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="edit-booking-title" className="text-xl font-bold">Edit booking</h2>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                disabled={isSavingBooking}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <FaTimes />
              </button>
            </div>
            <form noValidate onSubmit={saveBooking} className="space-y-4">
              {bookingFormError && (
                <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="leading-snug">{bookingFormError}</span>
                </div>
              )}
              <label className="block text-sm font-medium">
                Movie title
                <input
                  value={bookingForm.movieTitle}
                  onChange={(event) => setBookingForm((current) => ({ ...current, movieTitle: event.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Seats
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={bookingForm.seats}
                    onChange={(event) => setBookingForm((current) => ({ ...current, seats: event.target.value }))}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Total price (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bookingForm.totalPrice}
                    onChange={(event) => setBookingForm((current) => ({ ...current, totalPrice: event.target.value }))}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Status
                <select
                  value={bookingForm.status}
                  onChange={(event) => setBookingForm((current) => ({ ...current, status: event.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  disabled={isSavingBooking}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBooking}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSavingBooking ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {isAuthenticated && (
        <AdminAiChat
          onUnauthorized={() => {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            setIsAuthenticated(false);
          }}
        />
      )}
    </div>
  );
};

function UserTable({ users, onEdit, onDelete }) {
  if (!users.length) return <p className="p-8 text-center text-sm text-gray-500">No users to show.</p>;
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Username</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user._id || user.id} className="hover:bg-gray-50">
              <td className="px-5 py-4 font-medium text-gray-900">{user.username || "—"}</td>
              <td className="px-5 py-4 text-gray-700">{user.email || "—"}</td>
              <td className="px-5 py-4 capitalize text-gray-600">{user.role || "user"}</td>
              <td className="px-5 py-4 text-gray-600">{formatDate(user.createdAt || user.created_at)}</td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(user)}
                    className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingTable({ bookings, onEdit }) {
  if (!bookings.length) return <p className="p-8 text-center text-sm text-gray-500">No bookings to show.</p>;
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Movie</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Seats</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Booked</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-gray-100">
          {bookings.map((booking) => (
            <tr key={booking._id || booking.id} className="hover:bg-gray-50">
              <td className="px-5 py-4 font-medium text-gray-900">{booking.movieTitle || "—"}</td>
              <td className="px-5 py-4 text-gray-700">{booking.user?.username || booking.user?.email || "—"}</td>
              <td className="px-5 py-4 text-gray-700">{booking.seats}</td>
              <td className="px-5 py-4 text-gray-700">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(booking.totalPrice || 0)}</td>
              <td className="px-5 py-4 text-gray-700">{booking.status}</td>
              <td className="px-5 py-4 text-gray-600">{formatDate(booking.bookingDate)}</td>
              <td className="px-5 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(booking)}
                  className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
                >
                  <FaEdit /> Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPage;
