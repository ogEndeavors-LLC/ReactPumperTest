import React, { useState, useEffect, useCallback } from "react";
import { FiBarChart, FiFileText, FiDroplet, FiUser } from "react-icons/fi";
import { useTheme } from "./ThemeContext";
import { baseUrl } from "./config"; // Import baseUrl from config
import { useUser } from "./UserContext";

const GaugeEntry = () => {
  const { theme } = useTheme();
  const [wells, setWells] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const { userID } = useUser();
  const [userDetails, setUserDetails] = useState(null);

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

  const fetchLeases = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/leases.php`);
      if (!response.ok) throw new Error("Network response was not ok");
      const leaseData = await response.json();

      const allWells = leaseData.flatMap((lease) =>
        lease.Wells.map((well) => ({
          ...well,
          LeaseName: lease.LeaseName,
        }))
      );

      const filteredWells = allWells.filter(
        (well, index) =>
          index === 0 || well.LeaseName !== allWells[index - 1].LeaseName
      );

      setWells(filteredWells);
    } catch (error) {
      console.error("Error fetching leases:", error);
    }
  }, []);

  useEffect(() => {
    fetchLeases();
    fetchUserDetails();
    const currentDate = new Date().toISOString().split("T")[0];
    setSelectedDate(currentDate);
  }, [fetchLeases, fetchUserDetails]);

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
        {/* Enhanced "Hi user, Message" section */}
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

        <div className="grid grid-cols-1 gap-6">
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

          <div>
            <label className="block mb-2 text-lg font-medium">Lease:</label>
            <select
              className={`block w-full ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              } border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out`}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              {wells.map((well, index) => (
                <option key={index} value={well.WellName}>
                  {well.WellName} {well.LeaseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-lg font-medium">Action:</label>
            <select
              className={`block w-full ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-600"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              } border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out`}
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              <option value="Daily Gauges">Daily Gauges</option>
              <option value="Add Run Ticket">Run Ticket</option>
              <option value="Add Water Tank Ticket">Water Tank</option>
            </select>
          </div>

          <div>
            <button className="w-full bg-gradient-to-br from-indigo-900 to-indigo-800 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg text-lg transition duration-300 ease-in-out">
              GO
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="w-full sm:w-auto bg-gradient-to-br from-blue-900 to-blue-800 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg text-lg transition duration-300 ease-in-out">
              View Inventory
            </button>
            <button className="w-full sm:w-auto bg-gradient-to-br from-green-900 to-green-800 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg text-lg transition duration-300 ease-in-out">
              View Production
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GaugeEntry;