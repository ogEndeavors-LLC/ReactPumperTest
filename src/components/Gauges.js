import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import moment from "moment";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { baseUrl } from "./config.js";
import { useUser } from "./UserContext";
import { LastPage } from "@mui/icons-material";

/**
 * MAIN COMPONENT
 */
function GaugeEntryPage() {
  /*************************************************
   * 0) Fetch client-level flags from API
   *************************************************/
  const [showBSW, setShowBSW] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const { state } = useLocation(); // <-- Where we get lease data, gaugeDate, action, etc.

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
  const [showSampleRunTicketImages, setShowSampleRunTicketImages] =
    useState(false);

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
          // In your original code you used: data[0].purchasers[0].DispatchPhone
          // Just be sure this index is valid:
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
   * 1) Read gauge data from state instead of URL param
   *************************************************/
  // If the user navigated: navigate(`/GaugeEntry?leaseid=XXX&date=YYY`,
  // { state: { lease, gaugeDate, action }})
  // We can destructure them here:
  const {
    lease: leaseData, // The entire lease object from the previous page
    gaugeDate: paramGaugeDate,
    action: selectedAction,
  } = state || {};

  /*************************************************
   * 2) Basic data from the passed-in lease object
   *************************************************/
  // We'll keep local state just as before:
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

  const [showOil, setShowOil] = useState(false);
  const [showWater, setShowWater] = useState(false);
  const [showGas, setShowGas] = useState(false);
  const [hasGasMeter, setHasGasMeter] = useState(false);
  const [hasWaterMeter, setHasWaterMeter] = useState(false);

  const [oilGauges, setOilGauges] = useState([]);
  const [waterGauges, setWaterGauges] = useState([]);
  const [wellEntries, setWellEntries] = useState([]);

  useEffect(() => {
    if (!leaseData) return;

    console.log("Lease data:", leaseData);

    //------------------------------------------------
    // 1) Basic Lease-Level Fields
    //------------------------------------------------
    setLeaseID(leaseData.LeaseID ?? "");
    setLeaseName(leaseData.LeaseName ?? "");
    setPumper(leaseData.PumperID ?? "");
    setLastUser(leaseData.RecentLogUserID ?? "");
    setLastUpdateDate(leaseData.RecentLogDateTime ?? "");
    if (lastUpdateDate) {
      lastUpdateDate.format("MM/DD/YYYY");
    }
    // Purchaser info
    setPurchaserID(leaseData.Purchaser ?? "");
    setPurchaser(leaseData.Purchaser ?? "");
    setPurchaserLeaseNo(leaseData.PurchaserLeaseNo ?? "");

    // Pumper Contact
    if (leaseData.PumperInfo) {
      setPumperEmail(leaseData.PumperInfo.Email ?? "");
      setPumperPhone(leaseData.PumperInfo.Phone ?? "");
    } else {
      setPumperEmail("");
      setPumperPhone("");
    }

    //------------------------------------------------
    // 2) Feature Flags
    //------------------------------------------------
    setShowOil(leaseData.ShowOil === "Y");
    setShowWater(leaseData.ShowWater === "Y");
    setShowGas(leaseData.ShowGas === "Y");
    setHasGasMeter(leaseData.GasMeter === "Y");
    setHasWaterMeter(leaseData.WaterMeter === "Y");

    //------------------------------------------------
    // 3) Tanks Array
    //    (Used for size, bblsPerInch, etc.)
    //------------------------------------------------
    const allTanks = Array.isArray(leaseData.Tanks) ? leaseData.Tanks : [];
    setTanks(allTanks);

    // Default to first Tank’s ID if it exists
    if (allTanks.length > 0) {
      setTankID(allTanks[0].TankID ?? "");
    } else {
      setTankID("");
    }

    //------------------------------------------------
    // 4) Wells -> Build Well Gauge Entries
    //------------------------------------------------
    if (Array.isArray(leaseData.Wells)) {
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
    } else {
      setWellEntries([]);
    }

    //------------------------------------------------
    // 5) DailyGauges -> Oil/Water Gauge Arrays
    //------------------------------------------------
    if (
      Array.isArray(leaseData.DailyGauges) &&
      leaseData.DailyGauges.length > 0
    ) {
      const oilList = [];
      const waterList = [];
      let firstGauge = null;

      leaseData.DailyGauges.forEach((dg, idx) => {
        // Save the first gauge for “global” fields
        if (idx === 0) {
          firstGauge = dg;
        }

        // Find matching tank so we can store bblsPerInch
        const matchingTank = allTanks.find((t) => t.TankID === dg.TankID);
        const bblsPerInch = parseFloat(matchingTank?.bblsPerInch ?? "0") || 0;

        if (dg.TankType === "T") {
          // Oil Tank
          oilList.push({
            GaugeID: dg.GaugeID,
            TankID: dg.TankID,
            gaugeFt: parseFloat(dg.GaugeFt || "0"),
            gaugeIn: parseFloat(dg.GaugeIn || "0"),
            overrideBbls: parseFloat(dg.OverrideBbls || "0"),
            bblsPerInch, // <- important to prevent NaN
          });
        } else if (dg.TankType === "W") {
          // Water Tank
          waterList.push({
            GaugeID: dg.GaugeID,
            TankID: dg.TankID,
            gaugeFt: parseFloat(dg.GaugeFt || "0"),
            gaugeIn: parseFloat(dg.GaugeIn || "0"),
            bblsPerInch,
          });
        }
      });

      // Update oil/water gauge states
      setOilGauges(oilList);
      setWaterGauges(waterList);

      //------------------------------------------------
      // 6) Global Fields from the First Gauge
      //------------------------------------------------
      if (firstGauge) {
        setComments(firstGauge.Comment ?? "");
        setTbgPressure(parseFloat(firstGauge.TbgPressure || "0"));
        setCsgPressure(parseFloat(firstGauge.CsgPressure || "0"));
        setGasMeter(parseFloat(firstGauge.GMeter || "0"));
        setMcf(parseFloat(firstGauge.Mcf || "0"));
        setGasDisp(firstGauge.GasDisp ?? "3");
        setManualWater(parseFloat(firstGauge.Water || "0"));

        // If your server stores these, you can also set them:
        setWaterMeter(parseFloat(firstGauge.WMeter || "0"));
        setChoke(parseFloat(firstGauge.Choke || "0"));
        setFlowRate(parseFloat(firstGauge.FlowRate || "0"));
        setLinePressure(parseFloat(firstGauge.LinePressure || "0"));
        setStaticPressure(parseFloat(firstGauge.StaticPressure || "0"));
        setDiffPressure(parseFloat(firstGauge.DiffPressure || "0"));
        setHoursOn(parseFloat(firstGauge.HoursOn || "0"));
        setGaugeTime(firstGauge.GaugeTime ?? "12:00");
        setPocRunTime(parseFloat(firstGauge.PocRunTime || "100"));
        setSpcc(firstGauge.SPCC ?? "");
        setInitialGauges(firstGauge.InitialGauges ?? "N");
      }
    } else {
      // If no DailyGauges, reset arrays
      setOilGauges([]);
      setWaterGauges([]);
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

  // If no gaugeDate was passed in state, default to today's date
  const [gaugeDate, setGaugeDate] = useState(() => {
    if (paramGaugeDate) {
      return paramGaugeDate;
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [src] = useState("-");
  const [srcFrom] = useState("-1");
  const [srcThru] = useState("-1");

  // Additional flags
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
  const [drawBbls, setDrawBbls] = useState(2);
  const [soldOil, setSoldOil] = useState(0);
  const [colorCutOnHand, setColorCutOnHand] = useState(0);

  const [waterProduced, setWaterProduced] = useState(0);
  const [waterOnHand, setWaterOnHand] = useState(0);
  const [waterInchesProduced, setWaterInchesProduced] = useState(0);
  const [waterHauledBbls, setWaterHauledBbls] = useState(0);

  const [meteredWater, setMeteredWater] = useState(0);
  const [meteredGas, setMeteredGas] = useState(0);

  useEffect(() => {
    let totalOilInches = 0;
    let totalOilBbls = 0;
    let totalColorCutBbls = 0;

    oilGauges.forEach((tank) => {
      const topInches = (tank.gaugeFt || 0) * 12 + (tank.gaugeIn || 0);
      const bblsPerInch = parseFloat(tank.bblsPerInch ?? 0);

      // NEW: Factor in overrideBbls if > 0
      const overrideVal = parseFloat(tank.overrideBbls || "0");
      const grossBbls = overrideVal > 0 ? overrideVal : topInches * bblsPerInch;

      totalOilInches += topInches;
      totalOilBbls += topInches * bblsPerInch;
      totalOilBbls += grossBbls;

      if (useColorCut) {
        const cutInches = (tank.colorCutFt || 0) * 12 + (tank.colorCutIn || 0);
        totalColorCutBbls += cutInches * bblsPerInch;
      }
    });

    let netOilBbls = totalOilBbls - totalColorCutBbls;
    netOilBbls = Math.round(netOilBbls * 10000) / 10000;
    totalColorCutBbls = Math.round(totalColorCutBbls * 10000) / 10000;
    const oilInchesRounded = Math.round(totalOilInches * 10000) / 10000;

    setOilProduced(netOilBbls);
    setInchesProduced(oilInchesRounded);
    setOilOnHand(netOilBbls);
    setColorCutOnHand(totalColorCutBbls);
  }, [oilGauges, useColorCut]);

  // ------------------------------
  // WATER PRODUCTION
  // ------------------------------
  useEffect(() => {
    let totalWaterInches = 0;
    let totalWaterBbls = 0;

    waterGauges.forEach((tank) => {
      const topInches = (tank.gaugeFt || 0) * 12 + (tank.gaugeIn || 0);
      const bblsPerInch = parseFloat(tank.bblsPerInch ?? 0);

      totalWaterInches += topInches;
      totalWaterBbls += topInches * bblsPerInch;
    });

    totalWaterBbls = Math.round(totalWaterBbls * 10000) / 10000;
    const waterInchesRounded = Math.round(totalWaterInches * 10000) / 10000;

    setWaterProduced(totalWaterBbls);
    setWaterInchesProduced(waterInchesRounded);
    setWaterOnHand(totalWaterBbls);
    setWaterHauledBbls(10); // placeholder
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

  function useWindowHeight() {
    const [windowHeight, setWindowHeight] = useState(
      typeof window !== "undefined" ? window.innerHeight : 9999
    );

    useEffect(() => {
      function handleResize() {
        setWindowHeight(window.innerHeight);
      }
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    return windowHeight;
  }

  function openImageModal(imageUrl) {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  }

  function closeImageModal() {
    setSelectedImage("");
    setShowImageModal(false);
  }

  /*************************************************
   * 6) Recent Gauge History (AG Grid) - optional
   *************************************************/
  const [expandHistory, setExpandHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyRowData, setHistoryRowData] = useState([]);
  const [pinnedTopRowData, setPinnedTopRowData] = useState([]);
  const windowWidth = useWindowWidth();
  const windowHeight = useWindowHeight();
  const isIpad = windowWidth >= 820 || windowHeight === 820;
  const isNarrow = windowWidth < 850;

  // Hard-coded "T" for Gauges By Tank
  const [selectedReport] = useState("T");

  // If you had previously fetched gauge history from an API, you can do so here.
  // Or comment it out to rely purely on passed-in data.
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

      // Optionally prefill from the most recent
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

  // Calculate pinned totals row
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

  // Main submit logic
  /************************************************
   * 8) Tickets modals + EDITING
   *************************************************/
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      console.warn("Form validation failed.");
      return;
    }

    // 1) Build the POST params
    const params = new URLSearchParams();
    params.append("lid", leaseID);
    params.append("gdate", gaugeDate);
    params.append("showWells", showWells ? "Y" : "N");
    params.append("LogUserID", userID || "UnknownUser");

    // Oil gauges
    oilGauges.forEach((tank) => {
      params.append("gaugeid[]", tank.GaugeID || 0);
      params.append("tankid[]", tank.TankID || "");
      params.append("override[]", tank.override || "N");
      params.append("gaugeft[]", tank.gaugeFt || 0);
      params.append("gaugein[]", tank.gaugeIn || 0);
      params.append("overridebbls[]", tank.overrideBbls || 0);
      params.append("accumoverridebbls[]", "0.00");
    });

    // Water gauges
    waterGauges.forEach((wTank) => {
      params.append("wgaugeid[]", wTank.GaugeID || 0);
      params.append("wgaugeft[]", wTank.gaugeFt || 0);
      params.append("wgaugein[]", wTank.gaugeIn || 0);
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
    params.append("gmeter", gasMeter || 0);
    params.append("mcf", mcf || 0);
    params.append("gasdisp", gasDisp || "3");

    // Additional fields
    params.append("comments", comments || "");
    params.append("spcc", spcc || "");
    params.append("initgauges", initialGauges);

    // 2) Helper to store offline gauge data
    const storeGaugeDataOffline = () => {
      const offlineKey = `offlineGauge_${leaseID}_${gaugeDate}`;
      const gaugeObj = {
        daily: [],
        tbgPressure,
        csgPressure,
        gasMeter,
        mcf,
        gasDisp,
        manualWater,
        waterMeter,
        comments,
        spcc,
        initialGauges,
        lastUser: userID,
        lastUpdateDate: new Date().toISOString(),
      };

      // Rebuild daily arrays
      const oilDaily = oilGauges.map((tank) => ({
        GaugeID: tank.GaugeID || 0,
        TankID: tank.TankID,
        GaugeFt: tank.gaugeFt || 0,
        GaugeIn: tank.gaugeIn || 0,
        TankType: "T",
      }));
      const waterDaily = waterGauges.map((tank) => ({
        GaugeID: tank.GaugeID || 0,
        TankID: tank.TankID,
        GaugeFt: tank.gaugeFt || 0,
        GaugeIn: tank.gaugeIn || 0,
        TankType: "W",
      }));

      gaugeObj.daily = [...oilDaily, ...waterDaily];
      localStorage.setItem(offlineKey, JSON.stringify(gaugeObj));
      console.log("Gauge data stored offline:", offlineKey);
    };

    // 3) Update the in-memory lease object and localStorage "leases"
    if (leaseData) {
      const updatedLease = structuredClone(leaseData);

      // Merge new gauge values back into updatedLease.DailyGauges
      if (updatedLease.DailyGauges) {
        updatedLease.DailyGauges = updatedLease.DailyGauges.map((dg) => {
          if (dg.TankType === "T") {
            const match = oilGauges.find((o) => o.GaugeID === dg.GaugeID);
            if (match) {
              return {
                ...dg,
                GaugeFt: match.gaugeFt.toString(),
                GaugeIn: match.gaugeIn.toString(),
                OverrideBbls: match.overrideBbls?.toString() || "0.00",
              };
            }
          } else if (dg.TankType === "W") {
            const match = waterGauges.find((w) => w.GaugeID === dg.GaugeID);
            if (match) {
              return {
                ...dg,
                GaugeFt: match.gaugeFt.toString(),
                GaugeIn: match.gaugeIn.toString(),
              };
            }
          }
          return dg; // no change
        });
      }

      console.log("Updated in-memory lease for immediate use:", updatedLease);

      // Update localStorage "leases"
      try {
        const storedLeases = localStorage.getItem("leases");
        if (storedLeases) {
          const parsedLeases = JSON.parse(storedLeases);
          const idx = parsedLeases.findIndex(
            (l) => l.LeaseID === updatedLease.LeaseID
          );
          if (idx !== -1) {
            parsedLeases[idx] = updatedLease; // Replace old with updated
            localStorage.setItem("leases", JSON.stringify(parsedLeases));
            console.log(
              "LocalStorage 'leases' updated for LeaseID:",
              updatedLease.LeaseID
            );
          }
        }
      } catch (error) {
        console.error("Error updating lease in localStorage:", error);
      }
    }

    // 4) Attempt to POST online
    try {
      const response = await fetch(`${baseUrl}/service_postgauge.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      // If the server signals offline queue
      if (response.status === 202) {
        console.log("Offline/queued by Service Worker. Storing offline...");
        storeGaugeDataOffline();
        navigate(`/pumper?activeLease=${leaseID}`);
        return;
      }

      // Otherwise parse success or error
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const textResp = await response.text();
        result = { status: "error", message: textResp };
      }

      console.log("Server gauge response:", result);
      if (result.status === "success") {
        // Also store offline copy for reference
        storeGaugeDataOffline();
        navigate(`/pumper?activeLease=${leaseID}`);
      } else {
        alert(`Partial/error:\n${JSON.stringify(result)}`);
      }
    } catch (err) {
      // 5) If truly offline or request fails
      console.error("Network error => offline?", err);
      storeGaugeDataOffline();
      navigate(`/pumper?activeLease=${leaseID}`);
    }
  };

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
    comments: "",

    gaugeid1: "-1",
    gaugeid2: "-1",
    imagefilename: "",
    gaugedate: "",
    gaugetime: "15:30",
    gaugetype: "B",
    tickettype: "S",
    tankid: tankID,
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

  // If you have purchaser loads for this lease, filter them
  const loadsForThisPurchaser = useMemo(() => {
    if (!purchaserID || !purchaserLeaseNo) return [];
    return purchaserLoads.filter(
      (ld) =>
        ld.PurchaserID === purchaserID &&
        ld.PurchaserLeaseID === purchaserLeaseNo
    );
  }, [purchaserID, purchaserLeaseNo, purchaserLoads]);

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

  /*************************************************
   * 8A) Post (Add or Update) a Run Ticket
   *************************************************/
  const handleRunTicketSave = async (e) => {
    e.preventDefault();

    const runTicketNumber = newRunTicket.ticketId.trim();
    const mergedComments = runTicketNumber
      ? `[RT#${runTicketNumber}] ${newRunTicket.comments || ""}`
      : newRunTicket.comments || "";

    if (!newRunTicket.gaugedate) {
      alert("GaugeDate is required (cannot be null).");
      return;
    }

    const urlParams = new URLSearchParams();
    urlParams.append("comments", mergedComments);
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
          the network connection is restored.
        </div>
      )}

      {/* NAVBAR */}
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

      {/* MAIN CONTENT */}
      <div className="pt-8 px-2 md:px-3 lg:px-4 pb-6">
        {/* LEASE & PURCHASER INFO */}
        <div className="bg-white shadow-lg rounded-lg p-3 mb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* LEFT SIDE: LEASE INFO */}
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
                        {pumperPhone}
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

            {/* RIGHT SIDE: PURCHASER INFO */}
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

          {/* PURCHASER LOADS (OPTIONAL) */}
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

        {/* TWO COLUMNS */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* LEFT COLUMN (GAUGE FORM) */}
          <div
            className={`${
              isRightColumnActive ? "md:w-7/12" : "md:w-full"
            } flex flex-col gap-4`}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-lg rounded-lg p-3 space-y-4"
            >
              {/* HIDDEN INPUTS */}
              <input type="hidden" name="src" value={src} />
              <input type="hidden" name="lid" value={leaseID} />
              <input type="hidden" name="gdate" value={gaugeDate} />
              <input type="hidden" name="fdate" value={srcFrom} />
              <input type="hidden" name="tdate" value={srcThru} />

              {/* OIL TANKS */}
              {showOil && (
                <div className="p-2 rounded-lg bg-[#D3D3D3]">
                  <div className="mb-1 bg-[#D3D3D3] p-2 rounded-lg w-full">
                    <h4 className="font-bold text-base text-gray-700 mb-1">
                      Oil Tanks
                    </h4>
                    <div className="bg-white rounded shadow p-2 w-full text-sm">
                      <div
                        className={`grid grid-cols-1 gap-2 font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-2 px-2 lg:grid-cols-${
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

                      {oilGauges.map((tank, idx) => (
                        <div
                          key={tank.TankID}
                          className="grid grid-cols-1 lg:grid-cols-12 items-center gap-2 py-1 px-2 hover:bg-gray-50 transition-colors"
                        >
                          {/* Tank label */}
                          <div
                            className={`${
                              useColorCut ? "lg:col-span-3" : "lg:col-span-4"
                            } font-medium text-gray-800`}
                          >
                            {tank.TankID} ({tank.size})
                          </div>

                          {/* If useColorCut => show top gauge and color cut, else just top gauge */}
                          {useColorCut ? (
                            <>
                              {/* iPad layout */}
                              {isIpad ? (
                                <div className="flex flex-row items-center justify-between w-full gap-1 px-0 lg:col-span-9">
                                  <div className="flex items-center gap-1">
                                    <div className="flex items-center gap-1">
                                      <label className="text-gray-600 font-medium">
                                        Top Ft:
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        className="border px-1 py-1 w-16 text-right rounded focus:outline-blue-500"
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
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <label className="text-gray-600 font-medium">
                                        Top In:
                                      </label>
                                      <input
                                        type="number"
                                        step="0.25"
                                        min="0"
                                        max="11.75"
                                        className="border px-1 py-1 w-16 text-right rounded focus:outline-blue-500"
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
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="flex items-center gap-1">
                                      <label className="text-gray-600 font-medium">
                                        Cut Ft:
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        className="border px-1 py-1 w-16 text-right rounded focus:outline-blue-500"
                                        value={tank.colorCutFt || 0}
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
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <label className="text-gray-600 font-medium">
                                        Cut In:
                                      </label>
                                      <input
                                        type="number"
                                        step="0.25"
                                        min="0"
                                        max="11.75"
                                        className="border px-1 py-1 w-16 text-right rounded focus:outline-blue-500"
                                        value={tank.colorCutIn || 0}
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
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : isNarrow ? (
                                // Narrow layout
                                <div className="lg:col-span-12 flex flex-col items-center gap-2">
                                  <div className="flex items-center gap-2 justify-center">
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
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
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
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 justify-center">
                                    <div className="flex items-center gap-1">
                                      <label className="text-gray-600 font-medium">
                                        Cut Ft:
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                                        value={tank.colorCutFt || 0}
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
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
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
                                        value={tank.colorCutIn || 0}
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
                                        onFocus={(e) => e.target.select()}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Normal large layout
                                <div className="lg:col-span-9 flex flex-col lg:flex-row items-center gap-2">
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
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </div>
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
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <label className="text-gray-600 font-medium">
                                      Cut Ft:
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="30"
                                      className="border px-2 py-1 w-16 text-right rounded focus:outline-blue-500"
                                      value={tank.colorCutFt || 0}
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
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </div>
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
                                      value={tank.colorCutIn || 0}
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
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            // Not using color cut
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
                                  onFocus={(e) => e.target.select()}
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
                                  onFocus={(e) => e.target.select()}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Additional controls at the bottom of the Oil Tanks section */}
                      <div className="flex flex-col lg:flex-row items-center gap-2 mt-2 px-2 justify-center">
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
                              onChange={(e) => {
                                const val = parseFloat(e.target.value || "0");
                                setPocRunTime(val);
                              }}
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
                            onChange={(e) => {
                              const val = parseFloat(e.target.value || "0");
                              setTbgPressure(val);
                            }}
                            onFocus={(e) => e.target.select()}
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
                            onChange={(e) => {
                              const val = parseFloat(e.target.value || "0");
                              setCsgPressure(val);
                            }}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GAS */}
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
                        onFocus={(e) => e.target.select()}
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
                          onFocus={(e) => e.target.select()}
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
                              onFocus={(e) => e.target.select()}
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
                              onFocus={(e) => e.target.select()}
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
                          onFocus={(e) => e.target.select()}
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
                          onFocus={(e) => e.target.select()}
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
                          onFocus={(e) => e.target.select()}
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
                          onFocus={(e) => e.target.select()}
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
                          onFocus={(e) => e.target.select()}
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

              {/* WATER */}
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
                            onFocus={(e) => e.target.select()}
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
                            onFocus={(e) => e.target.select()}
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
                        onFocus={(e) => e.target.select()}
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
                      onFocus={(e) => e.target.select()}
                    />
                    <small>{manualWaterLabel2}</small>
                  </div>
                </div>
              )}

              {/* NOTES / WELLS / SUBMIT */}
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
                                onFocus={(e) => e.target.select()}
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
                                onFocus={(e) => e.target.select()}
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
                                onFocus={(e) => e.target.select()}
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
                                onFocus={(e) => e.target.select()}
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

          {/* RIGHT COLUMN (SUMMARIES / TICKETS / IMAGES) */}
          {isRightColumnActive && (
            <div className="md:w-5/12 flex flex-col gap-4">
              {/* SUMMARIES */}
              {(showOil || showWater || hasGasMeter) && (
                <div className="bg-white border p-3 rounded-lg text-sm shadow-sm">
                  <h4 className="text-center font-semibold text-gray-700 mb-2">
                    Production Summaries
                  </h4>
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

                  {showGas && hasGasMeter && (
                    <div className="flex justify-between bg-[#FFFFE0] p-2 text-sm rounded mt-2">
                      <label className="font-medium">Gas Metered</label>
                      <div>{meteredGas.toFixed(0)} mcf</div>
                    </div>
                  )}

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

              {/* IMAGES SECTION */}
              <div className="bg-white border p-3 text-sm rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-700 mb-2">Images</h4>
                  <button className="bg-blue-400 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    <i className="fa fa-camera" aria-hidden="true"></i>
                    <a
                      href={`ogp_ImagesAdd.php?LeaseID=${leaseID}&GaugeDate=${gaugeDate}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1"
                    >
                      Add Images
                    </a>
                  </button>
                </div>

                {/* SAMPLE IMAGES (THUMBNAILS) */}
                <div className="flex gap-2 justify-center mt-2">
                  <img
                    src="https://via.placeholder.com/60?text=IMG1"
                    alt="Sample Image 1"
                    className="w-14 h-auto border cursor-pointer"
                    onClick={() =>
                      openImageModal(
                        "https://via.placeholder.com/600x400?text=IMG1"
                      )
                    }
                  />
                  <img
                    src="https://via.placeholder.com/60?text=IMG2"
                    alt="Sample Image 2"
                    className="w-14 h-auto border cursor-pointer"
                    onClick={() =>
                      openImageModal(
                        "https://via.placeholder.com/600x400?text=IMG2"
                      )
                    }
                  />
                </div>
              </div>

              {/* RUN TICKETS */}
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
                    <div className="font-bold">
                      RT #{rt.ticketId} &nbsp; {rt.gaugetime} &nbsp; Open:{" "}
                      {rt.opengaugeft} ft / {rt.opengaugein} in &nbsp; Close:{" "}
                      {rt.closegaugeft} ft / {rt.closegaugein} in
                    </div>
                    <div className="mt-1 ml-4 italic">
                      Gravity={rt.gravity}, Temp={rt.temp}, BSW={rt.bsw}
                      <br />
                      Comments: {rt.comments}
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

              {/* WATER TICKETS */}
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
                      WT #{wt.ticketId} &nbsp; {wt.gaugetime} &nbsp; Open{" "}
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

        {/* RECENT GAUGE HISTORY */}
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

      {/* MODAL: RUN TICKET */}
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

            {/* SAMPLE IMAGE THUMBNAILS */}
            <div className="flex gap-2 justify-center mb-3">
              <img
                src="https://via.placeholder.com/60?text=RT1"
                alt="RT1"
                className="w-14 h-auto border cursor-pointer"
                onClick={() =>
                  openImageModal("https://via.placeholder.com/600x400?text=RT1")
                }
              />
              <img
                src="https://via.placeholder.com/60?text=RT2"
                alt="RT2"
                className="w-14 h-auto border cursor-pointer"
                onClick={() =>
                  openImageModal("https://via.placeholder.com/600x400?text=RT2")
                }
              />
            </div>

            <form onSubmit={handleRunTicketSave} className="space-y-2 text-sm">
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
                  onFocus={(e) => e.target.select()} // <--- highlight entire text on focus
                />
              </div>

              <div>
                <label className="block font-semibold">Comments:</label>
                <textarea
                  className="border rounded p-1 w-full"
                  rows={2}
                  placeholder="Any notes..."
                  value={newRunTicket.comments}
                  onChange={(e) =>
                    setNewRunTicket({
                      ...newRunTicket,
                      comments: e.target.value,
                    })
                  }
                />
              </div>

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

      {/* MODAL: WATER TICKET */}
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

            {/* SAMPLE IMAGE THUMBNAILS */}
            <div className="flex gap-2 justify-center mb-3">
              <img
                src="https://via.placeholder.com/60?text=RT1"
                alt="WT1"
                className="w-14 h-auto border cursor-pointer"
                onClick={() =>
                  openImageModal("https://via.placeholder.com/600x400?text=WT1")
                }
              />
              <img
                src="https://via.placeholder.com/60?text=RT2"
                alt="WT2"
                className="w-14 h-auto border cursor-pointer"
                onClick={() =>
                  openImageModal("https://via.placeholder.com/600x400?text=WT2")
                }
              />
            </div>

            <form
              onSubmit={handleWaterTicketSave}
              className="space-y-2 text-sm"
            >
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

      {/* MODAL: FULL-SIZE IMAGE PREVIEW */}
      {showImageModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="relative bg-white rounded shadow-md p-2">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              onClick={closeImageModal}
            >
              <i className="fa fa-times" aria-hidden="true"></i>
            </button>
            <img
              src={selectedImage}
              alt="Full-size preview"
              className="max-w-[90vw] max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
export default GaugeEntryPage;
