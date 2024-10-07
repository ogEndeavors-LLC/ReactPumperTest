// Header.js
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faPrint,
  faArrowLeft,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

const Header = ({
  isDarkMode,
  quickLink,
  handleQuickLinkChange,
  fromDate,
  handleFromDateChange,
  thruDate,
  handleThruDateChange,
  avgMethod,
  handleAvgMethodChange,
  currentDate,
  handleDateChange,
  handleDateNavigate,
  searchText,
  handleSearchChange,
  selectedTag,
  handleTagChange,
  tagOptions,
  wellType,
  handleWellTypeChange,
  showPriorDay,
  toggleShowPriorDay,
  handleExport,
  handlePrint,
  children,
}) => {
  return (
    <div className="flex items-center gap-4 mb-5">
      {/* Quick Links Dropdown */}
      {handleQuickLinkChange && (
        <select
          value={quickLink}
          onChange={handleQuickLinkChange}
          className={`w-32 ${
            isDarkMode
              ? "bg-gray-800 text-gray-200 border-none"
              : "bg-white text-black border border-gray-300"
          } text-base px-2 py-1 rounded`}
        >
          <option value="custom">Custom</option>
          <option value="3D">Last 3 Days</option>
          <option value="7D">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="CM">Current Month</option>
          <option value="LM">Last Month</option>
          <option value="3M">Last 3 Months</option>
          <option value="6M">Last 6 Months</option>
          <option value="CY">Current Year</option>
          <option value="LY">Last Year</option>
        </select>
      )}

      {/* From Date Input */}
      {handleFromDateChange && (
        <input
          type="date"
          value={fromDate}
          onChange={handleFromDateChange}
          className={`w-30 text-center ${
            isDarkMode
              ? "bg-gray-800 text-gray-200 border-none"
              : "bg-white text-black border border-gray-300"
          } text-base px-2 py-1 rounded`}
        />
      )}

      {/* Thru Date Input */}
      {handleThruDateChange && (
        <input
          type="date"
          value={thruDate}
          onChange={handleThruDateChange}
          className={`w-30 text-center ${
            isDarkMode
              ? "bg-gray-800 text-gray-200 border-none"
              : "bg-white text-black border border-gray-300"
          } text-base px-2 py-1 rounded`}
        />
      )}

      {/* Date Navigation Buttons */}
      {handleDateNavigate && (
        <>
          <button
            onClick={() => handleDateNavigate(-1)}
            className={`${
              isDarkMode
                ? "bg-gray-800 text-gray-200 border-none"
                : "bg-blue-100 text-black border border-gray-300"
            } px-2 py-1 rounded cursor-pointer`}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <input
            type="date"
            value={currentDate}
            onChange={handleDateChange}
            className={`w-30 text-center ${
              isDarkMode
                ? "bg-gray-800 text-gray-200 border-none"
                : "bg-white text-black border border-gray-300"
            } px-2 py-1 rounded`}
          />
          <button
            onClick={() => handleDateNavigate(1)}
            className={`${
              isDarkMode
                ? "bg-gray-800 text-gray-200 border-none"
                : "bg-blue-100 text-black border border-gray-300"
            } px-2 py-1 rounded cursor-pointer`}
          >
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </>
      )}

      {/* Search Input */}
      {handleSearchChange && (
        <input
          type="text"
          placeholder="Search Lease ID / Lease Name / Pumper ID"
          value={searchText}
          onChange={handleSearchChange}
          className={`flex-grow ${
            isDarkMode
              ? "bg-gray-800 text-gray-200 border-none"
              : "bg-white text-black border border-gray-300"
          } px-2 py-1 rounded`}
        />
      )}

      {/* Tag Selection */}
      {handleTagChange && tagOptions && (
        <select
          value={selectedTag}
          onChange={handleTagChange}
          className={`w-32 ${
            isDarkMode
              ? "bg-gray-800 text-gray-200 border-none"
              : "bg-white text-black border border-gray-300"
          } px-2 py-1 rounded`}
        >
          <option value="">All Tags</option>
          {tagOptions.map((tagOption) => (
            <option key={tagOption.TagID} value={tagOption.TagID}>
              {tagOption.TagID} - {tagOption.TagDesc}
            </option>
          ))}
        </select>
      )}

      {/* Well Type Selection */}
      {handleWellTypeChange && (
        <select
          value={wellType}
          onChange={handleWellTypeChange}
          className={`w-36 ${
            isDarkMode
              ? "bg-gray-800 text-gray-200 border-none"
              : "bg-white text-black border border-gray-300"
          } px-2 py-1 rounded`}
        >
          <option value="">Show All</option>
          <option value="I">Injection Only (I)</option>
          <option value="P">Production Only (P)</option>
        </select>
      )}

      {/* Show Prior Day Button */}
      {toggleShowPriorDay && (
        <button
          onClick={toggleShowPriorDay}
          className={`${
            isDarkMode
              ? "bg-gray-800 text-gray-200 border-none"
              : "bg-blue-100 text-black border border-gray-300"
          } px-3 py-1 rounded cursor-pointer`}
        >
          {showPriorDay ? "Hide Prior Day" : "Show Prior Day"}
        </button>
      )}

      {/* Export and Print Icons */}
      {handleExport && (
        <FontAwesomeIcon
          icon={faDownload}
          className={`cursor-pointer text-2xl ${
            isDarkMode ? "text-yellow-400" : "text-blue-600"
          }`}
          onClick={handleExport}
        />
      )}
      {handlePrint && (
        <FontAwesomeIcon
          icon={faPrint}
          className={`cursor-pointer text-2xl ${
            isDarkMode ? "text-yellow-400" : "text-blue-600"
          }`}
          onClick={handlePrint}
        />
      )}

      {/* Additional elements specific to each page */}
      {children}
    </div>
  );
};

export default Header;
