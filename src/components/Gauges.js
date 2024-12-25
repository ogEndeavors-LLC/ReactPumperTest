import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import moment from "moment";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { baseUrl } from "./config.js";
import { faBullseye } from "@fortawesome/free-solid-svg-icons";

function GaugeEntryPage() {
  /*************************************************
   * 0) Fetch client-level flags from API
   *************************************************/
  // For example: useBSW, use24, useMaps, showWells, ...
  const [showBSW, setShowBSW] = useState(false);
  const [use24, setUse24] = useState(false);
  const [useLinePressure, setUseLinePressure] = useState(false);
  const [useColorCut, setUseColorCut] = useState(false);
  const [useImages, setUseImages] = useState(false);
  const [showWells, setShowWells] = useState(false);
  const [showPOC, setShowPOC] = useState(true); // default true
  const [manualWaterLabel, setManualWaterLabel] = useState("Produced Water");
  const [manualWaterLabel2, setManualWaterLabel2] = useState("bbls");

  useEffect(() => {
    // Example client-level settings fetch:
    fetch(`${baseUrl}/api/clientDetails.php`)
      .then((res) => res.json())
      .then((data) => {
        // This assumes data returns an array with at least one object
        if (data && Array.isArray(data) && data.length > 0) {
          const clientInfo = data[0];
          // Adjust your flags according to the presence of "Y"/"N"
          setShowBSW(clientInfo.useBSW === "Y");
          setUse24(clientInfo.use24 === "Y");
          setUseLinePressure(clientInfo.useLinePressure === "Y");
          setShowWells(clientInfo.ShowWells === "Y");
          setUseColorCut(clientInfo.UseColorCut === "Y");
          setUseImages(clientInfo.UseImages === "Y");

          // The API might say "ShowPOC" is "Y" or "N"
          // In your sample, ShowPOC is "N" by default
          if (clientInfo.ShowPOC === "N") {
            setShowPOC(false);
          }

          // Water labels
          if (clientInfo.ManualWaterLabel) {
            setManualWaterLabel(clientInfo.ManualWaterLabel);
          }
          if (clientInfo.ManualWaterLabel2) {
            setManualWaterLabel2(clientInfo.ManualWaterLabel2);
          }
        }
      })
      .catch((err) => console.error("Error fetching client details:", err));
  }, []);

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

    // Suppose this is your standard lease-level fetch
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

  useEffect(() => {
    if (!leaseData) return;

    // Populate states from leaseData
    setLeaseID(leaseData.LeaseID || "");
    setLeaseName(leaseData.LeaseName || "");
    setPumper(leaseData.PumperID || "");
    setPumperPhone("325-698-0200"); // placeholder
    setPumperEmail("pumper@example.com"); // placeholder

    setPurchaserID(leaseData.Purchaser || "");
    setPurchaser(leaseData.Purchaser || "");
    setPurchaserPhone("555-8888"); // placeholder
    setPurchaserEmail("dispatch@transoiltx.com"); // placeholder
    setPurchaserLeaseNo(leaseData.PurchaserLeaseNo || "");

    // Show flags
    setShowOil(leaseData.ShowOil === "Y");
    setShowWater(leaseData.ShowWater === "Y");
    setShowGas(leaseData.ShowGas === "Y");
    setHasGasMeter(leaseData.GasMeter === "Y");
    setHasWaterMeter(leaseData.WaterMeter === "Y");

    // Tanks
    if (leaseData.Tanks && Array.isArray(leaseData.Tanks)) {
      const oilTanks = leaseData.Tanks.filter((t) => t.TankType === "T");
      const waterTanks = leaseData.Tanks.filter((t) => t.TankType === "W");

      const mappedOil = oilTanks.map((tank, idx) => ({
        gaugeId: `OILTANK_${tank.TankID || idx}`,
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

      const mappedWater = waterTanks.map((tank, idx) => ({
        gaugeId: `WTRTANK_${tank.TankID || idx}`,
        tankId: tank.TankID,
        size: tank.Size,
        gaugeFt: 0,
        gaugeIn: 0,
        bblsPerInch: parseFloat(tank.BBLSperInch || "0"),
      }));
      setWaterGauges(mappedWater);
    }

    // Wells
    if (leaseData.Wells && Array.isArray(leaseData.Wells)) {
      const mappedWells = leaseData.Wells.map((w, idx) => ({
        wellGaugeID: `WellGauge${idx}`,
        wellID: w.WellID || `Well-${idx}`,
        wellOn: w.Active === "Y" ? "Y" : "N",
        reasonDown: "NU",
        note: "",
      }));
      setWellEntries(mappedWells);
    }
  }, [leaseData]);

  /*************************************************
   * 3) Standard user session / date / role, etc.
   *************************************************/
  const [userSession] = useState({
    user: "demoUser",
    role: "A",
    username: "demoUsername",
    userphone: "555-1234",
  });
  const [role] = useState(userSession.role);

  // "Gauge Date" placeholder
  const [gaugeDate] = useState("2024-01-01");

  // "src" logic
  const [src] = useState("-");
  const [srcFrom] = useState("-1");
  const [srcThru] = useState("-1");

  // Additional states
  const [expandWells, setExpandWells] = useState(false);
  const [showWaterTanks] = useState(true); // If the lease uses water tanks
  const [showMcf, setShowMcf] = useState(true);
  const [showMcfAccum, setShowMcfAccum] = useState(true);

  // LACT (if you need them)
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
   * 5) Summaries
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

  useEffect(() => {
    // Oil
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

    // placeholders
    setSoldOil(10.0);
    setDrawBbls(1.5);
  }, [oilGauges, useColorCut]);

  useEffect(() => {
    // Water
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
    // Metered Water
    setMeteredWater(waterMeter);
  }, [waterMeter, waterMeterReset]);

  useEffect(() => {
    // Metered Gas
    setMeteredGas(gasMeter);
  }, [gasMeter, gasMeterReset]);

  /*************************************************
   * 6) History
   *************************************************/
  const [expandHistory, setExpandHistory] = useState(false);
  const [historyRowData, setHistoryRowData] = useState([]);

  const historyColumnDefs = useMemo(() => {
    return [
      {
        headerName: "Date",
        field: "gaugeDate",
        flex: 1,
        valueFormatter: (params) =>
          moment(params.value).isValid()
            ? moment(params.value).format("MM/DD/YYYY")
            : params.value,
      },
      {
        headerName: "Oil",
        field: "oil",
        flex: 1,
        cellStyle: { textAlign: "right" },
      },
      {
        headerName: "Run",
        field: "run",
        flex: 1,
        cellStyle: { textAlign: "right" },
      },
      {
        headerName: "BSW",
        field: "bsw",
        flex: 1,
        cellStyle: { textAlign: "right" },
      },
      {
        headerName: "Water",
        field: "water",
        flex: 1,
        cellStyle: { textAlign: "right" },
      },
      {
        headerName: "Gas",
        field: "gas",
        flex: 1,
        cellStyle: { textAlign: "right" },
      },
      { headerName: "Comments", field: "comment", flex: 2 },
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

  useEffect(() => {
    // Mock last 7 days
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dateStr = moment().subtract(i, "days").format("YYYY-MM-DD");
      days.push({
        gaugeDate: dateStr,
        oil: (Math.random() * 50).toFixed(2),
        run: (Math.random() * 10).toFixed(2),
        bsw: (Math.random() * 2).toFixed(2),
        water: (Math.random() * 25).toFixed(2),
        gas: (Math.random() * 300).toFixed(0),
        comment: i === 0 ? "Most Recent" : "",
      });
    }
    days.sort((a, b) => moment(b.gaugeDate) - moment(a.gaugeDate));
    setHistoryRowData(days);
  }, []);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    alert("Form submitted (Here you’d send data to your server).");
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
   * 8) Tickets modals
   *************************************************/
  const [showRunTicketModal, setShowRunTicketModal] = useState(false);
  const [showWaterTicketModal, setShowWaterTicketModal] = useState(false);

  // Run Ticket
  const [runTickets, setRunTickets] = useState([]);
  const [newRunTicket, setNewRunTicket] = useState({
    product: "Sell Oil",
    gaugeTime: "15:30",
    ticketId: "",
    gaugeAction: "Open",
    openFt: 0,
    openIn: 0.0,
    disposition: "",
    runTicketNumber: 999,
    closeFt: 0,
    closeIn: 0.0,
    diffInches: "0 in",
    diffBbls: "0 bbls",
  });

  // Water Ticket
  const [waterTickets, setWaterTickets] = useState([]);
  const [newWaterTicket, setNewWaterTicket] = useState({
    ticketId: "",
    gaugeTime: "10:00",
    gaugeAction: "Open",
    openFt: 0,
    openIn: 0.0,
    closeFt: 0,
    closeIn: 0.0,
    diffInches: "0 in",
    diffBbls: "0 bbls",
    comments: "",
  });

  const openRunTicketModal = () => {
    setNewRunTicket({
      product: "Sell Oil",
      gaugeTime: "15:30",
      ticketId: "",
      gaugeAction: "Open",
      openFt: 0,
      openIn: 0.0,
      disposition: "",
      runTicketNumber: 999,
      closeFt: 0,
      closeIn: 0.0,
      diffInches: "0 in",
      diffBbls: "0 bbls",
    });
    setShowRunTicketModal(true);
  };

  const closeRunTicketModal = () => {
    setShowRunTicketModal(false);
  };

  const handleAddRunTicket = (e) => {
    e.preventDefault();
    if (!newRunTicket.ticketId) {
      alert("Run Ticket ID is required.");
      return;
    }
    setRunTickets((prev) => [...prev, { ...newRunTicket }]);
    setShowRunTicketModal(false);
  };

  const openWaterTicketModal = () => {
    setNewWaterTicket({
      ticketId: "",
      gaugeTime: "10:00",
      gaugeAction: "Open",
      openFt: 0,
      openIn: 0.0,
      closeFt: 0,
      closeIn: 0.0,
      diffInches: "0 in",
      diffBbls: "0 bbls",
      comments: "",
    });
    setShowWaterTicketModal(true);
  };

  const closeWaterTicketModal = () => {
    setShowWaterTicketModal(false);
  };

  const handleAddWaterTicket = (e) => {
    e.preventDefault();
    if (!newWaterTicket.ticketId) {
      alert("Water Ticket ID is required.");
      return;
    }
    setWaterTickets((prev) => [...prev, { ...newWaterTicket }]);
    setShowWaterTicketModal(false);
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
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white shadow flex justify-between items-center px-4 py-2 z-10">
        <div className="flex items-end">
          <h3 className="font-extrabold text-2xl tracking-tight text-gray-800">
            Gauge Entry
          </h3>
          <small className="ml-3 text-sm text-gray-500 italic -mb-1">
            Logged in as: {userSession.user}
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
      <div className="pt-8 px-2 md:px-4 lg:px-8 pb-8">
        {/* Lease & Purchaser Info */}
        <div className="bg-white shadow-lg rounded-lg p-4 mb-4">
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
              className="bg-white shadow-lg rounded-lg p-4 space-y-4"
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
                  <div className="mb-2 bg-[#D3D3D3] p-3 rounded-lg w-full">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      Oil Tanks
                    </h4>
                    <div className="bg-white rounded shadow p-2 text-xs w-full">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-12 flex items-center font-medium text-gray-700 border-b border-gray-200 pb-1 mb-2 px-4">
                          <div
                            className={`${useColorCut ? "w-2/12" : "w-4/12"}`}
                          >
                            Tank (Size)
                          </div>
                          <div
                            className={`${
                              useColorCut ? "w-4/12" : "w-8/12"
                            } text-center`}
                          >
                            Top Gauge
                          </div>
                          {useColorCut && (
                            <div className="w-5/12 text-center">Color Cut</div>
                          )}
                        </div>

                        {oilGauges.map((tank, idx) => (
                          <div
                            key={tank.gaugeId}
                            className="col-span-12 grid grid-cols-12 items-center gap-2 py-1 px-4 hover:bg-gray-50 transition-colors"
                          >
                            <div
                              className={`${
                                useColorCut ? "col-span-3" : "col-span-4"
                              } font-medium text-gray-800`}
                            >
                              {tank.tankId} ({tank.size})
                            </div>
                            <div
                              className={`${
                                useColorCut ? "col-span-4" : "col-span-8"
                              } flex flex-wrap items-center gap-2`}
                            >
                              <div className="flex items-center gap-1">
                                <label className="text-gray-500">Ft:</label>
                                <input
                                  type="number"
                                  className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                                  value={tank.gaugeFt}
                                  min="0"
                                  max="30"
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
                                <label className="text-gray-500">In:</label>
                                <input
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  max="11.75"
                                  className="border p-1 w-12 text-right rounded focus:outline-blue-500"
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
                            {useColorCut && (
                              <div className="col-span-5 flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <label className="text-gray-500">Ft:</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    className="border p-1 w-12 text-right rounded focus:outline-blue-500"
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
                                <div className="flex items-center gap-1">
                                  <label className="text-gray-500">In:</label>
                                  <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="11.75"
                                    className="border p-1 w-12 text-right rounded focus:outline-blue-500"
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
                            )}
                          </div>
                        ))}
                        <div className="col-span-12 flex flex-wrap items-center gap-2 mt-2 px-4">
                          {use24 && (
                            <div className="flex items-center gap-1">
                              <label className="text-gray-500">
                                GaugeTime:
                              </label>
                              <input
                                type="time"
                                className="border p-1 w-24 text-xs text-right rounded focus:outline-blue-500"
                                value={gaugeTime}
                                onChange={(e) => setGaugeTime(e.target.value)}
                              />
                            </div>
                          )}
                          {showPOC && (
                            <div className="flex items-center gap-1">
                              <label className="text-gray-500">POC %:</label>
                              <input
                                type="number"
                                className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                                min="0"
                                max="100"
                                value={pocRunTime}
                                onChange={(e) =>
                                  setPocRunTime(
                                    parseFloat(e.target.value || "0")
                                  )
                                }
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <label className="text-gray-500">Tbg psi:</label>
                            <input
                              type="number"
                              className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                              value={tbgPressure}
                              onChange={(e) =>
                                setTbgPressure(
                                  parseFloat(e.target.value || "0")
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <label className="text-gray-500">Csg psi:</label>
                            <input
                              type="number"
                              className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                              value={csgPressure}
                              onChange={(e) =>
                                setCsgPressure(
                                  parseFloat(e.target.value || "0")
                                )
                              }
                            />
                          </div>
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
                    <div className="flex items-center gap-1 text-xs p-2 bg-white rounded shadow-sm mb-2">
                      <label className="text-gray-500">Gas Meter:</label>
                      <input
                        type="number"
                        className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                        value={gasMeter}
                        onChange={(e) =>
                          setGasMeter(parseFloat(e.target.value || "0"))
                        }
                      />
                      <select
                        className="border p-1 text-xs rounded focus:outline-blue-500"
                        value={gasMeterReset}
                        onChange={(e) => setGasMeterReset(e.target.value)}
                      >
                        <option value="N">Reset? No</option>
                        <option value="Y">Reset? Yes</option>
                      </select>
                    </div>
                  )}

                  {showMcf && (
                    <div className="text-xs space-y-2">
                      {/* Gas MCF/Accum/FLP */}
                      <div className="flex flex-wrap items-center gap-1 p-2 bg-white rounded shadow-sm">
                        <label className="text-gray-500">MCF:</label>
                        <input
                          type="number"
                          className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                          value={mcf}
                          onChange={(e) =>
                            setMcf(parseFloat(e.target.value || "0"))
                          }
                        />
                        {showMcfAccum && (
                          <>
                            <label className="text-gray-500">Accum:</label>
                            <input
                              type="number"
                              className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                              value={mcfAccum}
                              onChange={(e) =>
                                setMcfAccum(parseFloat(e.target.value || "0"))
                              }
                            />
                          </>
                        )}
                        {useLinePressure && (
                          <>
                            <label className="text-gray-500">FLP:</label>
                            <input
                              type="number"
                              className="border p-1 w-12 text-right rounded focus:outline-blue-500"
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
                      {/* Gas Pressures */}
                      <div className="flex flex-wrap items-center gap-1 p-2 bg-white rounded shadow-sm">
                        <label className="text-gray-500">Static:</label>
                        <input
                          type="number"
                          className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                          value={staticPressure}
                          onChange={(e) =>
                            setStaticPressure(parseFloat(e.target.value || "0"))
                          }
                        />
                        <label className="text-gray-500">Diff:</label>
                        <input
                          type="number"
                          className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                          value={diffPressure}
                          onChange={(e) =>
                            setDiffPressure(parseFloat(e.target.value || "0"))
                          }
                        />
                        <label className="text-gray-500">Flow:</label>
                        <input
                          type="number"
                          className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                          value={flowRate}
                          onChange={(e) =>
                            setFlowRate(parseFloat(e.target.value || "0"))
                          }
                        />
                      </div>
                      {/* Choke, Hrs On, Gas Disp */}
                      <div className="flex flex-wrap items-center gap-1 p-2 bg-white rounded shadow-sm">
                        <label className="text-gray-500">Choke:</label>
                        <input
                          type="number"
                          className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                          value={choke}
                          onChange={(e) =>
                            setChoke(parseFloat(e.target.value || "0"))
                          }
                        />
                        <label className="text-gray-500">Hrs On:</label>
                        <input
                          type="number"
                          className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                          value={hoursOn}
                          onChange={(e) =>
                            setHoursOn(parseFloat(e.target.value || "0"))
                          }
                        />
                      </div>
                      <div className="flex items-center gap-1 p-2 bg-white rounded shadow-sm">
                        <label className="text-gray-500">Gas Disp:</label>
                        <select
                          className="border p-1 text-xs rounded focus:outline-blue-500"
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
                        key={tank.gaugeId}
                        className="flex flex-wrap items-center gap-1 mb-2 text-xs p-2 bg-white rounded shadow-sm"
                      >
                        <label className="font-medium">
                          {tank.tankId} ({tank.size})
                        </label>
                        <div className="flex items-center gap-1 ml-2">
                          <label className="text-gray-500">Ft:</label>
                          <input
                            type="number"
                            className="border p-1 w-12 text-right rounded focus:outline-blue-500"
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
                          <label className="text-gray-500">In:</label>
                          <input
                            type="number"
                            className="border p-1 w-12 text-right rounded focus:outline-blue-500"
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
                    <div className="flex flex-wrap items-center gap-1 text-xs p-2 bg-white rounded shadow-sm">
                      <label className="text-gray-500">Meter:</label>
                      <input
                        type="number"
                        className="border p-1 w-12 text-right rounded focus:outline-blue-500"
                        value={waterMeter}
                        onChange={(e) =>
                          setWaterMeter(parseFloat(e.target.value || "0"))
                        }
                      />
                      <select
                        className="border p-1 text-xs rounded focus:outline-blue-500"
                        value={waterMeterReset}
                        onChange={(e) => setWaterMeterReset(e.target.value)}
                      >
                        <option value="N">Reset? No</option>
                        <option value="Y">Reset? Yes</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs p-2 bg-white rounded shadow-sm mt-2">
                    <label className="text-gray-500">{manualWaterLabel}:</label>
                    <input
                      type="number"
                      className="border p-1 w-12 text-right rounded focus:outline-blue-500"
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
              <div className="bg-white border p-3 rounded text-xs col-span-1 md:col-span-2 space-y-2 shadow-sm mt-4">
                <label className="font-semibold">Notes</label>
                <textarea
                  rows={2}
                  className="border p-1 w-full mt-1 rounded focus:outline-blue-500"
                  placeholder="Any additional comments or observations..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <label className="font-semibold">SPCC</label>
                    <select
                      className="border p-1 text-xs rounded focus:outline-blue-500"
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
                      className="border p-1 text-xs rounded focus:outline-blue-500"
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
                          <th className="border p-1">Well ID</th>
                          <th className="border p-1">On?</th>
                          <th className="border p-1">ReasonDown</th>
                          <th className="border p-1">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wellEntries.map((w, idx) => (
                          <tr key={idx}>
                            <td className="border p-1">{w.wellID}</td>
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
                  Last Entry by {userSession.user} on{" "}
                  {new Date().toLocaleString()}
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
                      <div className="flex justify-between bg-[#D3D3D3] p-2 text-xs rounded">
                        <label className="font-medium">Oil Produced</label>
                        <div>
                          <span className="mr-2">
                            {inchesProduced.toFixed(2)} in
                          </span>
                          {oilProduced.toFixed(2)} bbls
                        </div>
                      </div>
                      <div className="flex justify-between bg-[#D3D3D3] p-2 text-xs rounded mt-1">
                        <label className="font-medium">Oil Sold</label>
                        <div>{soldOil.toFixed(2)} bbls</div>
                      </div>
                      {showBSW && (
                        <div className="flex justify-between bg-[#D3D3D3] p-2 text-xs rounded mt-1">
                          <label className="font-medium">BS&W</label>
                          <div>{drawBbls.toFixed(2)} bbls</div>
                        </div>
                      )}
                      <div className="flex justify-between bg-[#D3D3D3] p-2 text-xs rounded mt-1">
                        <label className="font-medium">On Hand</label>
                        <div>{oilOnHand.toFixed(2)} bbls</div>
                      </div>
                      {useColorCut && (
                        <div className="flex justify-between bg-[#D3D3D3] p-2 text-xs rounded mt-1">
                          <label className="font-medium">ColorCut OnHand</label>
                          <div>{colorCutOnHand.toFixed(2)} bbls</div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Gas summary */}
                  {showGas && hasGasMeter && (
                    <div className="flex justify-between bg-[#FFFFE0] p-2 text-xs rounded mt-2">
                      <label className="font-medium">Gas Metered</label>
                      <div>{meteredGas.toFixed(0)} mcf</div>
                    </div>
                  )}

                  {/* Water summary */}
                  {showWater && (
                    <>
                      {hasWaterMeter && (
                        <div className="flex justify-between bg-[#ADD8E6] p-2 text-xs rounded mt-2">
                          <label className="font-medium">Water Metered</label>
                          <div>{meteredWater.toFixed(0)} bbls</div>
                        </div>
                      )}
                      <div className="flex justify-between bg-[#ADD8E6] p-2 text-xs rounded mt-1">
                        <label className="font-medium">
                          {manualWaterLabel}
                        </label>
                        <div>{manualWater} bbls</div>
                      </div>
                      {showWaterTanks && (
                        <div className="flex justify-between bg-[#ADD8E6] p-2 text-xs rounded mt-1">
                          <label className="font-medium">Water Produced</label>
                          <div>
                            {waterInchesProduced.toFixed(2)} in /{" "}
                            {waterProduced.toFixed(2)} bbls
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between bg-[#ADD8E6] p-2 text-xs rounded mt-1">
                        <label className="font-medium">Water Hauled</label>
                        <div>{waterHauledBbls.toFixed(0)} bbls</div>
                      </div>
                      {showWaterTanks && (
                        <div className="flex justify-between bg-[#ADD8E6] p-2 text-xs rounded mt-1">
                          <label className="font-medium">Water On Hand</label>
                          <div>{waterOnHand.toFixed(2)} bbls</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Images */}
              {useImages && (
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
              )}

              {/* Run Tickets */}
              <div className="bg-white border p-3 text-sm rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Run Tickets
                  </h4>
                  <button
                    onClick={openRunTicketModal}
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
                        {rt.product} &nbsp; {rt.gaugeTime} &nbsp; {rt.ticketId}{" "}
                        &nbsp;
                        {rt.gaugeAction} &nbsp; {rt.openFt} ft &nbsp;{" "}
                        {rt.openIn} in &nbsp;
                        {rt.disposition}
                      </div>
                      <div className="mt-1 ml-4 italic">
                        Edit Run Ticket {rt.runTicketNumber} &nbsp; Close &nbsp;
                        {rt.closeFt} ft &nbsp; {rt.closeIn} in &nbsp;
                        {rt.diffInches} &nbsp; {rt.diffBbls}
                      </div>
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
                    onClick={openWaterTicketModal}
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
                      Ticket #{wt.ticketId} &nbsp; {wt.gaugeTime} &nbsp;{" "}
                      {wt.gaugeAction} &nbsp;
                      {wt.openFt} ft &nbsp; {wt.openIn} in &nbsp; - &nbsp;
                      {wt.closeFt} ft &nbsp; {wt.closeIn} in &nbsp;
                      <span className="ml-2 text-gray-600">
                        {wt.diffInches}, {wt.diffBbls}
                      </span>
                    </div>
                    <div className="mt-1 ml-4 text-gray-600 italic">
                      {wt.comments}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Gauge History */}
        <div className="bg-white shadow-lg rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm text-gray-700">
              Recent Gauge History (Last 7 Days)
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
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Add Run Ticket */}
      {showRunTicketModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white w-full max-w-xl p-4 rounded shadow-lg relative">
            <button
              onClick={closeRunTicketModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
            >
              <i className="fa fa-times" aria-hidden="true"></i>
            </button>
            <h2 className="text-lg font-semibold mb-2">Add Run Ticket</h2>
            <form onSubmit={handleAddRunTicket} className="space-y-2 text-sm">
              {/* Product */}
              <div>
                <label className="block font-semibold">Product:</label>
                <select
                  className="border rounded p-1 w-full"
                  value={newRunTicket.product}
                  onChange={(e) =>
                    setNewRunTicket({
                      ...newRunTicket,
                      product: e.target.value,
                    })
                  }
                >
                  <option value="Sell Oil">Sell Oil</option>
                  <option value="BS&W">BS&W</option>
                </select>
              </div>

              {/* Time & Run Ticket ID */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-semibold">Time:</label>
                  <input
                    type="time"
                    className="border rounded p-1 w-full"
                    value={newRunTicket.gaugeTime}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        gaugeTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-semibold">Run Ticket ID:</label>
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
              </div>

              {/* Action */}
              <div>
                <label className="block font-semibold">
                  Action (Open/Close):
                </label>
                <select
                  className="border rounded p-1 w-full"
                  value={newRunTicket.gaugeAction}
                  onChange={(e) =>
                    setNewRunTicket({
                      ...newRunTicket,
                      gaugeAction: e.target.value,
                    })
                  }
                >
                  <option value="Open">Open</option>
                  <option value="Close">Close</option>
                </select>
              </div>

              {/* Open Gauge */}
              <div>
                <label className="block font-semibold">
                  Open Gauge (ft / in):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    className="border rounded p-1 w-1/2"
                    placeholder="Ft"
                    value={newRunTicket.openFt}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        openFt: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="11.75"
                    className="border rounded p-1 w-1/2"
                    placeholder="In"
                    value={newRunTicket.openIn}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        openIn: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
              </div>

              {/* Close Gauge */}
              <div>
                <label className="block font-semibold">
                  Close Gauge (ft / in):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    className="border rounded p-1 w-1/2"
                    placeholder="Ft"
                    value={newRunTicket.closeFt}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        closeFt: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="11.75"
                    className="border rounded p-1 w-1/2"
                    placeholder="In"
                    value={newRunTicket.closeIn}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        closeIn: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
              </div>

              {/* Run Ticket # & Disposition */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-semibold">Run Ticket #:</label>
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
                  <label className="block font-semibold">Disposition:</label>
                  <input
                    type="text"
                    className="border rounded p-1 w-full"
                    placeholder="Disposition note"
                    value={newRunTicket.disposition}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        disposition: e.target.value,
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
                    value={newRunTicket.diffInches}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
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
                    value={newRunTicket.diffBbls}
                    onChange={(e) =>
                      setNewRunTicket({
                        ...newRunTicket,
                        diffBbls: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

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
                  Save Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Water Ticket */}
      {showWaterTicketModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white w-full max-w-xl p-4 rounded shadow-lg relative">
            <button
              onClick={closeWaterTicketModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
            >
              <i className="fa fa-times" aria-hidden="true"></i>
            </button>
            <h2 className="text-lg font-semibold mb-2">Add Water Ticket</h2>
            <form onSubmit={handleAddWaterTicket} className="space-y-2 text-sm">
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

              {/* Gauge Time */}
              <div>
                <label className="block font-semibold">Gauge Time:</label>
                <input
                  type="time"
                  className="border rounded p-1 w-full"
                  value={newWaterTicket.gaugeTime}
                  onChange={(e) =>
                    setNewWaterTicket({
                      ...newWaterTicket,
                      gaugeTime: e.target.value,
                    })
                  }
                />
              </div>

              {/* Action */}
              <div>
                <label className="block font-semibold">
                  Action (Open/Close):
                </label>
                <select
                  className="border rounded p-1 w-full"
                  value={newWaterTicket.gaugeAction}
                  onChange={(e) =>
                    setNewWaterTicket({
                      ...newWaterTicket,
                      gaugeAction: e.target.value,
                    })
                  }
                >
                  <option value="Open">Open</option>
                  <option value="Close">Close</option>
                </select>
              </div>

              {/* Open Gauge */}
              <div>
                <label className="block font-semibold">
                  Open Gauge (ft / in):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    className="border rounded p-1 w-1/2"
                    placeholder="Ft"
                    value={newWaterTicket.openFt}
                    onChange={(e) =>
                      setNewWaterTicket({
                        ...newWaterTicket,
                        openFt: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="11.75"
                    className="border rounded p-1 w-1/2"
                    placeholder="In"
                    value={newWaterTicket.openIn}
                    onChange={(e) =>
                      setNewWaterTicket({
                        ...newWaterTicket,
                        openIn: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
              </div>

              {/* Close Gauge */}
              <div>
                <label className="block font-semibold">
                  Close Gauge (ft / in):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    className="border rounded p-1 w-1/2"
                    placeholder="Ft"
                    value={newWaterTicket.closeFt}
                    onChange={(e) =>
                      setNewWaterTicket({
                        ...newWaterTicket,
                        closeFt: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="11.75"
                    className="border rounded p-1 w-1/2"
                    placeholder="In"
                    value={newWaterTicket.closeIn}
                    onChange={(e) =>
                      setNewWaterTicket({
                        ...newWaterTicket,
                        closeIn: parseFloat(e.target.value || "0"),
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

              {/* Comments */}
              <div>
                <label className="block font-semibold">Comments:</label>
                <textarea
                  rows={2}
                  className="border rounded p-1 w-full"
                  placeholder="Any notes about this water ticket..."
                  value={newWaterTicket.comments}
                  onChange={(e) =>
                    setNewWaterTicket({
                      ...newWaterTicket,
                      comments: e.target.value,
                    })
                  }
                />
              </div>

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
                  Save Ticket
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
