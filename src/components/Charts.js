import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SketchPicker } from "react-color";
import { useUser } from "./UserContext";
import debounce from "lodash/debounce";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRedo,
  faCog,
  faPrint,
  faChartBar,
  faChartLine,
  faTimes,
  faExchangeAlt,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import { baseUrl } from "./config"; // Import the baseUrl

// Helper function to filter out zero or negative values
const filterLogarithmicData = (data) => {
  return data.map((item) => ({
    ...item,
    TestGas: item.TestGas > 0 ? item.TestGas : null,
    JTF: item.JTF > 0 ? item.JTF : null,
    FTF: item.FTF > 0 ? item.FTF : null,
    FAP: item.FAP > 0 ? item.FAP : null,
    GFFAP: item.GFFAP > 0 ? item.GFFAP : null,
    SND: item.SND > 0 ? item.SND : null,
  }));
};

const ChartComponent = () => {
  const [reportType, setReportType] = useState("CD");
  const { user } = useUser();
  const { userRole, userID } = useUser();
  const [selectedWellID, setSelectedWellID] = useState("");
  const [wells, setWells] = useState([]);

  const chartRef = useRef(null);
  const [data, setData] = useState([]);
  const [quickLink, setQuickLink] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const [chartTypes, setChartTypes] = useState({
    Oil: "bar",
    ProducedWater: "bar",
    InjectedWater: "bar",
    Gas: "line",
    Tbg: "line",
    Csg: "line",
    TestOil: "bar",
    TestWater: "bar",
    TestGas: "line",
    JTF: "line",
    FTF: "line",
    FAP: "line",
    GFFAP: "line",
    SND: "line",
  });
  const [colors, setColors] = useState({
    Oil: "#FF7F0E",
    ProducedWater: "#2CA02C",
    InjectedWater: "#1F77B4",
    Tbg: "#D62728",
    Csg: "#9467BD",
    Gas: "#8C564B",
    TestOil: "#FF7F0E",
    TestWater: "#2CA02C",
    TestGas: "#8C564B",
    JTF: "#FFBB78",
    FTF: "#98DF8A",
    FAP: "#AEC7E8",
    GFFAP: "#FF9896",
    SND: "#C5B0D5",
  });
  const [colorPicker, setColorPicker] = useState({
    visible: false,
    field: null,
  });
  const [logarithmic, setLogarithmic] = useState(false);
  const [stacked, setStacked] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [disabledSeries, setDisabledSeries] = useState([]);
  const [fromDate, setFromDate] = useState(
    moment().subtract(30, "days").format("YYYY-MM-DD")
  );
  const [thruDate, setThruDate] = useState(moment().format("YYYY-MM-DD"));
  const [selectedTag, setSelectedTag] = useState("All");
  const [selectedLeaseID, setSelectedLeaseID] = useState("~ALL~");
  const [leases, setLeases] = useState([]);
  const [tags, setTags] = useState(["All"]);
  const [chartView, setChartView] = useState("production");

  const formatXAxis = (tickItem) => {
    let date;
    if (reportType === "CM" && chartView === "production") {
      date = moment(tickItem, "MM-YYYY");
    } else {
      date = moment(tickItem, "YYYY-MM-DD");
    }
    return date.format("M/D/YY");
  };

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch(
        `${baseUrl}/api/userdetails.php?id=${userID}&chartsPref=true`
      );
      const data = await response.json();

      if (data.success && data.ChartsPref) {
        const { chartTypes, colors, logarithmic, disabledSeries } =
          data.ChartsPref;
        setChartTypes({
          ...chartTypes,
        });
        setColors({
          ...colors,
        });
        setLogarithmic(logarithmic || false);
        setDisabledSeries(disabledSeries || []);
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
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
      setWells(allWells);

      setLeases(leaseData);
      const uniqueTags = [
        ...new Set(
          leaseData.flatMap((lease) =>
            [lease.Tag1, lease.Tag2, lease.Tag3, lease.Tag4].filter(Boolean)
          )
        ),
      ];
      setTags(["All", ...uniqueTags]);
    } catch (error) {
      console.error("Error fetching leases:", error);
    }
  }, []);

  const fetchChartData = useCallback(async () => {
    try {
      const rpt = selectedLeaseID === "~ALL~" ? "C" : "P";
      const response = await fetch(
        `${baseUrl}/service_testprod.php?Rpt=${reportType}&QD=${quickLink}&LeaseID=${encodeURIComponent(
          selectedLeaseID
        )}&From=${fromDate}&Thru=${thruDate}&Tag=${selectedTag}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      return result.map((item) => ({
        GaugeDate:
          reportType === "CM"
            ? item.MonthYear
            : moment(item.GaugeDate).format("YYYY-MM-DD"),
        Oil: parseFloat(item.Produced) || 0,
        ProducedWater: parseFloat(item.ProducedWaterTotal) || 0,
        InjectedWater: parseFloat(item.InjectedWaterTotal) || 0,
        Gas: parseFloat(item.Gas) || 0,
        Tbg: parseFloat(item.Tbg) || 0,
        Csg: parseFloat(item.Csg) || 0,
      }));
    } catch (error) {
      console.error("Error fetching chart data:", error);
      return [];
    }
  }, [fromDate, thruDate, selectedLeaseID, selectedTag, quickLink, reportType]);

  const fetchWellTestData = useCallback(async () => {
    try {
      const response = await fetch(
        `${baseUrl}/service_welltests.php?LeaseID=${selectedLeaseID}&WellID=${selectedWellID}&FromDate=${fromDate}&ThruDate=${thruDate}`
      );

      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      return result.map((item) => ({
        GaugeDate: item.GaugeDate,
        TestOil: parseFloat(item.TestOil) || 0,
        TestWater: parseFloat(item.TestWater) || 0,
        TestGas: parseFloat(item.TestGas) || 0,
        Tbg: parseFloat(item.TbgPressure) || 0,
        Csg: parseFloat(item.CsgPressure) || 0,
        JTF: parseFloat(item.JTF) || 0,
        FTF: parseFloat(item.FTF) || 0,
        FAP: parseFloat(item.FAP) || 0,
        GFFAP: parseFloat(item.GFFAP) || 0,
        SND: parseFloat(item.SNDepth) || 0,
      }));
    } catch (error) {
      console.error("Error fetching well test data:", error);
      return [];
    }
  }, [selectedLeaseID, selectedWellID, fromDate, thruDate]);

  useEffect(() => {
    fetchPreferences();
    fetchLeases();
  }, [fetchPreferences, fetchLeases]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result =
          chartView === "production"
            ? await fetchChartData()
            : await fetchWellTestData();
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [chartView, fetchChartData, fetchWellTestData]);

  const debouncedSavePreferences = useCallback(
    debounce(async () => {
      try {
        const response = await fetch(`${baseUrl}/api/userdetails.php`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            UserID: userID,
            ChartsPref: { chartTypes, colors, logarithmic, disabledSeries },
          }),
        });

        const data = await response.json();
        if (!data.success)
          console.error("Error saving user preferences:", data.message);
      } catch (error) {
        console.error("Error saving user preferences:", error);
      }
    }, 300),
    [userID, chartTypes, colors, logarithmic, disabledSeries]
  );

  useEffect(() => {
    debouncedSavePreferences();
  }, [
    chartTypes,
    colors,
    logarithmic,
    disabledSeries,
    debouncedSavePreferences,
  ]);

  const handleQuickLinkChange = (qd) => {
    setQuickLink(qd);
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
  };

  const handleToggle = (field) => {
    setChartTypes((prev) => ({
      ...prev,
      [field]: prev[field] === "line" ? "bar" : "line",
    }));
  };

  const handleColorChange = (color) => {
    setColors((prev) => ({ ...prev, [colorPicker.field]: color.hex }));
    setColorPicker({ visible: false, field: null });
  };

  const handleLegendClick = ({ dataKey }) => {
    setDisabledSeries((prev) =>
      prev.includes(dataKey)
        ? prev.filter((item) => item !== dataKey)
        : [...prev, dataKey]
    );
  };

  const resetLegend = () => setDisabledSeries([]);

  const renderLegendText = (value, entry) => {
    const { color } = entry;
    let unit = "BBLS";
    if (
      value === "Gas" ||
      value === "TestGas" ||
      value === "JTF" ||
      value === "FTF" ||
      value === "FAP" ||
      value === "GFFAP" ||
      value === "SND"
    )
      unit = "MCF";
    return (
      <span style={{ color: disabledSeries.includes(value) ? "#ccc" : color }}>
        {value} ({unit})
      </span>
    );
  };

  useEffect(() => {
    if (selectedLeaseID !== "~ALL~") {
      const selectedLease = leases.find(
        (lease) => lease.LeaseID === selectedLeaseID
      );
      if (selectedLease) {
        setWells(selectedLease.Wells);
        setSelectedWellID(
          selectedLease.Wells.length > 0 ? selectedLease.Wells[0].WellID : ""
        ); // Automatically select the first well
      }
    } else {
      // If "All Leases" is selected, show all wells
      const allWells = leases.flatMap((lease) =>
        lease.Wells.map((well) => ({
          ...well,
          LeaseName: lease.LeaseName,
        }))
      );
      setWells(allWells);
      setSelectedWellID(""); // Reset selected well
    }
  }, [selectedLeaseID, leases]);

  const handleNextLease = () => {
    const currentIndex = leases.findIndex(
      (lease) => lease.LeaseID === selectedLeaseID
    );
    const nextIndex = (currentIndex + 1) % leases.length;
    setSelectedLeaseID(leases[nextIndex].LeaseID);
  };

  const handleNextWell = () => {
    const currentIndex = wells.findIndex(
      (well) => well.WellID === selectedWellID
    );
    const nextIndex = (currentIndex + 1) % wells.length;
    setSelectedWellID(wells[nextIndex].WellID);
  };

  const handlePrint = () => {
    const printContents = chartRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    const leaseName =
      leases.find((lease) => lease.LeaseID === selectedLeaseID)?.LeaseName ||
      "All Leases";

    // Function to format date to m/d/yy
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${date.getMonth() + 1}/${date.getDate()}/${date
        .getFullYear()
        .toString()
        .substr(-2)}`;
    };

    const style = `
      <style>
        @media print {
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          #printContainer {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          #headerInfo {
            margin-bottom: 20px;
            font-size: 12px;
          }
          #headerInfo h1 {
            font-size: 18px;
            margin: 0 0 10px 0;
          }
          #headerInfo p {
            margin: 2px 0;
          }
          #chartContainer {
            flex-grow: 1;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          #chartContainer > div {
            width: 100% !important;
            height: 100% !important;
          }
          .recharts-wrapper {
            width: 100% !important;
            height: 100% !important;
          }
          .reset-legend-button {
            display: none !important;
          }
          .recharts-legend-wrapper {
            bottom: 0 !important;
          }
        }
      </style>
    `;

    const headerInfo = `
      <div id="headerInfo">
        <h1>${
          chartView === "production" ? "Production Chart" : "Well Test Chart"
        }</h1>
        <p><strong>Date Range:</strong> ${formatDate(fromDate)} to ${formatDate(
      thruDate
    )}</p>
        <p><strong>Lease:</strong> ${leaseName}</p>
        ${
          chartView === "production" && selectedTag !== "all"
            ? `<p><strong>Tag:</strong> ${selectedTag}</p>`
            : ""
        }
        ${
          chartView === "wellTest"
            ? `<p><strong>Well:</strong> ${selectedWellID || "All Wells"}</p>`
            : ""
        }
        <p><strong>Y-Axis Scale:</strong> ${
          logarithmic ? "Logarithmic" : "Linear"
        }</p>
      </div>
    `;

    document.body.innerHTML =
      style +
      `
      <div id="printContainer">
        ${headerInfo}
        <div id="chartContainer">${printContents}</div>
      </div>
    `;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };
  const handleEditClick = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
    setIsEditing(!isEditing);
  };

  const handleChartViewChange = () => {
    setChartView(chartView === "production" ? "wellTest" : "production");
    setData([]); // Clear existing data
  };

  return (
    <>
      <div className="chart-container">
        <div className={`filters-container ${isEditing ? "editing" : ""}`}>
          <div className="filters">
            <div className="filter-group">
              <div className="filter-item">
                <label>Time Range</label>
                <select
                  value={quickLink}
                  onChange={(e) => handleQuickLinkChange(e.target.value)}
                >
                  <option value="30">Last 30 days</option>
                  <option value="CM">Current Month</option>
                  <option value="3D">Last 3 Days</option>
                  <option value="7D">Last 7 Days</option>
                  <option value="LM">Last Month</option>
                  <option value="3M">Last 3 months</option>
                  <option value="6M">Last 6 months</option>
                  <option value="CY">Current Year</option>
                  <option value="LY">Last Year</option>
                </select>
              </div>
              <div className="filter-item">
                <label>From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>To</label>
                <input
                  type="date"
                  value={thruDate}
                  onChange={(e) => setThruDate(e.target.value)}
                />
              </div>

              <div className="filter-item">
                <label>Lease</label>
                <select
                  value={selectedLeaseID}
                  onChange={(e) => setSelectedLeaseID(e.target.value)}
                >
                  {chartView === "production" ? (
                    <option value="~ALL~">All Leases</option>
                  ) : (
                    leases.length > 0 && (
                      <option value={leases[0].LeaseID} key={leases[0].LeaseID}>
                        {leases[0].LeaseName}
                      </option>
                    )
                  )}
                  {leases
                    .filter(
                      (lease) =>
                        chartView === "production" || lease.WellType !== "INJ"
                    )
                    .map((lease, index) => (
                      <option
                        key={lease.LeaseID}
                        value={lease.LeaseID}
                        selected={chartView !== "production" && index === 0}
                      >
                        {lease.LeaseName}
                      </option>
                    ))}
                </select>
                <button className="next-well-button" onClick={handleNextLease}>
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
              {chartView === "production" ? (
                <div className="filter-item">
                  <label>Tag</label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                  >
                    {tags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="filter-item">
                  <label>Well</label>
                  <select
                    value={selectedWellID}
                    onChange={(e) => setSelectedWellID(e.target.value)}
                    disabled={selectedLeaseID === "~ALL~"}
                  >
                    <option value="">Select a well</option>
                    {wells.map((well) => (
                      <option key={well.UniqID} value={well.WellID}>
                        {well.WellID}
                      </option>
                    ))}
                  </select>
                  <button className="next-well-button" onClick={handleNextWell}>
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                </div>
              )}
              {chartView === "production" && (
                <div className="filter-item">
                  <label>Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="CD">Daily</option>
                    <option value="CM">Monthly</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="action-buttons">
            <button
              className="action-button print-button"
              onClick={handlePrint}
            >
              <FontAwesomeIcon icon={faPrint} className="icon" /> Print
            </button>
            <button
              className="action-button settings-button"
              onClick={handleEditClick}
            >
              <FontAwesomeIcon
                icon={isSidePanelOpen ? faTimes : faCog}
                className="icon"
              />
              {isSidePanelOpen ? "Done" : "Edit"}
            </button>
          </div>
        </div>
        <div ref={chartRef} className="chart-container-inner">
          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            <ResponsiveContainer width="100%" height={700} key={chartView}>
              <ComposedChart
                data={logarithmic ? filterLogarithmicData(data) : data}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="GaugeDate"
                  tickFormatter={formatXAxis}
                  interval="preserveStartEnd"
                  tick={{ fontSize: 12, angle: -45, textAnchor: "end" }}
                  height={60}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis
                  yAxisId="left"
                  scale={logarithmic ? "log" : "linear"}
                  domain={
                    logarithmic ? [1, "auto"] : [0, (dataMax) => dataMax * 1.1]
                  }
                  allowDataOverflow={true}
                  label={{ value: "BBLS", angle: -90, position: "insideLeft" }}
                  tickCount={logarithmic ? undefined : 7}
                  tickFormatter={(value) => {
                    if (logarithmic) {
                      return value >= 1000000
                        ? `${(value / 1000000).toFixed(1)}M`
                        : value >= 1000
                        ? `${(value / 1000).toFixed(1)}K`
                        : value.toFixed(1);
                    }
                    return value >= 1000000
                      ? `${(value / 1000000).toFixed(1)}M`
                      : value >= 1000
                      ? `${(value / 1000).toFixed(1)}K`
                      : value.toFixed(1);
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  scale={logarithmic ? "log" : "linear"}
                  domain={
                    logarithmic ? [1, "auto"] : [0, (dataMax) => dataMax * 1.1]
                  }
                  allowDataOverflow={true}
                  label={{ value: "MCF", angle: -90, position: "insideRight" }}
                  tickCount={logarithmic ? undefined : 7}
                  tickFormatter={(value) => {
                    if (logarithmic) {
                      return value >= 1000000
                        ? `${(value / 1000000).toFixed(1)}M`
                        : value >= 1000
                        ? `${(value / 1000).toFixed(1)}K`
                        : value.toFixed(1);
                    }
                    return value >= 1000000
                      ? `${(value / 1000000).toFixed(1)}M`
                      : value >= 1000
                      ? `${(value / 1000).toFixed(1)}K`
                      : value.toFixed(1);
                  }}
                />
                <Tooltip />
                <Legend
                  onClick={handleLegendClick}
                  formatter={renderLegendText}
                />
                {chartView === "production" ? (
                  <>
                    {!disabledSeries.includes("Oil") &&
                      (chartTypes.Oil === "bar" ? (
                        <Bar yAxisId="left" dataKey="Oil" fill={colors.Oil} />
                      ) : (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Oil"
                          stroke={colors.Oil}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("ProducedWater") &&
                      (chartTypes.ProducedWater === "bar" ? (
                        <Bar
                          yAxisId="left"
                          dataKey="ProducedWater"
                          fill={colors.ProducedWater}
                        />
                      ) : (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="ProducedWater"
                          stroke={colors.ProducedWater}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("InjectedWater") &&
                      (chartTypes.InjectedWater === "bar" ? (
                        <Bar
                          yAxisId="left"
                          dataKey="InjectedWater"
                          fill={colors.InjectedWater}
                        />
                      ) : (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="InjectedWater"
                          stroke={colors.InjectedWater}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("Gas") &&
                      (chartTypes.Gas === "bar" ? (
                        <Bar yAxisId="right" dataKey="Gas" fill={colors.Gas} />
                      ) : (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="Gas"
                          stroke={colors.Gas}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("Tbg") &&
                      (chartTypes.Tbg === "bar" ? (
                        <Bar yAxisId="right" dataKey="Tbg" fill={colors.Tbg} />
                      ) : (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="Tbg"
                          stroke={colors.Tbg}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("Csg") &&
                      (chartTypes.Csg === "bar" ? (
                        <Bar yAxisId="right" dataKey="Csg" fill={colors.Csg} />
                      ) : (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="Csg"
                          stroke={colors.Csg}
                          dot={false}
                        />
                      ))}
                  </>
                ) : (
                  <>
                    {!disabledSeries.includes("TestOil") &&
                      (chartTypes.TestOil === "bar" ? (
                        <Bar
                          yAxisId="left"
                          dataKey="TestOil"
                          name="Test Oil"
                          fill={colors.TestOil}
                        />
                      ) : (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="TestOil"
                          name="Test Oil"
                          stroke={colors.TestOil}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("TestWater") &&
                      (chartTypes.TestWater === "bar" ? (
                        <Bar
                          yAxisId="left"
                          dataKey="TestWater"
                          name="Test Water"
                          fill={colors.TestWater}
                        />
                      ) : (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="TestWater"
                          name="Test Water"
                          stroke={colors.TestWater}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("TestGas") &&
                      (chartTypes.TestGas === "bar" ? (
                        <Bar
                          yAxisId="right"
                          dataKey="TestGas"
                          name="Test Gas"
                          fill={colors.TestGas}
                        />
                      ) : (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="TestGas"
                          name="Test Gas"
                          stroke={colors.TestGas}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("Tbg") &&
                      (chartTypes.Tbg === "bar" ? (
                        <Bar yAxisId="right" dataKey="Tbg" fill={colors.Tbg} />
                      ) : (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="Tbg"
                          stroke={colors.Tbg}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("Csg") &&
                      (chartTypes.Csg === "bar" ? (
                        <Bar yAxisId="right" dataKey="Csg" fill={colors.Csg} />
                      ) : (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="Csg"
                          stroke={colors.Csg}
                          dot={false}
                        />
                      ))}

                    {!disabledSeries.includes("JTF") &&
                      (chartTypes.JTF === "bar" ? (
                        <Bar
                          yAxisId="right"
                          dataKey="JTF"
                          name="JTF"
                          fill={colors.JTF}
                        />
                      ) : (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="JTF"
                          name="JTF"
                          stroke={colors.JTF}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("FTF") &&
                      (chartTypes.FTF === "bar" ? (
                        <Bar
                          yAxisId="right"
                          dataKey="FTF"
                          name="FTF"
                          fill={colors.FTF}
                        />
                      ) : (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="FTF"
                          name="FTF"
                          stroke={colors.FTF}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("FAP") &&
                      (chartTypes.FAP === "bar" ? (
                        <Bar
                          yAxisId="right"
                          dataKey="FAP"
                          name="FAP"
                          fill={colors.FAP}
                        />
                      ) : (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="FAP"
                          name="FAP"
                          stroke={colors.FAP}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("GFFAP") &&
                      (chartTypes.GFFAP === "bar" ? (
                        <Bar
                          yAxisId="right"
                          dataKey="GFFAP"
                          name="GFFAP"
                          fill={colors.GFFAP}
                        />
                      ) : (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="GFFAP"
                          name="GFFAP"
                          stroke={colors.GFFAP}
                          dot={false}
                        />
                      ))}
                    {!disabledSeries.includes("SND") &&
                      (chartTypes.SND === "bar" ? (
                        <Bar
                          yAxisId="right"
                          dataKey="SND"
                          name="SND"
                          fill={colors.SND}
                        />
                      ) : (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="SND"
                          name="SND"
                          stroke={colors.SND}
                          dot={false}
                        />
                      ))}
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
          <button className="reset-legend-button" onClick={resetLegend}>
            <FontAwesomeIcon icon={faRedo} className="icon" /> Reset Legend
          </button>
        </div>
        <div className={`settings-panel ${isSidePanelOpen ? "open" : ""}`}>
          <h2>Settings</h2>
          <div className="settings-section">
            <h3>Chart Type and Color</h3>
            {Object.entries(
              chartView === "production"
                ? {
                    Oil: chartTypes.Oil,
                    ProducedWater: chartTypes.ProducedWater,
                    InjectedWater: chartTypes.InjectedWater,
                    Gas: chartTypes.Gas,
                    Tbg: chartTypes.Tbg,
                    Csg: chartTypes.Csg,
                  }
                : {
                    TestOil: chartTypes.TestOil,
                    TestWater: chartTypes.TestWater,
                    TestGas: chartTypes.TestGas,
                    Tbg: chartTypes.Tbg,
                    Csg: chartTypes.Csg,
                    JTF: chartTypes.JTF,
                    FTF: chartTypes.FTF,
                    FAP: chartTypes.FAP,
                    GFFAP: chartTypes.GFFAP,
                    SND: chartTypes.SND,
                  }
            ).map(([field, type]) => (
              <div key={field} className="settings-item">
                <span>{field}</span>
                <div className="chart-controls">
                  <button
                    className="chart-type-button"
                    onClick={() => handleToggle(field)}
                  >
                    {type === "line" ? (
                      <FontAwesomeIcon icon={faChartBar} />
                    ) : (
                      <FontAwesomeIcon icon={faChartLine} />
                    )}
                  </button>
                  <div
                    className="color-box"
                    style={{ backgroundColor: colors[field] }}
                    onClick={() => setColorPicker({ visible: true, field })}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="settings-section">
            <h3>Y-Axis Scale</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={logarithmic}
                onChange={() => setLogarithmic(!logarithmic)}
              />
              Logarithmic
            </label>
          </div>
          {chartView === "production" && (
            <div className="settings-section">
              <h3>Stacked Options</h3>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={stacked}
                  onChange={() => setStacked(!stacked)}
                />
                Stacked Gas and Tbg
              </label>
            </div>
          )}
        </div>
        {colorPicker.visible && (
          <div className="color-picker-modal">
            <div className="color-picker-container">
              <SketchPicker
                color={colors[colorPicker.field]}
                onChangeComplete={handleColorChange}
              />
              <button
                className="close-button"
                onClick={() => setColorPicker({ visible: false, field: null })}
              >
                Close
              </button>
            </div>
          </div>
        )}
        <div className="fab-container">
          <button className="fab" onClick={handleChartViewChange}>
            <FontAwesomeIcon icon={faExchangeAlt} />
            {chartView === "production" ? "Wells" : "Prod"}
          </button>
        </div>
      </div>
      <style jsx>{`
        .chart-container {
          min-height: 100vh;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 0px;
          width: 100%;
          box-sizing: border-box;
        }

        .filters-container {
          width: 100%;
          max-width: 80%;
          background: linear-gradient(to right, #ebf4ff, #dee6ff);
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 8px;
          display: flex;
          align-items: center;
          transition: transform 0.3s ease-in-out;
        }

        .filters-container.editing {
          transform: translateX(-100px);
        }

        .filters {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
        }

        .filter-group {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          flex: 1;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          margin-bottom: 0;
        }

        .filter-item label {
          margin-bottom: 4px;
          font-size: 12px;
          font-weight: 500;
          color: #4a4a4a;
        }

        .filter-item select,
        .filter-item input {
          width: 100%;
          max-width: 200px;
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .filter-item select:focus,
        .filter-item input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
          outline: none;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          margin-left: 16px;
        }

        .action-button {
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }

        .print-button {
          background-color: #10b981;
          color: #fff;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }

        .print-button:hover {
          background-color: #059669;
        }

        .settings-button {
          background-color: #3b82f6;
          color: #fff;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .settings-button:hover {
          background-color: #2563eb;
        }

        .next-lease-button,
        .next-well-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          margin-left: 10px;
          background-color: transparent;
          color: #1d72b8;
          border: none;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .next-lease-button:hover,
        .next-well-button:hover {
          color: #155a8a;
        }

        .next-lease-button:focus,
        .next-well-button:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(29, 114, 184, 0.4);
        }

        .next-lease-button .fa-icon,
        .next-well-button .fa-icon {
          margin-left: 0;
        }

        .chart-container-inner {
          width: 100%;
          max-width: 100%;
          background-color: #ffffff;
          border-radius: 8px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
        }

        .loading-spinner::after {
          content: "";
          display: block;
          width: 64px;
          height: 64px;
          border: 8px solid #f3f4f6;
          border-top: 8px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .reset-legend-button {
          margin-top: 16px;
          padding: 8px 16px;
          background-color: #3b82f6;
          color: #fff;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }

        .reset-legend-button:hover {
          background-color: #2563eb;
        }

        .settings-panel {
          position: fixed;
          right: -280px;
          top: 10%;
          height: auto;
          max-height: 80vh;
          overflow-y: auto;
          width: 280px;
          padding: 24px;
          background-color: #ffffff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: right 0.3s ease-in-out;
        }

        .settings-panel.open {
          right: 0;
        }

        .settings-panel h2 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .settings-section {
          margin-bottom: 24px;
        }

        .settings-section h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .settings-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .chart-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chart-type-button {
          padding: 6px;
          border-radius: 4px;
          background-color: #3b82f6;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }

        .chart-type-button:hover {
          background-color: #2563eb;
        }

        .color-box {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
        }

        .checkbox-label input {
          margin-right: 8px;
        }

        .color-picker-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .color-picker-container {
          background-color: #ffffff;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .close-button {
          margin-top: 16px;
          padding: 8px 16px;
          background-color: #ef4444;
          color: #fff;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }

        .close-button:hover {
          background-color: #dc2626;
        }

        .fab-container {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 1000;
        }

        .fab {
          width: 56px;
          height: 56px;
          border-radius: 28px;
          background-color: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .fab:hover {
          background-color: #2563eb;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </>
  );
};

export default ChartComponent;
