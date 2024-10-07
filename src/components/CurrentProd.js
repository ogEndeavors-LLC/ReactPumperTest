import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import ReactDOM from "react-dom";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faSearch,
  faFileExport,
  faPrint,
  faArrowLeft,
  faArrowRight,
  faChartLine,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import sampleImage from "../assets/logo.jpg";
import moment from "moment";
import { useTheme } from "./ThemeContext";
import { baseUrl } from "./config.js";
import Header from "./GridHeader"; // Import the Header component
import GridLoader from "./GridLoader";

const CurrentDataGrid = () => {
  const { theme = "light" } = useTheme() || {};
  const isDarkMode = theme === "dark";
  const [rowData, setRowData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [totalRow, setTotalRow] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tagOptions, setTagOptions] = useState([]);

  // **Parse URL parameters**
  const params = new URLSearchParams(window.location.search);
  const initialTag = params.get("Tag") || "";
  const initialGaugeDate =
    params.get("GaugeDate") || moment().format("YYYY-MM-DD");
  const initialType = params.get("Type") || "";

  // **Initialize state variables with URL parameters**
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [currentDate, setCurrentDate] = useState(initialGaugeDate);
  const [wellType, setWellType] = useState(initialType);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [showPriorDay, setShowPriorDay] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // **Modify the API call to include URL parameters**
      let apiUrl = `${baseUrl}/service_testcurrent.php`;
      const apiParams = new URLSearchParams();
      if (selectedTag) apiParams.append("Tag", selectedTag);
      if (currentDate) apiParams.append("GaugeDate", currentDate);
      if (wellType) apiParams.append("Type", wellType);

      if (apiParams.toString()) {
        apiUrl += `?${apiParams.toString()}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      // **Sample entry for testing**
      const sampleEntry = {
        PrintLeaseName: "Sample",
        PrintPumperID: "PUMP001",
        PrintLeaseID: "LEASE001",
        Purchaser: "Sample Oil Co.",
        ReportOrder: 1,
        RRC: "12345",
        PropertyNum: "PROP001",
        UIC: "UIC001",
        Target: 100,
        GaugeDate: new Date().toISOString().split("T")[0],
        GaugeTime: "08:00:00",
        Produced: "75.50",
        RunBbls: "50.20",
        DrawBbls: "25.30",
        WaterTotal: "10.50",
        WaterInjectedTotal: "5.20",
        Gas: "1000.00",
        OnHand: "150.80",
        csg: "500.00",
        tbg: "300.00",
        PriorCsg: "500.00",
        PriorTbg: "300.00",
        FlowLinePressure: "200.00",
        McfAccum: "5000.00",
        HoursOn: "22.00",
        WaterMeter: "1000.00",
        MeterReset: "0",
        InitialGauge: "1",
        SPCC: "Yes",
        gaugecomments: "This is a test comment.",
        ImageCount: 3,
        imageUrl: sampleImage,
        PriorProduced: "70.00",
        PriorGas: "950.00",
        PriorWaterTotal: "9.50",
        PriorWaterInjectedTotal: "4.80",
        WaterHauledBbls: "8.00",
      };

      // **Convert numeric strings to fixed decimals**
      Object.keys(sampleEntry).forEach((key) => {
        if (!isNaN(sampleEntry[key])) {
          sampleEntry[key] = parseFloat(sampleEntry[key]).toFixed(2);
        }
      });

      const updatedData = [sampleEntry, ...data];
      setRowData(updatedData);
      setFilteredData(updatedData);
      calculateTotal(updatedData);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const calculateTotal = (data) => {
    const totals = data.reduce(
      (acc, curr) => {
        return {
          Produced:
            acc.Produced + (curr.Produced ? parseFloat(curr.Produced) : 0),
          Gas: acc.Gas + (curr.Gas ? parseFloat(curr.Gas) : 0),
          WaterTotal:
            acc.WaterTotal +
            (curr.WaterTotal ? parseFloat(curr.WaterTotal) : 0),
          WaterInjectedTotal:
            acc.WaterInjectedTotal +
            (curr.WaterInjectedTotal ? parseFloat(curr.WaterInjectedTotal) : 0),
          PriorProduced:
            acc.PriorProduced +
            (curr.PriorProduced ? parseFloat(curr.PriorProduced) : 0),
          PriorGas:
            acc.PriorGas + (curr.PriorGas ? parseFloat(curr.PriorGas) : 0),
          PriorWaterTotal:
            acc.PriorWaterTotal +
            (curr.PriorWaterTotal ? parseFloat(curr.PriorWaterTotal) : 0),
          PriorWaterInjectedTotal:
            acc.PriorWaterInjectedTotal +
            (curr.PriorWaterInjectedTotal
              ? parseFloat(curr.PriorWaterInjectedTotal)
              : 0),
          OnHand: acc.OnHand + (curr.OnHand ? parseFloat(curr.OnHand) : 0),
          RunBbls: acc.RunBbls + (curr.RunBbls ? parseFloat(curr.RunBbls) : 0),
          WaterHauledBbls:
            acc.WaterHauledBbls +
            (curr.WaterHauledBbls ? parseFloat(curr.WaterHauledBbls) : 0),
          DrawBbls:
            acc.DrawBbls + (curr.DrawBbls ? parseFloat(curr.DrawBbls) : 0),
          tbg:
            wellType === "I"
              ? acc.tbg + (curr.tbg ? parseFloat(curr.tbg) : 0)
              : null,
          csg:
            wellType === "I"
              ? acc.csg + (curr.csg ? parseFloat(curr.csg) : 0)
              : null,
          PriorTbg:
            wellType === "I"
              ? acc.PriorTbg + (curr.PriorTbg ? parseFloat(curr.PriorTbg) : 0)
              : null,
          PriorCsg:
            wellType === "I"
              ? acc.PriorCsg + (curr.PriorCsg ? parseFloat(curr.PriorCsg) : 0)
              : null,
        };
      },
      {
        Produced: 0,
        Gas: 0,
        WaterTotal: 0,
        WaterInjectedTotal: 0,
        PriorProduced: 0,
        PriorGas: 0,
        PriorWaterTotal: 0,
        PriorWaterInjectedTotal: 0,
        OnHand: 0,
        RunBbls: 0,
        WaterHauledBbls: 0,
        DrawBbls: 0,
        tbg: 0,
        csg: 0,
        PriorTbg: 0,
        PriorCsg: 0,
      }
    );

    totals.PrintLeaseName = "Totals"; // Change this line to set ':Total' for the Location column

    // Convert totals to fixed decimals
    Object.keys(totals).forEach((key) => {
      if (totals[key] !== null && !isNaN(totals[key])) {
        totals[key] = parseFloat(totals[key]).toFixed(2);
      } else if (key !== "PrintLeaseName") {
        totals[key] = ""; // Set to empty string for display
      }
    });

    setTotalRow(totals);
  };
  const fetchOptions = async () => {
    try {
      let apiUrl = `${baseUrl}/api/usertags.php`;

      const response = await fetch(apiUrl);
      const data = await response.json();
      const tags = data.filter((item) => item.TagID && item.TagDesc);

      setTagOptions(tags);

      console.log(tagOptions);
      console.log(tags);
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  const ImageCellRenderer = (params) => {
    if (params.data.ImageCount > 0) {
      return (
        <span
          onClick={() => showImageModal(params.data.imageUrl)}
          style={{
            cursor: "pointer",
            color: isDarkMode ? "#FFD700" : "#1890ff",
            textDecoration: "none",
          }}
        >
          <FontAwesomeIcon icon={faImage} />
        </span>
      );
    }
    return null;
  };

  // **Refetch data whenever selectedTag, currentDate, or wellType changes**
  useEffect(() => {
    fetchData();
    fetchOptions();
  }, [selectedTag, currentDate, wellType]);

  useEffect(() => {
    const filtered = filterData(rowData);
    setFilteredData(filtered);
    calculateTotal(filtered);
  }, [searchText, rowData]);

  const filterData = (data) => {
    return data.filter(
      (item) =>
        item.PrintLeaseName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.PrintLeaseID.toLowerCase().includes(searchText.toLowerCase()) ||
        item.PrintPumperID.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const showImageModal = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImageUrl(null);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleTagChange = (e) => {
    setSelectedTag(e.target.value);
  };

  const handleDateChange = (e) => {
    setCurrentDate(e.target.value);
  };

  const handleDateNavigate = (direction) => {
    const newDate = moment(currentDate, "YYYY-MM-DD")
      .add(direction, "days")
      .format("YYYY-MM-DD");
    setCurrentDate(newDate);
  };
  const handleChartClick = (leaseName) => {
    // Use the current selected date instead of the current month
    const selectedDate = moment(currentDate).format("YYYY-MM-DD");
    // Redirect to the chart page with LeaseID and selected date as parameters
    window.location.href = `/charts?LeaseID=${leaseName}&Date=${selectedDate}`;
  };

  const toggleShowPriorDay = () => {
    setShowPriorDay(!showPriorDay);
  };

  const handleWellTypeChange = (e) => {
    setWellType(e.target.value);
  };

  const columnDefs = useMemo(() => {
    const allColumns = [
      // **Location**
      {
        headerName: "Location",
        field: "PrintLeaseName",
        sortable: true,
        filter: true,
        pinned: "left",
        width: 150,
        cellStyle: (params) => ({
          backgroundColor:
            params.node.rowIndex % 2 === 0
              ? isDarkMode
                ? "#303030"
                : "#FFFFFF"
              : isDarkMode
              ? "#424242"
              : "#F0F0F0",
          color: isDarkMode ? "#FFFFFF" : "#000000",
          fontWeight: "bold",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
        }),
        headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
      },
      // **Include prior day columns conditionally**
      ...(showPriorDay
        ? [
            // **Prior Oil**
            {
              headerName: `${moment(currentDate)
                .subtract(1, "days")
                .format("MM/DD")} Prior Oil`,
              field: "PriorProduced",
              sortable: true,
              filter: true,
              width: 120,
              cellStyle: {
                backgroundColor: isDarkMode ? "#424242" : "#D3D3D3",
                color: isDarkMode ? "#FFFFFF" : "#000000",
                fontWeight: "500",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                textAlign: "right",
              },
              headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
              valueFormatter: (params) =>
                params.value !== null
                  ? parseFloat(params.value).toFixed(2)
                  : "0.00",
            },
            // **Prior Gas**
            {
              headerName: "Prior Gas",
              field: "PriorGas",
              sortable: true,
              filter: true,
              width: 100,
              cellStyle: {
                backgroundColor: isDarkMode ? "#424242" : "#FFFFE0",
                color: isDarkMode ? "#FFFFFF" : "#000000",
                fontWeight: "500",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                textAlign: "right",
              },
              headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
              valueFormatter: (params) =>
                params.value !== null
                  ? parseFloat(params.value).toFixed(2)
                  : "0.00",
            },
            // **Prior Water**
            {
              headerName: "Prior Water",
              field: "PriorWaterTotal",
              sortable: true,
              filter: true,
              width: 120,
              cellStyle: {
                backgroundColor: isDarkMode ? "#424242" : "#ADD8E6",
                color: isDarkMode ? "#FFFFFF" : "#000000",
                fontWeight: "500",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                textAlign: "right",
              },
              headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
              valueFormatter: (params) =>
                params.value !== null
                  ? parseFloat(params.value).toFixed(2)
                  : "0.00",
            },
            // **Prior Injected**
            {
              headerName: "Prior Injected",
              field: "PriorWaterInjectedTotal",
              sortable: true,
              filter: true,
              width: 120,
              cellStyle: {
                backgroundColor: isDarkMode ? "#424242" : "#E6E6FA",
                color: isDarkMode ? "#FFFFFF" : "#000000",
                fontWeight: "500",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                textAlign: "right",
              },
              headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
              valueFormatter: (params) =>
                params.value !== null
                  ? parseFloat(params.value).toFixed(2)
                  : "0.00",
            },
            // **Prior TBG**
            {
              headerName: "Prior TBG",
              field: "PriorTbg",
              sortable: true,
              filter: true,
              width: 100,
              cellStyle: {
                backgroundColor: isDarkMode ? "#424242" : "#FFFFFF", // White for light mode, darker color for dark mode
                color: isDarkMode ? "#FFFFFF" : "#000000", // Text color for dark mode and light mode
                opacity: 0.6,
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                textAlign: "right",
              },
              headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
              valueFormatter: (params) =>
                params.value !== null
                  ? parseFloat(params.value).toFixed(2)
                  : "0.00",
            },
            // **Prior CSG**
            {
              headerName: "Prior CSG",
              field: "PriorCsg",
              sortable: true,
              filter: true,
              width: 100,
              cellStyle: {
                backgroundColor: isDarkMode ? "#424242" : "#FFFFFF", // White for light mode, darker color for dark mode
                color: isDarkMode ? "#FFFFFF" : "#000000", // Text color for dark mode and light mode
                opacity: 0.6,
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                textAlign: "right",
              },
              headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
              valueFormatter: (params) =>
                params.value !== null
                  ? parseFloat(params.value).toFixed(2)
                  : "0.00",
            },
          ]
        : []),
      // **Current Oil**
      {
        headerName: `${moment(currentDate).format("MM/DD")} Current Oil`,
        field: "Produced",
        sortable: true,
        filter: true,
        width: 120,
        cellStyle: {
          backgroundColor: isDarkMode ? "#424242" : "#D3D3D3",
          color: isDarkMode ? "#FFFFFF" : "#000000",
          fontWeight: "500",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
          textAlign: "right",
        },
        headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
        valueFormatter: (params) =>
          params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      // **Gas**
      {
        headerName: "Gas",
        field: "Gas",
        sortable: true,
        filter: true,
        width: 100,
        cellStyle: {
          backgroundColor: isDarkMode ? "#424242" : "#FFFFE0",
          color: isDarkMode ? "#FFFFFF" : "#000000",
          fontWeight: "500",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
          textAlign: "right",
        },
        headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
        valueFormatter: (params) =>
          params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      // **Water**
      {
        headerName: "Water",
        field: "WaterTotal",
        sortable: true,
        filter: true,
        width: 120,
        cellStyle: {
          backgroundColor: isDarkMode ? "#424242" : "#ADD8E6",
          color: isDarkMode ? "#FFFFFF" : "#000000",
          fontWeight: "500",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
          textAlign: "right",
        },
        headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
        valueFormatter: (params) =>
          params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      // **Injected**
      {
        headerName: "Injected",
        field: "WaterInjectedTotal",
        sortable: true,
        filter: true,
        width: 120,
        cellStyle: {
          backgroundColor: isDarkMode ? "#424242" : "#E6E6FA",
          color: isDarkMode ? "#FFFFFF" : "#000000",
          fontWeight: "500",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
          textAlign: "right",
        },
        headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
        valueFormatter: (params) =>
          params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      // **TBG** (Tubing Pressure)
      {
        headerName: "TBG",
        field: "tbg",
        sortable: true,
        filter: true,
        width: 100,
        cellStyle: {
          backgroundColor: isDarkMode ? "#424242" : "#FFFFFF", // White for light mode, darker color for dark mode
          color: isDarkMode ? "#FFFFFF" : "#000000", // Text color for dark mode and light mode
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
          textAlign: "right",
        },
        headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
        valueFormatter: (params) =>
          params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      // **CSG** (Casing Pressure)
      {
        headerName: "CSG",
        field: "csg",
        sortable: true,
        filter: true,
        width: 100,
        cellStyle: {
          backgroundColor: isDarkMode ? "#424242" : "#FFFFFF", // White for light mode, darker color for dark mode
          color: isDarkMode ? "#FFFFFF" : "#000000", // Text color for dark mode and light mode
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
          textAlign: "right",
        },
        headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
        valueFormatter: (params) =>
          params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      },
      // **Comment**
      {
        headerName: "Comment",
        field: "gaugecomments",
        sortable: true,
        filter: true,
        minWidth: 150,
        cellStyle: (params) => ({
          backgroundColor:
            params.node.rowIndex % 2 === 0
              ? isDarkMode
                ? "#303030"
                : "#FFFFFF"
              : isDarkMode
              ? "#424242"
              : "#F0F0F0",
          color: isDarkMode ? "#FFFFFF" : "#000000",
          fontStyle: "italic",
          whiteSpace: "normal",
          lineHeight: "20px",
        }),
        autoHeight: true,
        headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
      },
      // **Images**
      {
        headerName: "Images",
        field: "ImageCount",
        sortable: false,
        filter: false,
        width: 100,
        cellRenderer: "imageCellRenderer",
        cellStyle: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDarkMode ? "#424242" : "#F5F5F5",
          color: isDarkMode ? "#FFFFFF" : "#000000",
          whiteSpace: "nowrap",
          overflow: "hidden",
        },
        headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
      },
      // **Lease ID**
      {
        headerName: "Lease ID",
        field: "PrintLeaseID",
        sortable: true,
        filter: true,
        width: 100,
        cellStyle: (params) => ({
          backgroundColor:
            params.node.rowIndex % 2 === 0
              ? isDarkMode
                ? "#303030"
                : "#FFFFFF"
              : isDarkMode
              ? "#424242"
              : "#F0F0F0",
          color: isDarkMode ? "#FFFFFF" : "#000000",
          fontWeight: "500",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
          textAlign: "right",
        }),
        headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
      },
      // **Pumper ID**
      {
        headerName: "Pumper ID",
        field: "PrintPumperID",
        sortable: true,
        filter: true,
        width: 100,
        cellStyle: (params) => ({
          backgroundColor:
            params.node.rowIndex % 2 === 0
              ? isDarkMode
                ? "#303030"
                : "#FFFFFF"
              : isDarkMode
              ? "#424242"
              : "#F0F0F0",
          color: isDarkMode ? "#FFFFFF" : "#000000",
          fontWeight: "500",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
          textAlign: "right",
        }),
        headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
      },
      // **Chart Button**
      {
        headerName: "Chart",
        field: "PrintLeaseID",
        sortable: false,
        filter: false,
        width: 100,
        cellRenderer: (params) => (
          <button
            onClick={() => handleChartClick(params.value)}
            className={`chart-button ${
              isDarkMode ? "dark" : "light"
            } px-2 py-1 rounded cursor-pointer`}
          >
            <FontAwesomeIcon icon={faChartLine} /> View Chart
          </button>
        ),
        cellStyle: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      },
    ];

    let columns = [...allColumns];

    // **Adjust columns based on wellType**
    if (wellType === "P") {
      // **Production Only:** Exclude 'Injected', 'Prior Injected', and pressure columns
      columns = columns.filter(
        (col) =>
          ![
            "WaterInjectedTotal",
            "PriorWaterInjectedTotal",
            "tbg",
            "csg",
            "PriorTbg",
            "PriorCsg",
          ].includes(col.field)
      );
    } else if (wellType === "I") {
      // **Injection Only:** Include only injection-related columns
      columns = columns.filter((col) =>
        [
          "PrintLeaseName",
          "PrintLeaseID",
          "PrintPumperID",
          "WaterInjectedTotal",
          "PriorWaterInjectedTotal",
          "tbg",
          "csg",
          "PriorTbg",
          "PriorCsg",
          "ImageCount",
          "gaugecomments",
        ].includes(col.field)
      );
    } else {
      // **Show All:** Exclude 'tbg', 'csg', 'PriorTbg', 'PriorCsg' columns
      columns = columns.filter(
        (col) => !["tbg", "csg", "PriorTbg", "PriorCsg"].includes(col.field)
      );
    }

    return columns;
  }, [wellType, showPriorDay, isDarkMode, currentDate]);
  const handleExport = () => {
    const csvRows = [];
    const headers = columnDefs.map((col) => col.headerName);
    csvRows.push(headers.join(","));

    filteredData.forEach((row) => {
      const values = columnDefs.map((col) => {
        let cellValue = row[col.field];

        // Handle the ImageCount column with HYPERLINK function
        if (col.field === "ImageCount" && row.ImageCount > 0 && row.imageUrl) {
          const fullImageUrl = `${baseUrl}/${row.imageUrl}`;

          // Escape double quotes in the URL
          const escapedUrl = fullImageUrl.replace(/"/g, '""');
          const hyperlinkFormula = `=HYPERLINK("${escapedUrl}", "View Image")`;

          // Wrap the entire formula in double quotes and escape any inner double quotes
          return `"${hyperlinkFormula.replace(/"/g, '""')}"`;
        }

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
    link.download = `export_${currentDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const formatValue = (value) => {
    return value !== null && value !== undefined
      ? parseFloat(value).toFixed(2)
      : "0.00";
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    // **Exclude the "Chart" column when printing**
    const printColumns = columnDefs.filter((col) => col.headerName !== "Chart");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Current Data Report</title>
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
          <h1>Current Production</h1>
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
              ${[totalRow, ...filteredData]
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

  return (
    <div
      className={`ag-theme-alpine ${isDarkMode ? "dark" : ""}`}
      style={{
        padding: "20px",
        background: isDarkMode ? "#1E1E1E" : "#f0f2f5",
        borderRadius: "10px",
        marginBottom: "30px",
        color: isDarkMode ? "#E0E0E0" : "#000000",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header
        isDarkMode={isDarkMode}
        currentDate={currentDate}
        handleDateChange={handleDateChange}
        handleDateNavigate={handleDateNavigate}
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        selectedTag={selectedTag}
        handleTagChange={handleTagChange}
        tagOptions={tagOptions}
        wellType={wellType}
        handleWellTypeChange={handleWellTypeChange}
        showPriorDay={showPriorDay}
        toggleShowPriorDay={toggleShowPriorDay}
        handleExport={handleExport}
        handlePrint={handlePrint}
      />

      {loading ? (
        <GridLoader isDarkMode={isDarkMode} rows={50} columns={10} />
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div
          style={{
            height: "1100px",
            overflow: "auto",
          }}
        >
          <AgGridReact
            rowData={[totalRow, ...filteredData]}
            columnDefs={columnDefs}
            rowSelection="multiple"
            animateRows={true}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
              flex: 1,
              minWidth: 100,
              wrapHeaderText: true,
              autoHeaderHeight: true,
            }}
            pagination={true}
            paginationPageSize={100}
            domLayout="normal"
            getRowHeight={() => "auto"}
            getRowStyle={(params) =>
              params.node.rowIndex === 0
                ? {
                    fontWeight: "900", // Increased from 'bold' to '900' for maximum boldness
                    backgroundColor: isDarkMode ? "#2e7d32" : "#e8f5e9",
                    color: isDarkMode ? "#FFFFFF" : "#000000",
                    fontSize: "1.2em", // Slightly increased from 1.1em to 1.2em
                    borderBottom: "2px solid #000", // Increased from 2px to 3px for more emphasis
                  }
                : {}
            }
            components={{
              imageCellRenderer: ImageCellRenderer,
            }}
            headerHeight={null}
          />{" "}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Image Zoom Modal"
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: isDarkMode ? "#424242" : "#ffffff",
            color: isDarkMode ? "#FFFFFF" : "#000000",
          },
        }}
      >
        {selectedImageUrl && (
          <img
            src={selectedImageUrl}
            alt="Selected"
            style={{ maxWidth: "100%" }}
          />
        )}
        <button
          onClick={closeModal}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: isDarkMode ? "#303030" : "#f0f0f0",
            color: isDarkMode ? "#FFFFFF" : "#000000",
            border: isDarkMode ? "none" : "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </Modal>
    </div>
  );
};

export default CurrentDataGrid;
