import React, { useState, useEffect, useCallback } from "react";
import { FiBarChart, FiFileText, FiDroplet } from "react-icons/fi";
import { useTheme } from "./ThemeContext";
import { baseUrl } from "./config"; // Import baseUrl from config

const GaugeEntry = () => {
  const { theme } = useTheme();
  const [wells, setWells] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

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
    const currentDate = new Date().toISOString().split("T")[0];
    setSelectedDate(currentDate);
  }, [fetchLeases]);

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-800 to-gray-900 text-white"
          : "bg-gradient-to-br from-indigo-50 to-blue-100 text-gray-800"
      } flex flex-col justify-center items-center p-8`}
    >
      <div
        className={`${
          theme === "dark" ? "bg-gray-700 text-white" : "bg-white text-gray-800"
        } shadow-2xl rounded-3xl p-10 sm:p-12 max-w-4xl w-full`}
      >
        <div className="grid grid-cols-1 gap-8">
          <div className="mb-4">
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

          <div className="mb-4">
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
                  {well.WellName} - {well.LeaseName}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
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
              <option value="Daily Gauges">
                <FiBarChart className="inline-block mr-2" />
                Daily Gauges
              </option>
              <option value="Add Run Ticket">
                <FiFileText className="inline-block mr-2" />
                Run Ticket
              </option>
              <option value="Add Water Tank Ticket">
                <FiDroplet className="inline-block mr-2" />
                Water Tank
              </option>
            </select>
          </div>

          <div className="mb-8">
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-full shadow-lg text-lg transition duration-300 ease-in-out">
              GO
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-full shadow-lg text-lg transition duration-300 ease-in-out">
              View Inventory
            </button>
            <button className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-full shadow-lg text-lg transition duration-300 ease-in-out">
              View Production
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GaugeEntry;
