import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExport, faPrint } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import { baseUrl } from "./config"; // Assuming baseUrl is defined in config.js
import Header from "./GridHeader"; // Import the Header component
import { useTheme } from "./ThemeContext";
import GridLoader from "./GridLoader";

const ProductionSummary = () => {
  const { theme = "light" } = useTheme() || {};
  const isDarkMode = theme === "dark";

  const [rowData, setRowData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [totalRow, setTotalRow] = useState({});
  const [fromDate, setFromDate] = useState(
    new URLSearchParams(window.location.search).get("From") ||
      moment().subtract(30, "days").format("YYYY-MM-DD")
  );
  const [thruDate, setThruDate] = useState(
    new URLSearchParams(window.location.search).get("Thru") ||
      moment().format("YYYY-MM-DD")
  );
  const [pumper, setPumper] = useState("All");
  const [tag, setTag] = useState(
    new URLSearchParams(window.location.search).get("Tag") || "All"
  );
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tagOptions, setTagOptions] = useState([]);
  const [avgMethod, setAvgMethod] = useState(
    new URLSearchParams(window.location.search).get("AM") || "AllDays"
  );
  const [quickLink, setQuickLink] = useState("custom");

  useEffect(() => {
    fetchOptions();
    fetchData();
  }, [fromDate, thruDate, pumper, tag, avgMethod]);

  useEffect(() => {
    const filtered = filterData(rowData);
    setFilteredData(filtered);
    calculateTotal(filtered);
  }, [searchText, rowData]);

  const fetchOptions = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/usertags.php`);
      const data = await response.json();
      const tags = data.filter((item) => item.TagID && item.TagDesc);
      setTagOptions(tags);
    } catch (error) {
      console.error("Error fetching tag options:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = new URL(`${baseUrl}/service_testprod.php`);
      apiUrl.searchParams.append("LeaseID", "Summary");
      apiUrl.searchParams.append("From", fromDate);
      apiUrl.searchParams.append("Thru", thruDate);

      if (tag !== "All") {
        apiUrl.searchParams.append("Tag", tag);
      }

      apiUrl.searchParams.append("AM", avgMethod);

      const response = await fetch(apiUrl);
      const data = await response.json();
      setRowData(data);
      setFilteredData(data);
      calculateTotal(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again.");
      setLoading(false);
    }
  };

  const updateURLParams = (param, value) => {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, "", url);
  };

  const handleDateChange = (e) => {
    const newFromDate = e.target.value;
    setFromDate(newFromDate);
    updateURLParams("From", newFromDate);
    setQuickLink("custom"); // Reset quick link to custom when date changes
  };

  const handleThruDateChange = (e) => {
    const newThruDate = e.target.value;
    setThruDate(newThruDate);
    updateURLParams("Thru", newThruDate);
    setQuickLink("custom"); // Reset quick link to custom when date changes
  };

  const handleAvgMethodChange = (e) => {
    const newAvgMethod = e.target.value;
    setAvgMethod(newAvgMethod);
    updateURLParams("AM", newAvgMethod);
  };

  const filterData = (data) => {
    return data.filter(
      (item) =>
        item.LeaseName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.LeaseID.toLowerCase().includes(searchText.toLowerCase()) ||
        item.PumperID.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const handleSearchChange = (e) => setSearchText(e.target.value);

  const handleTagChange = (e) => {
    setTag(e.target.value);
    updateURLParams("Tag", e.target.value);
  };

  const calculateTotal = (data) => {
    const totals = data.reduce(
      (acc, curr) => {
        return {
          Produced:
            acc.Produced + (curr.Produced ? parseFloat(curr.Produced) : 0),
          AvgProduced:
            acc.AvgProduced +
            (curr.AvgProduced ? parseFloat(curr.AvgProduced) : 0),
          RunBbls: acc.RunBbls + (curr.RunBbls ? parseFloat(curr.RunBbls) : 0),
          DrawBbls:
            acc.DrawBbls + (curr.DrawBbls ? parseFloat(curr.DrawBbls) : 0),
          Water: acc.Water + (curr.Water ? parseFloat(curr.Water) : 0),
          AvgWater:
            acc.AvgWater + (curr.AvgWater ? parseFloat(curr.AvgWater) : 0),
          WaterHauledBbls:
            acc.WaterHauledBbls +
            (curr.WaterHauledBbls ? parseFloat(curr.WaterHauledBbls) : 0),
          Gas: acc.Gas + (curr.Gas ? parseFloat(curr.Gas) : 0),
          AvgGas: acc.AvgGas + (curr.AvgGas ? parseFloat(curr.AvgGas) : 0),
          WaterInjectedTotal:
            acc.WaterInjectedTotal +
            (curr.WaterInjectedTotal ? parseFloat(curr.WaterInjectedTotal) : 0),
          AvgWaterInjected:
            acc.AvgWaterInjected +
            (curr.AvgWaterInjected ? parseFloat(curr.AvgWaterInjected) : 0),
        };
      },
      {
        Produced: 0,
        AvgProduced: 0,
        RunBbls: 0,
        DrawBbls: 0,
        Water: 0,
        AvgWater: 0,
        WaterHauledBbls: 0,
        Gas: 0,
        AvgGas: 0,
        WaterInjectedTotal: 0,
        AvgWaterInjected: 0,
      }
    );

    totals.LeaseName = "Totals";

    // Format totals to two decimal places
    Object.keys(totals).forEach((key) => {
      if (typeof totals[key] === "number") {
        totals[key] = parseFloat(totals[key]).toFixed(2);
      }
    });

    setTotalRow(totals);
  };

  const columnDefinitions = useMemo(() => {
    return [
      {
        headerName: "Lease",
        field: "LeaseName",
        sortable: true,
        filter: true,
        width: 150,
        cellStyle: {
          fontWeight: "bold",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
        },
        headerClass: "vertical-header",
      },
      {
        headerName: "Total Oil",
        field: "Produced",
        sortable: true,
        filter: true,
        width: 120,
        cellStyle: { backgroundColor: "#EEEEEE", textAlign: "right" },
        headerClass: "vertical-header",
        valueFormatter: (params) =>
          params.value ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      {
        headerName: "Daily Avg Oil",
        field: "AvgProduced",
        sortable: true,
        filter: true,
        width: 130,
        cellStyle: { backgroundColor: "#EEEEEE", textAlign: "right" },
        headerClass: "vertical-header",
        valueFormatter: (params) =>
          params.value ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      {
        headerName: "Run Bbls",
        field: "RunBbls",
        sortable: true,
        filter: true,
        width: 120,
        cellStyle: { backgroundColor: "#EEEEEE", textAlign: "right" },
        headerClass: "vertical-header",
        valueFormatter: (params) =>
          params.value ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      {
        headerName: "BS&W Draws",
        field: "DrawBbls",
        sortable: true,
        filter: true,
        width: 120,
        cellStyle: { backgroundColor: "#EEEEEE", textAlign: "right" },
        headerClass: "vertical-header",
        valueFormatter: (params) =>
          params.value ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      {
        headerName: "Water",
        field: "Water",
        sortable: true,
        filter: true,
        width: 100,
        cellStyle: { backgroundColor: "#E6F2FF", textAlign: "right" },
        headerClass: "vertical-header",
        valueFormatter: (params) =>
          params.value ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      {
        headerName: "Daily Avg Water",
        field: "AvgWater",
        sortable: true,
        filter: true,
        width: 130,
        cellStyle: { backgroundColor: "#E6F2FF", textAlign: "right" },
        headerClass: "vertical-header",
        valueFormatter: (params) =>
          params.value ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      {
        headerName: "Water Hauled",
        field: "WaterHauledBbls",
        sortable: true,
        filter: true,
        width: 130,
        cellStyle: { backgroundColor: "#E6F2FF", textAlign: "right" },
        headerClass: "vertical-header",
        valueFormatter: (params) =>
          params.value ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      {
        headerName: "Gas",
        field: "Gas",
        sortable: true,
        filter: true,
        width: 80,
        cellStyle: { backgroundColor: "#FFFFE1", textAlign: "right" },
        headerClass: "vertical-header",
        valueFormatter: (params) =>
          params.value ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      {
        headerName: "Daily Avg Gas",
        field: "AvgGas",
        sortable: true,
        filter: true,
        width: 130,
        cellStyle: { backgroundColor: "#FFFFE1", textAlign: "right" },
        headerClass: "vertical-header",
        valueFormatter: (params) =>
          params.value ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      {
        headerName: "Injected",
        field: "WaterInjectedTotal",
        sortable: true,
        filter: true,
        width: 120,
        cellStyle: { backgroundColor: "#dce6f2", textAlign: "right" },
        headerClass: "vertical-header",
        valueFormatter: (params) =>
          params.value ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      {
        headerName: "Daily Avg Injected",
        field: "AvgWaterInjected",
        sortable: true,
        filter: true,
        width: 130,
        cellStyle: { backgroundColor: "#dce6f2", textAlign: "right" },
        headerClass: "vertical-header",
        valueFormatter: (params) =>
          params.value ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      {
        headerName: "Pumper ID",
        field: "PumperID",
        sortable: true,
        filter: true,
        width: 100,
        cellStyle: { textAlign: "center" },
        headerClass: "vertical-header",
      },
    ];
  }, []);

  const handleExport = () => {
    // Implement export functionality here
    console.log("Exporting data...");
  };

  const handlePrint = () => {
    // Implement print functionality here
    console.log("Printing data...");
  };

  const handleQuickLinkChange = (e) => {
    const qd = e.target.value;
    setQuickLink(qd);
    if (qd === "custom") {
      // Do nothing, user will set fromDate and thruDate manually
      return;
    }
    let newFromDate, newThruDate;
    const today = moment();

    switch (qd) {
      case "CM":
        newFromDate = today.clone().startOf("month").format("YYYY-MM-DD");
        newThruDate = today.clone().endOf("month").format("YYYY-MM-DD");
        break;
      case "3D":
        newFromDate = today.clone().subtract(2, "days").format("YYYY-MM-DD");
        newThruDate = today.clone().format("YYYY-MM-DD");
        break;
      case "7D":
        newFromDate = today.clone().subtract(6, "days").format("YYYY-MM-DD");
        newThruDate = today.clone().format("YYYY-MM-DD");
        break;
      case "30":
        newFromDate = today.clone().subtract(29, "days").format("YYYY-MM-DD");
        newThruDate = today.clone().format("YYYY-MM-DD");
        break;
      case "LM":
        newFromDate = today
          .clone()
          .subtract(1, "month")
          .startOf("month")
          .format("YYYY-MM-DD");
        newThruDate = today
          .clone()
          .subtract(1, "month")
          .endOf("month")
          .format("YYYY-MM-DD");
        break;
      case "3M":
        newFromDate = today
          .clone()
          .subtract(3, "months")
          .add(1, "day")
          .format("YYYY-MM-DD");
        newThruDate = today.clone().format("YYYY-MM-DD");
        break;
      case "6M":
        newFromDate = today
          .clone()
          .subtract(6, "months")
          .add(1, "day")
          .format("YYYY-MM-DD");
        newThruDate = today.clone().format("YYYY-MM-DD");
        break;
      case "CY":
        newFromDate = today.clone().startOf("year").format("YYYY-MM-DD");
        newThruDate = today.clone().format("YYYY-MM-DD");
        break;
      case "LY":
        newFromDate = today
          .clone()
          .subtract(1, "year")
          .startOf("year")
          .format("YYYY-MM-DD");
        newThruDate = today
          .clone()
          .subtract(1, "year")
          .endOf("year")
          .format("YYYY-MM-DD");
        break;
      default:
        return;
    }

    setFromDate(newFromDate);
    setThruDate(newThruDate);
    updateURLParams("From", newFromDate);
    updateURLParams("Thru", newThruDate);
  };

  return (
    <div
      className={`ag-theme-alpine ${isDarkMode ? "dark" : ""}`}
      style={{
        padding: "20px",
        background: isDarkMode ? "#1E1E1E" : "#f0f2f5",
        borderRadius: "10px",
        marginBottom: "30px",
        color: isDarkMode ? "#E0E0E0" : "#000000",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header
        isDarkMode={isDarkMode}
        quickLink={quickLink}
        handleQuickLinkChange={handleQuickLinkChange}
        fromDate={fromDate}
        handleFromDateChange={handleDateChange}
        thruDate={thruDate}
        handleThruDateChange={handleThruDateChange}
        avgMethod={avgMethod}
        handleAvgMethodChange={handleAvgMethodChange}
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        selectedTag={tag}
        handleTagChange={handleTagChange}
        tagOptions={tagOptions}
        handleExport={handleExport}
        handlePrint={handlePrint}
        // No need to pass quickLinkOptions
      />

      <div
        className="ag-theme-alpine"
        style={{ height: "1100px", width: "100%" }}
      >
        {loading ? (
          <GridLoader isDarkMode={isDarkMode} rows={50} columns={10} />
        ) : error ? (
          <div>Error: {error}</div>
        ) : (
          <AgGridReact
            rowData={[totalRow, ...filteredData]}
            columnDefs={columnDefinitions}
            pagination={true}
            paginationPageSize={50}
            suppressHorizontalScroll={true}
            suppressRowVirtualisation={false}
            defaultColDef={{
              resizable: true,
              wrapHeaderText: true,
              autoHeaderHeight: true,
              sortable: true,
              filter: true,
              minWidth: 100,
              flex: 1, // Add this line
            }}
            getRowStyle={(params) =>
              params.node.rowIndex === 0
                ? {
                    fontWeight: "bold",
                    backgroundColor: "#d9ead3",
                    borderBottom: "2px solid #000",
                  }
                : {}
            }
            // Remove or adjust the onGridReady function
            // onGridReady={(params) => {
            //   params.api.sizeColumnsToFit();
            // }}
          />
        )}
      </div>
    </div>
  );
};

export default ProductionSummary;
