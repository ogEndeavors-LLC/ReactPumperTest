import React, { useState, useEffect } from "react";
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
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Input, Select, Spin, Alert, Button, Space } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import sampleImage from "../assets/logo.jpg";
import moment from "moment";
import { useTheme } from "./ThemeContext";

const { Option } = Select;

const CurrentDataGrid = () => {
  const { theme } = useTheme();
  const [rowData, setRowData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [totalRow, setTotalRow] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [currentDate, setCurrentDate] = useState(moment().format("MM/DD/YYYY"));
  const [showPriorDay, setShowPriorDay] = useState(true);

  const isDarkMode = theme === "dark";

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://test.ogfieldticket.com/service_testcurrent.php`
      );
      const data = await response.json();

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
        CsgPressure: "500.00",
        TbgPressure: "300.00",
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

      Object.keys(sampleEntry).forEach((key) => {
        if (typeof sampleEntry[key] === "number") {
          sampleEntry[key] = sampleEntry[key].toFixed(2);
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

  const ImageCellRenderer = (params) => {
    if (params.data.ImageCount > 0) {
      return (
        <FontAwesomeIcon
          icon={faImage}
          style={{
            cursor: "pointer",
            color: isDarkMode ? "#FFD700" : "#1890ff",
          }}
          onClick={() => showImageModal(params.data.imageUrl)}
        />
      );
    }
    return null;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = filterData(rowData);
    setFilteredData(filtered);
    calculateTotal(filtered);
  }, [searchText, selectedTag, showPriorDay]);

  const filterData = (data) => {
    return data.filter(
      (item) =>
        (item.PrintLeaseName.toLowerCase().includes(searchText.toLowerCase()) ||
          item.PrintLeaseID.toLowerCase().includes(searchText.toLowerCase()) ||
          item.PrintPumperID.toLowerCase().includes(
            searchText.toLowerCase()
          )) &&
        (selectedTag === "" ||
          item.Tag1 === selectedTag ||
          item.Tag2 === selectedTag ||
          item.Tag3 === selectedTag ||
          item.Tag4 === selectedTag)
    );
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
      }
    );
    setTotalRow(totals);
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

  const handleTagChange = (value) => {
    setSelectedTag(value);
  };

  const handleDateChange = (days) => {
    const newDate = moment(currentDate).add(days, "days").format("MM/DD/YYYY");
    setCurrentDate(newDate);
  };

  const toggleShowPriorDay = () => {
    setShowPriorDay(!showPriorDay);
  };

  const columnDefs = [
    {
      headerName: "Location",
      field: "PrintLeaseName",
      sortable: true,
      filter: true,
      checkboxSelection: true,
      pinned: "left",
      width: 150,
      cellStyle: () => ({
        fontWeight: "bold",
        backgroundColor: isDarkMode ? "#303030" : "#e3f2fd",
        color: isDarkMode ? "#FFFFFF" : "#000000",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
      }),
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
    },
    ...(showPriorDay
      ? [
          {
            headerName: `${moment(currentDate)
              .subtract(1, "days")
              .format("MM/DD")} Oil`,
            field: "PriorProduced",
            sortable: true,
            filter: true,
            width: 120,
            cellStyle: {
              backgroundColor: isDarkMode ? "#424242" : "#f8d7da",
              fontWeight: "500",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
              color: isDarkMode ? "#FFFFFF" : "#000000",
              opacity: 0.6, // Reduced opacity for prior day
            },
            headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
            valueFormatter: (params) =>
              params.value !== null
                ? parseFloat(params.value).toFixed(2)
                : "0.00",
          },
          {
            headerName: "Prior Gas",
            field: "PriorGas",
            sortable: true,
            filter: true,
            width: 100,
            cellStyle: {
              backgroundColor: isDarkMode ? "#424242" : "#fff3cd",
              fontWeight: "500",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
              color: isDarkMode ? "#FFFFFF" : "#000000",
              opacity: 0.6, // Reduced opacity for prior day
            },
            headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
            valueFormatter: (params) =>
              params.value !== null
                ? parseFloat(params.value).toFixed(2)
                : "0.00",
          },
          {
            headerName: "Prior Water",
            field: "PriorWaterTotal",
            sortable: true,
            filter: true,
            width: 120,
            cellStyle: {
              backgroundColor: isDarkMode ? "#424242" : "#d0e9ff",
              fontWeight: "500",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
              color: isDarkMode ? "#FFFFFF" : "#000000",
              opacity: 0.6, // Reduced opacity for prior day
            },
            headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
            valueFormatter: (params) =>
              params.value !== null
                ? parseFloat(params.value).toFixed(2)
                : "0.00",
          },
          {
            headerName: "Prior Injected",
            field: "PriorWaterInjectedTotal",
            sortable: true,
            filter: true,
            width: 120,
            cellStyle: {
              backgroundColor: isDarkMode ? "#424242" : "#d6efd7",
              fontWeight: "500",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
              color: isDarkMode ? "#FFFFFF" : "#000000",
              opacity: 0.6, // Reduced opacity for prior day
            },
            headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
            valueFormatter: (params) =>
              params.value !== null
                ? parseFloat(params.value).toFixed(2)
                : "0.00",
          },
        ]
      : []),
    {
      headerName: `${currentDate} Oil`,
      field: "Produced",
      sortable: true,
      filter: true,
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 120,
      cellStyle: {
        backgroundColor: isDarkMode ? "#5d4037" : "#ffebee",
        fontWeight: "500",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        color: isDarkMode ? "#FFFFFF" : "#000000",
        opacity: 0.9, // Increased opacity for current day
      },
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
    },
    {
      headerName: "Gas",
      field: "Gas",
      sortable: true,
      filter: true,
      width: 100,
      cellStyle: {
        backgroundColor: isDarkMode ? "#424242" : "#fff8e1",
        fontWeight: "500",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        color: isDarkMode ? "#FFFFFF" : "#000000",
        opacity: 0.9, // Increased opacity for current day
      },
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
    },
    {
      headerName: "Water",
      field: "WaterTotal",
      sortable: true,
      filter: true,
      width: 120,
      cellStyle: {
        backgroundColor: isDarkMode ? "#01579b" : "#e1f5fe",
        fontWeight: "500",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        color: isDarkMode ? "#FFFFFF" : "#000000",
        opacity: 0.9, // Increased opacity for current day
      },
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
    },
    {
      headerName: "Injected",
      field: "WaterInjectedTotal",
      sortable: true,
      filter: true,
      width: 120,
      cellStyle: {
        backgroundColor: isDarkMode ? "#00695c" : "#e8f5e9",
        fontWeight: "500",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        color: isDarkMode ? "#FFFFFF" : "#000000",
        opacity: 0.9, // Increased opacity for current day
      },
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
    },
    {
      headerName: "Comment",
      field: "gaugecomments",
      sortable: true,
      filter: true,
      minWidth: 150,
      cellStyle: {
        backgroundColor: isDarkMode ? "#212121" : "#f5f5f5",
        fontStyle: "italic",
        whiteSpace: "normal",
        lineHeight: "20px",
        color: isDarkMode ? "#FFFFFF" : "#000000",
      },
      autoHeight: true,
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
    },
    {
      headerName: "Bbls OH",
      field: "OnHand",
      sortable: true,
      filter: true,
      width: 120,
      cellStyle: {
        backgroundColor: isDarkMode ? "#424242" : "#eceff1",
        fontWeight: "500",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        color: isDarkMode ? "#FFFFFF" : "#000000",
      },
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
    },
    {
      headerName: "Run Bbls",
      field: "RunBbls",
      sortable: true,
      filter: true,
      width: 120,
      cellStyle: {
        backgroundColor: isDarkMode ? "#546e7a" : "#cfd8dc",
        fontWeight: "500",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        color: isDarkMode ? "#FFFFFF" : "#000000",
      },
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
    },
    {
      headerName: "Water Hauled",
      field: "WaterHauledBbls",
      sortable: true,
      filter: true,
      width: 120,
      cellStyle: {
        backgroundColor: isDarkMode ? "#1e88e5" : "#bbdefb",
        fontWeight: "500",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        color: isDarkMode ? "#FFFFFF" : "#000000",
      },
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
    },
    {
      headerName: "BS&W Draw",
      field: "DrawBbls",
      sortable: true,
      filter: true,
      width: 120,
      cellStyle: {
        backgroundColor: isDarkMode ? "#37474f" : "#b0bec5",
        fontWeight: "500",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        color: isDarkMode ? "#FFFFFF" : "#000000",
      },
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
    },
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
        backgroundColor: isDarkMode ? "#424242" : "#f5f5f5",
        color: isDarkMode ? "#FFFFFF" : "#000000",
        whiteSpace: "nowrap",
        overflow: "hidden",
      },
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
    },
    {
      headerName: "Lease ID",
      field: "PrintLeaseID",
      sortable: true,
      filter: true,
      width: 100,
      cellStyle: {
        backgroundColor: isDarkMode ? "#00796b" : "#e0f7fa",
        fontWeight: "500",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        color: isDarkMode ? "#FFFFFF" : "#000000",
      },
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
    },
    {
      headerName: "Pumper ID",
      field: "PrintPumperID",
      sortable: true,
      filter: true,
      width: 100,
      cellStyle: {
        backgroundColor: isDarkMode ? "#004d40" : "#e0f2f1",
        fontWeight: "500",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        color: isDarkMode ? "#FFFFFF" : "#000000",
      },
      headerClass: isDarkMode ? "ag-header-dark" : "ag-header-light",
    },
  ];
  const handleExport = () => {
    const csvContent = filteredData
      .map((row) => Object.values(row).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `export_${currentDate}.csv`;
    link.click();
  };

  const handlePrint = () => {
    const gridElement = document.querySelector(".ag-theme-alpine");
    if (!gridElement) {
      console.error("Grid element not found");
      return;
    }

    const printContent = gridElement.innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = `
      <div style="padding: 20px;">
        <h1>Current Data Report</h1>
        <p>Date: ${currentDate}</p>
        ${printContent}
      </div>
    `;

    window.print();

    document.body.innerHTML = originalContent;

    // Re-render the component to restore event listeners
    // You may need to modify this based on your app's structure
    ReactDOM.render(<CurrentDataGrid />, document.getElementById("root"));
  };

  const inputStyles = {
    backgroundColor: isDarkMode ? "#333333" : "#ffffff",
    color: isDarkMode ? "#E0E0E0" : "#000000",
    border: isDarkMode ? "1px solid #555" : "1px solid #ccc",
  };

  const selectStyles = {
    width: "30%",
    backgroundColor: isDarkMode ? "#333333" : "#ffffff",
    color: isDarkMode ? "#E0E0E0" : "#000000",
    border: isDarkMode ? "1px solid #555" : "1px solid #ccc",
  };

  const selectDropdownStyles = {
    backgroundColor: isDarkMode ? "#333333" : "#ffffff",
    color: isDarkMode ? "#E0E0E0" : "#000000",
  };

  if (loading)
    return (
      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
    );
  if (error)
    return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <div
      className={`ag-theme-alpine ${isDarkMode ? "dark" : ""}`}
      style={{
        padding: "20px",
        background: isDarkMode ? "#1E1E1E" : "#f0f2f5",
        borderRadius: "10px",
        overflowX: "auto",
        marginBottom: "30px",
        color: isDarkMode ? "#E0E0E0" : "#000000",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          gap: "10px",
        }}
      >
        <Space>
          <Button
            icon={<FontAwesomeIcon icon={faArrowLeft} />}
            onClick={() => handleDateChange(-1)}
            style={{
              backgroundColor: isDarkMode ? "#333333" : "#e3f2fd",
              color: isDarkMode ? "#E0E0E0" : "#000000",
              border: isDarkMode ? "none" : "1px solid #ccc",
            }}
          />
          <Button
            icon={<FontAwesomeIcon icon={faCalendarAlt} />}
            onClick={() => setCurrentDate(moment().format("MM/DD/YYYY"))}
            style={{
              backgroundColor: isDarkMode ? "#333333" : "#e3f2fd",
              color: isDarkMode ? "#E0E0E0" : "#000000",
              border: isDarkMode ? "none" : "1px solid #ccc",
            }}
          >
            {currentDate}
          </Button>
          <Button
            icon={<FontAwesomeIcon icon={faArrowRight} />}
            onClick={() => handleDateChange(1)}
            style={{
              backgroundColor: isDarkMode ? "#333333" : "#e3f2fd",
              color: isDarkMode ? "#E0E0E0" : "#000000",
              border: isDarkMode ? "none" : "1px solid #ccc",
            }}
          />
        </Space>
        <Input
          placeholder="Search Lease ID / Lease Name / Pumper ID"
          value={searchText}
          onChange={handleSearchChange}
          prefix={<FontAwesomeIcon icon={faSearch} />}
          size="large"
          style={inputStyles}
        />
        <Select
          placeholder="Filter by Tag"
          onChange={handleTagChange}
          size="large"
          style={selectStyles}
          dropdownStyle={selectDropdownStyles}
        >
          <Option
            value=""
            style={{ color: isDarkMode ? "#E0E0E0" : "#000000" }}
          >
            All Tags
          </Option>
          <Option
            value="Tag1"
            style={{ color: isDarkMode ? "#E0E0E0" : "#000000" }}
          >
            Tag1
          </Option>
          <Option
            value="Tag2"
            style={{ color: isDarkMode ? "#E0E0E0" : "#000000" }}
          >
            Tag2
          </Option>
          <Option
            value="Tag3"
            style={{ color: isDarkMode ? "#E0E0E0" : "#000000" }}
          >
            Tag3
          </Option>
          <Option
            value="Tag4"
            style={{ color: isDarkMode ? "#E0E0E0" : "#000000" }}
          >
            Tag4
          </Option>
        </Select>
        <Space>
          <Button
            onClick={toggleShowPriorDay}
            style={{
              backgroundColor: isDarkMode ? "#333333" : "#e3f2fd",
              color: isDarkMode ? "#E0E0E0" : "#000000",
              border: isDarkMode ? "none" : "1px solid #ccc",
            }}
          >
            {showPriorDay ? "Hide Prior Day" : "Show Prior Day"}
          </Button>
          <FontAwesomeIcon
            icon={faFileExport}
            style={{
              cursor: "pointer",
              fontSize: "24px",
              color: isDarkMode ? "#FFD700" : "#1890ff",
            }}
            onClick={handleExport}
          />
          <FontAwesomeIcon
            icon={faPrint}
            style={{
              cursor: "pointer",
              fontSize: "24px",
              color: isDarkMode ? "#FFD700" : "#1890ff",
            }}
            onClick={handlePrint}
          />
        </Space>
      </div>

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
          autoHeight: true,
          wrapText: true,
        }}
        pagination={true}
        paginationPageSize={100}
        domLayout="autoHeight"
        getRowHeight={() => "auto"}
        getRowStyle={(params) =>
          params.node.rowIndex === 0
            ? {
                fontWeight: "bold",
                backgroundColor: isDarkMode ? "#2e7d32" : "#e8f5e9",
              }
            : {}
        }
        components={{
          imageCellRenderer: ImageCellRenderer,
        }}
        style={{
          boxShadow: isDarkMode
            ? "0 4px 8px rgba(0, 0, 0, 0.5)"
            : "0 4px 8px rgba(0, 0, 0, 0.1)",
          borderRadius: "10px",
          overflowX: "auto",
        }}
      />
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
