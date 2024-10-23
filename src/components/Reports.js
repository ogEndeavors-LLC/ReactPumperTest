import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import moment from "moment";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { baseUrl } from "./config"; // Adjust to your config path
import { useTheme } from "./ThemeContext"; // Assuming you have theme context
import Header from "./GridHeader"; // Import the Header component
import GridLoader from "./GridLoader";

const ReportPage = () => {
  // Retrieve the current theme (light or dark)
  const { theme = "light" } = useTheme() || {};
  const isDarkMode = theme === "dark";
  const [currentDate, setCurrentDate] = useState(moment().format("YYYY-MM-DD"));

  // State variables
  const [reportFrom, setReportFrom] = useState(
    moment().startOf("year").format("YYYY-MM-DD")
  );
  const [reportThru, setReportThru] = useState(
    moment().endOf("year").format("YYYY-MM-DD")
  );
  const [selectedReport, setSelectedReport] = useState("P"); // Default to '' for default report
  const [leaseID, setLeaseID] = useState("");
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [pinnedTopRowData, setPinnedTopRowData] = useState([]);
  const [isParamsLoaded, setIsParamsLoaded] = useState(false);

  // Lease settings state variables
  const [hasWaterMeter, setHasWaterMeter] = useState("Y");
  const [showTbg, setShowTbg] = useState("Y");
  const [showCsg, setShowCsg] = useState("Y");
  const [showStatic, setShowStatic] = useState("Y");
  const [showDiff, setShowDiff] = useState("Y");
  const [showFlowRate, setShowFlowRate] = useState("Y");
  const [showChoke, setShowChoke] = useState("Y");
  const [showMcfAccum, setShowMcfAccum] = useState("Y");
  const [showHoursOn, setShowHoursOn] = useState("Y");
  const [hasGasMeter, setHasGasMeter] = useState("Y");
  const [showWater, setShowWater] = useState("Y");
  const [showOil, setShowOil] = useState("Y");
  const [showGas, setShowGas] = useState("Y");
  const [wellType, setWellType] = useState("ALL");
  const [useLinePressure, setUseLinePressure] = useState("Y");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const reportTypeFromUrl = params.get("Rpt");
    if (reportTypeFromUrl) {
      setSelectedReport(reportTypeFromUrl);
    }

    const leaseIdFromUrl = params.get("LeaseID");
    if (leaseIdFromUrl) {
      setLeaseID(leaseIdFromUrl);
    }

    const startDateFromUrl = params.get("StartDate");
    const thruDateFromUrl = params.get("Thru");

    if (startDateFromUrl) {
      setReportFrom(moment(startDateFromUrl).format("YYYY-MM-DD"));
    }

    if (thruDateFromUrl) {
      setReportThru(moment(thruDateFromUrl).format("YYYY-MM-DD"));
    }

    setIsParamsLoaded(true); // Indicate that the URL params have been loaded
  }, []);
  // Fetch leases on component mount
  useEffect(() => {
    if (isParamsLoaded) {
      fetchLeases();
    }
  }, [isParamsLoaded, selectedReport]);

  // Update lease settings when leaseID changes
  useEffect(() => {
    if (leaseID && leases.length > 0) {
      const selectedLease = leases.find((lease) => lease.LeaseID === leaseID);
      if (selectedLease) {
        setLeaseSettings(selectedLease);
      }
    }
  }, [leaseID, leases]);

  // Fetch data whenever dependencies change
  useEffect(() => {
    if (isParamsLoaded && leaseID) {
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
    showGas,
    showCsg,
    showStatic,
    showDiff,
    showFlowRate,
    showChoke,
    showMcfAccum,
    showHoursOn,
    wellType,
  ]);

  // Function to fetch lease options along with their settings
  const fetchLeases = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/leases.php`);
      const data = await response.json();

      // Get LeaseID from URL params (if available)
      const params = new URLSearchParams(window.location.search);
      const leaseIdFromUrl = params.get("LeaseID");

      // If selectedReport is "O", include "All" option
      if (selectedReport === "O") {
        const allOption = { LeaseID: "All", LeaseName: "ALL" };
        const leasesWithAll = [allOption, ...data];
        setLeases(leasesWithAll);

        // If a LeaseID is provided via URL, use that, otherwise default to "All"
        if (leaseIdFromUrl) {
          const leaseFromUrl = leasesWithAll.find(
            (lease) => lease.LeaseID === leaseIdFromUrl
          );
          if (leaseFromUrl) {
            setLeaseID(leaseFromUrl.LeaseID);
            setLeaseSettings(leaseFromUrl);
          } else {
            setLeaseID("All"); // Default to "All" if LeaseID from URL is not found
            setLeaseSettings(leasesWithAll[1]); // Assuming the first lease is valid for initial settings
          }
        } else {
          setLeaseID("All"); // Default to "All" if no LeaseID in URL
          setLeaseSettings(leasesWithAll[1]); // Assuming the first lease is valid for initial settings
        }
      } else {
        // For other reports
        setLeases(data);

        // If a LeaseID is provided via URL, use that, otherwise default to the first lease
        if (leaseIdFromUrl) {
          const leaseFromUrl = data.find(
            (lease) => lease.LeaseID === leaseIdFromUrl
          );
          if (leaseFromUrl) {
            setLeaseID(leaseFromUrl.LeaseID);
            setLeaseSettings(leaseFromUrl);
          } else if (data.length > 0) {
            setLeaseID(data[0].LeaseID); // Default to the first lease in the list if LeaseID from URL is not found
            setLeaseSettings(data[0]);
          }
        } else if (data.length > 0) {
          setLeaseID(data[0].LeaseID || ""); // Default to the first lease if no LeaseID in URL
          setLeaseSettings(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching leases:", error);
    }
    setLoading(false);
  };

  // Function to set lease settings based on selected lease
  const setLeaseSettings = (leaseData) => {
    setHasWaterMeter(leaseData.WaterMeter || "N");
    setShowTbg(leaseData.ShowTbg || "N");
    setShowCsg(leaseData.ShowCsg || "N");
    setShowStatic(leaseData.ShowStatic || "N");
    setShowDiff(leaseData.ShowDiff || "N");
    setShowFlowRate(leaseData.ShowFlowRate || "N");
    setShowChoke(leaseData.ShowChoke || "N");
    setShowMcfAccum(leaseData.ShowMcfAccum || "N");
    setShowHoursOn(leaseData.ShowHoursOn || "N");
    setHasGasMeter(leaseData.GasMeter || "N");
    setShowWater(leaseData.ShowWater || "N");
    setShowOil(leaseData.ShowOil || "N");
    setShowGas(leaseData.ShowGas || "N");
    setWellType(leaseData.WellType || "ALL");
    setUseLinePressure(leaseData.useLinePressure || "N");
  };

  // Function to fetch data based on selected options
  const fetchData = async () => {
    setLoading(true);
    try {
      let apiUrl = "";
      const apiParams = new URLSearchParams();

      if (selectedReport === "T") {
        // Gauges By Tank report
        apiUrl = `${baseUrl}/service_testgauge.php`;

        apiParams.append("Rpt", "T");
        if (leaseID) apiParams.append("LeaseID", leaseID);
        if (reportFrom) apiParams.append("From", reportFrom);
        if (reportThru) apiParams.append("Thru", reportThru);

        apiUrl += `?${apiParams.toString()}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        const formattedData = data.map((item) => ({
          ...item,
          GaugeDate: moment(item.GaugeDate).format("MM/DD/YYYY"),
          GaugeTime: moment(item.GaugeTime, "HH:mm:ss").format("HH:mm"),
          Gauge: `${item.GaugeFt}' ${item.GaugeIn}"`,
        }));

        setRowData(formattedData);

        calculateTotalsForGaugesByTank(formattedData); // Call the new totals function
      } else if (selectedReport === "Y") {
        // Yearly Production Report
        apiUrl = `${baseUrl}/service_testprod.php`;

        apiParams.append("Rpt", "Y");
        if (leaseID) apiParams.append("LeaseID", leaseID);
        if (reportFrom) apiParams.append("From", reportFrom);
        if (reportThru) apiParams.append("Thru", reportThru);

        apiUrl += `?${apiParams.toString()}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        const formattedData = await Promise.all(
          data.map(async (item) => ({
            ...item,
            TMonthYear: moment(item.TMonthYear, "MM/YYYY").format("MM/YYYY"),
            BOMOnHand: await calculateBOMOnHand(item.TYear, item.TMonth),
          }))
        );
        setRowData(formattedData);
        calculateYearlyTotal(formattedData);
      } else if (selectedReport === "O") {
        // New Gauges OH BBLs report logic
        apiUrl = `${baseUrl}/service_gauges_oh.php`;

        if (leaseID === "All") {
          apiParams.append("LeaseID", "");
        } else {
          apiParams.append("LeaseID", leaseID);
        }

        // Append date parameters if they exist
        if (reportFrom) apiParams.append("FromDate", reportFrom);
        if (reportThru) apiParams.append("ThruDate", reportThru);

        apiUrl += `?${apiParams.toString()}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        const formattedData = data.map((item) => ({
          LeaseID: item.LeaseID,
          LeaseName: item.LeaseName,
          TankID: item.TankID,
          Size: `${item.Size} bbls/in`,
          Gauge: `${item.GaugeFt}' ${item.GaugeIn}"`,
          BblsOH: parseFloat(item.BblsOH).toFixed(2),
          PendingLoads: parseInt(item.NumLoads, 10),
          Gauged: parseFloat(item.BblsOH).toFixed(2), // Assuming Gauged is same as BblsOH
          // Add other fields if necessary
        }));

        setRowData(formattedData);
      } else if (selectedReport === "P") {
        // Default or other reports
        apiUrl = `${baseUrl}/service_testprod.php`;

        apiParams.append("Rpt", selectedReport);
        if (leaseID) apiParams.append("LeaseID", leaseID);
        if (reportFrom) apiParams.append("From", reportFrom);
        if (reportThru) apiParams.append("Thru", reportThru);

        apiUrl += `?${apiParams.toString()}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        const formattedData = data.map((item) => ({
          ...item,
          GaugeDate: moment(item.GaugeDate).format("MM/DD/YYYY"),
        }));
        calculateTotal(formattedData);

        setRowData(formattedData);
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

  // Function to calculate totals for the Gauges By Tank report
  const calculateTotalsForGaugesByTank = (data) => {
    const totals = data.reduce(
      (acc, curr) => {
        return {
          GaugeDate: "Totals",
          gaugedbbls: acc.gaugedbbls + (parseFloat(curr.gaugedbbls) || 0),
          runbbls: acc.runbbls + (parseFloat(curr.runbbls) || 0),
          drawbbls: acc.drawbbls + (parseFloat(curr.drawbbls) || 0),
          WMeter: acc.WMeter + (parseFloat(curr.WMeter) || 0),
          waterproducedtankbbls:
            acc.waterproducedtankbbls +
            (parseFloat(curr.waterproducedtankbbls) || 0),
          netwater: acc.netwater + (parseFloat(curr.netwater) || 0),
          waterrunbbls: acc.waterrunbbls + (parseFloat(curr.waterrunbbls) || 0),
          netgas: acc.netgas + (parseFloat(curr.netgas) || 0),
        };
      },
      {
        GaugeDate: "",
        gaugedbbls: 0,
        runbbls: 0,
        drawbbls: 0,
        WMeter: 0,
        waterproducedtankbbls: 0,
        netwater: 0,
        waterrunbbls: 0,
        netgas: 0,
      }
    );

    // Format totals to fixed decimals
    Object.keys(totals).forEach((key) => {
      if (key !== "GaugeDate" && totals[key] !== null && !isNaN(totals[key])) {
        totals[key] = parseFloat(totals[key]).toFixed(2);
      }
    });

    setPinnedTopRowData([totals]);
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
          WaterInjectedTotal:
            acc.WaterInjectedTotal +
            (curr.WaterInjectedTotal ? parseFloat(curr.WaterInjectedTotal) : 0),
          Gas: acc.Gas + (curr.Gas ? parseFloat(curr.Gas) : 0),
          tbg: "", // Tubing pressure might be averaged or left empty
          csg: "",
          flp: "",
          Static: "",
          Diff: "",
          FlowRate: "",
          Choke: "",
          McfAccum: "",
          HoursOn: "",
          spcc: "",
          dispcomments: "",
        };
      },
      {
        GaugeDate: "",
        Produced: 0,
        RunBbls: 0,
        DrawBbls: 0,
        WaterTotal: 0,
        WaterHauledBbls: 0,
        WaterInjectedTotal: 0,
        Gas: 0,
        tbg: "",
        csg: "",
        flp: "",
        Static: "",
        Diff: "",
        FlowRate: "",
        Choke: "",
        McfAccum: "",
        HoursOn: "",
        spcc: "",
        dispcomments: "",
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

  const oilCellStyle = {
    backgroundColor: isDarkMode ? "#424242" : "#D3D3D3",
    color: isDarkMode ? "#FFFFFF" : "#000000",
    fontWeight: "500",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    textAlign: "right",
  };

  const waterCellStyle = {
    backgroundColor: isDarkMode ? "#424242" : "#E6E6FA",
    color: isDarkMode ? "#FFFFFF" : "#000000",
    fontWeight: "500",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    textAlign: "right",
  };

  const gasCellStyle = {
    backgroundColor: isDarkMode ? "#424242" : "#FFFFE0",
    color: isDarkMode ? "#FFFFFF" : "#000000",
    fontWeight: "500",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    textAlign: "right",
  };

  // Define column definitions based on the selected report and lease settings
  const columnDefs = useMemo(() => {
    const columns = [];

    // Common columns
    if (selectedReport === "Y") {
      // Yearly Production Report Columns
      columns.push({
        headerName: "Month",
        field: "TMonthYear",
        sortable: true,
        filter: true,
        cellStyle: { textAlign: "center" },
        minWidth: 110,
        flex: 1,
      });

      if (showOil === "Y") {
        columns.push(
          {
            headerName: "BOM On Hand",
            field: "BOMOnHand",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            minWidth: 120,
            flex: 1,
          },
          {
            headerName: "Production",
            field: "SumProduced",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            minWidth: 100,
            flex: 1,
          },
          {
            headerName: "Disposition",
            field: "SumRunBbls",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            minWidth: 100,
            flex: 1,
          }
        );
      }

      if (showWater === "Y") {
        if (wellType === "INJ") {
          columns.push({
            headerName: "Injected",
            field: "SumWaterInjected",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: waterCellStyle,
            minWidth: 100,
            flex: 1,
          });
        } else {
          columns.push({
            headerName: "Water",
            field: "SumWater",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: waterCellStyle,
            minWidth: 100,
            flex: 1,
          });
        }
      }

      if (showTbg === "Y") {
        columns.push(
          {
            headerName: "Avg Tbg Pressure",
            field: "AvgTbg",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: { textAlign: "right" },
            minWidth: 130,
            flex: 1,
          },
          {
            headerName: "Max Tbg Pressure",
            field: "MaxTbg",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: { textAlign: "right" },
            minWidth: 130,
            flex: 1,
          }
        );
      }

      if (showGas === "Y") {
        columns.push({
          headerName: "Mcf",
          field: "SumGas",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: gasCellStyle,
          minWidth: 80,
          flex: 1,
        });
      }
    } else if (selectedReport === "T") {
      // Gauges By Tank Report Columns
      columns.push(
        {
          headerName: "Date",
          field: "GaugeDate",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          minWidth: 90,
          flex: 1,
        },
        {
          headerName: "Time",
          field: "GaugeTime",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          minWidth: 70,
          flex: 1,
        }
      );

      const showOilY = showOil === "Y";
      const showWaterY = showWater === "Y";
      const showGasY = showGas === "Y";

      // Handle different combinations of showOil, showWater, and showGas
      if (showOilY) {
        columns.push(
          {
            headerName: "Type",
            field: "GaugeType",
            sortable: true,
            filter: true,
            cellStyle: { textAlign: "center" },
            minWidth: 100,
            flex: 1,
            cellRenderer: (params) => {
              const value = params.value
                ? params.value.trim().toUpperCase()
                : "";
              if (value === "R") return "Run Ticket";
              if (value === "G") return "Gauge";
              return value;
            },
          },
          {
            headerName: "Tank",
            field: "TankID",
            sortable: true,
            filter: true,
            cellStyle: { textAlign: "center" },
            minWidth: 80,
            flex: 1,
          },
          {
            headerName: "Gauge",
            field: "Gauge",
            sortable: true,
            filter: true,
            cellStyle: oilCellStyle,
            minWidth: 100,
            flex: 1,
          },
          {
            headerName: "Gross Bbls",
            field: "gaugedbbls",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            minWidth: 100,
            flex: 1,
          },
          {
            headerName: "Run Bbls",
            field: "runbbls",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            minWidth: 100,
            flex: 1,
          },
          {
            headerName: "BS&W Draws",
            field: "drawbbls",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            minWidth: 110,
            flex: 1,
          }
        );
      }

      if (showWaterY) {
        if (wellType === "INJ") {
          columns.push({
            headerName: "Water Injected",
            field: "WaterInjectedTotal",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: waterCellStyle,
            minWidth: 130,
            flex: 1,
          });
        } else {
          columns.push(
            {
              headerName: "Water Meter",
              field: "WMeter",
              sortable: true,
              filter: true,
              valueFormatter: formatValue,
              cellStyle: waterCellStyle,
              minWidth: 110,
              flex: 1,
            },
            {
              headerName: "Water Bbls Gauged",
              field: "waterproducedtankbbls",
              sortable: true,
              filter: true,
              valueFormatter: formatValue,
              cellStyle: waterCellStyle,
              minWidth: 150,
              flex: 1,
            },
            {
              headerName: "Net Water",
              field: "netwater",
              sortable: true,
              filter: true,
              valueFormatter: formatValue,
              cellStyle: waterCellStyle,
              minWidth: 100,
              flex: 1,
            },
            {
              headerName: "Water Hauled",
              field: "waterrunbbls",
              sortable: true,
              filter: true,
              valueFormatter: formatValue,
              cellStyle: waterCellStyle,
              minWidth: 120,
              flex: 1,
            }
          );
        }
      }

      if (showGasY) {
        columns.push({
          headerName: "Gas",
          field: "netgas",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: gasCellStyle,
          minWidth: 80,
          flex: 1,
        });
      }

      // Comments
      columns.push({
        headerName: "Comments",
        field: "Comment",
        sortable: true,
        filter: true,
        cellStyle: { textAlign: "left" },
        minWidth: 150,
        flex: 1,
      });

      // Tbg and Csg
      if (showTbg === "Y") {
        columns.push({
          headerName: "Tbg",
          field: "TbgPressure",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          minWidth: 80,
          flex: 1,
        });
      }
      if (showCsg === "Y") {
        columns.push({
          headerName: "Csg",
          field: "CsgPressure",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          minWidth: 80,
          flex: 1,
        });
      }
    } else if (selectedReport === "O") {
      // New Gauges OH BBLs Report Columns
      columns.push(
        {
          headerName: "Lease ID",
          field: "LeaseID",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          minWidth: 100,
          flex: 1,
        },
        {
          headerName: "Lease Name",
          field: "LeaseName",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "left" },
          minWidth: 150,
          flex: 1,
        },
        {
          headerName: "Tank ID",
          field: "TankID",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          minWidth: 100,
          flex: 1,
        },
        {
          headerName: "Size (bbls/in)",
          field: "Size",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "right" },
          minWidth: 120,
          flex: 1,
        },
        {
          headerName: "Gauge",
          field: "Gauge",
          sortable: true,
          filter: true,
          cellStyle: oilCellStyle, // Reusing existing style
          minWidth: 100,
          flex: 1,
        },
        {
          headerName: "Bbls OH",
          field: "BblsOH",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: oilCellStyle,
          minWidth: 100,
          flex: 1,
        },
        {
          headerName: "Pending Loads",
          field: "PendingLoads",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "right" },
          minWidth: 130,
          flex: 1,
        },
        {
          headerName: "Gauged",
          field: "Gauged",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: oilCellStyle,
          minWidth: 100,
          flex: 1,
        }
      );
    } else {
      // Default or other reports
      columns.push({
        headerName: "Date",
        field: "GaugeDate",
        sortable: true,
        filter: true,
        cellStyle: { textAlign: "center" },
        minWidth: 110,
        maxWidth: 120,
        flex: 1,
        valueFormatter: (params) => {
          if (params.value === "Totals") return "Totals";
          return moment(params.value, "MM/DD/YYYY").format("MM/DD/YYYY");
        },
      });

      if (showOil === "Y") {
        columns.push(
          {
            headerName: "Gross Bbls",
            field: "Produced",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            minWidth: 100,
            flex: 1,
          },
          {
            headerName: "Run Bbls",
            field: "RunBbls",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            minWidth: 100,
            flex: 1,
          },
          {
            headerName: "BS&W Draws",
            field: "DrawBbls",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            minWidth: 110,
            flex: 1,
          }
        );
      }

      if (showGas === "Y") {
        columns.push({
          headerName: "Gas",
          field: "Gas",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: gasCellStyle,
          minWidth: 80,
          flex: 1,
        });
      }

      if (showWater === "Y") {
        if (wellType === "INJ") {
          columns.push({
            headerName: "Water Injected",
            field: "WaterInjectedTotal",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: waterCellStyle,
            minWidth: 130,
            flex: 1,
          });
        } else {
          columns.push(
            {
              headerName: "Water",
              field: "WaterTotal",
              sortable: true,
              filter: true,
              valueFormatter: formatValue,
              cellStyle: waterCellStyle,
              minWidth: 100,
              flex: 1,
            },
            {
              headerName: "Water Hauled",
              field: "WaterHauledBbls",
              sortable: true,
              filter: true,
              valueFormatter: formatValue,
              cellStyle: waterCellStyle,
              minWidth: 120,
              flex: 1,
            }
          );
        }
      }

      columns.push({
        headerName: "Comment",
        field: "dispcomments",
        sortable: true,
        filter: true,
        cellStyle: { textAlign: "left" },
        minWidth: 150,
        flex: 1,
      });

      if (showTbg === "Y") {
        columns.push({
          headerName: "Tbg",
          field: "tbg",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          minWidth: 80,
          flex: 1,
        });
      }

      if (showCsg === "Y") {
        columns.push({
          headerName: "Csg",
          field: "csg",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          minWidth: 80,
          flex: 1,
        });
      }

      // Additional gas-related columns
      if (showGas === "Y") {
        if (useLinePressure === "Y") {
          columns.push({
            headerName: "Flp",
            field: "flp",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: { textAlign: "right" },
            minWidth: 80,
            flex: 1,
          });
        }
        if (showStatic === "Y") {
          columns.push({
            headerName: "Static",
            field: "Static",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: { textAlign: "right" },
            minWidth: 80,
            flex: 1,
          });
        }
        if (showDiff === "Y") {
          columns.push({
            headerName: "Diff",
            field: "Diff",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: { textAlign: "right" },
            minWidth: 80,
            flex: 1,
          });
        }
        if (showFlowRate === "Y") {
          columns.push({
            headerName: "Flow Rate",
            field: "FlowRate",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: { textAlign: "right" },
            minWidth: 100,
            flex: 1,
          });
        }
        if (showChoke === "Y") {
          columns.push({
            headerName: "Choke",
            field: "Choke",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: { textAlign: "right" },
            minWidth: 80,
            flex: 1,
          });
        }
        if (showMcfAccum === "Y") {
          columns.push({
            headerName: "Accum",
            field: "McfAccum",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: { textAlign: "right" },
            minWidth: 80,
            flex: 1,
          });
        }
        if (showHoursOn === "Y") {
          columns.push({
            headerName: "Hours On",
            field: "HoursOn",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: { textAlign: "right" },
            minWidth: 90,
            flex: 1,
          });
        }
      }

      columns.push({
        headerName: "SPCC",
        field: "spcc",
        sortable: true,
        filter: true,
        minWidth: 80,
        flex: 1,
      });
    }

    return columns;
  }, [
    selectedReport,
    showOil,
    showWater,
    showGas,
    showTbg,
    showCsg,
    showStatic,
    showDiff,
    showFlowRate,
    showChoke,
    showMcfAccum,
    showHoursOn,
    useLinePressure,
    wellType,
    isDarkMode, // Include isDarkMode in dependencies
  ]);

  // Default column properties
  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      flex: 1, // Add this line

      minWidth: 50,
      wrapHeaderText: true,
      autoHeaderHeight: true,
    }),
    []
  );

  // Handlers for input changes and actions
  const handleReportFromChange = (e) => setReportFrom(e.target.value);
  const handleReportThruChange = (e) => setReportThru(e.target.value);
  const handleReportTypeChange = (e) => {
    setLoading(true);
    if (leaseID === "All") {
      setLeaseID("");
    }

    setSelectedReport(e.target.value);
    setLoading(false);
  };
  const handleLeaseChange = (e) => {
    setLoading(true);

    setLeaseID(e.target.value);
    setLoading(false);
  };

  const handleExport = () => {
    const csvRows = [];
    const headers = columnDefs.map((col) => col.headerName);
    csvRows.push(headers.join(","));
    const report =
      selectedReport === "P"
        ? "Production"
        : selectedReport === "O"
        ? "Gauges OH Bbls"
        : selectedReport === "T"
        ? "Gauges By Tank"
        : "Yearly Production";

    rowData.forEach((row) => {
      const values = columnDefs.map((col) => {
        let cellValue = row[col.field];

        // Escape and wrap other cell values
        if (cellValue !== null && cellValue !== undefined) {
          // Convert cell value to string and escape double quotes
          cellValue = String(cellValue).replace(/"/g, '""');
        } else {
          cellValue = "";
        }

        // Wrap the cell value in double quotes
        return `"${cellValue}"`;
      });
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a download link and trigger the download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${report}_${currentDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    // Safety check for rowData
    if (!Array.isArray(rowData) || rowData.length === 0) {
      console.error("No data available to print");
      return;
    }

    const printWindow = window.open("", "_blank");

    // Ensure columnDefs exists and filter out Chart column
    const printColumns = (columnDefs || []).filter(
      (col) => col.headerName !== "Chart"
    );

    // Safety check for printColumns
    if (!printColumns.length) {
      console.error("No columns defined for printing");
      printWindow.close();
      return;
    }

    // Format total values for display
    const formattedTotalRow = { ...pinnedTopRowData[0] };
    Object.keys(formattedTotalRow).forEach((key) => {
      if (
        key !== "GaugeDate" &&
        formattedTotalRow[key] !== null &&
        formattedTotalRow[key] !== "" &&
        !isNaN(formattedTotalRow[key])
      ) {
        // Format numbers to 2 decimal places
        formattedTotalRow[key] = parseFloat(formattedTotalRow[key]).toFixed(2);
      }
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${
            selectedReport === "P"
              ? "Production"
              : selectedReport === "O"
              ? "Gauges OH Bbls"
              : selectedReport === "T"
              ? "Gauges By Tank"
              : "Yearly Production"
          }</title>
          <style>
            @page {
              size: landscape;
            }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 8px; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              page-break-inside: auto;
            }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th, td { 
              border: 1px solid #ddd; 
              padding: 2px; 
              text-align: left; 
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            th { background-color: #f2f2f2; }
            .number { text-align: right; }
            .total-row {
              font-weight: 900;
              background-color: ${
                isDarkMode ? "#2e7d32" : "#e8f5e9"
              } !important;
              color: ${isDarkMode ? "#FFFFFF" : "#000000"};
              font-size: 1.2em;
              border-bottom: 3px solid #000;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <h1>${
            selectedReport === "P"
              ? "Production"
              : selectedReport === "O"
              ? "Gauges OH Bbls"
              : selectedReport === "T"
              ? "Gauges By Tank"
              : "Yearly Production"
          }</h1>
          <p>Date: ${moment(currentDate).format("MM-DD-YYYY")}</p>
          <table>
            <thead>
              <tr>
                ${printColumns
                  .map((col) => `<th>${col.headerName}</th>`)
                  .join("")}
              </tr>
            </thead>
            <tbody>
              <tr class="total-row">
                ${printColumns
                  .map((col) => {
                    let cellValue = formattedTotalRow[col.field] ?? "";

                    // Special handling for GaugeDate
                    if (col.field === "GaugeDate") {
                      cellValue = "Totals";
                    }

                    // Apply value formatter if exists
                    if (col.valueFormatter && cellValue !== "") {
                      cellValue = col.valueFormatter({ value: cellValue });
                    }

                    return `<td class="${
                      col.cellStyle?.textAlign === "right" ? "number" : ""
                    }">${cellValue}</td>`;
                  })
                  .join("")}
              </tr>
              ${rowData
                .map(
                  (row) => `
                  <tr>
                    ${printColumns
                      .map((col) => {
                        let cellValue = row[col.field] ?? "";

                        if (col.valueFormatter) {
                          cellValue = col.valueFormatter({ value: cellValue });
                        }

                        if (col.field === "GaugeDate" && cellValue) {
                          cellValue = moment(cellValue).format("MM-DD-YYYY");
                        }

                        return `<td class="${
                          col.cellStyle?.textAlign === "right" ? "number" : ""
                        }">${cellValue}</td>`;
                      })
                      .join("")}
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = function () {
      printWindow.print();
      printWindow.onafterprint = function () {
        printWindow.close();
      };
    };
  };
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

  return (
    <div
      className={`ag-theme-alpine ${isDarkMode ? "dark" : ""}`}
      style={{
        padding: "20px",
        background: isDarkMode ? "#1E1E1E" : "#f0f2f5",
        borderRadius: "10px",
        minHeight: "100vh",
        width: "100%",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header Section */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Header
          isDarkMode={isDarkMode}
          fromDate={reportFrom}
          handleFromDateChange={handleReportFromChange}
          thruDate={reportThru}
          handleThruDateChange={handleReportThruChange}
          reportType={selectedReport}
          handleReportTypeChange={handleReportTypeChange}
          leaseID={leaseID}
          leases={leases}
          handleLeaseChange={handleLeaseChange}
          handleExport={handleExport}
          handlePrint={handlePrint}
        />
      </div>
      {loading ? (
        <GridLoader isDarkMode={isDarkMode} rows={50} columns={10} />
      ) : (
        <div
          className="ag-theme-alpine"
          style={{ height: "1100px", width: "100%" }}
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
            suppressSizeToFit={true}
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
            // Remove 'suppressColumnVirtualisation' if present unless needed
          />
        </div>
      )}
    </div>
  );
};

export default ReportPage;
