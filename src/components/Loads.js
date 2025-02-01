import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { baseUrl } from "./config.js";
import { useUser } from "./UserContext";

function PurchaserLoadsPage() {
  // 1) Grab search params (leaseid & include)
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // If "leaseid" is present, we filter to that
  const paramLeaseID = searchParams.get("leaseid") || "";
  // If "include" is "N", we exclude "Picked Up"/"Rejected"
  const paramInclude = searchParams.get("include") || "Y"; // default "Y"

  // 2) Local states for data
  const [loadsData, setLoadsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 3) Pull companyName from context
  const { companyName } = useUser();

  // 4) Fetch from clientDetails.php, extract purchaserloads
  useEffect(() => {
    if (!companyName) return;
    setLoading(true);

    fetch(`${baseUrl}/api/clientDetails.php?company=${companyName}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const firstRecord = data[0];
          // The array of loads
          const { purchaserloads = [] } = firstRecord;
          setLoadsData(purchaserloads);
        }
      })
      .catch((err) => console.error("Error fetching client details:", err))
      .finally(() => {
        setLoading(false);
      });
  }, [companyName]);

  // 5) Handler to toggle “Include Picked Up/Rejected” loads
  const handleToggleIncludePickedUp = () => {
    const newInclude = paramInclude === "Y" ? "N" : "Y";
    // We update search params so it triggers re-render & filtering
    const newParams = new URLSearchParams(searchParams);
    newParams.set("include", newInclude);
    setSearchParams(newParams);
  };

  // 6) Filter data in-memory based on the params:
  //    (1) If leaseid is given, only show that lease
  //    (2) If include="N", exclude "Picked Up" or "Rejected"
  const filteredData = loadsData.filter((row) => {
    // Filter by LeaseID if provided
    if (paramLeaseID && row.PurchaserLeaseID !== paramLeaseID) {
      return false;
    }
    // Filter by "Picked Up" / "Rejected" if paramInclude = "N"
    if (
      paramInclude === "N" &&
      (row.LoadStatus === "Picked Up" || row.LoadStatus === "Rejected")
    ) {
      return false;
    }
    return true;
  });

  // 7) Render
  return (
    <div className="min-h-screen bg-gradient-to-t from-gray-200 via-gray-100 to-white text-gray-900">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white shadow flex justify-between items-center px-4 py-2 z-10">
        <div className="flex items-end">
          <h3 className="font-extrabold text-2xl tracking-tight text-gray-800">
            Purchaser Loads
          </h3>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-2xl text-gray-500 hover:text-red-600 transition-colors duration-300"
          title="Go Back"
        >
          <i className="fa fa-arrow-left" aria-hidden="true"></i>
        </button>
      </nav>

      {/* Page Content */}
      <div className="pt-12 px-2 md:px-4 lg:px-8 pb-8">
        {/* Header row */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-2">
          {/* Toggle */}
          <div className="flex items-center gap-2 bg-white p-3 rounded shadow">
            <input
              type="checkbox"
              id="togglePickedUp"
              checked={paramInclude === "Y"}
              onChange={handleToggleIncludePickedUp}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
            />
            <label
              htmlFor="togglePickedUp"
              className="text-sm text-gray-700 font-medium cursor-pointer"
            >
              Include Picked Up/Rejected Loads
            </label>
          </div>

          {/* Filter label */}
          <div className="text-right text-sm text-gray-600 italic">
            {paramLeaseID
              ? `Filtered to ${paramLeaseID}`
              : "Showing all leases"}
          </div>
        </div>

        {/* Table container */}
        <div className="bg-white rounded shadow">
          {loading ? (
            <p className="p-4 text-sm">Loading data…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto w-full border-collapse text-sm">
                <thead className="bg-gray-200 text-gray-700">
                  <tr>
                    <th className="py-2 px-3 text-left">Lease</th>
                    <th className="py-2 px-3 text-left">Tank</th>
                    <th className="py-2 px-3 text-left">Load Number</th>
                    <th className="py-2 px-3 text-left">Status</th>
                    <th className="py-2 px-3 text-left">Load Date/Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 px-3 text-center text-gray-500"
                      >
                        No loads found.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-2 px-3">
                          {row.PurchaserLeaseID} - {row.PurchaserLeaseName}
                        </td>
                        <td className="py-2 px-3">{row.PurchaserTankNum}</td>
                        <td className="py-2 px-3">{row.LoadNumber}</td>
                        <td className="py-2 px-3">{row.LoadStatus}</td>
                        <td className="py-2 px-3">{row.LoadDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PurchaserLoadsPage;
