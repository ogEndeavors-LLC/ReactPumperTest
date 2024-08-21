import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSpring, animated } from "react-spring";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationCircle,
  faCheckCircle,
  faUser,
  faLock,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/logo.jpg";
import { useUser } from "./UserContext";
import { baseUrl } from "./config"; // Importing the baseUrl from config.js

function SignInPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useUser();
  const [successMessage, setSuccessMessage] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(null);
  const [userID, setUserID] = useState("");
  const [token, setToken] = useState("");

  const formAnimation = useSpring({
    opacity: 1,
    transform: "translateY(0)",
    from: { opacity: 0, transform: "translateY(50px)" },
    config: { mass: 1, tension: 200, friction: 20 },
  });

  useEffect(() => {
    const extractSubdomain = () => {
      const hostname = window.location.hostname;
      const parts = hostname.split(".");
      if (parts.length > 2) {
        const subdomainPart = parts.shift();
        setSubdomain(subdomainPart);
      } else {
        setSubdomain("");
      }
    };

    extractSubdomain();
  }, []);

  const handleForgotPassword = async () => {
    if (username.trim() === "") {
      setError("Please Enter Username");
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/passwordreset.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID: username }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage("Password reset email sent successfully");
        setError(""); // Clear any previous error message
      } else {
        setError("Failed to send password reset email");
        setSuccessMessage(""); // Clear any previous success message
      }
    } catch (error) {
      setError("An error occurred while sending password reset email.");
      setSuccessMessage(""); // Clear any previous success message
    }
  };

  const handleCreateNewUser = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/google_login.php`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (data.success) {
        const { user } = data;
        setUser(user.Role, user.UserID);
        localStorage.setItem("userRole", user.Role);
        localStorage.setItem("userID", user.UserID);
        navigate("/home");
      } else {
        setError("Failed to create new user");
      }
    } catch (error) {
      setError("An error occurred while creating new user");
    }

    setShowPrompt(false);
  };

  function hashPassword(password) {
    let hash = 0,
      i,
      chr;
    for (i = 0; i < password.length; i++) {
      chr = password.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async function handleSignIn(e) {
    e.preventDefault();
    try {
      if (!navigator.onLine) {
        handleOfflineSignIn(e);
      } else {
        const response = await fetch(`${baseUrl}/api/login_api.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        const { success, message, user } = data;

        if (success) {
          setUser(user.Role, user.UserID);
          localStorage.setItem("userRole", user.Role);
          localStorage.setItem("userID", user.UserID);
          localStorage.setItem(
            "credentials",
            JSON.stringify({
              username,
              password: hashPassword(password),
              role: user.Role,
              userID: user.UserID,
            })
          );

          if (user.Role === "P") {
            navigate("/pumper");
          } else {
            navigate("/home");
          }
        } else {
          setError(message);
        }
      }
    } catch (error) {
      setError("An error occurred while signing in.");
    }
  }

  function handleOfflineSignIn() {
    const storedCredentials = JSON.parse(localStorage.getItem("credentials"));
    if (storedCredentials) {
      const {
        username: storedUsername,
        password: storedPasswordHash,
        role,
        userID,
      } = storedCredentials;
      const enteredPasswordHash = hashPassword(password);

      if (
        username === storedUsername &&
        enteredPasswordHash === storedPasswordHash
      ) {
        setUser(role, userID);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userID", userID);

        navigate("/home");
      } else {
        setError("Invalid credentials. Please sign in online first.");
      }
    } else {
      setError("No saved credentials available. Please sign in online first.");
    }
  }

  const handleGoogleLoginSuccess = (response) => {
    const token = response.credential;

    fetch(`${baseUrl}/api/google_login.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const { user } = data;
          setUser(user.Role, user.UserID);
          localStorage.setItem("userRole", user.Role);
          localStorage.setItem("userID", user.UserID);
          navigate("/home");
        } else if (data.message === "User not found") {
          setShowPrompt(true);
          setToken(token);
        } else {
          setError(data.message);
        }
      })
      .catch((error) => {
        setError("An error occurred during Google Sign-In.");
      });
  };

  const handleExistingUserSubmit = () => {
    fetch(`${baseUrl}/api/google_login.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, userID, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const { user } = data;
          setUser(user.Role, user.UserID);
          localStorage.setItem("userRole", user.Role);
          localStorage.setItem("userID", user.UserID);
          navigate("/home");
        } else {
          setError("Google Sign-In failed.");
        }
      })
      .catch((error) => {
        setError("An error occurred during Google Sign-In.");
      });

    setShowPrompt(false);
  };

  const handleGoogleLoginError = () => {
    setError("Google Sign-In failed.");
  };

  return (
    <GoogleOAuthProvider clientId="43210536118-10g29la6m8pfd5epk6u16851igpnlrqc.apps.googleusercontent.com">
      <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-r from-gray-100 to-gray-200">
        <animated.div
          style={formAnimation}
          className="bg-white shadow-2xl rounded-lg px-6 py-10 sm:px-12 sm:py-14 max-w-md w-full transform hover:scale-105 transition-transform duration-500 relative z-10 flex flex-col justify-center min-h-screen sm:min-h-0"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-gray-400 to-gray-500 rounded-t-lg animate-pulse"></div>
          <img
            src={logo}
            className="w-40 sm:w-32 mx-auto mb-6 sm:mb-8 rounded-full border-4 border-white shadow-md animate-float"
            alt="logo"
          />
          {subdomain && (
            <p className="text-xl font-semibold text-gray-800 text-center mb-6">
              {subdomain.charAt(0).toUpperCase() + subdomain.slice(1)}
            </p>
          )}
          <form className="space-y-6 sm:space-y-8" onSubmit={handleSignIn}>
            <div>
              <label
                className="block text-gray-700 font-semibold mb-2 text-base sm:text-lg"
                htmlFor="username"
              >
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Username
              </label>
              <input
                className="w-full border-gray-300 border-2 rounded-md px-4 py-2 sm:px-5 sm:py-3 text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-gray-400 focus:border-transparent transition-all duration-300"
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label
                className="block text-gray-700 font-semibold mb-2 text-base sm:text-lg"
                htmlFor="password"
              >
                <FontAwesomeIcon icon={faLock} className="mr-2" />
                Password
              </label>
              <input
                className="w-full border-gray-300 border-2 rounded-md px-4 py-2 sm:px-5 sm:py-3 text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-gray-400 focus:border-transparent transition-all duration-300"
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {successMessage && (
              <p className="text-green-500 text-base sm:text-lg animate-pulse">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                {successMessage}
              </p>
            )}

            {error && (
              <p className="text-red-500 text-base sm:text-lg animate-pulse">
                <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
                {error}
              </p>
            )}
            <button
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-gray-600 transform hover:scale-105 transition-transform duration-500 shadow-lg text-lg sm:text-xl"
              type="submit"
            >
              Sign In
            </button>
            <p className="text-gray-600 text-center text-base sm:text-lg">
              <a
                className="text-gray-700 hover:text-gray-800 underline transition-colors duration-300"
                href="#"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </a>
            </p>
          </form>
          <div className="flex justify-center mt-6">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              scope="openid profile email"
              className="w-full"
            />
          </div>
        </animated.div>

        {showPrompt && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 space-y-6 max-w-lg mx-auto text-center relative">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowPrompt(false);
                  setIsExistingUser(null);
                }}
              >
                <FontAwesomeIcon icon={faTimes} className="text-2xl" />
              </button>
              <FontAwesomeIcon
                icon={faExclamationCircle}
                className="text-red-500 text-4xl mb-4"
              />
              <h2 className="text-2xl font-semibold text-gray-700">
                User Not Found
              </h2>
              <p className="text-gray-600">Are you an existing user?</p>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  className="bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 transition duration-300 shadow-md"
                  onClick={() => setIsExistingUser(true)}
                >
                  Yes
                </button>
                <button
                  className="bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-600 transition duration-300 shadow-md"
                  onClick={() => setIsExistingUser(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {isExistingUser !== null && isExistingUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 space-y-6 max-w-lg mx-auto text-center relative">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowPrompt(false);
                  setIsExistingUser(null);
                }}
              >
                <FontAwesomeIcon icon={faTimes} className="text-2xl" />
              </button>
              <FontAwesomeIcon
                icon={faUser}
                className="text-blue-500 text-4xl mb-4"
              />
              <h2 className="text-2xl font-semibold text-gray-700">
                Enter your User ID
              </h2>
              <input
                type="text"
                value={userID}
                onChange={(e) => setUserID(e.target.value)}
                className="w-full border-gray-300 border-2 rounded-md px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-gray-400 focus:border-transparent transition-all duration-300"
                placeholder="User ID"
              />
              <button
                className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600 transition duration-300 shadow-md mt-4"
                onClick={handleExistingUserSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {isExistingUser !== null && !isExistingUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 space-y-6 max-w-lg mx-auto text-center relative">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowPrompt(false);
                  setIsExistingUser(null);
                }}
              >
                <FontAwesomeIcon icon={faTimes} className="text-2xl" />
              </button>
              <FontAwesomeIcon
                icon={faLock}
                className="text-yellow-500 text-4xl mb-4"
              />
              <h2 className="text-2xl font-semibold text-gray-700">
                Create a New Password
              </h2>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-gray-300 border-2 rounded-md px-4 py-2 text-base focus:outline-none focus:ring-4 focus:ring-gray-400 focus:border-transparent transition-all duration-300"
                placeholder="New Password"
              />
              <button
                className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600 transition duration-300 shadow-md mt-4"
                onClick={handleCreateNewUser}
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default SignInPage;
