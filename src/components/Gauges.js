import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { baseUrl } from "./config.js";
import { useUser } from "./UserContext";

/**
 * MAIN COMPONENT
 */
function GaugeEntryPage() {
  /*************************************************
   * 0) Fetch client-level flags from API
   *************************************************/
  const [showBSW, setShowBSW] = useState(false);
  const [use24, setUse24] = useState(false);
  const [useLinePressure, setUseLinePressure] = useState(false);
  const [useColorCut, setUseColorCut] = useState(false);
  const [useImages, setUseImages] = useState(false);
  const [showWells, setShowWells] = useState(false);
  const [showPOC, setShowPOC] = useState(true); // default true
  const [manualWaterLabel, setManualWaterLabel] = useState("Produced Water");
  const [manualWaterLabel2, setManualWaterLabel2] = useState("bbls");
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { companyName } = useUser();
  const [tanks, setTanks] = useState([]);

  const [tankID, setTankID] = useState("");
  const [showLoads, setShowLoads] = useState(false);
  const [purchaserLoads, setPurchaserLoads] = useState([]);
  const [expandPurchaser, setExpandPurchaser] = useState(false);
  const [lastUser, setLastUser] = useState("");
  const [lastUpdateDate, setLastUpdateDate] = useState("");

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Example: fetch client-level settings once
  useEffect(() => {
    if (!companyName) return;

    fetch(`${baseUrl}/api/clientDetails.php?company=${companyName}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          const clientInfo = data[0];
          setShowBSW(clientInfo.useBSW === "Y");
          setUse24(clientInfo.use24 === "Y");
          setUseLinePressure(clientInfo.useLinePressure === "Y");
          setShowWells(clientInfo.ShowWells === "Y");
          setUseColorCut(clientInfo.UseColorCut === "Y");
          setUseImages(clientInfo.UseImages === "Y");
          setPurchaserPhone(data[0].purchasers[0].DispatchPhone);
          setPurchaserEmail(data[0].purchasers[0].OperatorEmail);

          if (clientInfo.ShowLoads === "Y") {
            setShowLoads(true);
          }
          if (clientInfo.ShowPOC === "N") {
            setShowPOC(false);
          }
          if (clientInfo.ManualWaterLabel) {
            setManualWaterLabel(clientInfo.ManualWaterLabel);
          }
          if (clientInfo.ManualWaterLabel2) {
            setManualWaterLabel2(clientInfo.ManualWaterLabel2);
          }
          if (clientInfo.purchaserloads) {
            setPurchaserLoads(clientInfo.purchaserloads);
          }
        }
      })
      .catch((err) => console.error("Error fetching client details:", err));
  }, [companyName]);

  /*************************************************
   * 1) Read URL parameter: leaseid=XXXX
   *************************************************/
  const [searchParams] = useSearchParams();
  const paramLeaseID = searchParams.get("leaseid") || "";

  /*************************************************
   * 2) Basic data fetched from lease-level API
   *************************************************/
  const [leaseData, setLeaseData] = useState(null);

  // Lease-level states
  const [leaseID, setLeaseID] = useState("");
  const [leaseName, setLeaseName] = useState("");
  const [pumper, setPumper] = useState("");
  const [pumperPhone, setPumperPhone] = useState("");
  const [pumperEmail, setPumperEmail] = useState("");

  const [purchaserID, setPurchaserID] = useState("");
  const [purchaser, setPurchaser] = useState("");
  const [purchaserPhone, setPurchaserPhone] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [purchaserLeaseNo, setPurchaserLeaseNo] = useState("");

  // Show flags (lease-level)
  const [showOil, setShowOil] = useState(false);
  const [showWater, setShowWater] = useState(false);
  const [showGas, setShowGas] = useState(false);
  const [hasGasMeter, setHasGasMeter] = useState(false);
  const [hasWaterMeter, setHasWaterMeter] = useState(false);

  // Tanks
  const [oilGauges, setOilGauges] = useState([]);
  const [waterGauges, setWaterGauges] = useState([]);

  // Wells
  const [wellEntries, setWellEntries] = useState([]);

  useEffect(() => {
    if (!paramLeaseID) return;
    const url = `${baseUrl}/api/leases.php?leaseid=${paramLeaseID}`;
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json && Array.isArray(json) && json.length > 0) {
          setLeaseData(json[0]);
        }
      })
      .catch((err) => console.error("Error fetching lease data:", err));
  }, [paramLeaseID]);

  // Populate from leaseData
  useEffect(() => {
    if (!leaseData) return;

    // You can optionally do something with user, role, username, userphone here:
    console.log("User context data:", { user, role, username, userphone });

    setTankID(leaseData.Tanks[0]?.TankID || "");
    setTanks(leaseData.Tanks || "");

    console.log(tanks);
    setLeaseID(leaseData.LeaseID || "");
    setLeaseName(leaseData.LeaseName || "");
    setPumper(leaseData.PumperID || "");
    setPurchaserID(leaseData.Purchaser || "");
    setPurchaser(leaseData.Purchaser || "");
    setPurchaserLeaseNo(leaseData.PurchaserLeaseNo || "");

    setShowOil(leaseData.ShowOil === "Y");
    setShowWater(leaseData.ShowWater === "Y");
    setShowGas(leaseData.ShowGas === "Y");
    setHasGasMeter(leaseData.GasMeter === "Y");
    setHasWaterMeter(leaseData.WaterMeter === "Y");

    if (leaseData.Tanks && Array.isArray(leaseData.Tanks)) {
      const oilTanks = leaseData.Tanks.filter((t) => t.TankType === "T");
      const waterTanks = leaseData.Tanks.filter((t) => t.TankType === "W");

      const mappedOil = oilTanks.map((tank) => ({
        GaugeID: 0,
        TankID: tank.TankID,
        tankId: tank.TankID,
        size: tank.Size,
        gaugeFt: 0,
        gaugeIn: 0,
        colorCutFt: 0,
        colorCutIn: 0,
        overrideBbls: 0,
        bblsPerInch: parseFloat(tank.BBLSperInch || "0"),
      }));
      setOilGauges(mappedOil);

      const mappedWater = waterTanks.map((tank) => ({
        GaugeID: 0,
        TankID: tank.TankID,
        tankId: tank.TankID,
        size: tank.Size,
        gaugeFt: 0,
        gaugeIn: 0,
        bblsPerInch: parseFloat(tank.BBLSperInch || "0"),
      }));
      setWaterGauges(mappedWater);
    }

    if (leaseData.Wells && Array.isArray(leaseData.Wells)) {
      const mappedWells = leaseData.Wells.map((w, idx) => ({
        WellGaugeId: 0,
        wellID: w.WellID || `Well-${idx}`,
        wellOn: w.Active === "Y" ? "Y" : "N",
        reasonDown: "NU",
        note: "",
        tbg: "",
        csg: "",
        oilTest: "",
        gasTest: "",
        waterTest: "",
        TSTM: "",
        JTF: "",
        FTF: "",
        FAP: "",
        GFFAP: "",
        SND: "",
      }));
      setWellEntries(mappedWells);
    }
  }, [leaseData]);

  /*************************************************
   * 3) Standard user session / date / role, etc.
   *************************************************/
  const { userID, userRole, userEmail, userPhone } = useUser();
  const user = userID;
  const role = userRole;
  const username = userEmail;
  const userphone = userPhone;

  // Rename them locally to match your existing variable names:

  // We'll assume "Gauge Date" as a placeholder
  const [gaugeDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [src] = useState("-");
  const [srcFrom] = useState("-1");
  const [srcThru] = useState("-1");

  // Additional states
  const [expandWells, setExpandWells] = useState(false);
  const [showWaterTanks] = useState(true);
  const [showMcf, setShowMcf] = useState(true);
  const [showMcfAccum, setShowMcfAccum] = useState(true);

  // LACT
  const [useLACT] = useState(false);
  const [showLACT] = useState(false);

  /*************************************************
   * 4) Oil & Gas & Water & Pressure fields
   *************************************************/
  // Gas
  const [gasMeter, setGasMeter] = useState(0);
  const [gasMeterReset, setGasMeterReset] = useState("N");
  const [mcf, setMcf] = useState(0);
  const [mcfAccum, setMcfAccum] = useState(0);
  const [linePressure, setLinePressure] = useState(0);
  const [tbgPressure, setTbgPressure] = useState(0);
  const [csgPressure, setCsgPressure] = useState(0);
  const [staticPressure, setStaticPressure] = useState(0);
  const [diffPressure, setDiffPressure] = useState(0);
  const [flowRate, setFlowRate] = useState(0);
  const [choke, setChoke] = useState(0);
  const [hoursOn, setHoursOn] = useState(0);
  const [gasDisp, setGasDisp] = useState("3");

  // Water
  const [waterMeter, setWaterMeter] = useState(0);
  const [waterMeterReset, setWaterMeterReset] = useState("N");
  const [manualWater, setManualWater] = useState(0);

  // Common
  const [gaugeTime, setGaugeTime] = useState("12:00");
  const [pocRunTime, setPocRunTime] = useState(100);
  const [spcc, setSpcc] = useState("");
  const [initialGauges, setInitialGauges] = useState("N");
  const [comments, setComments] = useState("");

  /*************************************************
   * 5) Summaries (oil/water)
   *************************************************/
  const [oilProduced, setOilProduced] = useState(0);
  const [oilOnHand, setOilOnHand] = useState(0);
  const [inchesProduced, setInchesProduced] = useState(0);
  const [drawBbls, setDrawBbls] = useState(0);
  const [soldOil, setSoldOil] = useState(0);
  const [colorCutOnHand, setColorCutOnHand] = useState(0);

  const [waterProduced, setWaterProduced] = useState(0);
  const [waterOnHand, setWaterOnHand] = useState(0);
  const [waterInchesProduced, setWaterInchesProduced] = useState(0);
  const [waterHauledBbls, setWaterHauledBbls] = useState(0);

  const [meteredWater, setMeteredWater] = useState(0);
  const [meteredGas, setMeteredGas] = useState(0);

  // Recalculate oil tanks if user changes gauge
  useEffect(() => {
    let totalOilInches = 0;
    let totalOilBbls = 0;
    let totalColorCutBbls = 0;

    oilGauges.forEach((tank) => {
      const inches = tank.gaugeFt * 12 + tank.gaugeIn;
      totalOilInches += inches;
      const bbls = inches * tank.bblsPerInch;
      totalOilBbls += bbls;

      if (useColorCut) {
        const ccInches = tank.colorCutFt * 12 + tank.colorCutIn;
        const ccBbls = ccInches * tank.bblsPerInch;
        totalColorCutBbls += ccBbls;
      }
    });

    const netOilBbls = totalOilBbls - totalColorCutBbls;
    setOilProduced(netOilBbls);
    setInchesProduced(totalOilInches);
    setOilOnHand(netOilBbls);
    setColorCutOnHand(totalColorCutBbls);

    // placeholders for example
    setSoldOil(10.0);
    setDrawBbls(1.5);
  }, [oilGauges, useColorCut]);

  // Recalculate water tanks if user changes gauge
  useEffect(() => {
    let totalWaterInches = 0;
    let totalWaterBbls = 0;

    waterGauges.forEach((tank) => {
      const inches = tank.gaugeFt * 12 + tank.gaugeIn;
      const bbls = inches * tank.bblsPerInch;
      totalWaterInches += inches;
      totalWaterBbls += bbls;
    });

    setWaterProduced(totalWaterBbls);
    setWaterInchesProduced(totalWaterInches);
    setWaterOnHand(totalWaterBbls);
    setWaterHauledBbls(10);
  }, [waterGauges]);

  useEffect(() => {
    setMeteredWater(waterMeter);
  }, [waterMeter, waterMeterReset]);

  useEffect(() => {
    setMeteredGas(gasMeter);
  }, [gasMeter, gasMeterReset]);
  function useWindowWidth() {
    const [windowWidth, setWindowWidth] = useState(
      typeof window !== "undefined" ? window.innerWidth : 9999
    );

    useEffect(() => {
      function handleResize() {
        setWindowWidth(window.innerWidth);
      }
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    return windowWidth;
  }

  /*************************************************
   * 6) Recent Gauge History (AG Grid)
   *************************************************/
  const [expandHistory, setExpandHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyRowData, setHistoryRowData] = useState([]);
  const [pinnedTopRowData, setPinnedTopRowData] = useState([]);
  const windowWidth = useWindowWidth();
  const isNarrow = windowWidth <= 850;

  // Hard-coded "T" for Gauges By Tank
  const [selectedReport] = useState("T");

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      console.warn("Form validation failed");
      return;
    }

    // Build POST params
    const params = new URLSearchParams();

    // Required gauge data
    params.append("lid", leaseID);
    params.append("gdate", gaugeDate);
    params.append("showWells", showWells ? "Y" : "N");

    // Pass the user as LogUserID
    params.append("LogUserID", user || "UnknownUser");

    // Oil gauges
    oilGauges.forEach((tank) => {
      params.append("gaugeid[]", tank.GaugeID || 0);
      params.append("tankid[]", tank.TankID || "");
      params.append("override[]", "N");
      params.append("gaugeft[]", tank.gaugeFt || 0);
      params.append("gaugein[]", tank.gaugeIn || 0);
      params.append("overridebbls[]", tank.overrideBbls || 0);
      params.append("accumoverridebbls[]", "0.00");
    });

    // Water gauges
    waterGauges.forEach((wt) => {
      params.append("wgaugeid[]", wt.GaugeID || 0);
      params.append("wgaugeft[]", wt.gaugeFt || 0);
      params.append("wgaugein[]", wt.gaugeIn || 0);
    });

    // Wells
    if (showWells) {
      wellEntries.forEach((well) => {
        params.append("wellgaugeid[]", well.WellGaugeId || "");
        params.append("wellon[]", well.wellOn || "Y");
        params.append("reasondown[]", well.reasonDown || "NU");
        params.append("note[]", well.note || "");
        params.append("welltbg[]", well.tbg || 0);
        params.append("wellcsg[]", well.csg || 0);
        params.append("testoil[]", well.oilTest || 0);
        params.append("testgas[]", well.gasTest || 0);
        params.append("testwater[]", well.waterTest || 0);
        params.append("tstm[]", well.TSTM || "N");
        params.append("jtf[]", well.JTF || 0);
        params.append("ftf[]", well.FTF || 0);
        params.append("fap[]", well.FAP || 0);
        params.append("gffap[]", well.GFFAP || 0);
        params.append("snd[]", well.SND || 0);
      });
    }

    // Pressures, water meter, etc.
    params.append("tbg", tbgPressure || 0);
    params.append("csg", csgPressure || 0);
    params.append("h20m", waterMeter || 0);
    params.append("h20reset", waterMeterReset);
    params.append("h20", manualWater || 0);
    params.append("comments", comments || "");
    params.append("spcc", spcc || "");
    params.append("initgauges", initialGauges);

    try {
      const response = await fetch(`${baseUrl}/service_postgauge.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      // If the Service Worker returns 202, it usually means offline (queued)
      if (response.status === 202) {
        console.log("Request accepted (202) - likely offline and queued.");
        navigate(`/pumper?activeLease=${leaseID}`);
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const textResp = await response.text();
        result = { status: "error", message: textResp };
      }

      console.log("Server response (Gauge):", result);

      // Handle known foreign key error if it appears
      if (
        result.message &&
        result.message.includes("Cannot add or update a child row")
      ) {
        alert(
          "The selected TankID is not recognized by the database (foreign key constraint). " +
            "Please use a valid TankID for this Lease."
        );
        return;
      }

      if (result.status === "success") {
        navigate(`/pumper?activeLease=${leaseID}`);
      } else {
        alert(`Partial or error.\n${JSON.stringify(result)}`);
      }
    } catch (err) {
      console.error("POST error:", err);
      alert(`Submission failed: ${err.message}`);
    }
  };

  // AG Grid columns
  const historyColumnDefs = useMemo(() => {
    return [
      {
        headerName: "Date",
        field: "GaugeDate",
        flex: 1,
        valueFormatter: (params) => {
          if (params.value === "Totals") return "Totals";
          return moment(params.value, "MM/DD/YYYY").format("MM/DD/YYYY");
        },
        cellStyle: { textAlign: "center" },
        sort: "desc",
        sortable: true,
        filter: true,
      },
      {
        headerName: "Time",
        field: "GaugeTime",
        flex: 1,
        cellStyle: { textAlign: "center" },
        sortable: true,
        filter: true,
      },
      {
        headerName: "Type",
        field: "GaugeType",
        flex: 1,
        cellStyle: { textAlign: "center" },
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          const value = params.value ? params.value.trim().toUpperCase() : "";
          if (value === "R") return "Run Ticket";
          if (value === "G") return "Gauge";
          return value;
        },
      },
      {
        headerName: "Tank",
        field: "TankID",
        flex: 1,
        cellStyle: { textAlign: "center" },
        sortable: true,
        filter: true,
      },
      {
        headerName: "Gauge",
        field: "Gauge",
        flex: 1,
        sortable: true,
        filter: true,
      },
      {
        headerName: "Gross Bbls",
        field: "produced",
        flex: 1,
        type: "rightAligned",
        sortable: true,
        filter: true,
      },
      {
        headerName: "Run Bbls",
        field: "runbbls",
        flex: 1,
        type: "rightAligned",
        sortable: true,
        filter: true,
      },
      {
        headerName: "BS&W Draws",
        field: "drawbbls",
        flex: 1,
        type: "rightAligned",
        sortable: true,
        filter: true,
      },
      {
        headerName: "Comments",
        field: "Comment",
        flex: 1,
        cellStyle: { textAlign: "left" },
        sortable: true,
        filter: true,
      },
      {
        headerName: "Tbg",
        field: "TbgPressure",
        flex: 1,
        type: "rightAligned",
        sortable: true,
        filter: true,
      },
      {
        headerName: "Csg",
        field: "CsgPressure",
        flex: 1,
        type: "rightAligned",
        sortable: true,
        filter: true,
      },
    ];
  }, []);
  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 80,
    }),
    []
  );

  // Auto-fetch if "T" & leaseID
  useEffect(() => {
    if (selectedReport !== "T" || !leaseID) return;
    fetchRecentGaugeHistory();
  }, [selectedReport, leaseID]);

  const fetchRecentGaugeHistory = async () => {
    try {
      setLoadingHistory(true);
      let apiUrl = `${baseUrl}/service_testgauge.php`;
      const params = new URLSearchParams();
      params.append("Rpt", "T");
      params.append("LeaseID", leaseID);

      const fromDate = moment().subtract(7, "days").format("YYYY-MM-DD");
      const thruDate = moment().format("YYYY-MM-DD");
      params.append("From", fromDate);
      params.append("Thru", thruDate);
      apiUrl += `?${params.toString()}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      const formattedData = data.map((item) => ({
        ...item,
        GaugeDate: moment(item.GaugeDate).format("MM/DD/YYYY"),
        GaugeTime: moment(item.GaugeTime, "HH:mm:ss").format("HH:mm"),
        Gauge: `${item.GaugeFt}' ${item.GaugeIn}"`,
      }));

      setHistoryRowData(formattedData);
      calculateTotalsForGaugesByTank(formattedData);

      // Prefill from the MOST RECENT record
      if (formattedData.length > 0) {
        const sorted = [...formattedData].sort(
          (a, b) =>
            new Date(b.GaugeDate + " " + b.GaugeTime) -
            new Date(a.GaugeDate + " " + a.GaugeTime)
        );
        const mostRecent = sorted[0];

        setTbgPressure(parseFloat(mostRecent.TbgPressure || 0));
        setCsgPressure(parseFloat(mostRecent.CsgPressure || 0));

        if (mostRecent.WMeter) {
          setWaterMeter(parseFloat(mostRecent.WMeter));
        }
        if (mostRecent.GMeter) {
          setGasMeter(parseFloat(mostRecent.GMeter));
        }
      }
    } catch (error) {
      console.error("Error fetching recent gauge history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };
  // 1) Create a helper to format your date-time string
  function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return "";

    // Replace the space with "T" so it's a valid ISO8601 date-time for the Date constructor
    // e.g. "2025-02-06 14:21:18" => "2025-02-06T14:21:18"
    const isoString = dateTimeStr.replace(" ", "T");

    // Parse into a Date object
    const dateObj = new Date(isoString);

    // If parsing fails (invalid date), just return the raw string or handle error
    if (isNaN(dateObj.getTime())) {
      return dateTimeStr;
    }

    // Split out the date part in "MM/DD/YYYY" format
    const datePart = dateObj.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    // Split out the time part in "h:mm:ss am/pm" format (lowercase "am/pm")
    const timePart = dateObj
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
      .toLowerCase();

    // Combine them (remove comma if you prefer a single space)
    return `${datePart} ${timePart}`;
  }

  // 2) Use this helper inside your fetchGaugeRows logic
  async function fetchGaugeRows() {
    if (!leaseID || !gaugeDate) return;

    try {
      const params = new URLSearchParams();
      params.set("lid", leaseID);
      params.set("gdate", gaugeDate);

      const url = `${baseUrl}/service_getgauges.php?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "success") {
        const dailyRows = data.daily || [];
        const recentComment = data.recentComment || "";
        const recentLogUserID = data.recentLogUserID || "";
        const recentLogDateTime = data.recentLogDateTime || "";

        // Update comment
        setComments(recentComment);

        // -------------- Format the LogDateTime --------------
        const formattedLogDateTime = formatDateTime(recentLogDateTime);

        // Set your "lastUser" and "lastUpdateDate" states
        setLastUser(recentLogUserID);
        setLastUpdateDate(formattedLogDateTime);

        // ...the rest of your logic for updating oil/water gauges...
        // (unchanged code below)
        const dailyByTankID = {};
        dailyRows.forEach((row) => {
          if (row.TankID) {
            dailyByTankID[row.TankID] = row;
          }
        });

        setOilGauges((prev) =>
          prev.map((oilTank) => {
            const daily = dailyByTankID[oilTank.tankId];
            if (!daily) return oilTank;
            return {
              ...oilTank,
              GaugeID: parseInt(daily.GaugeID || "0", 10),
              gaugeFt: parseFloat(daily.GaugeFt || "0"),
              gaugeIn: parseFloat(daily.GaugeIn || "0"),
            };
          })
        );

        setWaterGauges((prev) =>
          prev.map((wTank) => {
            const daily = dailyByTankID[wTank.tankId];
            if (!daily) return wTank;
            return {
              ...wTank,
              GaugeID: parseInt(daily.GaugeID || "0", 10),
              gaugeFt: parseFloat(daily.GaugeFt || "0"),
              gaugeIn: parseFloat(daily.GaugeIn || "0"),
            };
          })
        );

        // If TbgPressure, CsgPressure, GMeter, etc. are global fields, use the first row
        if (dailyRows.length > 0) {
          const firstRow = dailyRows[0];
          setTbgPressure(parseFloat(firstRow.TbgPressure || "0"));
          setCsgPressure(parseFloat(firstRow.CsgPressure || "0"));
          setGasMeter(parseFloat(firstRow.GMeter || "0"));
        }
      } else {
        console.error("Error from service_getgauges:", data.message);
      }
    } catch (err) {
      console.error("Fetch gauge rows error:", err);
    }
  }

  useEffect(() => {
    fetchGaugeRows();
  }, [leaseID, gaugeDate, showWells]);

  const calculateTotalsForGaugesByTank = (data) => {
    const totals = data.reduce(
      (acc, curr) => ({
        GaugeDate: "Totals",
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
      }),
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

    Object.keys(totals).forEach((key) => {
      if (key !== "GaugeDate") {
        totals[key] = parseFloat(totals[key]).toFixed(2);
      }
    });

    setPinnedTopRowData([totals]);
  };

  const onGridReady = (params) => {
    params.api.sizeColumnsToFit();
  };

  /*************************************************
   * 7) Validation & Submission
   *************************************************/
  const validateForm = () => {
    if (showWells && expandWells) {
      for (const w of wellEntries) {
        if (w.wellOn === "N") {
          if (!w.reasonDown || w.reasonDown === "NU" || !w.note) {
            alert(`Well ${w.wellID} is Off - Reason Down & Note Required`);
            return false;
          }
        } else {
          if (w.reasonDown && w.reasonDown !== "NU") {
            alert(`Well ${w.wellID}: Reason Down not needed when ON.`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleCancel = () => {
    switch (src) {
      case "O24":
        alert("Redirect to O24 page...");
        break;
      case "GD":
        alert("Redirect to GD page...");
        break;
      default:
        alert("Canceled. Normally redirect to default page.");
        break;
    }
  };

  /*************************************************
   * 8) Tickets modals + EDITING
   *************************************************/
  const [showRunTicketModal, setShowRunTicketModal] = useState(false);
  const [showWaterTicketModal, setShowWaterTicketModal] = useState(false);

  const [runTickets, setRunTickets] = useState([]);
  const [waterTickets, setWaterTickets] = useState([]);

  const [editingRunTicketIndex, setEditingRunTicketIndex] = useState(null);
  const [editingWaterTicketIndex, setEditingWaterTicketIndex] = useState(null);

  const [newRunTicket, setNewRunTicket] = useState({
    src: "-1",
    lact: "N",
    lid: "",
    gdate: "",
    gaugeid1: "-1",
    gaugeid2: "-1",
    imagefilename: "",
    gaugedate: "",
    gaugetime: "15:30",
    gaugetype: "B",
    comments: "",
    tickettype: "S",
    tankid: tankID, // Notice here: "GAS" must exist in your Tanks table if referencing foreign key
    opengaugeft: 0,
    opengaugein: 0,
    closegaugeft: 0,
    closegaugein: 0,
    override: "N",
    overridebbls: "",
    gravity: 2,
    temp: 2,
    bsw: 2,
    image_upload: "",
    runTicketNumber: 999,
    disposition: "",
    ticketId: "",
  });

  const [newWaterTicket, setNewWaterTicket] = useState({
    src: "-1",
    lact: "N",
    lid: "",
    gdate: "",
    gaugeid1: "-1",
    gaugeid2: "-1",
    imagefilename: "",
    gaugedate: "",
    gaugetime: "10:00",
    gaugetype: "B",
    comments: "",
    tickettype: "W",
    tankid: "WTANK1",
    opengaugeft: 0,
    opengaugein: 0,
    closegaugeft: 0,
    closegaugein: 0,
    override: "N",
    overridebbls: "",
    gravity: 2,
    temp: 2,
    bsw: 2,
    image_upload: "",
    ticketId: "",
    diffInches: "0 in",
    diffBbls: "0 bbls",
  });

  // Helpers
  const openRunTicketModal = (existingIndex = null) => {
    if (existingIndex !== null) {
      const existing = runTickets[existingIndex];
      setNewRunTicket({ ...existing });
      setEditingRunTicketIndex(existingIndex);
    } else {
      setNewRunTicket((prev) => ({
        ...prev,
        lid: leaseID,
        gdate: gaugeDate,
        gaugedate: gaugeDate,
        ticketId: "",
        gaugeid1: "-1",
        gaugeid2: "-1",
        tankid: tankID,
        opengaugeft: 0,
        opengaugein: 0,
        closegaugeft: 0,
        closegaugein: 0,
        runTicketNumber: 999,
        disposition: "",
        comments: "",
      }));
      setEditingRunTicketIndex(null);
    }
    setShowRunTicketModal(true);
  };
  const closeRunTicketModal = () => setShowRunTicketModal(false);

  const loadsForThisPurchaser = useMemo(() => {
    return purchaserLoads.filter((l) => l.PurchaserID === purchaserID);
  }, [purchaserLoads, purchaserID]);

  const [pendingCount, dispatchedCount, pickedUpCount, rejectedCount] =
    useMemo(() => {
      let pending = 0;
      let dispatched = 0;
      let pickedUp = 0;
      let rejected = 0;
      loadsForThisPurchaser.forEach((ld) => {
        const status = (ld.LoadStatus || "").toLowerCase();
        if (status.includes("generated")) pending++;
        else if (status.includes("dispatched")) dispatched++;
        else if (status.includes("picked")) pickedUp++;
        else if (status.includes("reject")) rejected++;
      });
      return [pending, dispatched, pickedUp, rejected];
    }, [loadsForThisPurchaser]);

  const loadsAsOfDateTime = moment().format("MM/DD/YY hh:mm a");

  const openWaterTicketModal = (existingIndex = null) => {
    if (existingIndex !== null) {
      const existing = waterTickets[existingIndex];
      setNewWaterTicket({ ...existing });
      setEditingWaterTicketIndex(existingIndex);
    } else {
      setNewWaterTicket((prev) => ({
        ...prev,
        lid: leaseID,
        gdate: gaugeDate,
        gaugedate: gaugeDate,
        ticketId: "",
        opengaugeft: 0,
        opengaugein: 0,
        closegaugeft: 0,
        closegaugein: 0,
        diffInches: "0 in",
        diffBbls: "0 bbls",
        comments: "",
      }));
      setEditingWaterTicketIndex(null);
    }
    setShowWaterTicketModal(true);
  };
  const closeWaterTicketModal = () => setShowWaterTicketModal(false);

  /*************************************************
   * 8A) Post (Add or Update) a Run Ticket
   *************************************************/
  const handleRunTicketSave = async (e) => {
    e.preventDefault();

    // If comments is empty or all whitespace, use "placeholder"
    if (!newRunTicket.comments || !newRunTicket.comments.trim()) {
      newRunTicket.comments = "placeholder";
    }

    // Still enforce that gaugedate can't be null
    if (!newRunTicket.gaugedate) {
      alert("GaugeDate is required (cannot be null).");
      return;
    }

    const urlParams = new URLSearchParams();
    urlParams.append("comments", newRunTicket.comments.trim());
    urlParams.append("gaugedate", newRunTicket.gaugedate);
    urlParams.append("gdate", newRunTicket.gaugedate);
    urlParams.append("gaugetime", newRunTicket.gaugetime || "12:00");
    urlParams.append("tickettype", newRunTicket.tickettype || "S");
    urlParams.append("lid", newRunTicket.lid || "");
    urlParams.append("src", newRunTicket.src || "-1");
    urlParams.append("lact", newRunTicket.lact || "N");
    urlParams.append("gaugeid1", newRunTicket.gaugeid1 || "-1");
    urlParams.append("gaugeid2", newRunTicket.gaugeid2 || "-1");
    urlParams.append("tankid", newRunTicket.tankid || tankID);
    urlParams.append("imagefilename", newRunTicket.imagefilename || "");
    urlParams.append("opengaugeft", newRunTicket.opengaugeft ?? 0);
    urlParams.append("opengaugein", newRunTicket.opengaugein ?? 0);
    urlParams.append("closegaugeft", newRunTicket.closegaugeft ?? 0);
    urlParams.append("closegaugein", newRunTicket.closegaugein ?? 0);
    urlParams.append("override", newRunTicket.override || "N");
    urlParams.append("overridebbls", newRunTicket.overridebbls ?? 0);
    urlParams.append("gravity", newRunTicket.gravity ?? 0);
    urlParams.append("temp", newRunTicket.temp ?? 0);
    urlParams.append("bsw", newRunTicket.bsw ?? 0);

    try {
      const resp = await fetch(`${baseUrl}/ogp_submit_rt.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlParams.toString(),
      });

      const textResp = await resp.text();
      let result;
      try {
        result = JSON.parse(textResp);
      } catch (err) {
        result = {
          status: "error",
          message: textResp,
        };
      }

      console.log("RunTicket Save response:", result);

      // If the server complains about the foreign key
      if (
        result.message &&
        result.message.includes("Cannot add or update a child row")
      ) {
        alert(
          "Foreign key constraint failed: Please ensure this TankID exists " +
            "for your Lease on the server."
        );
        return;
      }

      if (result.status !== "success") {
        alert("Error saving the run ticket: " + result.message);
        return;
      }

      if (editingRunTicketIndex !== null) {
        setRunTickets((prev) => {
          const copy = [...prev];
          copy[editingRunTicketIndex] = { ...newRunTicket };
          return copy;
        });
      } else {
        setRunTickets((prev) => [...prev, { ...newRunTicket }]);
      }
      closeRunTicketModal();
    } catch (err) {
      console.error("RunTicket Save error:", err);
      alert(`Failed: ${err.message}`);
    }
  };

  /*************************************************
   * 8B) Post (Add or Update) a Water Ticket
   *************************************************/
  const handleWaterTicketSave = async (e) => {
    e.preventDefault();

    const urlParams = new URLSearchParams();
    Object.entries(newWaterTicket).forEach(([key, value]) => {
      urlParams.append(key, String(value === undefined ? "" : value));
    });

    try {
      const resp = await fetch(`${baseUrl}/ogp_submit_rt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlParams.toString(),
      });

      const textResp = await resp.text();
      let result;
      try {
        result = JSON.parse(textResp);
      } catch (err) {
        result = { status: "error", message: textResp };
      }

      console.log("WaterTicket Save response:", result);

      // If the server complains about the foreign key
      if (
        result.message &&
        result.message.includes("Cannot add or update a child row")
      ) {
        alert(
          "Foreign key constraint failed: The water TankID must exist " +
            "for your Lease on the server."
        );
        return;
      }

      if (result.status !== "success") {
        alert("There was an error saving the water ticket.");
        return;
      }

      if (editingWaterTicketIndex !== null) {
        setWaterTickets((prev) => {
          const copy = [...prev];
          copy[editingWaterTicketIndex] = { ...newWaterTicket };
          return copy;
        });
      } else {
        setWaterTickets((prev) => [...prev, { ...newWaterTicket }]);
      }
      closeWaterTicketModal();
    } catch (err) {
      console.error("WaterTicket Save error:", err);
      alert(`Failed: ${err.message}`);
    }
  };

  const handleDeleteRunTicket = (index) => {
    if (!window.confirm("Are you sure you want to delete this run ticket?")) {
      return;
    }
    setRunTickets((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleDeleteWaterTicket = (index) => {
    if (!window.confirm("Are you sure you want to delete this water ticket?")) {
      return;
    }
    setWaterTickets((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  /*************************************************
   * 9) Decide if right column is active
   *************************************************/
  const isRightColumnActive = true;

  /*************************************************
   * MAIN RENDER
   *************************************************/
  return (
    <div className="min-h-screen bg-gradient-to-t from-gray-200 via-gray-100 to-white text-gray-900">
      {/* OFFLINE BANNER */}
      {!isOnline && (
        <div className="relative top-0 left-0 w-full z-50 bg-red-600 text-white text-center p-2 font-semibold">
          <i className="fa fa-exclamation-circle mr-2" aria-hidden="true"></i>
          You are currently offline. Any data submitted will be processed once
          the network connection is restored.{" "}
        </div>
      )}

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white shadow flex justify-between items-center px-4 py-2 z-10">
        <div className="flex items-end">
          <h3 className="font-extrabold text-2xl tracking-tight text-gray-800">
            Gauge Entry
          </h3>
          <small className="ml-3 text-sm text-gray-500 italic -mb-1">
            Logged in as: {user}
          </small>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="text-2xl text-gray-500 hover:text-red-600 transition-colors duration-300"
          title="Cancel"
        >
          <i className="fa fa-times" aria-hidden="true"></i>
        </button>
      </nav>

      {/* Main Content */}
      <div className="pt-8 px-2 md:px-4 lg:px-8 pb-6">
        {/* Lease & Purchaser Info */}
        <div className="bg-white shadow-lg rounded-lg p-3 mb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left side: Lease info */}
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-xs text-gray-500 w-16">Lease</span>
                <span className="text-xl font-semibold ml-2">
                  {leaseName} ({leaseID})
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 w-16">Date</span>
                <span className="text-xl font-semibold ml-2">
                  {moment(gaugeDate).format("MM/DD/YYYY")}
                </span>
              </div>
              {(role === "O" || role === "A") && (
                <>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 w-16">Pumper</span>
                    <span className="text-sm ml-2">
                      {pumper} (
                      <a
                        href={`tel:${pumperPhone}`}
                        className="text-blue-600 underline hover:text-blue-800 transition-colors"
                      >
                        {pumperEmail}
                      </a>
                      )
                    </span>
                  </div>
                  <div className="flex items-center ml-16">
                    <a
                      href={`mailto:${pumperEmail}?Subject=${leaseName}`}
                      className="text-blue-600 underline text-sm hover:text-blue-800 transition-colors"
                    >
                      {pumperEmail}
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Right side: Purchaser info */}
            {purchaserID && (
              <div className="border-l border-gray-300 pl-4">
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  <div className="text-xs text-gray-500 flex items-center">
                    Purchaser:
                  </div>
                  <div className="font-medium">
                    {purchaser} (
                    <a
                      href={`tel:${purchaserPhone}`}
                      className="text-blue-600 underline hover:text-blue-800 transition-colors"
                    >
                      {purchaserPhone}
                    </a>
                    )
                  </div>

                  {purchaserEmail && (
                    <>
                      <div className="text-xs text-gray-500 flex items-center">
                        Email:
                      </div>
                      <div>
                        <a
                          className="text-blue-600 underline hover:text-blue-800 transition-colors"
                          href={`mailto:${purchaserEmail}?Subject=${leaseName}&Body=Request%20load%20for%20${leaseName}%20-%20Tank%20#__`}
                        >
                          {purchaserEmail}
                        </a>
                      </div>
                    </>
                  )}

                  {purchaserLeaseNo && (
                    <>
                      <div className="text-xs text-gray-500 flex items-center">
                        Lease No.:
                      </div>
                      <div>{purchaserLeaseNo}</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {showLoads && purchaserID && loadsForThisPurchaser.length > 0 && (
            <div className="mt-2 text-xs">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Purchaser Lease Loads</h4>
                <button
                  type="button"
                  onClick={() => setExpandPurchaser(!expandPurchaser)}
                  className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-xs"
                >
                  {expandPurchaser ? "Collapse" : "Expand"}
                </button>
              </div>
              {expandPurchaser && (
                <table className="table table-sm table-striped table-bordered w-full mt-2">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-1 border">Lease</th>
                      <th className="p-1 border">Tank</th>
                      <th className="p-1 border">Load #</th>
                      <th className="p-1 border">Status</th>
                      <th className="p-1 border">Load Date/Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadsForThisPurchaser.map((ld, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-1 border">
                          {ld.PurchaserLeaseID} - {ld.PurchaserLeaseName}
                        </td>
                        <td className="p-1 border">{ld.PurchaserTankNum}</td>
                        <td className="p-1 border">{ld.LoadNumber}</td>
                        <td className="p-1 border">{ld.LoadStatus}</td>
                        <td className="p-1 border">{ld.LoadDate || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Two Columns */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left Column */}
          <div
            className={`${
              isRightColumnActive ? "md:w-7/12" : "md:w-full"
            } flex flex-col gap-4`}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-lg rounded-lg p-3 space-y-4"
            >
              {/* Hidden inputs */}
              <input type="hidden" name="src" value={src} />
              <input type="hidden" name="lid" value={leaseID} />
              <input type="hidden" name="gdate" value={gaugeDate} />
              <input type="hidden" name="fdate" value={srcFrom} />
              <input type="hidden" name="tdate" value={srcThru} />

              {/* Oil Tanks */}
              {showOil && (
                <div className="p-2 rounded-lg bg-[#D3D3D3]">
                  <div className="mb-1 bg-[#D3D3D3] p-2 rounded-lg w-full">
                    <h4 className="font-bold text-base text-gray-700 mb-1">
                      Oil Tanks
                    </h4>

                    {/* Oil Gauges Container */}
                    <div className="bg-white rounded shadow p-2 w-full text-sm">
                      {/* Header Row */}
                      <div
                        className={`grid grid-cols-1 gap-2 font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-2 px-3 lg:grid-cols-${
                          useColorCut ? "12" : "9"
                        }`}
                      >
                        <div
                          className={`${
                            useColorCut ? "lg:col-span-3" : "lg:col-span-4"
                          }`}
                        >
                          Tank (Size)
                        </div>
                        {useColorCut ? (
                          <div className="text-center lg:col-span-9">
                            Top Gauge &amp; Color Cut
                          </div>
                        ) : (
                          <div className="text-center lg:col-span-8">
                            Top Gauge
                          </div>
                        )}
                      </div>

                      {/* Oil Gauges Rows */}
                      {oilGauges.map((tank, idx) => (
                        <div
                          key={tank.TankID}
                          className="grid grid-cols-1 lg:grid-cols-12 items-center gap-2 py-1 px-3 hover:bg-gray-50 transition-colors"
                        >
                          {/* Tank Name / Size */}
                          <div
                            className={`${
                              useColorCut ? "lg:col-span-3" : "lg:col-span-4"
                            } font-medium text-gray-800`}
                          >
                            {tank.TankID} ({tank.size})
                          </div>

                          {/* If we use color cut */}
                          {useColorCut ? (
                            // -------------------------------------------
                            // NARROW LAYOUT (<= 850px)
                            // -------------------------------------------
                            isNarrow ? (
                              <div className="lg:col-span-9 flex flex-col items-center gap-2">
                                {/* Top Gauge row (Ft & In) */}
                                <div className="flex items-center gap-2 justify-center">
                                  {/* Top Gauge Ft */}
                                  <div className="flex items-center gap-1">
                                    <label className="text-gray-600 font-medium">
                                      Top Ft:
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="30"
                                      className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                                      value={tank.gaugeFt}
                                      onChange={(e) => {
                                        const val = parseFloat(
                                          e.target.value || "0"
                                        );
                                        setOilGauges((prev) => {
                                          const updated = [...prev];
                                          updated[idx].gaugeFt = val;
                                          return updated;
                                        });
                                      }}
                                    />
                                  </div>
                                  {/* Top Gauge In */}
                                  <div className="flex items-center gap-1">
                                    <label className="text-gray-600 font-medium">
                                      Top In:
                                    </label>
                                    <input
                                      type="number"
                                      step="0.25"
                                      min="0"
                                      max="11.75"
                                      className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                                      value={tank.gaugeIn}
                                      onChange={(e) => {
                                        const val = parseFloat(
                                          e.target.value || "0"
                                        );
                                        setOilGauges((prev) => {
                                          const updated = [...prev];
                                          updated[idx].gaugeIn = val;
                                          return updated;
                                        });
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Color Cut row (Ft & In) */}
                                <div className="flex items-center gap-2 justify-center">
                                  {/* Color Cut Ft */}
                                  <div className="flex items-center gap-1">
                                    <label className="text-gray-600 font-medium">
                                      Cut Ft:
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="30"
                                      className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                                      value={tank.colorCutFt}
                                      onChange={(e) => {
                                        const val = parseFloat(
                                          e.target.value || "0"
                                        );
                                        setOilGauges((prev) => {
                                          const updated = [...prev];
                                          updated[idx].colorCutFt = val;
                                          return updated;
                                        });
                                      }}
                                    />
                                  </div>
                                  {/* Color Cut In */}
                                  <div className="flex items-center gap-1">
                                    <label className="text-gray-600 font-medium">
                                      Cut In:
                                    </label>
                                    <input
                                      type="number"
                                      step="0.25"
                                      min="0"
                                      max="11.75"
                                      className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                                      value={tank.colorCutIn}
                                      onChange={(e) => {
                                        const val = parseFloat(
                                          e.target.value || "0"
                                        );
                                        setOilGauges((prev) => {
                                          const updated = [...prev];
                                          updated[idx].colorCutIn = val;
                                          return updated;
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // -------------------------------------------
                              // ORIGINAL LAYOUT (> 850px)
                              // -------------------------------------------
                              <div className="lg:col-span-9 flex flex-col lg:flex-row items-center gap-2">
                                {/* Top Gauge Ft */}
                                <div className="flex items-center gap-1">
                                  <label className="text-gray-600 font-medium">
                                    Top Ft:
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                                    value={tank.gaugeFt}
                                    onChange={(e) => {
                                      const val = parseFloat(
                                        e.target.value || "0"
                                      );
                                      setOilGauges((prev) => {
                                        const updated = [...prev];
                                        updated[idx].gaugeFt = val;
                                        return updated;
                                      });
                                    }}
                                  />
                                </div>
                                {/* Top Gauge In */}
                                <div className="flex items-center gap-1">
                                  <label className="text-gray-600 font-medium">
                                    Top In:
                                  </label>
                                  <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="11.75"
                                    className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                                    value={tank.gaugeIn}
                                    onChange={(e) => {
                                      const val = parseFloat(
                                        e.target.value || "0"
                                      );
                                      setOilGauges((prev) => {
                                        const updated = [...prev];
                                        updated[idx].gaugeIn = val;
                                        return updated;
                                      });
                                    }}
                                  />
                                </div>
                                {/* Color Cut Ft */}
                                <div className="flex items-center gap-1">
                                  <label className="text-gray-600 font-medium">
                                    Cut Ft:
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                                    value={tank.colorCutFt}
                                    onChange={(e) => {
                                      const val = parseFloat(
                                        e.target.value || "0"
                                      );
                                      setOilGauges((prev) => {
                                        const updated = [...prev];
                                        updated[idx].colorCutFt = val;
                                        return updated;
                                      });
                                    }}
                                  />
                                </div>
                                {/* Color Cut In */}
                                <div className="flex items-center gap-1">
                                  <label className="text-gray-600 font-medium">
                                    Cut In:
                                  </label>
                                  <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="11.75"
                                    className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                                    value={tank.colorCutIn}
                                    onChange={(e) => {
                                      const val = parseFloat(
                                        e.target.value || "0"
                                      );
                                      setOilGauges((prev) => {
                                        const updated = [...prev];
                                        updated[idx].colorCutIn = val;
                                        return updated;
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            )
                          ) : (
                            // -------------------------------------------
                            // NO COLOR CUT
                            // -------------------------------------------
                            <div className="lg:col-span-8 flex flex-col lg:flex-row items-center gap-2 px-2 justify-start">
                              <div className="flex items-center gap-1">
                                <label className="text-gray-600 font-medium">
                                  Ft:
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="30"
                                  className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                                  value={tank.gaugeFt}
                                  onChange={(e) => {
                                    const val = parseFloat(
                                      e.target.value || "0"
                                    );
                                    setOilGauges((prev) => {
                                      const updated = [...prev];
                                      updated[idx].gaugeFt = val;
                                      return updated;
                                    });
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <label className="text-gray-600 font-medium">
                                  In:
                                </label>
                                <input
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  max="11.75"
                                  className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                                  value={tank.gaugeIn}
                                  onChange={(e) => {
                                    const val = parseFloat(
                                      e.target.value || "0"
                                    );
                                    setOilGauges((prev) => {
                                      const updated = [...prev];
                                      updated[idx].gaugeIn = val;
                                      return updated;
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Additional Controls: Tbg, Csg, etc. */}
                      <div className="flex flex-col lg:flex-row items-center gap-2 mt-2 px-4 justify-center">
                        {use24 && (
                          <div className="flex items-center gap-1">
                            <label className="text-gray-600 font-medium">
                              GaugeTime:
                            </label>
                            <input
                              type="time"
                              className="border px-2 py-1 w-20 text-sm text-right rounded focus:outline-blue-500"
                              value={gaugeTime}
                              onChange={(e) => setGaugeTime(e.target.value)}
                            />
                          </div>
                        )}
                        {showPOC && (
                          <div className="flex items-center gap-1">
                            <label className="text-gray-600 font-medium">
                              POC %:
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                              value={pocRunTime}
                              onChange={(e) =>
                                setPocRunTime(parseFloat(e.target.value || "0"))
                              }
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <label className="text-gray-600 font-medium">
                            Tbg psi:
                          </label>
                          <input
                            type="number"
                            className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                            value={tbgPressure}
                            onChange={(e) =>
                              setTbgPressure(parseFloat(e.target.value || "0"))
                            }
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="text-gray-600 font-medium">
                            Csg psi:
                          </label>
                          <input
                            type="number"
                            className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                            value={csgPressure}
                            onChange={(e) =>
                              setCsgPressure(parseFloat(e.target.value || "0"))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gas */}
              {showGas && (
                <div className="p-2 rounded-lg bg-[#FFFFE0]">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">
                    Gas
                  </h4>
                  {hasGasMeter && (
                    <div className="flex items-center gap-1 text-sm p-2 bg-white rounded shadow-sm mb-2">
                      <label className="text-gray-600 font-medium">
                        Gas Meter:
                      </label>
                      <input
                        type="number"
                        className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                        value={gasMeter}
                        onChange={(e) =>
                          setGasMeter(parseFloat(e.target.value || "0"))
                        }
                      />
                      <select
                        className="border px-2 py-1 text-sm rounded focus:outline-blue-500"
                        value={gasMeterReset}
                        onChange={(e) => setGasMeterReset(e.target.value)}
                      >
                        <option value="N">Reset? No</option>
                        <option value="Y">Reset? Yes</option>
                      </select>
                    </div>
                  )}

                  {showMcf && (
                    <div className="text-sm space-y-2">
                      <div className="flex flex-wrap items-center gap-1 p-2 bg-white rounded shadow-sm">
                        <label className="text-gray-600 font-medium">
                          MCF:
                        </label>
                        <input
                          type="number"
                          className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                          value={mcf}
                          onChange={(e) =>
                            setMcf(parseFloat(e.target.value || "0"))
                          }
                        />
                        {showMcfAccum && (
                          <>
                            <label className="text-gray-600 font-medium">
                              Accum:
                            </label>
                            <input
                              type="number"
                              className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                              value={mcfAccum}
                              onChange={(e) =>
                                setMcfAccum(parseFloat(e.target.value || "0"))
                              }
                            />
                          </>
                        )}
                        {useLinePressure && (
                          <>
                            <label className="text-gray-600 font-medium">
                              FLP:
                            </label>
                            <input
                              type="number"
                              className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                              value={linePressure}
                              onChange={(e) =>
                                setLinePressure(
                                  parseFloat(e.target.value || "0")
                                )
                              }
                            />
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1 p-2 bg-white rounded shadow-sm">
                        <label className="text-gray-600 font-medium">
                          Static:
                        </label>
                        <input
                          type="number"
                          className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                          value={staticPressure}
                          onChange={(e) =>
                            setStaticPressure(parseFloat(e.target.value || "0"))
                          }
                        />
                        <label className="text-gray-600 font-medium">
                          Diff:
                        </label>
                        <input
                          type="number"
                          className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                          value={diffPressure}
                          onChange={(e) =>
                            setDiffPressure(parseFloat(e.target.value || "0"))
                          }
                        />
                        <label className="text-gray-600 font-medium">
                          Flow:
                        </label>
                        <input
                          type="number"
                          className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                          value={flowRate}
                          onChange={(e) =>
                            setFlowRate(parseFloat(e.target.value || "0"))
                          }
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-1 p-2 bg-white rounded shadow-sm">
                        <label className="text-gray-600 font-medium">
                          Choke:
                        </label>
                        <input
                          type="number"
                          className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                          value={choke}
                          onChange={(e) =>
                            setChoke(parseFloat(e.target.value || "0"))
                          }
                        />
                        <label className="text-gray-600 font-medium">
                          Hrs On:
                        </label>
                        <input
                          type="number"
                          className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                          value={hoursOn}
                          onChange={(e) =>
                            setHoursOn(parseFloat(e.target.value || "0"))
                          }
                        />
                      </div>

                      <div className="flex items-center gap-1 p-2 bg-white rounded shadow-sm">
                        <label className="text-gray-600 font-medium">
                          Gas Disp:
                        </label>
                        <select
                          className="border px-2 py-1 text-sm rounded focus:outline-blue-500"
                          value={gasDisp}
                          onChange={(e) => setGasDisp(e.target.value)}
                        >
                          <option value="1">Lease Fuel</option>
                          <option value="2">Transmission</option>
                          <option value="3">Processing Plant</option>
                          <option value="4">Vented/Flared</option>
                          <option value="A">Flared</option>
                          <option value="B">Vented</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Water */}
              {showWater && (
                <div className="p-2 rounded-lg bg-[#ADD8E6]">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">
                    Water
                  </h4>
                  {showWaterTanks &&
                    waterGauges.map((tank, idx) => (
                      <div
                        key={tank.TankID}
                        className="flex flex-wrap items-center gap-1 mb-2 text-sm p-2 bg-white rounded shadow-sm"
                      >
                        <label className="font-medium">
                          {tank.TankID} ({tank.size})
                        </label>
                        <div className="flex items-center gap-1 ml-2">
                          <label className="text-gray-600 font-medium">
                            Ft:
                          </label>
                          <input
                            type="number"
                            className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                            value={tank.gaugeFt}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value || "0");
                              setWaterGauges((prev) => {
                                const updated = [...prev];
                                updated[idx].gaugeFt = val;
                                return updated;
                              });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="text-gray-600 font-medium">
                            In:
                          </label>
                          <input
                            type="number"
                            className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                            value={tank.gaugeIn}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value || "0");
                              setWaterGauges((prev) => {
                                const updated = [...prev];
                                updated[idx].gaugeIn = val;
                                return updated;
                              });
                            }}
                          />
                        </div>
                      </div>
                    ))}

                  {hasWaterMeter && (
                    <div className="flex flex-wrap items-center gap-1 text-sm p-2 bg-white rounded shadow-sm">
                      <label className="text-gray-600 font-medium">
                        Meter:
                      </label>
                      <input
                        type="number"
                        className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                        value={waterMeter}
                        onChange={(e) =>
                          setWaterMeter(parseFloat(e.target.value || "0"))
                        }
                      />
                      <select
                        className="border px-2 py-1 text-sm rounded focus:outline-blue-500"
                        value={waterMeterReset}
                        onChange={(e) => setWaterMeterReset(e.target.value)}
                      >
                        <option value="N">Reset? No</option>
                        <option value="Y">Reset? Yes</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-sm p-2 bg-white rounded shadow-sm mt-2">
                    <label className="text-gray-600 font-medium">
                      {manualWaterLabel}:
                    </label>
                    <input
                      type="number"
                      className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                      value={manualWater}
                      onChange={(e) =>
                        setManualWater(parseFloat(e.target.value || "0"))
                      }
                    />
                    <small>{manualWaterLabel2}</small>
                  </div>
                </div>
              )}

              {/* Notes / Wells / Submit */}
              <div className="bg-white border p-3 rounded text-sm col-span-1 md:col-span-2 space-y-2 shadow-sm mt-3">
                <label className="font-semibold">Notes</label>
                <textarea
                  rows={2}
                  className="border p-1 w-full mt-1 rounded focus:outline-blue-500 text-sm"
                  placeholder="Any additional comments or observations..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <label className="font-semibold">SPCC</label>
                    <select
                      className="border p-1 text-sm rounded focus:outline-blue-500"
                      value={spcc}
                      onChange={(e) => setSpcc(e.target.value)}
                    >
                      <option value=""> </option>
                      <option value="Y">Yes</option>
                      <option value="P">Pending</option>
                      <option value="N">No</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="font-semibold">Initial Gauges</label>
                    <select
                      className="border p-1 text-sm rounded focus:outline-blue-500"
                      value={initialGauges}
                      onChange={(e) => setInitialGauges(e.target.value)}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              {showWells && (
                <div className="bg-purple-50 p-3 text-sm rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-gray-800">
                      Wells
                    </h4>
                    <button
                      type="button"
                      onClick={() => setExpandWells(!expandWells)}
                      className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-200 transition-colors"
                    >
                      <i
                        className={`fa ${
                          expandWells ? "fa-angle-up" : "fa-angle-down"
                        }`}
                      ></i>
                      {expandWells ? "Collapse" : "Expand"}
                    </button>
                  </div>
                  <div
                    className={`mt-2 overflow-hidden transition-all duration-300 ${
                      expandWells ? "max-h-[800px]" : "max-h-0"
                    }`}
                  >
                    <table className="w-full border text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-1">Well On?</th>
                          <th className="border p-1">Reason Down</th>
                          <th className="border p-1">Note</th>
                          <th className="border p-1">Tbg</th>
                          <th className="border p-1">Csg</th>
                          <th className="border p-1">Oil Test</th>
                          <th className="border p-1">Gas Test</th>
                          <th className="border p-1">Water Test</th>
                          <th className="border p-1">TSTM</th>
                          <th className="border p-1">JTF</th>
                          <th className="border p-1">FTF</th>
                          <th className="border p-1">FAP</th>
                          <th className="border p-1">GFFAP</th>
                          <th className="border p-1">SND</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wellEntries.map((w, idx) => (
                          <tr key={idx}>
                            <td className="border p-1">
                              <select
                                className="border p-1 text-xs rounded focus:outline-blue-500"
                                value={w.wellOn}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].wellOn = val;
                                    return updated;
                                  });
                                }}
                              >
                                <option value="Y">Yes</option>
                                <option value="N">No</option>
                              </select>
                            </td>
                            <td className="border p-1">
                              <select
                                className="border p-1 text-xs rounded focus:outline-blue-500"
                                value={w.reasonDown}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].reasonDown = val;
                                    return updated;
                                  });
                                }}
                              >
                                <option value="NU"> </option>
                                <option value="PU">Pump</option>
                                <option value="OT">Other</option>
                              </select>
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                className="border p-1 w-24 text-xs rounded focus:outline-blue-500"
                                value={w.note}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].note = val;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                className="border p-1 w-16 text-xs rounded focus:outline-blue-500"
                                value={w.tbg}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].tbg = val;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                className="border p-1 w-16 text-xs rounded focus:outline-blue-500"
                                value={w.csg}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].csg = val;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                className="border p-1 w-16 text-xs rounded focus:outline-blue-500"
                                value={w.oilTest}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].oilTest = val;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                className="border p-1 w-16 text-xs rounded focus:outline-blue-500"
                                value={w.gasTest}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].gasTest = val;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                className="border p-1 w-16 text-xs rounded focus:outline-blue-500"
                                value={w.waterTest}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].waterTest = val;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                className="border p-1 w-16 text-xs rounded focus:outline-blue-500"
                                value={w.TSTM}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].TSTM = val;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                className="border p-1 w-16 text-xs rounded focus:outline-blue-500"
                                value={w.JTF}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].JTF = val;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                className="border p-1 w-16 text-xs rounded focus:outline-blue-500"
                                value={w.FTF}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].FTF = val;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                className="border p-1 w-16 text-xs rounded focus:outline-blue-500"
                                value={w.FAP}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].FAP = val;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                className="border p-1 w-16 text-xs rounded focus:outline-blue-500"
                                value={w.GFFAP}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].GFFAP = val;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                            <td className="border p-1">
                              <input
                                type="text"
                                className="border p-1 w-16 text-xs rounded focus:outline-blue-500"
                                value={w.SND}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWellEntries((prev) => {
                                    const updated = [...prev];
                                    updated[idx].SND = val;
                                    return updated;
                                  });
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-col items-center gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white font-semibold py-1 px-4 rounded hover:bg-blue-700 text-sm transition-colors"
                >
                  Submit
                </button>
                <div className="text-xs text-gray-500 italic">
                  Last Entry by {lastUser} on {lastUpdateDate}
                </div>
              </div>
            </form>
          </div>

          {/* Right Column */}
          {isRightColumnActive && (
            <div className="md:w-5/12 flex flex-col gap-4">
              {/* Summaries */}
              {(showOil || showWater || hasGasMeter) && (
                <div className="bg-white border p-3 rounded-lg text-sm shadow-sm">
                  <h4 className="text-center font-semibold text-gray-700 mb-2">
                    Production Summaries
                  </h4>
                  {/* Oil summary */}
                  {showOil && (
                    <>
                      <div className="flex justify-between bg-[#D3D3D3] p-2 text-sm rounded">
                        <label className="font-medium">Oil Produced</label>
                        <div>
                          <span className="mr-2">
                            {inchesProduced.toFixed(2)} in
                          </span>
                          {oilProduced.toFixed(2)} bbls
                        </div>
                      </div>
                      <div className="flex justify-between bg-[#D3D3D3] p-2 text-sm rounded mt-1">
                        <label className="font-medium">Oil Sold</label>
                        <div>{soldOil.toFixed(2)} bbls</div>
                      </div>
                      {showBSW && (
                        <div className="flex justify-between bg-[#D3D3D3] p-2 text-sm rounded mt-1">
                          <label className="font-medium">BS&amp;W</label>
                          <div>{drawBbls.toFixed(2)} bbls</div>
                        </div>
                      )}
                      <div className="flex justify-between bg-[#D3D3D3] p-2 text-sm rounded mt-1">
                        <label className="font-medium">On Hand</label>
                        <div>{oilOnHand.toFixed(2)} bbls</div>
                      </div>
                      {useColorCut && (
                        <div className="flex justify-between bg-[#D3D3D3] p-2 text-sm rounded mt-1">
                          <label className="font-medium">ColorCut OnHand</label>
                          <div>{colorCutOnHand.toFixed(2)} bbls</div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Gas summary */}
                  {showGas && hasGasMeter && (
                    <div className="flex justify-between bg-[#FFFFE0] p-2 text-sm rounded mt-2">
                      <label className="font-medium">Gas Metered</label>
                      <div>{meteredGas.toFixed(0)} mcf</div>
                    </div>
                  )}

                  {/* Water summary */}
                  {showWater && (
                    <>
                      {hasWaterMeter && (
                        <div className="flex justify-between bg-[#ADD8E6] p-2 text-sm rounded mt-2">
                          <label className="font-medium">Water Metered</label>
                          <div>{meteredWater.toFixed(0)} bbls</div>
                        </div>
                      )}
                      <div className="flex justify-between bg-[#ADD8E6] p-2 text-sm rounded mt-1">
                        <label className="font-medium">
                          {manualWaterLabel}
                        </label>
                        <div>{manualWater} bbls</div>
                      </div>
                      {showWaterTanks && (
                        <div className="flex justify-between bg-[#ADD8E6] p-2 text-sm rounded mt-1">
                          <label className="font-medium">Water Produced</label>
                          <div>
                            {waterInchesProduced.toFixed(2)} in /{" "}
                            {waterProduced.toFixed(2)} bbls
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between bg-[#ADD8E6] p-2 text-sm rounded mt-1">
                        <label className="font-medium">Water Hauled</label>
                        <div>{waterHauledBbls.toFixed(0)} bbls</div>
                      </div>
                      {showWaterTanks && (
                        <div className="flex justify-between bg-[#ADD8E6] p-2 text-sm rounded mt-1">
                          <label className="font-medium">Water On Hand</label>
                          <div>{waterOnHand.toFixed(2)} bbls</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Images */}
              <div className="bg-white border p-3 text-sm rounded-lg shadow-sm">
                <h4 className="text-center font-semibold text-gray-700 mb-2">
                  Images
                </h4>
                <div className="flex justify-between items-center">
                  <button className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors">
                    <i className="fa fa-camera" aria-hidden="true"></i>
                    <a
                      href={`ogp_ImagesAdd.php?LeaseID=${leaseID}&GaugeDate=${gaugeDate}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Add
                    </a>
                  </button>
                  <a
                    href={`ogp_Images.php?LeaseID=${leaseID}&GaugeDate=${gaugeDate}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline text-xs hover:text-blue-800 transition-colors"
                  >
                    View Images
                  </a>
                </div>
              </div>

              {/* Run Tickets */}
              <div className="bg-white border p-3 text-sm rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Run Tickets
                  </h4>
                  <button
                    onClick={() => openRunTicketModal(null)}
                    className="bg-blue-400 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded"
                  >
                    Add Run Ticket
                  </button>
                </div>
                {runTickets.length === 0 && (
                  <p className="text-xs">No run tickets.</p>
                )}
                {runTickets.map((rt, idx) => (
                  <div key={idx} className="text-xs border rounded p-2 mb-2">
                    <div>
                      <div className="font-bold">
                        TicketID #{rt.ticketId} &nbsp; {rt.gaugetime} &nbsp;
                        Open Gauge: {rt.opengaugeft} ft / {rt.opengaugein} in
                        &nbsp; Close Gauge: {rt.closegaugeft} ft /{" "}
                        {rt.closegaugein} in
                      </div>
                      <div className="mt-1 ml-4 italic">
                        RT# {rt.runTicketNumber}, {rt.disposition}, BSW={rt.bsw}
                        , Gravity={rt.gravity}
                        <br />
                        Comments: {rt.comments}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        className="bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded text-xs"
                        onClick={() => openRunTicketModal(idx)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-200 hover:bg-red-300 px-2 py-1 rounded text-xs"
                        onClick={() => handleDeleteRunTicket(idx)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Water Tickets */}
              <div className="bg-white border p-3 text-sm rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Water Tickets
                  </h4>
                  <button
                    onClick={() => openWaterTicketModal(null)}
                    className="bg-blue-400 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded"
                  >
                    Add Water Ticket
                  </button>
                </div>
                {waterTickets.length === 0 && (
                  <p className="text-xs">No water tickets.</p>
                )}
                {waterTickets.map((wt, idx) => (
                  <div key={idx} className="text-xs border rounded p-2 mb-2">
                    <div className="font-bold">
                      Ticket #{wt.ticketId} &nbsp; {wt.gaugetime} &nbsp; Open{" "}
                      {wt.opengaugeft} ft / {wt.opengaugein} in &nbsp; Close{" "}
                      {wt.closegaugeft} ft / {wt.closegaugein} in
                      <span className="ml-2 text-gray-600">
                        &nbsp; {wt.diffInches}, {wt.diffBbls}
                      </span>
                    </div>
                    <div className="mt-1 ml-4 text-gray-600 italic">
                      {wt.comments}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        className="bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded text-xs"
                        onClick={() => openWaterTicketModal(idx)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-200 hover:bg-red-300 px-2 py-1 rounded text-xs"
                        onClick={() => handleDeleteWaterTicket(idx)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Gauge History */}
        <div className="bg-white shadow-lg rounded-lg p-3 mt-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm text-gray-700">
              Recent Gauge History
            </h4>
            <button
              type="button"
              onClick={() => setExpandHistory(!expandHistory)}
              className="text-sm bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded flex items-center gap-1 transition-colors"
            >
              <i
                className={`fa ${
                  expandHistory ? "fa-angle-up" : "fa-angle-down"
                }`}
              ></i>
              {expandHistory ? "Collapse" : "Expand"}
            </button>
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              expandHistory ? "max-h-[1000px]" : "max-h-0"
            }`}
          >
            {loadingHistory && <p className="text-xs">Loading...</p>}
            <div
              className="ag-theme-alpine mt-2"
              style={{ height: 300, width: "100%", overflowX: "auto" }}
            >
              <AgGridReact
                rowData={historyRowData}
                columnDefs={historyColumnDefs}
                defaultColDef={defaultColDef}
                animateRows={true}
                pagination={false}
                onGridReady={onGridReady}
                getRowStyle={(params) =>
                  params.node.rowPinned === "top"
                    ? {
                        fontWeight: "bold",
                        backgroundColor: "#e8f5e9",
                        color: "#000",
                        borderBottom: "2px solid #000",
                        fontSize: "1.1em",
                      }
                    : {}
                }
                suppressSizeToFit={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Add or Edit Run Ticket */}
      {showRunTicketModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white w-full max-w-xl p-4 rounded shadow-lg relative">
            <button
              onClick={closeRunTicketModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
            >
              <i className="fa fa-times" aria-hidden="true"></i>
            </button>
            <h2 className="text-lg font-semibold mb-2">
              {editingRunTicketIndex !== null ? "Edit" : "Add"} Run Ticket
            </h2>
            <form onSubmit={handleRunTicketSave} className="space-y-2 text-sm">
              {/* Ticket ID */}
              <div>
                <label className="block font-semibold">Run Ticket #:</label>
                <input
                  type="text"
                  className="border rounded p-1 w-full"
                  placeholder="e.g. 1050-2"
                  value={newRunTicket.ticketId}
                  onChange={(e) =>
                    setNewRunTicket({
                      ...newRunTicket,
                      ticketId: e.target.value,
                    })
                  }
                />
              </div>

              {/* Tank ID Dropdown */}
              <div>
                <label className="block font-semibold">Tank ID:</label>
                <select
                  className="border rounded p-1 w-full"
                  value={newRunTicket.tankId}
                  onChange={(e) =>
                    setNewRunTicket({
                      ...newRunTicket,
                      tankId: e.target.value,
                    })
                  }
                >
                  <option value="">-- Select a Tank --</option>
                  {tanks.map((tank) => (
                    <option key={tank.UniqID} value={tank.TankID}>
                      {tank.TankID}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block font-semibold">Gauge Time:</label>
                <input
                  type="time"
                  className="border rounded p-1 w-full"
                  value={newRunTicket.gaugetime}
                  onChange={(e) =>
                    setNewRunTicket({
                      ...newRunTicket,
                      gaugetime: e.target.value,
                    })
                  }
                />
              </div>

              {/* Open Gauge */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-semibold">
                    Open Gauge (ft):
                  </label>
                  <input
                    type="number"
                    className="border rounded p-1 w-full"
                    value={newRunTicket.opengaugeft}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        opengaugeft: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-semibold">
                    Open Gauge (in):
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    className="border rounded p-1 w-full"
                    value={newRunTicket.opengaugein}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        opengaugein: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
              </div>

              {/* Close Gauge */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-semibold">
                    Close Gauge (ft):
                  </label>
                  <input
                    type="number"
                    className="border rounded p-1 w-full"
                    value={newRunTicket.closegaugeft}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        closegaugeft: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-semibold">
                    Close Gauge (in):
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    className="border rounded p-1 w-full"
                    value={newRunTicket.closegaugein}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        closegaugein: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
              </div>

              {/* Run Ticket #, Gravity, Temp, BSW */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-semibold">
                    Run Ticket # (int):
                  </label>
                  <input
                    type="number"
                    className="border rounded p-1 w-full"
                    value={newRunTicket.runTicketNumber}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        runTicketNumber: parseInt(e.target.value || "0", 10),
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-semibold">Gravity:</label>
                  <input
                    type="number"
                    className="border rounded p-1 w-full"
                    value={newRunTicket.gravity}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        gravity: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-semibold">Temp:</label>
                  <input
                    type="number"
                    className="border rounded p-1 w-full"
                    value={newRunTicket.temp}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        temp: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-semibold">BSW:</label>
                  <input
                    type="number"
                    className="border rounded p-1 w-full"
                    value={newRunTicket.bsw}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        bsw: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
              </div>

              {/* NOTE: "Disposition" and "Comments" have been removed per your request */}

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded text-sm"
                  onClick={closeRunTicketModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  {editingRunTicketIndex !== null
                    ? "Update Ticket"
                    : "Save Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add or Edit Water Ticket */}
      {showWaterTicketModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white w-full max-w-xl p-4 rounded shadow-lg relative">
            <button
              onClick={closeWaterTicketModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
            >
              <i className="fa fa-times" aria-hidden="true"></i>
            </button>
            <h2 className="text-lg font-semibold mb-2">
              {editingWaterTicketIndex !== null ? "Edit" : "Add"} Water Ticket
            </h2>
            <form
              onSubmit={handleWaterTicketSave}
              className="space-y-2 text-sm"
            >
              {/* Ticket ID */}
              <div>
                <label className="block font-semibold">Ticket ID:</label>
                <input
                  type="text"
                  className="border rounded p-1 w-full"
                  placeholder="e.g. W-567"
                  value={newWaterTicket.ticketId}
                  onChange={(e) =>
                    setNewWaterTicket({
                      ...newWaterTicket,
                      ticketId: e.target.value,
                    })
                  }
                />
              </div>

              {/* Tank ID Dropdown */}
              <div>
                <label className="block font-semibold">Tank ID:</label>
                <select
                  className="border rounded p-1 w-full"
                  value={newWaterTicket.tankId}
                  onChange={(e) =>
                    setNewWaterTicket({
                      ...newWaterTicket,
                      tankId: e.target.value,
                    })
                  }
                >
                  <option value="">-- Select a Tank --</option>
                  {tanks.map((tank) => (
                    <option key={tank.UniqID} value={tank.TankID}>
                      {tank.TankID}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gauge Time */}
              <div>
                <label className="block font-semibold">Gauge Time:</label>
                <input
                  type="time"
                  className="border rounded p-1 w-full"
                  value={newWaterTicket.gaugetime}
                  onChange={(e) =>
                    setNewWaterTicket({
                      ...newWaterTicket,
                      gaugetime: e.target.value,
                    })
                  }
                />
              </div>

              {/* Open Gauge */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-semibold">
                    Open Gauge (ft):
                  </label>
                  <input
                    type="number"
                    className="border rounded p-1 w-full"
                    value={newWaterTicket.opengaugeft}
                    onChange={(e) =>
                      setNewWaterTicket({
                        ...newWaterTicket,
                        opengaugeft: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-semibold">
                    Open Gauge (in):
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    className="border rounded p-1 w-full"
                    value={newWaterTicket.opengaugein}
                    onChange={(e) =>
                      setNewWaterTicket({
                        ...newWaterTicket,
                        opengaugein: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
              </div>

              {/* Close Gauge */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-semibold">
                    Close Gauge (ft):
                  </label>
                  <input
                    type="number"
                    className="border rounded p-1 w-full"
                    value={newWaterTicket.closegaugeft}
                    onChange={(e) =>
                      setNewWaterTicket({
                        ...newWaterTicket,
                        closegaugeft: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-semibold">
                    Close Gauge (in):
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    className="border rounded p-1 w-full"
                    value={newWaterTicket.closegaugein}
                    onChange={(e) =>
                      setNewWaterTicket({
                        ...newWaterTicket,
                        closegaugein: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
              </div>

              {/* Diff Inches & Diff bbls */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-semibold">Diff Inches:</label>
                  <input
                    type="text"
                    className="border rounded p-1 w-full"
                    value={newWaterTicket.diffInches}
                    onChange={(e) =>
                      setNewWaterTicket({
                        ...newWaterTicket,
                        diffInches: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-semibold">Diff bbls:</label>
                  <input
                    type="text"
                    className="border rounded p-1 w-full"
                    value={newWaterTicket.diffBbls}
                    onChange={(e) =>
                      setNewWaterTicket({
                        ...newWaterTicket,
                        diffBbls: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* NOTE: Removed "Comments" from Water Tickets as requested */}

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded text-sm"
                  onClick={closeWaterTicketModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  {editingWaterTicketIndex !== null
                    ? "Update Ticket"
                    : "Save Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GaugeEntryPage;
