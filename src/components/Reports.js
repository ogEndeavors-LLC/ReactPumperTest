import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { useTheme } from "./ThemeContext";
import Header from "./GridHeader"; // Improved header component
import GridLoader from "./GridLoader"; // Loader component
import moment from "moment";
import { baseUrl } from "./config.js"; // Import baseUrl for API calls
import "ag-grid-community/styles/ag-grid.css"; // AG-Grid styles
import "ag-grid-community/styles/ag-theme-alpine.css"; // AG-Grid theme

const ReportPage = () => {
  const { theme = "light" } = useTheme() || {};
  const isDarkMode = theme === "dark";

  // State variables for form inputs
  const [reportFrom, setReportFrom] = useState(
    moment().startOf("month").format("YYYY-MM-DD")
  );
  const [reportThru, setReportThru] = useState(
    moment().subtract(1, "days").endOf("month").format("YYYY-MM-DD")
  );
  const [selectedReport, setSelectedReport] = useState("P"); // Default to "Production"
  const [leaseID, setLeaseID] = useState("");
  const [wellID, setWellID] = useState("~ALL~");
  const [leases, setLeases] = useState([]);
  const [wells, setWells] = useState([]);
  const [showWells, setShowWells] = useState(false); // Conditional rendering for wells dropdown
  const [loading, setLoading] = useState(false); // Loading state
  const [rowData, setRowData] = useState([]); // Data for the grid
  const [selectedTag, setSelectedTag] = useState("");
  const [currentDate, setCurrentDate] = useState(moment().format("YYYY-MM-DD"));
  const [wellType, setWellType] = useState("");

  // Fetch leases and wells data
  useEffect(() => {
    fetchLeases();
  }, []); // Fetch leases only once on component mount

  const fetchWells = () => {};
  // Fetch data whenever leaseID, reportFrom, or reportThru changes
  useEffect(() => {
    fetchData();
  }, [leaseID, reportFrom, reportThru]);

  const fetchLeases = async () => {
    setLoading(true);
    try {
      // API call to fetch lease data (using baseUrl)
      const response = await fetch(`${baseUrl}/api/leases.php`);
      const data = await response.json();
      setLeases(data); // Set lease data from the API
    } catch (error) {
      console.error("Error fetching leases:", error);
    }
    setLoading(false);
  };

  // Fetch data for the grid based on filters
  const fetchData = async () => {
    setLoading(true);
    try {
      // Construct the API URL with the correct parameters
      let apiUrl = `${baseUrl}/service_testcurrent.php`;
      const apiParams = new URLSearchParams();

      // Always include the report type "P"
      apiParams.append("Rpt", "P");

      // Include LeaseID, WellID, From, and Thru
      if (leaseID) apiParams.append("LeaseID", leaseID);
      if (wellID) apiParams.append("WellID", wellID);
      if (reportFrom) apiParams.append("From", reportFrom);
      if (reportThru) apiParams.append("Thru", reportThru);

      // Append the parameters to the URL
      apiUrl += `?${apiParams.toString()}`;

      const response = await fetch(apiUrl);
      const data = await response.json();
      setRowData(data); // Set the fetched data to rowData for AG-Grid
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };
  // Column definitions for AG-Grid
  const columnDefs = useMemo(
    () => [
      {
        headerName: "Gross Bbls",
        field: "Produced",
        sortable: true,
        filter: true,
        valueFormatter: (params) => parseFloat(params.value || 0).toFixed(2),
      },
      {
        headerName: "Run Bbls",
        field: "RunBbls",
        sortable: true,
        filter: true,
        valueFormatter: (params) => parseFloat(params.value || 0).toFixed(2),
      },
      {
        headerName: "BS&W Draws",
        field: "DrawBbls",
        sortable: true,
        filter: true,
        valueFormatter: (params) => parseFloat(params.value || 0).toFixed(2),
      },
      {
        headerName: "Water",
        field: "WaterTotal",
        sortable: true,
        filter: true,
        valueFormatter: (params) => parseFloat(params.value || 0).toFixed(2),
      },
      {
        headerName: "Water Hauled",
        field: "WaterHauledBbls",
        sortable: true,
        filter: true,
        valueFormatter: (params) => parseFloat(params.value || 0).toFixed(2),
      },
      {
        headerName: "Comment",
        field: "gaugecomments",
        sortable: true,
        filter: true,
      },
      {
        headerName: "Tbg",
        field: "tbg",
        sortable: true,
        filter: true,
        valueFormatter: (params) => parseFloat(params.value || 0).toFixed(2),
      },
      {
        headerName: "Csg",
        field: "csg",
        sortable: true,
        filter: true,
        valueFormatter: (params) => parseFloat(params.value || 0).toFixed(2),
      },
      { headerName: "SPCC", field: "SPCC", sortable: true, filter: true },
    ],
    []
  );

  // Handle input changes
  const handleReportFromChange = (e) => setReportFrom(e.target.value);
  const handleReportThruChange = (e) => setReportThru(e.target.value);
  const handleReportTypeChange = (e) => {
    setSelectedReport(e.target.value);
    setShowWells(["W", "WE"].includes(e.target.value)); // Show wells for certain report types
  };

  const handleLeaseChange = (e) => {
    setLeaseID(e.target.value);
    fetchWells(e.target.value); // Fetch wells based on the selected lease
  };

  const handleWellChange = (e) => setWellID(e.target.value);

  // Function to handle Export
  const handleExport = () => {
    console.log("Exporting data...");
  };

  // Function to handle Print
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <GridLoader isDarkMode={isDarkMode} />;
  }

  return (
    <div
      className={`container mx-auto px-4 py-6 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      {/* Header Component */}
      <Header
        isDarkMode={isDarkMode}
        fromDate={reportFrom}
        handleFromDateChange={handleReportFromChange}
        thruDate={reportThru}
        handleThruDateChange={handleReportThruChange}
        handleExport={handleExport}
        handlePrint={handlePrint}
      />

      <div className="flex flex-col space-y-4 mt-6">
        {/* Report Type Dropdown */}
        <div className="flex flex-wrap items-center gap-4">
          <label htmlFor="filterReport" className="font-medium">
            Report Type:
          </label>
          <select
            id="filterReport"
            value={selectedReport}
            onChange={handleReportTypeChange}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="P">Production</option>
            <option value="C">Production Chart</option>
            <option value="Y">Yearly Production</option>
            <option value="T">Gauges by Tank</option>
            <option value="D">Gauges by Date</option>
            <option value="O">Gauges OH Bbls</option>
            <option value="W">Wells On/Off</option>
            <option value="WE">Well Tests</option>
            <option value="R">Run Tickets Export</option>
            <option value="G">Gauges Export</option>
            <option value="A">API Daily Production</option>
            <option value="M">API Monthly Production</option>
          </select>
        </div>

        {/* Lease and Well Dropdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="leaseid" className="font-medium">
              Lease
            </label>
            <select
              id="leaseid"
              value={leaseID}
              onChange={handleLeaseChange}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {leases.map((lease) => (
                <option key={lease.LeaseID} value={lease.LeaseID}>
                  {lease.LeaseName}
                </option>
              ))}
            </select>
          </div>

          {showWells && (
            <div className="flex flex-col space-y-2">
              <label htmlFor="wellid" className="font-medium">
                Wells
              </label>
              <select
                id="wellid"
                value={wellID}
                onChange={handleWellChange}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {wells.map((well) => (
                  <option key={well.WellID} value={well.WellID}>
                    {well.WellID}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* AG-Grid */}
      <div
        className="ag-theme-alpine mt-8"
        style={{ height: "500px", width: "100%" }}
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={50}
        />
      </div>
    </div>
  );
};

export default ReportPage;
