import React, { useState, useEffect, useCallback } from "react";
import { FiUser } from "react-icons/fi";
import { useTheme } from "./ThemeContext";
import { baseUrl } from "./config";
import { useUser } from "./UserContext";
import { useNavigate } from "react-router-dom";

/**
 * This component:
 *  1. Fetches user details & all leases on mount.
 *  2. Each lease includes Tanks, Wells, DailyGauges, etc. (from the new leases.php).
 *  3. Filters leases for the current user (unless admin).
 *  4. Lets you select a lease + date + action, then navigates to Gauges page
 *     passing the entire selected lease object in state.
 *  5. Does NOT call service_getgauges.php; we rely on the data from leases.php.
 */
const GaugeEntry = () => {
  const { theme } = useTheme();
  const { userID } = useUser();
  const navigate = useNavigate();

  // State for user details
  const [userDetails, setUserDetails] = useState(null);

  // State for all leases from API (or localStorage if offline)
  const [leases, setLeases] = useState([]);

  // State for selected date
  const [selectedDate, setSelectedDate] = useState("");

  // State for which lease is currently chosen in the dropdown
  const [selectedLeaseID, setSelectedLeaseID] = useState("");

  // State for chosen action
  const [selectedAction, setSelectedAction] = useState("Daily Gauges");

  /////////////////////////////////////////////////////////////////////////////
  // 1) Fetch user details
  /////////////////////////////////////////////////////////////////////////////
  const fetchUserDetails = useCallback(async () => {
    try {
      const response = await fetch(
        `${baseUrl}/api/userdetails.php?id=${userID}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      if (data.success) {
        setUserDetails(data.user);
      } else {
        console.error("Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }, [userID]);

  /////////////////////////////////////////////////////////////////////////////
  // 2) Fetch all leases (with ?user=...) from your new leases.php
  //    Always commit leases to localStorage, and if offline or error, fallback.
  /////////////////////////////////////////////////////////////////////////////
  const fetchLeases = useCallback(async () => {
    // 1) If offline, skip fetch & use localStorage
    if (!navigator.onLine) {
      console.log("Offline mode detected, using localStorage for leases");
      const storedLeases = localStorage.getItem("leases");
      if (storedLeases) {
        setLeases(JSON.parse(storedLeases));
      }
      return;
    }

    // 2) Otherwise, attempt the fetch from the API
    try {
      const response = await fetch(`${baseUrl}/api/leases.php?user=${userID}`);
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.leases)) {
        // Update state & localStorage
        setLeases(data.leases);
        localStorage.setItem("leases", JSON.stringify(data.leases));
      } else {
        console.error("Failed to fetch leases or malformed data:", data);
        // fallback to localStorage
        const storedLeases = localStorage.getItem("leases");
        if (storedLeases) {
          setLeases(JSON.parse(storedLeases));
        }
      }
    } catch (error) {
      console.error("Error fetching leases:", error);
      // fallback to localStorage
      const storedLeases = localStorage.getItem("leases");
      if (storedLeases) {
        setLeases(JSON.parse(storedLeases));
      }
    }
  }, [userID]);

  /////////////////////////////////////////////////////////////////////////////
  // 3) useEffect to fetch data on mount & set default date
  /////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    fetchUserDetails();
    fetchLeases();
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }, [fetchUserDetails, fetchLeases]);

  /////////////////////////////////////////////////////////////////////////////
  // 4) Determine if user is Admin
  /////////////////////////////////////////////////////////////////////////////
  const isAdmin =
    userDetails?.IsAdmin === "Y" ||
    userDetails?.UserID?.toLowerCase() === "admin" ||
    userDetails?.Role?.toLowerCase() === "a" ||
    userDetails?.Role?.toLowerCase() === "i";

  /////////////////////////////////////////////////////////////////////////////
  // 5) Filter leases for this user (unless Admin)
  /////////////////////////////////////////////////////////////////////////////
  const filteredLeases = leases
    .filter((lease) => {
      return (
        isAdmin ||
        lease.PumperID?.toLowerCase() === userID?.toLowerCase() ||
        lease.ReliefID?.toLowerCase() === userID?.toLowerCase()
      );
    })
    .sort((a, b) => a.LeaseName.localeCompare(b.LeaseName));

  /////////////////////////////////////////////////////////////////////////////
  // 6) Optionally read "activeLease" from URL, pick next lease, etc.
  /////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (selectedLeaseID) return;

    const urlParams = new URLSearchParams(window.location.search);
    const activeLeaseParam = urlParams.get("activeLease") || "";

    if (filteredLeases.length > 0) {
      const idx = filteredLeases.findIndex(
        (l) => l.LeaseID === activeLeaseParam
      );
      if (idx >= 0 && idx < filteredLeases.length - 1) {
        setSelectedLeaseID(filteredLeases[idx + 1].LeaseID);
      } else {
        setSelectedLeaseID(filteredLeases[0].LeaseID);
      }
    }
  }, [filteredLeases, selectedLeaseID]);

  /////////////////////////////////////////////////////////////////////////////
  // 7) Handle the GO button click -> Navigate to Gauges screen
  //    passing the entire selected lease object in state.
  //    If offline, use localStorage data to find the selected lease.
  /////////////////////////////////////////////////////////////////////////////
  const handleGoClick = () => {
    if (!selectedLeaseID) {
      alert("Please select a Lease first.");
      return;
    }

    let selLease = filteredLeases.find((l) => l.LeaseID === selectedLeaseID);

    // If offline, try to fetch from localStorage
    if (!navigator.onLine) {
      const storedLeases = localStorage.getItem("leases");
      if (storedLeases) {
        const parsedLeases = JSON.parse(storedLeases);
        selLease = parsedLeases.find((l) => l.LeaseID === selectedLeaseID);
      }
    }

    if (!selLease) {
      alert("Selected lease not found. Please choose again.");
      return;
    }
    console.log(selLease);

    navigate(
      `/GaugeEntry?leaseid=${selectedLeaseID}&date=${selectedDate}&action=${selectedAction}`,
      {
        state: {
          lease: selLease, // includes DailyGauges if provided by the API
          gaugeDate: selectedDate,
          action: selectedAction,
        },
      }
    );
  };

  /////////////////////////////////////////////////////////////////////////////
  // RENDER
  /////////////////////////////////////////////////////////////////////////////
  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-gray-100"
          : "bg-gradient-to-r from-gray-50 via-gray-200 to-gray-300 text-gray-800"
      } flex flex-col justify-start items-center pt-8 px-4 sm:px-6 lg:px-8`}
    >
      <div
        className={`${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        } shadow-2xl rounded-2xl p-6 sm:p-8 max-w-md w-full mt-8`}
      >
        {/* Header / greeting area */}
        <div
          className={`flex items-center justify-center mb-8 p-4 rounded-xl shadow-lg ${
            theme === "dark" ? "bg-gray-700" : "bg-gray-100"
          }`}
        >
          <div className="flex-shrink-0 mr-4">
            {userDetails?.avatarUrl ? (
              <img
                className="h-16 w-16 rounded-full object-cover"
                src={userDetails.avatarUrl}
                alt="User Avatar"
              />
            ) : (
              <div
                className={`h-16 w-16 rounded-full flex items-center justify-center ${
                  theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                }`}
              >
                <FiUser
                  className={`h-8 w-8 ${
                    theme === "dark" ? "text-gray-200" : "text-gray-700"
                  }`}
                />
              </div>
            )}
          </div>
          <div>
            <h1
              className={`text-xl sm:text-xl font-bold tracking-wide ${
                theme === "dark" ? "text-gray-100" : "text-gray-800"
              }`}
            >
              {userDetails ? `Hi, ${userDetails.UserID}!` : "Loading..."}
            </h1>
            <p
              className={`mt-1 text-lg ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {userDetails?.Message}
            </p>
          </div>
        </div>

        {/* Main form */}
        <div className="grid grid-cols-1 gap-6">
          {/* Gauge Date */}
          <div>
            <label className="block mb-2 text-lg font-medium">
              Gauge Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`block w-full ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              } border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out`}
            />
          </div>

          {/* Lease Selector */}
          <div>
            <label className="block mb-2 text-lg font-medium">Lease:</label>
            <select
              className={`block w-full ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              } border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out`}
              value={selectedLeaseID}
              onChange={(e) => setSelectedLeaseID(e.target.value)}
            >
              <option value="">-- Select a Lease --</option>
              {filteredLeases.map((lease) => (
                <option key={lease.LeaseID} value={lease.LeaseID}>
                  {lease.LeaseName}
                </option>
              ))}
            </select>
          </div>

          {/* Action Selector */}
          <div>
            <label className="block mb-2 text-lg font-medium">Action:</label>
            <select
              className={`block w-full ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              } border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out`}
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="Daily Gauges">Daily Gauges</option>
              <option value="Add Run Ticket">Run Ticket</option>
              <option value="Add Water Tank Ticket">Water Tank</option>
            </select>
          </div>

          {/* GO button -> Navigates to Gauges page with lease data in state */}
          <div>
            <button
              className="w-full bg-gradient-to-br from-indigo-900 to-indigo-800 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg text-lg transition duration-300 ease-in-out"
              onClick={handleGoClick}
            >
              GO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GaugeEntry;
