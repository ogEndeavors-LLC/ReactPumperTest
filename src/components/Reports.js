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

  // State variables
  const [currentDate, setCurrentDate] = useState(moment().format("YYYY-MM-DD"));
  const [useColorCut, setUseColorCut] = useState("Y"); // Initialize with default "Y"
  const [reportFrom, setReportFrom] = useState(
    moment().startOf("year").format("YYYY-MM-DD")
  );
  const [reportThru, setReportThru] = useState(
    moment().endOf("year").format("YYYY-MM-DD")
  );
  const [quickLink, setQuickLink] = useState("custom"); // Add quickLink state
  const [selectedReport, setSelectedReport] = useState("P"); // Default to 'P' for default report
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

  // Load URL parameters on component mount
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

  // Fetch leases and client settings after URL parameters are loaded
  useEffect(() => {
    if (isParamsLoaded) {
      fetchLeases();
      fetchClientSettings();
    }
  }, [isParamsLoaded, selectedReport]);

  // Fetch client settings to get 'useColorCut' value
  const fetchClientSettings = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/ClientDetails.php`);
      const data = await response.json();
      if (data && data.length > 0) {
        const clientSettings = data[0];
        setUseColorCut(clientSettings.UseColorCut || "N");
      }
    } catch (error) {
      console.error("Error fetching client settings:", error);
    }
  };

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
      const response = await fetch(`${baseUrl}/api/leases.php?includeTanks=1`);
      const data = await response.json();

      const allOption = {
        LeaseID: "~ALL~",
        LeaseName: "All Leases",
        Tanks: [],
      };
      const leasesWithAll = [...data, allOption];
      setLeases(leasesWithAll);

      // Get LeaseID from URL params (if available)
      const params = new URLSearchParams(window.location.search);
      const leaseIdFromUrl = params.get("LeaseID");

      // Set default LeaseID if not already set
      if (leaseIdFromUrl) {
        // Use LeaseID from URL parameters
        setLeaseID(leaseIdFromUrl);
        const leaseFromUrl = leasesWithAll.find(
          (lease) => lease.LeaseID === leaseIdFromUrl
        );
        if (leaseFromUrl) {
          setLeaseSettings(leaseFromUrl);
        } else if (leasesWithAll.length > 0) {
          // If LeaseID from URL is not found, default to first real lease
          setLeaseID(leasesWithAll[0].LeaseID);
          setLeaseSettings(leasesWithAll[0]);
        }
      } else if (leasesWithAll.length > 0) {
        // No LeaseID in URL, default to first real lease
        setLeaseID(leasesWithAll[0].LeaseID);
        setLeaseSettings(leasesWithAll[0]);
      } else {
        // No leases available, default to '~ALL~'
        setLeaseID("~ALL~");
        setLeaseSettings(allOption);
      }

      // If a LeaseID is provided via URL, use that
      if (leaseIdFromUrl) {
        setLeaseID(leaseIdFromUrl);
        const leaseFromUrl = leasesWithAll.find(
          (lease) => lease.LeaseID === leaseIdFromUrl
        );
        if (leaseFromUrl) {
          setLeaseSettings(leaseFromUrl);
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

  // Function to update URL parameters
  const updateURLParams = (param, value) => {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, "", url);
  };

  // Handlers for input changes and actions
  const handleReportFromChange = (e) => {
    const newFromDate = e.target.value;
    setReportFrom(newFromDate);
    updateURLParams("StartDate", newFromDate);
    setQuickLink("custom"); // Reset quick link to custom when date changes
  };

  const handleReportThruChange = (e) => {
    const newThruDate = e.target.value;
    setReportThru(newThruDate);
    updateURLParams("Thru", newThruDate);
    setQuickLink("custom"); // Reset quick link to custom when date changes
  };

  const formatValueWithDefaultDot = (params) =>
    params.value !== null && !isNaN(params.value)
      ? parseFloat(params.value).toFixed(2)
      : ".";

  const formatValueWithDefaultZero = (params) =>
    params.value !== null && !isNaN(params.value)
      ? parseFloat(params.value).toFixed(2)
      : "0";

  const handleQuickLinkChange = (e) => {
    const qd = e.target.value;
    setQuickLink(qd);
    if (qd === "custom") {
      // Do nothing, user will set reportFrom and reportThru manually
      return;
    }
    let newReportFrom, newReportThru;
    const today = moment();

    switch (qd) {
      case "CM":
        newReportFrom = today.clone().startOf("month").format("YYYY-MM-DD");
        newReportThru = today.clone().endOf("month").format("YYYY-MM-DD");
        break;
      case "3D":
        newReportFrom = today.clone().subtract(2, "days").format("YYYY-MM-DD");
        newReportThru = today.clone().format("YYYY-MM-DD");
        break;
      case "7D":
        newReportFrom = today.clone().subtract(6, "days").format("YYYY-MM-DD");
        newReportThru = today.clone().format("YYYY-MM-DD");
        break;
      case "30":
        newReportFrom = today.clone().subtract(29, "days").format("YYYY-MM-DD");
        newReportThru = today.clone().format("YYYY-MM-DD");
        break;
      case "LM":
        newReportFrom = today
          .clone()
          .subtract(1, "month")
          .startOf("month")
          .format("YYYY-MM-DD");
        newReportThru = today
          .clone()
          .subtract(1, "month")
          .endOf("month")
          .format("YYYY-MM-DD");
        break;
      case "3M":
        newReportFrom = today
          .clone()
          .subtract(3, "months")
          .add(1, "day")
          .format("YYYY-MM-DD");
        newReportThru = today.clone().format("YYYY-MM-DD");
        break;
      case "6M":
        newReportFrom = today
          .clone()
          .subtract(6, "months")
          .add(1, "day")
          .format("YYYY-MM-DD");
        newReportThru = today.clone().format("YYYY-MM-DD");
        break;
      case "CY":
        newReportFrom = today.clone().startOf("year").format("YYYY-MM-DD");
        newReportThru = today.clone().format("YYYY-MM-DD");
        break;
      case "LY":
        newReportFrom = today
          .clone()
          .subtract(1, "year")
          .startOf("year")
          .format("YYYY-MM-DD");
        newReportThru = today
          .clone()
          .subtract(1, "year")
          .endOf("year")
          .format("YYYY-MM-DD");
        break;
      default:
        return;
    }

    setReportFrom(newReportFrom);
    setReportThru(newReportThru);
    updateURLParams("StartDate", newReportFrom);
    updateURLParams("Thru", newReportThru);
  };

  const handleReportTypeChange = (e) => {
    setLoading(true);
    setSelectedReport(e.target.value);
    updateURLParams("Rpt", e.target.value); // Update URL params if needed
    setLoading(false);
  };

  const handleLeaseChange = (e) => {
    setLoading(true);
    setLeaseID(e.target.value);
    setLoading(false);
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

        calculateTotalsForGaugesByTank(formattedData, selectedReport);
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
      } else if (selectedReport === "G") {
        // Export Report
        apiUrl = `${baseUrl}/service_gauges_export.php`;

        apiParams.append("LeaseID", leaseID || "~ALL~");
        apiParams.append("WellID", "undefined"); // Adjust if necessary
        if (reportFrom) apiParams.append("FromDate", reportFrom);
        if (reportThru) apiParams.append("ThruDate", reportThru);

        apiUrl += `?${apiParams.toString()}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        // Process data to match the PHP logic
        const formattedData = data.map((item) => {
          const gaugeFt = parseFloat(item.GaugeFt) || 0;
          const gaugeIn = parseFloat(item.GaugeIn) || 0;
          const colorCutFt = parseFloat(item.ColorCutFt) || 0;
          const colorCutIn = parseFloat(item.ColorCutIn) || 0;

          const totalFluidInches = gaugeFt * 12 + gaugeIn;
          const totalColorCutInches = colorCutFt * 12 + colorCutIn;
          const totalOilInches = totalFluidInches - totalColorCutInches;
          const totalOilFt = Math.floor(totalOilInches / 12);
          const totalOilIn = (totalOilInches / 12 - totalOilFt) * 12;

          const ticketDate = item.GaugeDate;
          const prodDate = moment(ticketDate).format("MM/DD/YYYY");

          return {
            ticketDate: ticketDate,
            leaseID: item.LeaseID,
            leaseName: item.LeaseName,
            tankID: item.TankID,
            gaugeFeet: totalOilFt,
            gaugeInches: totalOilIn.toFixed(2),
            leaseNum: item.PropertyNum,
            tankOrMeterNumber: item.WPTankNum,
            productCode: "OIL",
            productionDate: prodDate,
            // Include any additional fields if necessary
          };
        });

        setRowData(formattedData);
      } else if (selectedReport === "O") {
        // Gauges OH BBLs Report
        apiUrl = `${baseUrl}/service_gauges_oh.php`;

        if (leaseID === "~ALL~") {
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
          GaugeDate: moment(item.GaugeDate).format("MM/DD/YYYY"),
          TankID: item.TankID,
          Size: `${item.Size} `,
          Gauge: `${item.GaugeFt}' ${item.GaugeIn}"`,
          BblsOH: parseFloat(item.BblsOH).toFixed(2),
          PendingLoads: parseInt(item.NumLoads, 10),
          Gauged: parseFloat(item.BblsOH).toFixed(2), // Assuming Gauged is same as BblsOH
          // Include ColorCutFt and ColorCutIn if useColorCut is "Y"
          ...(useColorCut === "Y" && {
            ColorCut: `${item.ColorCutFt}' ${item.ColorCutIn}"`,
          }),
        }));

        calculateTotalsForGaugesByTank(formattedData, selectedReport);

        setRowData(formattedData);
      } else if (selectedReport === "R") {
        // Run Tickets Report
        apiUrl = `${baseUrl}/service_runtickets.php`;

        apiParams.append("LeaseID", leaseID || "~ALL~");
        apiParams.append("WellID", "undefined"); // Adjust if necessary
        if (reportFrom) apiParams.append("From", reportFrom);
        if (reportThru) apiParams.append("Thru", reportThru);

        apiUrl += `?${apiParams.toString()}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        const formattedData = await Promise.all(
          data.map(async (row) => {
            let bbls = 0;

            if (row.Override === "Y") {
              bbls = parseFloat(row.OverrideBbls) || 0;
              // Set opening and closing fields to empty strings
              row.OpeningFeet = "";
              row.OpeningInches = "";
              row.ClosingFeet = "";
              row.ClosingInches = "";
            } else {
              // Get lease data from leases array
              const dataLease = leases.find(
                (lease) => lease.LeaseID === row.LeaseID
              );

              if (!dataLease) {
                console.warn(
                  `Lease ID ${row.LeaseID} not found in leases array.`
                );
                // Handle missing lease data
              }

              const tankid = row.TankOrMeterNumber;
              const tanks = dataLease?.Tanks || [];
              const tank = tanks.find((t) => t.TankID == tankid);

              if (tank) {
                const TankBblsPerInch = parseFloat(tank.BBLSperInch) || 0;
                const openFeet = parseFloat(row.OpeningFeet) || 0;
                const openInches = parseFloat(row.OpeningInches) || 0;
                const closeFeet = parseFloat(row.ClosingFeet) || 0;
                const closeInches = parseFloat(row.ClosingInches) || 0;

                const openbbls = (openFeet * 12 + openInches) * TankBblsPerInch;
                const closebbls =
                  (closeFeet * 12 + closeInches) * TankBblsPerInch;
                bbls = -(closebbls - openbbls);
              } else {
                console.warn(
                  `Tank ID ${tankid} not found for Lease ID ${row.LeaseID}`
                );
                bbls = 0;
              }
            }

            // Get LeaseName from leases array
            const leaseInfo = leases.find(
              (lease) => lease.LeaseID === row.LeaseID
            );
            const LeaseName = leaseInfo ? leaseInfo.LeaseName : row.LeaseID;

            return {
              ...row,
              bbls: bbls.toFixed(2),
              TicketDate: row.TicketDate
                ? moment(row.TicketDate, "YYYY-MM-DD").format("MM/DD/YYYY")
                : "",
              TicketTime: moment(row.TicketTime, "HH:mm:ss").format("HH:mm"),
              LeaseName: LeaseName,
              // Format other fields if necessary
            };
          })
        );

        setRowData(formattedData);
        setPinnedTopRowData([]); // Ensure no totals row is set
      } else if (selectedReport === "A") {
        apiUrl = `${baseUrl}/service_testcurrent.php`;

        // Prepare API parameters
        const apiParams = new URLSearchParams();
        if (leaseID) apiParams.append("LeaseID", leaseID);
        if (reportFrom) apiParams.append("From", reportFrom);
        if (reportThru) apiParams.append("Thru", reportThru);

        apiUrl += `?${apiParams.toString()}`;

        // Fetch and process data
        const response = await fetch(apiUrl);
        const data = await response.json();

        const formattedData = data.map((item) => ({
          ...item,
          GaugeDate: item.GaugeDate
            ? moment(item.GaugeDate).format("MM/DD/YYYY")
            : null,
        }));

        setRowData(formattedData);
      } else if (selectedReport === "AM") {
        apiUrl = `${baseUrl}/service_testcurrent.php`;

        // Prepare API parameters
        const apiParams = new URLSearchParams();
        if (leaseID) apiParams.append("LeaseID", leaseID);
        if (reportFrom) apiParams.append("From", reportFrom);
        if (reportThru) apiParams.append("Thru", reportThru);

        apiUrl += `?${apiParams.toString()}`;

        // Fetch and process data
        const response = await fetch(apiUrl);
        const data = await response.json();

        const formattedData = data.map((item) => ({
          ...item,
          GaugeDate: item.GaugeDate
            ? moment(item.GaugeDate).format("MM/DD/YYYY")
            : null,
        }));

        setRowData(formattedData);
      } else {
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
  const calculateTotalsForGaugesByTank = (data, selectedReport) => {
    const totals = data.reduce(
      (acc, curr) => {
        return {
          GaugeDate: selectedReport === "T" ? "Totals" : "",
          produced: acc.produced + (parseFloat(curr.produced) || 0),
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
        produced: 0,
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

    // Common variables
    const showOilY = showOil === "Y";
    const showWaterY = showWater === "Y";
    const showGasY = showGas === "Y";

    if (selectedReport === "Y") {
      // Yearly Production Report Columns
      columns.push({
        headerName: "Month",
        field: "TMonthYear",
        sortable: true,
        filter: true,
        cellStyle: { textAlign: "center" },
        width: 100,
      });

      if (showOilY) {
        columns.push(
          {
            headerName: "BOM On Hand",
            field: "BOMOnHand",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            width: 120,
          },
          {
            headerName: "Production",
            field: "SumProduced",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            width: 100,
          },
          {
            headerName: "Disposition",
            field: "SumRunBbls",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            width: 100,
          }
        );
      }

      if (showWaterY) {
        if (wellType === "INJ") {
          columns.push({
            headerName: "Injected",
            field: "SumWaterInjected",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: waterCellStyle,
            width: 100,
          });
        } else {
          columns.push({
            headerName: "Water",
            field: "SumWater",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: waterCellStyle,
            width: 100,
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
            width: 130,
          },
          {
            headerName: "Max Tbg Pressure",
            field: "MaxTbg",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: { textAlign: "right" },
            width: 130,
          }
        );
      }

      if (showGasY) {
        columns.push({
          headerName: "Mcf",
          field: "SumGas",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: gasCellStyle,
          width: 80,
        });
      }
    } else if (selectedReport === "A") {
      columns.push(
        {
          headerName: "LeaseName",
          field: "LeaseName",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "left" },
          width: 150,
        },
        {
          headerName: "API",
          field: "API",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 100,
        },
        {
          headerName: "Date",
          field: "gaugedate",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 100,
        },
        {
          headerName: "Gas",
          field: "Gas",
          sortable: true,
          filter: true,
          valueFormatter: formatValueWithDefaultZero,
          cellStyle: gasCellStyle,
          width: 80,
        },
        {
          headerName: "Oil",
          field: "Produced",
          sortable: true,
          filter: true,
          valueFormatter: formatValueWithDefaultZero,
          cellStyle: oilCellStyle,
          width: 100,
        },
        {
          headerName: "Water",
          field: "Water",
          sortable: true,
          filter: true,
          valueFormatter: formatValueWithDefaultZero,
          cellStyle: waterCellStyle,
          width: 100,
        },
        {
          headerName: "Feet Above Pump",
          field: "Static",
          sortable: true,
          filter: true,
          valueFormatter: formatValueWithDefaultDot,
          cellStyle: { textAlign: "right" },
          width: 120,
        }
      );
    } else if (selectedReport === "AM") {
      columns.push(
        {
          headerName: "LeaseName",
          field: "LeaseName",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "left" },
          width: 150,
        },
        {
          headerName: "API",
          field: "API",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 100,
        },
        {
          headerName: "Date",
          field: "gaugedate",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 100,
        },

        {
          headerName: "DaysOn",
          field: "Produced",
          sortable: true,
          filter: true,
          valueFormatter: formatValueWithDefaultZero,
          cellStyle: oilCellStyle,
          width: 100,
        },
        {
          headerName: "Gas",
          field: "Gas",
          sortable: true,
          filter: true,
          valueFormatter: formatValueWithDefaultZero,
          cellStyle: gasCellStyle,
          width: 80,
        },
        {
          headerName: "Oil",
          field: "Produced",
          sortable: true,
          filter: true,
          valueFormatter: formatValueWithDefaultZero,
          cellStyle: oilCellStyle,
          width: 100,
        },
        {
          headerName: "Water",
          field: "Water",
          sortable: true,
          filter: true,
          valueFormatter: formatValueWithDefaultZero,
          cellStyle: waterCellStyle,
          width: 100,
        },
        {
          headerName: "Feet Above Pump",
          field: "Static",
          sortable: true,
          filter: true,
          valueFormatter: formatValueWithDefaultDot,
          cellStyle: { textAlign: "right" },
          width: 120,
        }
      );
    } else if (selectedReport === "G") {
      // Export Report Columns
      return [
        {
          headerName: "Ticket Date",
          field: "ticketDate",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 120,
          valueFormatter: (params) =>
            moment(params.value).isValid()
              ? moment(params.value).format("MM/DD/YYYY")
              : "",
        },
        {
          headerName: "Lease ID",
          field: "leaseID",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 100,
        },
        {
          headerName: "Lease Name",
          field: "leaseName",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "left" },
          width: 150,
        },
        {
          headerName: "Tank ID",
          field: "tankID",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 100,
        },
        {
          headerName: "Gauge Feet",
          field: "gaugeFeet",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          width: 100,
        },
        {
          headerName: "Gauge Inches",
          field: "gaugeInches",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          width: 110,
        },
        {
          headerName: "Lease Num",
          field: "leaseNum",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 100,
        },
        {
          headerName: "Tank/Meter Number",
          field: "tankOrMeterNumber",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 130,
        },
        {
          headerName: "Product Code",
          field: "productCode",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 110,
        },
        {
          headerName: "Production Date",
          field: "productionDate",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 120,
        },
      ];
    } else if (selectedReport === "T") {
      // Gauges By Tank Report Columns
      columns.push(
        {
          headerName: "Date",
          field: "GaugeDate",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 140,
          valueFormatter: (params) => {
            if (params.value === "Totals") return "Totals";
            return moment(params.value, "MM/DD/YYYY").format("MM/DD/YYYY");
          },
        },
        {
          headerName: "Time",
          field: "GaugeTime",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 90,
        }
      );

      if (showOilY) {
        columns.push(
          {
            headerName: "Type",
            field: "GaugeType",
            sortable: true,
            filter: true,
            cellStyle: { textAlign: "center" },
            width: 100,
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
            sort: "asc",
            filter: true,
            cellStyle: { textAlign: "center" },
            width: 110,
          },
          {
            headerName: "Gauge",
            field: "Gauge",
            sortable: true,
            filter: true,
            cellStyle: oilCellStyle,
            width: 100,
          },
          {
            headerName: "Gross Bbls",
            field: "produced",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            width: 100,
          },
          {
            headerName: "Run Bbls",
            field: "runbbls",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            width: 100,
          },
          {
            headerName: "BS&W Draws",
            field: "drawbbls",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            width: 110,
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
            width: 130,
          });
        } else {
          // Initialize an array to hold water-related columns
          const waterColumns = [];

          // Conditionally add the "Water Meter" column
          if (hasWaterMeter === "Y") {
            waterColumns.push({
              headerName: "Water Meter",
              field: "WMeter",
              sortable: true,
              filter: true,
              valueFormatter: formatValue,
              cellStyle: waterCellStyle,
              width: 110,
            });
          }

          // Add the remaining water columns
          waterColumns.push(
            {
              headerName: "Water Bbls Gauged",
              field: "waterproducedtankbbls",
              sortable: true,
              filter: true,
              valueFormatter: formatValue,
              cellStyle: waterCellStyle,
              width: 150,
            },
            {
              headerName: "Net Water",
              field: "netwater",
              sortable: true,
              filter: true,
              valueFormatter: formatValue,
              cellStyle: waterCellStyle,
              width: 100,
            },
            {
              headerName: "Water Hauled",
              field: "waterrunbbls",
              sortable: true,
              filter: true,
              valueFormatter: formatValue,
              cellStyle: waterCellStyle,
              width: 120,
            }
          );

          // Push the water columns to the main columns array
          columns.push(...waterColumns);
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
          width: 80,
        });
      }

      // Comments
      columns.push({
        headerName: "Comments",
        field: "Comment",
        sortable: true,
        filter: true,
        cellStyle: { textAlign: "left" },
        width: 150,
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
          width: 80,
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
          width: 80,
        });
      }
    } else if (selectedReport === "O") {
      // Gauges OH BBLs Report Columns
      columns.push(
        {
          headerName: "Lease ID",
          field: "LeaseID",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 100,
        },
        {
          headerName: "Lease Name",
          field: "LeaseName",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "left" },
          width: 150,
        },
        {
          headerName: "Tank ID",
          field: "TankID",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 100,
        },
        {
          headerName: "Size",
          field: "Size",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "right" },
          width: 120,
        },
        {
          headerName: "Gauge",
          field: "Gauge",
          sortable: true,
          filter: true,
          cellStyle: oilCellStyle,
          width: 100,
        },
        {
          headerName: "Bbls OH",
          field: "BblsOH",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: oilCellStyle,
          width: 100,
        },
        {
          headerName: "Pending Loads",
          field: "PendingLoads",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "right" },
          width: 130,
        },
        {
          headerName: "Gauged",
          field: "GaugeDate",
          sortable: true,
          filter: true,
          valueFormatter: (params) => {
            if (!params.value) return "";
            if (selectedReport === "T" && params.value === "Totals") {
              return "Totals";
            }
            const date = moment(params.value, "MM/DD/YYYY");
            return date.isValid() ? date.format("MM/DD/YY") : "";
          },
          cellStyle: oilCellStyle,
          width: 100,
        }
      );

      // Conditionally add the "Color Cut" column based on 'useColorCut'
      if (useColorCut === "Y") {
        columns.push({
          headerName: "Color Cut",
          field: "ColorCut",
          sortable: true,
          filter: true,
          cellStyle: oilCellStyle,
          width: 100,
        });
      }
    } else if (selectedReport === "R") {
      // Run Tickets Report Columns
      columns.push(
        {
          headerName: "Ticket Date",
          field: "TicketDate",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 100,
        },
        {
          headerName: "Ticket Time",
          field: "TicketTime",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 90,
        },
        {
          headerName: "Ticket Number",
          field: "TicketNumber",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 100,
        },
        {
          headerName: "Lease ID",
          field: "LeaseID",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 100,
        },
        {
          headerName: "Lease Name",
          field: "LeaseName",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "left" },
          width: 150,
        },
        {
          headerName: "Tank Number",
          field: "TankOrMeterNumber",
          sortable: true,
          filter: true,
          cellStyle: { textAlign: "center" },
          width: 110,
        }
      );

      // Add opening and closing measurements if not overridden
      columns.push(
        {
          headerName: "Opening Feet",
          field: "OpeningFeet",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          width: 100,
        },
        {
          headerName: "Opening Inches",
          field: "OpeningInches",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          width: 110,
        },
        {
          headerName: "Closing Feet",
          field: "ClosingFeet",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          width: 100,
        },
        {
          headerName: "Closing Inches",
          field: "ClosingInches",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          width: 110,
        }
      );

      // Add remaining fields
      columns.push(
        {
          headerName: "Observed Gravity",
          field: "ObsGravity",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          width: 120,
        },
        {
          headerName: "Observed Temp",
          field: "ObsTemp",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          width: 120,
        },
        {
          headerName: "Observed % BS&W",
          field: "ObsPctBSandW",
          sortable: true,
          filter: true,
          valueFormatter: (params) =>
            params.value !== undefined && params.value !== ""
              ? parseFloat(params.value).toFixed(4)
              : "",
          cellStyle: { textAlign: "right" },
          width: 130,
        },
        {
          headerName: "Bbls",
          field: "bbls",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          width: 100,
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
        width: 80,
        valueFormatter: (params) => {
          if (params.value === "Totals") return "Totals";
          return moment(params.value, "MM/DD/YYYY").format("MM/DD/YYYY");
        },
      });

      if (showOilY) {
        columns.push(
          {
            headerName: "Gross Bbls",
            field: "Produced",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            width: 100,
          },
          {
            headerName: "Run Bbls",
            field: "RunBbls",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            width: 100,
          },
          {
            headerName: "BS&W Draws",
            field: "DrawBbls",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: oilCellStyle,
            width: 110,
          }
        );
      }

      if (showGasY) {
        columns.push({
          headerName: "Gas",
          field: "Gas",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: gasCellStyle,
          width: 80,
        });
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
            width: 130,
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
              width: 100,
            },
            {
              headerName: "Water Hauled",
              field: "WaterHauledBbls",
              sortable: true,
              filter: true,
              valueFormatter: formatValue,
              cellStyle: waterCellStyle,
              width: 120,
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
        width: 150,
      });

      if (showTbg === "Y") {
        columns.push({
          headerName: "Tbg",
          field: "tbg",
          sortable: true,
          filter: true,
          valueFormatter: formatValue,
          cellStyle: { textAlign: "right" },
          width: 80,
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
          width: 80,
        });
      }

      // Additional gas-related columns
      if (showGasY) {
        if (useLinePressure === "Y") {
          columns.push({
            headerName: "Flp",
            field: "flp",
            sortable: true,
            filter: true,
            valueFormatter: formatValue,
            cellStyle: { textAlign: "right" },
            width: 80,
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
            width: 80,
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
            width: 80,
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
            width: 100,
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
            width: 80,
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
            width: 80,
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
            width: 90,
          });
        }
      }

      columns.push({
        headerName: "SPCC",
        field: "spcc",
        sortable: true,
        filter: true,
        width: 80,
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
    hasWaterMeter,
    isDarkMode,
    useColorCut, // Include 'useColorCut' in dependencies
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

  const handleExport = () => {
    const csvRows = [];
    const headers = columnDefs.map((col) => col.headerName);
    csvRows.push(headers.join(","));

    // Determine the report name
    const reportName =
      selectedReport === "P"
        ? "Production"
        : selectedReport === "O"
        ? "GaugesOHBBls"
        : selectedReport === "T"
        ? "GaugesByTank"
        : selectedReport === "Y"
        ? "YearlyProduction"
        : selectedReport === "R"
        ? "RunTickets"
        : "Report";

    // Find the selected lease name
    const selectedLease = leases.find((lease) => lease.LeaseID === leaseID);
    const leaseName = selectedLease ? selectedLease.LeaseName : leaseID;

    // Format the date range
    const dateRange = `${moment(reportFrom).format("MM/DD/YYYY")}-${moment(
      reportThru
    ).format("MM/DD/YYYY")}`;

    // Sanitize the file name
    const sanitizeFileName = (name) => name.replace(/[^a-z0-9_-]/gi, "_");

    const fileName = `${sanitizeFileName(reportName)}_${sanitizeFileName(
      leaseName
    )}_${dateRange}.csv`;

    rowData.forEach((row) => {
      const values = columnDefs.map((col) => {
        let cellValue = row[col.field];

        // Escape and wrap cell values
        if (cellValue !== null && cellValue !== undefined) {
          cellValue = String(cellValue).replace(/"/g, '""');
        } else {
          cellValue = "";
        }

        return `"${cellValue}"`;
      });
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // Create a download link and trigger the download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
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

    // Ensure columnDefs exists and filter out columns not needed in print
    let printColumns = (columnDefs || []).filter(
      (col) => col.headerName !== "Chart"
    );

    // Remove the "Type" column from print when "Gauges by Tank" is selected
    if (selectedReport === "T") {
      printColumns = printColumns.filter((col) => col.headerName !== "Type");
    }

    // Safety check for printColumns
    if (!printColumns.length) {
      console.error("No columns defined for printing");
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

    // Get the report title
    const reportTitle =
      selectedReport === "P"
        ? "Production"
        : selectedReport === "O"
        ? "Gauges OH Bbls"
        : selectedReport === "T"
        ? "Gauges By Tank"
        : selectedReport === "Y"
        ? "Yearly Production"
        : selectedReport === "R"
        ? "Run Tickets"
        : "Report";

    // Find the selected lease name
    const selectedLease = leases.find((lease) => lease.LeaseID === leaseID);
    const leaseName = selectedLease ? selectedLease.LeaseName : leaseID;

    // Format reportFrom and reportThru dates
    const formattedReportFrom = moment(reportFrom).format("MM-DD-YYYY");
    const formattedReportThru = moment(reportThru).format("MM-DD-YYYY");

    // Build the table headers and set column widths
    const colWidths = printColumns.map((col) => {
      // Set default width or a specific width based on the column
      let width = 80; // default width in pixels

      // Adjust widths for specific columns if needed
      if (col.headerName === "Lease Name") width = 100;
      else if (col.headerName === "Comments") width = 150;
      else if (col.headerName === "Date") width = 70;
      else if (col.headerName === "Time") width = 60;
      else width = 80; // Default width

      return width;
    });

    // Construct the HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            @page {
              size: landscape;
              margin: 1cm;
            }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 9px; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            header {
              text-align: center;
              margin-bottom: 20px;
            }
            header h1 {
              font-size: 24px;
              margin: 0;
            }
            header h2 {
              font-size: 18px;
              margin: 5px 0;
            }
            header p {
              font-size: 14px;
              margin: 5px 0;
            }
            hr {
              border: 0;
              border-top: 2px solid #000;
              margin: 10px 0;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              table-layout: fixed;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 4px; 
              text-align: left; 
              overflow: hidden;
            }
            th { 
              background-color: #f2f2f2; 
              white-space: normal; /* Allow wrapping */
              word-wrap: break-word;
              word-break: break-word;
              text-align: center;
              font-size: 9px;
              vertical-align: middle;
            }
            td {
              font-size: 9px;
              white-space: nowrap; /* Keep data in one line */
            }
            .number { text-align: right; }
            .total-row {
              font-weight: bold;
              background-color: ${
                isDarkMode ? "#2e7d32" : "#e8f5e9"
              } !important;
              color: ${isDarkMode ? "#FFFFFF" : "#000000"};
              border-bottom: 2px solid #000;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <header>
            <h1>${reportTitle}</h1>
            ${
              selectedReport === "T" || selectedReport === "R"
                ? `<h2>Lease Name: ${leaseName}</h2>`
                : ""
            }
            <p>Date Range: ${formattedReportFrom} - ${formattedReportThru}</p>
            <hr>
          </header>
          <table>
            <colgroup>
              ${colWidths
                .map((width) => `<col style="width: ${width}px;">`)
                .join("")}
            </colgroup>
            <thead>
              <tr>
                ${printColumns
                  .map((col) => `<th>${col.headerName}</th>`)
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${
                selectedReport !== "R" && pinnedTopRowData.length > 0
                  ? `<tr class="total-row">
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
                </tr>`
                  : ""
              }
              ${rowData
                .map(
                  (row) => `
                    <tr>
                      ${printColumns
                        .map((col) => {
                          let cellValue = row[col.field] ?? "";

                          if (col.valueFormatter) {
                            cellValue = col.valueFormatter({
                              value: cellValue,
                            });
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
    `;

    // Create a Blob from the HTML content
    const blob = new Blob([htmlContent], { type: "text/html" });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Open the Blob URL in a new window
    const printWindow = window.open(url, "_blank");

    // Set the window's onload function to print and close the window
    printWindow.onload = function () {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = function () {
        // Clean up the Blob URL after printing
        URL.revokeObjectURL(url);
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
          quickLink={quickLink}
          handleQuickLinkChange={handleQuickLinkChange}
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
            pinnedTopRowData={
              selectedReport === "R" ||
              selectedReport === "G" ||
              selectedReport === "AM" ||
              selectedReport === "A"
                ? null
                : pinnedTopRowData
            }
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
          />
        </div>
      )}
    </div>
  );
};

export default ReportPage;
