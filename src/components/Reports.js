// ReportPage.js

import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { useTheme } from "./ThemeContext";
import Header from "./GridHeader"; // Import the updated Header component
import GridLoader from "./GridLoader"; // Loader component
import moment from "moment";
import { baseUrl } from "./config.js"; // Import baseUrl for API calls
import "ag-grid-community/styles/ag-grid.css"; // AG-Grid styles
import "ag-grid-community/styles/ag-theme-alpine.css"; // AG-Grid theme

const ReportPage = () => {
  // Retrieve the current theme (light or dark)
  const { theme = "light" } = useTheme() || {};
  const isDarkMode = theme === "dark";

  // State variables
  const [reportFrom, setReportFrom] = useState(
    moment().startOf("year").format("YYYY-MM-DD")
  );
  const [reportThru, setReportThru] = useState(
    moment().endOf("year").format("YYYY-MM-DD")
  );
  const [selectedReport, setSelectedReport] = useState("Y"); // Default to 'Y' for yearly report
  const [leaseID, setLeaseID] = useState("");
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [pinnedTopRowData, setPinnedTopRowData] = useState([]);

  // Lease settings state variables
  const [showMcf, setShowMcf] = useState(true);
  const [showTbg, setShowTbg] = useState(true);
  const [showOil, setShowOil] = useState(true);
  const [showWater, setShowWater] = useState(true);
  const [wellType, setWellType] = useState("");

  // Fetch leases on component mount
  useEffect(() => {
    fetchLeases();
  }, []);

  // Fetch lease settings when leaseID changes
  useEffect(() => {
    if (leaseID) {
      fetchLeaseSettings(leaseID);
    }
  }, [leaseID]);

  // Fetch data whenever dependencies change
  useEffect(() => {
    if (leaseID) {
      fetchData();
    }
  }, [
    leaseID,
    reportFrom,
    reportThru,
    selectedReport,
    showOil,
    showWater,
    showTbg,
    showMcf,
    wellType,
  ]);

  // Function to fetch lease options
  const fetchLeases = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/leases.php`);
      const data = await response.json();
      setLeases(data);
      setLeaseID(data[0]?.LeaseID || "");
    } catch (error) {
      console.error("Error fetching leases:", error);
    }
    setLoading(false);
  };

  // Function to fetch lease settings
  const fetchLeaseSettings = async (leaseID) => {
    try {
      const response = await fetch(
        `${baseUrl}/service_leases.php?LeaseID=${encodeURIComponent(leaseID)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const leaseData = data[0];
        setShowMcf(leaseData.ShowGas === "Y");
        setShowTbg(leaseData.ShowTbg === "Y");
        setShowOil(leaseData.ShowOil === "Y");
        setShowWater(leaseData.ShowWater === "Y");
        setWellType(leaseData.WellType);
      }
    } catch (error) {
      console.error("Error fetching lease settings:", error);
    }
  };

  // Function to fetch report data based on selected options
  const fetchData = async () => {
    setLoading(true);
    try {
      let apiUrl = `${baseUrl}/service_testprod.php`;
      const apiParams = new URLSearchParams();

      apiParams.append("Rpt", selectedReport);
      if (leaseID) apiParams.append("LeaseID", leaseID);
      if (reportFrom) apiParams.append("From", reportFrom);
      if (reportThru) apiParams.append("Thru", reportThru);

      apiUrl += `?${apiParams.toString()}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (selectedReport === "Y") {
        // For yearly report, process data accordingly
        const formattedData = await Promise.all(
          data.map(async (item) => ({
            ...item,
            TMonthYear: moment(item.TMonthYear, "MM/YYYY").format("MM/YYYY"),
            BOMOnHand: await calculateBOMOnHand(item.TYear, item.TMonth),
          }))
        );
        setRowData(formattedData);
        calculateYearlyTotal(formattedData);
      } else {
        // For other reports
        const formattedData = data.map((item) => ({
          ...item,
          GaugeDate: moment(item.GaugeDate).format("MM/DD/YYYY"),
        }));
        setRowData(formattedData);
        calculateTotal(formattedData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  // Function to calculate BOM On Hand for each month
  const calculateBOMOnHand = async (year, month) => {
    try {
      // Adjust the date to get the last day of the previous month
      const date = moment(`${year}-${month}-01`)
        .subtract(1, "days")
        .format("YYYY-MM-DD");
      // Fetch OnHandValue from the API (replace with your actual endpoint)
      const response = await fetch(
        `${baseUrl}/api/onhandvalue.php?LeaseID=${encodeURIComponent(
          leaseID
        )}&Date=${date}`
      );
      const data = await response.json();
      return data.value || 0;
    } catch (error) {
      console.error("Error calculating BOM On Hand:", error);
      return 0;
    }
  };

  // Function to calculate totals for the yearly report
  const calculateYearlyTotal = (data) => {
    const totals = data.reduce(
      (acc, curr) => {
        return {
          TMonthYear: "Totals",
          BOMOnHand:
            acc.BOMOnHand + (curr.BOMOnHand ? parseFloat(curr.BOMOnHand) : 0),
          SumProduced:
            acc.SumProduced +
            (curr.SumProduced ? parseFloat(curr.SumProduced) : 0),
          SumRunBbls:
            acc.SumRunBbls +
            (curr.SumRunBbls ? parseFloat(curr.SumRunBbls) : 0),
          SumWater:
            acc.SumWater + (curr.SumWater ? parseFloat(curr.SumWater) : 0),
          AvgTbg: acc.AvgTbg + (curr.AvgTbg ? parseFloat(curr.AvgTbg) : 0),
          MaxTbg: acc.MaxTbg + (curr.MaxTbg ? parseFloat(curr.MaxTbg) : 0),
          SumWaterInjected:
            acc.SumWaterInjected +
            (curr.SumWaterInjected ? parseFloat(curr.SumWaterInjected) : 0),
          SumGas: acc.SumGas + (curr.SumGas ? parseFloat(curr.SumGas) : 0),
        };
      },
      {
        TMonthYear: "",
        BOMOnHand: 0,
        SumProduced: 0,
        SumRunBbls: 0,
        SumWater: 0,
        AvgTbg: 0,
        MaxTbg: 0,
        SumWaterInjected: 0,
        SumGas: 0,
      }
    );

    // Format totals to fixed decimals
    Object.keys(totals).forEach((key) => {
      if (
        key !== "TMonthYear" &&
        totals[key] !== null &&
        totals[key] !== "" &&
        !isNaN(totals[key])
      ) {
        totals[key] = parseFloat(totals[key]).toFixed(2);
      }
    });

    setPinnedTopRowData([totals]);
  };

  // Function to calculate totals for other reports
  const calculateTotal = (data) => {
    const totals = data.reduce(
      (acc, curr) => {
        return {
          GaugeDate: "Totals",
          Produced:
            acc.Produced + (curr.Produced ? parseFloat(curr.Produced) : 0),
          RunBbls: acc.RunBbls + (curr.RunBbls ? parseFloat(curr.RunBbls) : 0),
          DrawBbls:
            acc.DrawBbls + (curr.DrawBbls ? parseFloat(curr.DrawBbls) : 0),
          WaterTotal:
            acc.WaterTotal +
            (curr.WaterTotal ? parseFloat(curr.WaterTotal) : 0),
          WaterHauledBbls:
            acc.WaterHauledBbls +
            (curr.WaterHauledBbls ? parseFloat(curr.WaterHauledBbls) : 0),
          gaugecomments: "", // Comments are not summed
          tbg: "", // Tubing pressure might be averaged or left empty
          csg: "", // Casing pressure might be averaged or left empty
          spcc: "", // SPCC might be a status, leave as empty or set to a default value
        };
      },
      {
        GaugeDate: "",
        Produced: 0,
        RunBbls: 0,
        DrawBbls: 0,
        WaterTotal: 0,
        WaterHauledBbls: 0,
        gaugecomments: "",
        tbg: "",
        csg: "",
        spcc: "",
      }
    );

    // Format totals to fixed decimals
    Object.keys(totals).forEach((key) => {
      if (
        key !== "GaugeDate" &&
        totals[key] !== null &&
        totals[key] !== "" &&
        !isNaN(totals[key])
      ) {
        totals[key] = parseFloat(totals[key]).toFixed(2);
      }
    });

    setPinnedTopRowData([totals]);
  };

  // Value formatter for numeric fields
  const formatValue = (params) =>
    params.value !== undefined && params.value !== ""
      ? parseFloat(params.value).toFixed(2)
      : "";

  // Define column definitions based on the selected report and lease settings
  const columnDefs = useMemo(() => {
    if (selectedReport === "Y") {
      // Yearly Production Report Columns
      const columns = [
        {
          headerName: "Month",
          field: "TMonthYear",
          sortable: true,
          filter: true,
          minWidth: 110,
        },
      ];

      if (showOil) {
        columns.push(
          {
            headerName: "BOM On Hand",
            field: "BOMOnHand",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
          },
          {
            headerName: "Production",
            field: "SumProduced",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
          },
          {
            headerName: "Disposition",
            field: "SumRunBbls",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
          }
        );
      }

      if (showWater) {
        if (wellType === "INJ") {
          columns.push({
            headerName: "Injected",
            field: "SumWaterInjected",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
          });
        } else {
          columns.push({
            headerName: "Water",
            field: "SumWater",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
          });
        }
      }

      if (showTbg) {
        columns.push(
          {
            headerName: "Avg Tbg Pressure",
            field: "AvgTbg",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
          },
          {
            headerName: "Max Tbg Pressure",
            field: "MaxTbg",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
          }
        );
      }

      if (showMcf) {
        columns.push({
          headerName: "Mcf",
          field: "SumGas",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
        });
      }

      return columns;
    } else {
      // Columns for production report when selectedReport !== "Y"
      return [
        {
          headerName: "Date",
          field: "GaugeDate",
          sortable: true,
          filter: true,
          minWidth: 110,
          valueFormatter: (params) => {
            if (params.value === "Totals") return "Totals";
            return moment(params.value, "MM/DD/YYYY").format("MM/DD/YYYY");
          },
        },
        {
          headerName: "Gross Bbls",
          field: "Produced",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
        },
        {
          headerName: "Run Bbls",
          field: "RunBbls",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
        },
        {
          headerName: "BS&W Draws",
          field: "DrawBbls",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
        },
        {
          headerName: "Water",
          field: "WaterTotal",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
        },
        {
          headerName: "Water Hauled",
          field: "WaterHauledBbls",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
        },
        {
          headerName: "Comment",
          field: "dispcomments",
          sortable: true,
          filter: true,
        },
        {
          headerName: "Tbg",
          field: "tbg",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
        },
        {
          headerName: "Csg",
          field: "csg",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
        },
        {
          headerName: "SPCC",
          field: "spcc",
          sortable: true,
          filter: true,
        },
      ];
    }
  }, [selectedReport, showOil, showWater, showTbg, showMcf, wellType]);

  // Default column properties
  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  // Handlers for input changes and actions
  const handleReportFromChange = (e) => setReportFrom(e.target.value);
  const handleReportThruChange = (e) => setReportThru(e.target.value);
  const handleReportTypeChange = (e) => {
    setSelectedReport(e.target.value);
  };
  const handleLeaseChange = (e) => {
    setLeaseID(e.target.value);
  };

  // Placeholder functions for export and print actions
  const handleExport = () => {
    console.log("Exporting data...");
    // Implement export functionality here
  };

  const handlePrint = () => {
    window.print();
    // Implement custom print functionality if needed
  };

  // Grid event handlers
  const onGridReady = (params) => {
    params.api.sizeColumnsToFit();
  };

  const onFirstDataRendered = (params) => {
    params.api.sizeColumnsToFit();
  };

  // Render loading indicator if data is being fetched
  if (loading) {
    return <GridLoader isDarkMode={isDarkMode} />;
  }

  // Main component render
  return (
    <div
      className={`container mx-auto px-4 py-6 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      {/* Header Section */}
      <div className="mb-6">
        <Header
          isDarkMode={isDarkMode}
          fromDate={reportFrom}
          handleFromDateChange={handleReportFromChange}
          thruDate={reportThru}
          handleThruDateChange={handleReportThruChange}
          reportType={selectedReport} // Pass 'selectedReport' as 'reportType'
          handleReportTypeChange={handleReportTypeChange}
          leaseID={leaseID}
          leases={leases}
          handleLeaseChange={handleLeaseChange}
          handleExport={handleExport}
          handlePrint={handlePrint}
        />
      </div>

      {/* AG-Grid Section */}
      <div
        className="ag-theme-alpine"
        style={{
          height: "1100px",
          width: "100%",
          margin: "0 auto",
          paddingTop: "20px",
        }}
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={50}
          onGridReady={onGridReady}
          onFirstDataRendered={onFirstDataRendered}
          pinnedTopRowData={pinnedTopRowData}
          getRowStyle={(params) =>
            params.node.rowPinned === "top"
              ? {
                  fontWeight: "bold",
                  backgroundColor: isDarkMode ? "#2e7d32" : "#e8f5e9",
                  color: isDarkMode ? "#FFFFFF" : "#000000",
                  borderBottom: "2px solid #000",
                  fontSize: "1.1em",
                }
              : {}
          }
        />
      </div>
    </div>
  );
};

export default ReportPage;
