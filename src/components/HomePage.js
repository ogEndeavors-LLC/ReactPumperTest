import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaClipboardList,
  FaFileAlt,
  FaPen,
  FaFlask,
  FaArrowDown,
  FaTachometerAlt,
} from "react-icons/fa";
import { useTheme } from "./ThemeContext";
import moment from "moment";
const Homepage = () => {
  // Use the theme from context
  const { theme } = useTheme();
  // Initialize the navigate function for routing
  const navigate = useNavigate();
  // Determine if dark mode is active
  const isDarkMode = theme === "dark";

  // Navigation handlers
  const handleGaugeEntryClick = () => {
    navigate("/pumper");
  };

  const handleCurrentProductionClick = () => {
    navigate("/prod");
  };

  const handleInventoryByLeaseClick = () => {
    navigate("/inv?type=lease");
  };

  const handleReportsClick = () => {
    navigate("/reports");
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-gray-100"
          : "bg-gradient-to-r from-gray-50 via-gray-200 to-gray-300 text-gray-800"
      } flex flex-col justify-start items-center px-4 sm:px-6 lg:px-8`}
    >
      {/* Main content container */}
      <div
        className={`${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } shadow-2xl rounded-3xl p-10 sm:p-12 max-w-6xl w-full mt-16`}
      >
        {/* Dashboard title */}
        <h1
          className={`text-4xl sm:text-6xl font-extrabold mb-12 text-center tracking-wide ${
            isDarkMode ? "text-gray-100" : "text-gray-800"
          }`}
        ></h1>

        {/* Grid container for dashboard sections */}
        <div className="grid grid-cols-1 gap-8">
          {/* Top Row: Current Production & Injection */}
          <div
            className={`${
              isDarkMode
                ? "bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600"
                : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400"
            } p-10 rounded-xl shadow-lg border-t-4 cursor-pointer transition-all duration-300 hover:shadow-2xl`}
            onClick={handleCurrentProductionClick}
          >
            <h2
              className={`flex items-center justify-center text-2xl font-bold text-center ${
                isDarkMode ? "text-blue-400" : "text-blue-700"
              }`}
            >
              <FaTachometerAlt
                className={`h-8 w-8 ${
                  isDarkMode ? "text-blue-400" : "text-blue-500"
                } mr-3`}
              />
              Current Production & Injection
            </h2>
          </div>

          {/* Middle Section: 3 Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Inventory by Lease */}
            <div
              className={`p-10 rounded-xl shadow-lg border-t-4 cursor-pointer transition-all duration-300 hover:shadow-2xl ${
                isDarkMode
                  ? "bg-gray-700 border-gray-500"
                  : "bg-white border-gray-200"
              }`}
              onClick={handleInventoryByLeaseClick}
            >
              <h2
                className={`flex items-center text-2xl font-bold ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <FaClipboardList
                  className={`h-8 w-8 ${
                    isDarkMode ? "text-gray-400" : "text-gray-400"
                  } mr-3`}
                />
                Inventory by Lease
              </h2>
            </div>

            <div
              className={`p-10 rounded-xl shadow-lg border-t-4 cursor-pointer transition-all duration-300 hover:shadow-2xl ${
                isDarkMode
                  ? "bg-gray-700 border-gray-500"
                  : "bg-white border-gray-200"
              }`}
              onClick={() => {
                const startDate = moment()
                  .subtract(1, "month")
                  .startOf("month")
                  .format("YYYY-MM-DD");
                const thruDate = moment().format("YYYY-MM-DD");
                navigate(
                  `/reports?Rpt=O&LeaseID=&StartDate=${startDate}&Thru=${thruDate}`
                );
              }}
            >
              <h2
                className={`flex items-center text-2xl font-bold ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <FaClipboardList
                  className={`h-8 w-8 ${
                    isDarkMode ? "text-gray-400" : "text-gray-400"
                  } mr-3`}
                />
                Inventory by Tank
              </h2>
            </div>

            {/* Reports */}
            <div
              className={`p-10 rounded-xl shadow-lg border-t-4 cursor-pointer transition-all duration-300 hover:shadow-2xl ${
                isDarkMode
                  ? "bg-gray-700 border-gray-500"
                  : "bg-white border-gray-200"
              }`}
              onClick={handleReportsClick}
            >
              <h2
                className={`flex items-center text-2xl font-bold ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <FaChartBar
                  className={`h-8 w-8 ${
                    isDarkMode ? "text-gray-400" : "text-gray-400"
                  } mr-3`}
                />
                Reports
              </h2>
            </div>

            {/* Notes */}
            <div
              className={`p-10 rounded-xl shadow-lg border-t-4 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-500"
                  : "bg-white border-gray-200"
              }`}
            >
              <h2
                className={`flex items-center text-2xl font-bold ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <FaPen
                  className={`h-8 w-8 ${
                    isDarkMode ? "text-gray-400" : "text-gray-400"
                  } mr-3`}
                />
                Notes
              </h2>
            </div>

            {/* Well Tests */}
            <div
              className={`p-10 rounded-xl shadow-lg border-t-4 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-500"
                  : "bg-white border-gray-200"
              }`}
            >
              <h2
                className={`flex items-center text-2xl font-bold ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <FaFlask
                  className={`h-8 w-8 ${
                    isDarkMode ? "text-gray-400" : "text-gray-400"
                  } mr-3`}
                />
                Well Tests
              </h2>
            </div>

            {/* Wells Down */}
            <div
              className={`p-10 rounded-xl shadow-lg border-t-4 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-500"
                  : "bg-white border-gray-200"
              }`}
            >
              <h2
                className={`flex items-center text-2xl font-bold ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <FaArrowDown
                  className={`h-8 w-8 ${
                    isDarkMode ? "text-gray-400" : "text-gray-400"
                  } mr-3`}
                />
                Wells Down
              </h2>
            </div>
          </div>

          {/* Bottom Row: Gauge Entry (Clickable) */}
          <div
            className={`${
              isDarkMode
                ? "bg-gradient-to-br from-indigo-900 to-indigo-800 border-indigo-600"
                : "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-400"
            } p-10 rounded-xl shadow-lg border-t-4 cursor-pointer transition-all duration-300 hover:shadow-2xl`}
            onClick={handleGaugeEntryClick}
          >
            <h2
              className={`flex items-center justify-center text-2xl font-bold text-center ${
                isDarkMode ? "text-indigo-400" : "text-indigo-700"
              }`}
            >
              <FaChartBar
                className={`h-8 w-8 ${
                  isDarkMode ? "text-indigo-400" : "text-indigo-500"
                } mr-3`}
              />
              Gauge Entry
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
