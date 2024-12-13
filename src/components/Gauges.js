import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function GaugeEntryPage() {
  /*************************************************
   * Mock user/session data
   *************************************************/
  const [userSession] = useState({
    user: "demoUser",
    role: "A",
    username: "demoUsername",
    userphone: "555-1234",
  });

  // Basic lease/purchaser/pumper data
  const [leaseID] = useState("123");
  const [gaugeDate] = useState("2024-01-01");
  const [leaseName] = useState("Lease Name");
  const [pumper] = useState("Admin");
  const [pumperPhone] = useState("555-9999");
  const [pumperEmail] = useState("pumper@example.com");
  const [purchaserID] = useState("XYZ");
  const [purchaser] = useState("Acme Oil Purchaser");
  const [purchaserPhone] = useState("555-8888");
  const [purchaserEmail] = useState("dispatch@acmeoil.com");
  const [purchaserLeaseNo] = useState("ACME-789");
  const [role] = useState(userSession.role);

  // "src" logic
  const [src] = useState("-");
  const [srcFrom] = useState("-1");
  const [srcThru] = useState("-1");

  /*************************************************
   * Flags/sections
   *************************************************/
  const [showOil] = useState(true);
  const [showWater] = useState(true);
  const [useLinePressure] = useState(true);
  const [use24] = useState(true);
  const [useColorCut] = useState(true);
  const [showPOC] = useState(true);
  const [showWells] = useState(true);
  const [expandWells, setExpandWells] = useState(false);
  const [showWaterTanks] = useState(true);
  const [useImages] = useState(true);
  const [showMcf] = useState(true);
  const [showMcfAccum] = useState(true);
  const [hasGasMeter] = useState(true);
  const [hasWaterMeter] = useState(true);
  const [manualWaterLabel] = useState("Produced Water");
  const [manualWaterLabel2] = useState("bbls");
  const [showBSW] = useState(true);
  const [useLACT] = useState(false);
  const [showLACT] = useState(false);

  /*************************************************
   * Gauge-entry form states
   *************************************************/
  // Oil Tanks
  const [oilGauges, setOilGauges] = useState([
    {
      gaugeId: "OIL1",
      tankId: "Tank-1",
      size: "500 bbl tank",
      gaugeFt: 0,
      gaugeIn: 0,
      colorCutFt: 0,
      colorCutIn: 0,
      overrideBbls: 0,
      bblsPerInch: 1.5,
    },
    {
      gaugeId: "OIL2",
      tankId: "Tank-2",
      size: "300 bbl tank",
      gaugeFt: 0,
      gaugeIn: 0,
      colorCutFt: 0,
      colorCutIn: 0,
      overrideBbls: 0,
      bblsPerInch: 1.5,
    },
  ]);

  // Gas fields
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
  const [waterGauges, setWaterGauges] = useState([
    {
      gaugeId: "WTR1",
      tankId: "WTank-1",
      size: "300 bbl water tank",
      gaugeFt: 0,
      gaugeIn: 0,
      bblsPerInch: 1.5,
    },
  ]);

  // Common form fields
  const [gaugeTime, setGaugeTime] = useState("12:00");
  const [pocRunTime, setPocRunTime] = useState(100);
  const [spcc, setSpcc] = useState("");
  const [initialGauges, setInitialGauges] = useState("N");
  const [comments, setComments] = useState("");

  // Wells
  const [wellEntries, setWellEntries] = useState([
    {
      wellGaugeID: "WellGauge01",
      wellID: "Well-1",
      wellOn: "Y",
      reasonDown: "NU",
      note: "",
    },
    {
      wellGaugeID: "WellGauge02",
      wellID: "Well-2",
      wellOn: "N",
      reasonDown: "PU",
      note: "Pump issues",
    },
  ]);

  /*************************************************
   * Summary data
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

  /*************************************************
   * Run Tickets - mock
   *************************************************/
  const [runTickets] = useState([
    {
      ticketType: "OilOpen",
      gaugeType: "R",
      gaugeDateTime: "2024-12-01T08:00",
      tankId: "Tank-1",
      override: "N",
      comment: "Ticket# 1001",
    },
    {
      ticketType: "OilClose",
      gaugeType: "T",
      gaugeDateTime: "2024-12-01T12:00",
      tankId: "Tank-1",
      override: "N",
      comment: "Ticket# 1001",
    },
    {
      ticketType: "WaterOpen",
      gaugeType: "B",
      gaugeDateTime: "2024-12-01T09:00",
      tankId: "WTank-1",
      override: "N",
      comment: "WaterTicket# 2001",
    },
    {
      ticketType: "WaterClose",
      gaugeType: "F",
      gaugeDateTime: "2024-12-01T10:15",
      tankId: "WTank-1",
      override: "N",
      comment: "WaterTicket# 2001",
    },
  ]);

  /*************************************************
   * Simulated data load
   *************************************************/
  useEffect(() => {
    setOilProduced(45.32);
    setOilOnHand(120.77);
    setInchesProduced(12.25);
    setSoldOil(10.0);
    setDrawBbls(1.5);
    setColorCutOnHand(5.0);

    setWaterProduced(20);
    setWaterOnHand(75.0);
    setWaterInchesProduced(6.5);
    setWaterHauledBbls(10);

    setMeteredWater(50);
    setMeteredGas(400);
  }, []);

  /*************************************************
   * Expand/Collapse Wells & Grid
   *************************************************/
  const [expandHistory, setExpandHistory] = useState(false);

  /*************************************************
   * 7-Day Gauge History (AG Grid)
   *************************************************/
  const [historyRowData, setHistoryRowData] = useState([]);

  useEffect(() => {
    // Mock last 7 days gauge data
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

  /*************************************************
   * Validation & Submission
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
   * Run Tickets
   *************************************************/
  const renderRunTicketsTable = (tickets, isWater = false) => {
    const bgColor = isWater ? "bg-blue-100" : "bg-orange-100";
    const headingLabel = isWater ? "Water Tickets" : "Run Tickets";

    const filtered = tickets.filter((t) =>
      isWater
        ? t.ticketType.toLowerCase().includes("water")
        : t.ticketType.toLowerCase().includes("oil")
    );

    if (!filtered.length) {
      return (
        <div className={`border p-2 mt-2 rounded ${bgColor}`}>
          <h4 className="text-center font-semibold">{headingLabel}</h4>
          <p className="text-center">No {headingLabel} Found</p>
        </div>
      );
    }

    return (
      <div className={`border p-2 mt-2 rounded ${bgColor}`}>
        <h4 className="text-center font-semibold">{headingLabel}</h4>
        <table className="w-full border-collapse text-xs mt-1">
          <thead className="bg-gray-50">
            <tr>
              <th className="border p-1">GaugeType</th>
              <th className="border p-1">Date/Time</th>
              <th className="border p-1">TankID</th>
              <th className="border p-1">Open/Close</th>
              <th className="border p-1">Gauge</th>
              <th className="border p-1">Comment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tk, idx) => {
              const isOpen = ["R", "B", "E", "W"].includes(tk.gaugeType);
              return (
                <tr key={idx} className="border">
                  <td className="border p-1">{tk.gaugeType}</td>
                  <td className="border p-1">{tk.gaugeDateTime}</td>
                  <td className="border p-1">{tk.tankId}</td>
                  <td className="border p-1">{isOpen ? "Open" : "Close"}</td>
                  <td className="border p-1">
                    <i>Gauge Data</i>
                  </td>
                  <td className="border p-1">{tk.comment}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  /*************************************************
   * MAIN RETURN
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

      <div className="pt-16 px-2 md:px-4 lg:px-8 pb-8">
        {/* Lease/Purchaser Info */}
        <div className="bg-white shadow-lg rounded-lg p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left side: Lease info */}
            <div className="md:w-2/3 space-y-2">
              <div className="flex flex-row items-center">
                <div className="w-16 text-xs text-gray-500">Lease</div>
                <div className="text-xl font-semibold">
                  {leaseName} ({leaseID})
                </div>
              </div>
              <div className="flex flex-row items-center">
                <div className="w-16 text-xs text-gray-500">Date</div>
                <div className="text-xl font-semibold">
                  {moment(gaugeDate).format("MM/DD/YYYY")}
                </div>
              </div>
              {(role === "O" || role === "A") && (
                <>
                  <div className="flex flex-row items-center">
                    <div className="w-16 text-xs text-gray-500">Pumper</div>
                    <div className="text-sm">
                      {pumper} (
                      <a
                        href={`tel:${pumperPhone}`}
                        className="text-blue-600 underline hover:text-blue-800 transition-colors"
                      >
                        {pumperPhone}
                      </a>
                      )
                    </div>
                  </div>
                  <div className="flex flex-row items-center pl-16">
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
              <div className="md:w-1/3 space-y-2">
                <div className="text-xs text-gray-500">Purchaser</div>
                <div className="text-sm">
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
                  <div>
                    <div className="text-xs text-gray-500">Dispatch Email</div>
                    <a
                      className="text-blue-600 underline text-sm hover:text-blue-800 transition-colors"
                      href={`mailto:${purchaserEmail}?Subject=${leaseName}&Body=Request%20load%20for%20${leaseName}%20-%20Tank%20#__`}
                    >
                      {purchaserEmail}
                    </a>
                  </div>
                )}
                {purchaserLeaseNo && (
                  <div>
                    <div className="text-xs text-gray-500">Lease No.</div>
                    <span className="text-sm">{purchaserLeaseNo}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form & Summaries */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left Column: the big gauge form */}
          <div className="md:w-7/12 flex flex-col gap-4">
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-lg rounded-lg p-4 space-y-4"
            >
              <input type="hidden" name="src" value={src} />
              <input type="hidden" name="lid" value={leaseID} />
              <input type="hidden" name="gdate" value={gaugeDate} />
              <input type="hidden" name="fdate" value={srcFrom} />
              <input type="hidden" name="tdate" value={srcThru} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LEFT Quadrant: Oil Tanks + Water */}
                <div className="p-2 rounded-lg bg-orange-50">
                  {/* Oil Tanks */}
                  {showOil && (
                    <div className="mb-2">
                      <h4 className="font-semibold text-sm mb-1 text-gray-700">
                        Oil Tanks
                      </h4>
                      {oilGauges.map((tank, idx) => (
                        <div
                          key={tank.gaugeId}
                          className="text-xs mb-2 p-2 rounded bg-white shadow-sm"
                        >
                          <div className="font-medium">
                            {tank.tankId} ({tank.size})
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <div className="flex items-center gap-1">
                              <label className="text-gray-500">Ft:</label>
                              <input
                                type="number"
                                className="border p-1 w-14 text-right rounded focus:outline-blue-500"
                                value={tank.gaugeFt}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value || "0");
                                  setOilGauges((prev) => {
                                    const updated = [...prev];
                                    updated[idx].gaugeFt = val;
                                    return updated;
                                  });
                                }}
                                min="0"
                                max="30"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <label className="text-gray-500">In:</label>
                              <input
                                type="number"
                                className="border p-1 w-14 text-right rounded focus:outline-blue-500"
                                value={tank.gaugeIn}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value || "0");
                                  setOilGauges((prev) => {
                                    const updated = [...prev];
                                    updated[idx].gaugeIn = val;
                                    return updated;
                                  });
                                }}
                                step="0.25"
                                min="0"
                                max="11.75"
                              />
                            </div>
                            {useColorCut && (
                              <>
                                <div className="flex items-center gap-1 ml-2">
                                  <label className="text-gray-500">
                                    CutFt:
                                  </label>
                                  <input
                                    type="number"
                                    className="border p-1 w-14 text-right rounded focus:outline-blue-500"
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
                                  <label className="text-gray-500">
                                    CutIn:
                                  </label>
                                  <input
                                    type="number"
                                    className="border p-1 w-14 text-right rounded focus:outline-blue-500"
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
                                    step="0.25"
                                    min="0"
                                    max="11.75"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Water Tanks */}
                  {showWater && (
                    <div className="bg-blue-50 p-2 rounded">
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
                                className="border p-1 w-16 text-right rounded focus:outline-blue-500"
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
                                className="border p-1 w-16 text-right rounded focus:outline-blue-500"
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
                            className="border p-1 w-16 text-right rounded focus:outline-blue-500"
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

                      <div className="flex items-center gap-2 text-xs p-2 bg-white rounded shadow-sm mt-2">
                        <label className="text-gray-500">
                          {manualWaterLabel}:
                        </label>
                        <input
                          type="number"
                          className="border p-1 w-16 text-right rounded focus:outline-blue-500"
                          value={manualWater}
                          onChange={(e) =>
                            setManualWater(parseFloat(e.target.value || "0"))
                          }
                        />
                        <small>{manualWaterLabel2}</small>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT Quadrant: Gas / Pressures */}
                <div className="bg-green-50 p-2 rounded-lg">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">
                    Gas / Pressures
                  </h4>
                  {hasGasMeter && (
                    <div className="flex items-center gap-1 text-xs p-2 bg-white rounded shadow-sm mb-2">
                      <label className="text-gray-500">Gas Meter:</label>
                      <input
                        type="number"
                        className="border p-1 w-16 text-right rounded focus:outline-blue-500"
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
                      <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded shadow-sm">
                        <label className="text-gray-500">MCF:</label>
                        <input
                          type="number"
                          className="border p-1 w-16 text-right rounded focus:outline-blue-500"
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
                              className="border p-1 w-16 text-right rounded focus:outline-blue-500"
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
                              className="border p-1 w-16 text-right rounded focus:outline-blue-500"
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
                      <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded shadow-sm">
                        <label className="text-gray-500">Static:</label>
                        <input
                          type="number"
                          className="border p-1 w-16 text-right rounded focus:outline-blue-500"
                          value={staticPressure}
                          onChange={(e) =>
                            setStaticPressure(parseFloat(e.target.value || "0"))
                          }
                        />
                        <label className="text-gray-500">Diff:</label>
                        <input
                          type="number"
                          className="border p-1 w-16 text-right rounded focus:outline-blue-500"
                          value={diffPressure}
                          onChange={(e) =>
                            setDiffPressure(parseFloat(e.target.value || "0"))
                          }
                        />
                        <label className="text-gray-500">Flow:</label>
                        <input
                          type="number"
                          className="border p-1 w-16 text-right rounded focus:outline-blue-500"
                          value={flowRate}
                          onChange={(e) =>
                            setFlowRate(parseFloat(e.target.value || "0"))
                          }
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded shadow-sm">
                        <label className="text-gray-500">Choke:</label>
                        <input
                          type="number"
                          className="border p-1 w-16 text-right rounded focus:outline-blue-500"
                          value={choke}
                          onChange={(e) =>
                            setChoke(parseFloat(e.target.value || "0"))
                          }
                        />
                        <label className="text-gray-500">Hrs On:</label>
                        <input
                          type="number"
                          className="border p-1 w-16 text-right rounded focus:outline-blue-500"
                          value={hoursOn}
                          onChange={(e) =>
                            setHoursOn(parseFloat(e.target.value || "0"))
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded shadow-sm">
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

                  {/* POC / Time / Tbg/Csg */}
                  <div className="bg-white p-2 text-xs mt-4 rounded shadow-sm space-y-2">
                    {use24 && (
                      <div className="flex items-center gap-2">
                        <label className="w-16 text-gray-500">GaugeTime</label>
                        <input
                          type="time"
                          className="border p-1 w-24 text-xs rounded focus:outline-blue-500"
                          value={gaugeTime}
                          onChange={(e) => setGaugeTime(e.target.value)}
                        />
                      </div>
                    )}
                    {showPOC && (
                      <div className="flex items-center gap-2">
                        <label className="w-16 text-gray-500">POC %</label>
                        <input
                          type="number"
                          className="border p-1 w-16 text-right rounded focus:outline-blue-500"
                          min="0"
                          max="100"
                          value={pocRunTime}
                          onChange={(e) =>
                            setPocRunTime(parseFloat(e.target.value || "0"))
                          }
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <label className="w-16 text-gray-500">Tbg psi</label>
                      <input
                        type="number"
                        className="border p-1 w-16 text-right rounded focus:outline-blue-500"
                        value={tbgPressure}
                        onChange={(e) =>
                          setTbgPressure(parseFloat(e.target.value || "0"))
                        }
                      />
                      <label className="w-16 text-gray-500">Csg psi</label>
                      <input
                        type="number"
                        className="border p-1 w-16 text-right rounded focus:outline-blue-500"
                        value={csgPressure}
                        onChange={(e) =>
                          setCsgPressure(parseFloat(e.target.value || "0"))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* NOTES (full width row) */}
                <div className="bg-white border p-3 rounded text-xs col-span-1 md:col-span-2 space-y-2 shadow-sm">
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
              </div>

              {/* Wells Section + Submit at the Bottom */}
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

              {/* Submit + Timestamp */}
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

          {/* Right Column: Summaries, Tickets, Images */}
          <div className="md:w-5/12 flex flex-col gap-4">
            {/* Summaries */}
            {(showOil || showWater || hasGasMeter) && (
              <div className="bg-white border p-3 rounded-lg text-sm shadow-sm">
                <h4 className="text-center font-semibold text-gray-700 mb-2">
                  Production Summaries
                </h4>
                {showOil && (
                  <>
                    <div className="flex justify-between bg-orange-50 p-2 text-xs rounded">
                      <label className="font-medium">Oil Produced</label>
                      <div>
                        <span className="mr-2">
                          {inchesProduced.toFixed(2)} in
                        </span>
                        {oilProduced.toFixed(2)} bbls
                      </div>
                    </div>
                    <div className="flex justify-between bg-orange-50 p-2 text-xs rounded mt-1">
                      <label className="font-medium">Oil Sold</label>
                      <div>{soldOil.toFixed(2)} bbls</div>
                    </div>
                    {showBSW && (
                      <div className="flex justify-between bg-orange-100 p-2 text-xs rounded mt-1">
                        <label className="font-medium">BS&W</label>
                        <div>{drawBbls.toFixed(2)} bbls</div>
                      </div>
                    )}
                    <div className="flex justify-between bg-orange-50 p-2 text-xs rounded mt-1">
                      <label className="font-medium">On Hand</label>
                      <div>{oilOnHand.toFixed(2)} bbls</div>
                    </div>
                    {useColorCut && (
                      <div className="flex justify-between bg-orange-100 p-2 text-xs rounded mt-1">
                        <label className="font-medium">ColorCut OnHand</label>
                        <div>{colorCutOnHand.toFixed(2)} bbls</div>
                      </div>
                    )}
                  </>
                )}

                {hasGasMeter && (
                  <div className="flex justify-between bg-green-50 p-2 text-xs rounded mt-2">
                    <label className="font-medium">Gas Metered</label>
                    <div>{meteredGas.toFixed(0)} mcf</div>
                  </div>
                )}
                {showWater && (
                  <>
                    {hasWaterMeter && (
                      <div className="flex justify-between bg-blue-50 p-2 text-xs rounded mt-2">
                        <label className="font-medium">Water Metered</label>
                        <div>{meteredWater.toFixed(0)} bbls</div>
                      </div>
                    )}
                    <div className="flex justify-between bg-blue-100 p-2 text-xs rounded mt-1">
                      <label className="font-medium">{manualWaterLabel}</label>
                      <div>{manualWater} bbls</div>
                    </div>
                    {showWaterTanks && (
                      <div className="flex justify-between bg-blue-50 p-2 text-xs rounded mt-1">
                        <label className="font-medium">Water Produced</label>
                        <div>
                          {waterInchesProduced.toFixed(2)} in /{" "}
                          {waterProduced.toFixed(2)} bbls
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between bg-blue-50 p-2 text-xs rounded mt-1">
                      <label className="font-medium">Water Hauled</label>
                      <div>{waterHauledBbls.toFixed(0)} bbls</div>
                    </div>
                    {showWaterTanks && (
                      <div className="flex justify-between bg-blue-100 p-2 text-xs rounded mt-1">
                        <label className="font-medium">Water On Hand</label>
                        <div>{waterOnHand.toFixed(2)} bbls</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Images with FA icon */}
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

            {(showOil || showLACT) && renderRunTicketsTable(runTickets, false)}
            {showWater && renderRunTicketsTable(runTickets, true)}
          </div>
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
    </div>
  );
}

export default GaugeEntryPage;
