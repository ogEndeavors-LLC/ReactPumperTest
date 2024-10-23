import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExport, faPrint } from "@fortawesome/free-solid-svg-icons";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { baseUrl } from "./config"; // Adjust to your config path
import { useTheme } from "./ThemeContext"; // Assuming you have theme context
import Header from "./GridHeader"; // Import the Header component
import GridLoader from "./GridLoader";

const InventoryByLease = () => {
  const { theme = "light" } = useTheme() || {};
  const isDarkMode = theme === "dark";
  const [rowData, setRowData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [tag, setTag] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      let apiUrl = `${baseUrl}/service_inv.php`; // Adjust to your actual API
      const params = new URLSearchParams();
      if (tag !== "All") params.append("Tag", tag);

      const response = await fetch(`${apiUrl}?${params.toString()}`);
      const data = await response.json();
      const filtered = filterData(data);
      setRowData(filtered);
      setFilteredData(filtered);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      let apiUrl = `${baseUrl}/api/usertags.php`; // Replace with your actual tag API
      const response = await fetch(apiUrl);
      const data = await response.json();
      const tags = data.filter((item) => item.TagID && item.TagDesc);
      setTagOptions(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const filterData = (data) => {
    return data.filter(
      (item) =>
        item.LeaseName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.PumperId.toLowerCase().includes(searchText.toLowerCase()) ||
        item.LeaseID.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, [tag]);

  useEffect(() => {
    const filtered = filterData(rowData);
    setFilteredData(filtered);
  }, [searchText, rowData]);

  const handleTagChange = (e) => setTag(e.target.value);
  const handleSearchChange = (e) => setSearchText(e.target.value);

  const handleExport = () => {
    const csvRows = [];
    const headers = columnDefs.map((col) => col.headerName);
    csvRows.push(headers.join(","));

    filteredData.forEach((row) => {
      const values = columnDefs.map((col) => {
        let cellValue = row[col.field];

        // Escape and wrap other cell values
        if (cellValue !== null && cellValue !== undefined) {
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
    link.download = `export_${moment(currentDate).format("MM-DD-YYYY")}.csv`; // Use state currentDate
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    // **Exclude the "Chart" column when printing**
    const printColumns = columnDefs.filter((col) => col.headerName !== "Chart");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lease Inventory</title>
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
          </style>
        </head>
        <body>
          <h1>Lease Inventory</h1>
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
              ${[...filteredData]
                .map(
                  (row, index) => `
                  <tr class="${index === 0 ? "total-row" : ""}">
                    ${printColumns
                      .map((col) => {
                        let cellValue = row[col.field];

                        // Apply value formatting if defined
                        if (col.valueFormatter) {
                          cellValue = col.valueFormatter({ value: cellValue });
                        }

                        // Special handling for ImageCount field
                        if (col.field === "ImageCount" && row.ImageCount > 0) {
                          cellValue = "Yes";
                        }

                        return `<td class="${
                          col.cellStyle?.textAlign === "right" ? "number" : ""
                        }">${cellValue || ""}</td>`;
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

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Lease",
        field: "LeaseName",
        sortable: true,
        filter: true,
        pinned: "left",
        flex: 1,
        cellStyle: { textAlign: "left" },
      },
      {
        headerName: "Bbls On Hand",
        field: "OnHand",
        sortable: true,
        filter: true,
        valueFormatter: (params) => parseFloat(params.value).toFixed(2),
        flex: 1,
        cellStyle: {
          backgroundColor: "#A9A9A9",
          textAlign: "right",
        },
      },
      {
        headerName: "Last Gauge Date",
        field: "LastGaugeDate",
        sortable: true,
        filter: true,
        valueFormatter: (params) =>
          params.value ? moment(params.value).format("MM/DD/YYYY") : "",
        flex: 1,
        cellStyle: { textAlign: "center" },
      },
      {
        headerName: "Lease ID",
        field: "LeaseID",
        sortable: true,
        filter: true,
        flex: 1,
        cellStyle: { textAlign: "center" },
      },
      {
        headerName: "Pumper ID",
        field: "PumperId",
        sortable: true,
        filter: true,
        flex: 1,
        cellStyle: { textAlign: "center" },
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" />
      </div>
    );
  }

  return (
    <div
      className={`ag-theme-alpine ${isDarkMode ? "dark" : ""}`}
      style={{
        padding: "20px",
        background: isDarkMode ? "#1E1E1E" : "#f0f2f5",
        borderRadius: "10px",
        minHeight: "100vh", // Adjusted height to accommodate content
        width: "100%",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      <Header
        isDarkMode={isDarkMode}
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        selectedTag={tag}
        handleTagChange={handleTagChange}
        tagOptions={tagOptions}
        handleExport={handleExport}
        handlePrint={handlePrint}
      />
      {loading ? (
        <GridLoader isDarkMode={isDarkMode} rows={50} columns={10} />
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div style={{ height: "calc(100% - 100px)", width: "100%" }}>
          <AgGridReact
            rowData={filteredData}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={100}
            domLayout="autoHeight"
          />
        </div>
      )}
    </div>
  );
};

export default InventoryByLease;
