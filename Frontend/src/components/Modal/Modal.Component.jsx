import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BiChevronDown } from "react-icons/bi";
import { login, register, verifyOtp } from "../../services/authApi";
import { adminApi } from "../../services/adminApi";

const CustomModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [signedInUser, setSignedInUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  const closeModal = () => {
    window.__isAuthModalOpen = false;
    setIsOpen(false);
    setIsRegisterMode(false);
    setAuthError("");
    setEmail("");
    setName("");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setIsOtpSent(false);
    setAuthMessage("");
  };

  const openModal = () => {
    window.__isAuthModalOpen = true;
    setIsOpen(true);
    setIsRegisterMode(false);
    setIsOtpSent(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setSignedInUser(null);
    setIsDropdownOpen(false);
    window.dispatchEvent(new CustomEvent("bookmyevent:user-changed", { detail: null }));
    navigate("/");
  };

  const handleEmailRegistration = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");

    // Custom client-side validation
    if (isRegisterMode && !isOtpSent) {
      if (!name.trim()) {
        setAuthError("Please enter your full name.");
        return;
      }
      if (!email.trim()) {
        setAuthError("Please enter your email address.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setAuthError("Please enter a valid email address.");
        return;
      }
      if (!password) {
        setAuthError("Please enter a password.");
        return;
      }
      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        return;
      }
      if (!confirmPassword) {
        setAuthError("Please confirm your password.");
        return;
      }
      if (password !== confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }
    } else if (isRegisterMode && isOtpSent) {
      if (!otp.trim()) {
        setAuthError("Please enter the 6-digit verification code.");
        return;
      }
      if (!/^\d{6}$/.test(otp.trim())) {
        setAuthError("Verification code must be exactly 6 digits.");
        return;
      }
    } else {
      if (!email.trim()) {
        setAuthError("Please enter your email address.");
        return;
      }
      if (!password) {
        setAuthError("Please enter your password.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let result;
      if (isRegisterMode && isOtpSent) {
        result = await verifyOtp({ email: email.trim(), otp });
      } else if (isRegisterMode) {
        result = await register({ username: name.trim(), email: email.trim(), password });
        setIsOtpSent(true);
        setAuthMessage("");
        setAuthError("");
        return;
      } else {
        try {
          result = await login({ email: email.trim(), password });
        } catch (customerLoginError) {
          if (customerLoginError.response?.status !== 404) {
            throw customerLoginError;
          }

          let adminResult;
          try {
            adminResult = await adminApi.login({ email: email.trim(), password });
          } catch (adminLoginError) {
            if (adminLoginError.status !== 401) {
              throw adminLoginError;
            }
            throw customerLoginError;
          }

          localStorage.setItem("adminToken", adminResult.token);
          localStorage.setItem("adminUser", JSON.stringify(adminResult.admin));
          closeModal();
          navigate("/admin");
          return;
        }
      }

      const userObject = {
        ...result,
        given_name: result.username || name.trim() || email.split("@")[0],
      };

      localStorage.setItem("user", JSON.stringify(userObject));
      setSignedInUser(userObject);
      window.dispatchEvent(new CustomEvent("bookmyevent:user-signed-in", { detail: userObject }));
      window.dispatchEvent(new CustomEvent("bookmyevent:user-changed", { detail: userObject }));
      closeModal();
      if (window.location.pathname.startsWith("/admin")) {
        navigate("/admin");
      }
    } catch (error) {
      setAuthError(
        error.response?.data?.message ||
          "Unable to connect to the server. Make sure the backend is running and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setAuthError("");
    setAuthMessage("");
    setIsSubmitting(true);
    try {
      await register({ username: name.trim(), email: email.trim(), password });
      setOtp("");
      setAuthMessage("A new verification code was sent.");
    } catch (error) {
      setAuthError(
        error.response?.data?.message ||
          "Unable to send a new verification code. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for programmatic auth trigger (e.g. from checkout or reviews)
  useEffect(() => {
    const handleOpenAuth = () => {
      if (window.__isAuthModalOpen) return;
      window.__isAuthModalOpen = true;
      setIsOpen(true);
      setIsRegisterMode(false);
      setIsOtpSent(false);
      setAuthError("");
      setAuthMessage("");
    };

    const handleUserChanged = (e) => {
      if (e.detail) {
        setSignedInUser(e.detail);
      } else {
        try {
          setSignedInUser(JSON.parse(localStorage.getItem("user") || "null"));
        } catch {
          setSignedInUser(null);
        }
      }
    };

    window.addEventListener("bookmyevent:open-auth", handleOpenAuth);
    window.addEventListener("bookmyevent:user-signed-in", handleUserChanged);
    window.addEventListener("bookmyevent:user-changed", handleUserChanged);
    return () => {
      window.removeEventListener("bookmyevent:open-auth", handleOpenAuth);
      window.removeEventListener("bookmyevent:user-signed-in", handleUserChanged);
      window.removeEventListener("bookmyevent:user-changed", handleUserChanged);
    };
  }, []);

  return (
    <>
      {signedInUser ? (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-red-600 text-white px-3 py-1 text-sm rounded flex items-center gap-2 hover:bg-red-700 transition"
          >
            Hi, {signedInUser.given_name || signedInUser.username || signedInUser.email}
            <BiChevronDown
              className={`transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={openModal}
          className="bg-red-600 text-white px-2 py-1 text-sm rounded hover:bg-red-700 transition"
        >
          Sign In
        </button>
      )}

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-[70] overflow-y-auto"
          onClose={closeModal}
        >
          <div className="min-h-screen flex items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
            </Transition.Child>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <button
                  onClick={closeModal}
                  className="absolute top-8 right-6 text-gray-500 hover:text-gray-700"
                >
                  {/* Close button icon */}
                  <svg
                    width="15"
                    height="15"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="#666"
                    className="fill-current"
                  >
                    <path d="M13.125 0l-7.5 7.5 7.5 7.5 1.429-1.428L8.482 7.5l6.072-6.071z"></path>
                    <path d="M1.429 0l7.5 7.5-7.5 7.5-1.43-1.428L6.072 7.5 0 1.43z"></path>
                  </svg>
                </button>

                <h2 className="text-2xl font-bold text-center mb-2">
                  {isOtpSent ? "Verify your email" : isRegisterMode ? "Create Account" : "Get Started"}
                </h2>

                <p className="text-center text-gray-500 text-sm mb-6">
                  {isOtpSent
                    ? `Enter the 6-digit code sent to ${email}.`
                    : isRegisterMode
                    ? "Join us today and start booking!"
                    : "Sign in with your email and password"}
                </p>

                {/* Email Form */}
                <form noValidate onSubmit={handleEmailRegistration}>
                  {authError && (
                    <div
                      role="alert"
                      className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="leading-snug">{authError}</span>
                    </div>
                  )}

                  {authMessage && (
                    <div
                      role="status"
                      className="mb-4 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 shadow-sm"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="leading-snug">{authMessage}</span>
                    </div>
                  )}

                  {isRegisterMode && !isOtpSent && (
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                      />
                    </div>
                  )}

                  {!isOtpSent && (
                    <>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </>
                  )}

                  {isOtpSent && (
                    <div className="mb-6">
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Verification code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter 6-digit code"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                      />
                    </div>
                  )}

                  {isRegisterMode && !isOtpSent && (
                    <div className="mb-6">
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-full mb-4 hover:bg-red-700 transition font-medium"
                  >
                    {isSubmitting
                      ? "Please wait..."
                      : isOtpSent
                        ? "Verify Email"
                      : isRegisterMode
                        ? "Create Account"
                        : "Sign In"}
                  </button>
                </form>

                {isOtpSent && (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                    className="w-full mb-4 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}

                {/* Toggle Mode */}
                <div className="text-center">
                  <p className="text-gray-600 text-sm">
                    {isRegisterMode ? "Already have an account? " : "Don't have an account? "}
                    <button
                      onClick={() => {
                        setIsRegisterMode(!isRegisterMode);
                        setIsOtpSent(false);
                        setOtp("");
                        setAuthError("");
                        setAuthMessage("");
                      }}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      {isRegisterMode ? "Sign In" : "Register"}
                    </button>
                  </p>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-center justify-center mt-6">
                  <label
                    htmlFor="termsCheckbox"
                    className="text-center text-gray-600 text-xs"
                  >
                    I agree to the{" "}
                    <a
                      href="/terms-and-conditions"
                      target="_blank"
                      className="text-blue-500"
                    >
                      Terms & Conditions
                    </a>{" "}
                    &amp;{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      className="text-blue-500"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default CustomModal;
