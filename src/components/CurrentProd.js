import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faSearch } from "@fortawesome/free-solid-svg-icons";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Input, Select, Spin, Alert, Typography, Space } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import sampleImage from "../assets/logo.jpg";
import { baseUrl } from "./config";
const { Option } = Select;
const { Title } = Typography;

const CurrentDataGrid = () => {
  const [rowData, setRowData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [totalRow, setTotalRow] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

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
        Comments: "Sample gauge reading",
        ImageCount: 3,
        imageUrl: sampleImage,
        PriorProduced: "70.00",
        PriorGas: "950.00",
        PriorWaterTotal: "9.50",
        PriorWaterInjectedTotal: "4.80",
        WaterHauledBbls: "8.00",
      };

      // Ensure all numerical fields are strings to match API data format
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
          style={{ cursor: "pointer", color: "#1890ff" }}
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
  }, [searchText, selectedTag]);

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

  const columnDefs = [
    {
      headerName: "Location",
      field: "PrintLeaseName",
      sortable: true,
      filter: true,
      checkboxSelection: true,
      pinned: "left",
      wrapText: true,
      autoHeight: true,
      width: 150,
      cellStyle: { fontWeight: "bold", color: "#1a237e" },
    },
    {
      headerName: "08/18 Oil",
      field: "Produced",
      sortable: true,
      filter: true,
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 120,
      cellStyle: { color: "#d32f2f", fontWeight: "500" },
    },
    {
      headerName: "Gas",
      field: "Gas",
      sortable: true,
      filter: true,
      cellStyle: {
        color: "#ffd600",
        fontWeight: "500",
        textShadow: "0px 0px 1px #000",
      },
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 100,
    },
    {
      headerName: "Water",
      field: "WaterTotal",
      sortable: true,
      filter: true,
      cellStyle: { color: "#0277bd", fontWeight: "500" },
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 120,
    },
    {
      headerName: "Injected",
      field: "WaterInjectedTotal",
      sortable: true,
      filter: true,
      cellStyle: { color: "#1a237e", fontWeight: "500" },
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 120,
    },
    {
      headerName: "08/19 Oil",
      field: "PriorProduced",
      sortable: true,
      filter: true,
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 120,
      cellStyle: { color: "#c62828", fontWeight: "500" },
    },
    {
      headerName: "Gas",
      field: "PriorGas",
      sortable: true,
      filter: true,
      cellStyle: {
        color: "#fbc02d",
        fontWeight: "500",
        textShadow: "0px 0px 1px #000",
      },
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 100,
    },
    {
      headerName: "Water",
      field: "PriorWaterTotal",
      sortable: true,
      filter: true,
      cellStyle: { color: "#0288d1", fontWeight: "500" },
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 120,
    },
    {
      headerName: "Injected",
      field: "PriorWaterInjectedTotal",
      sortable: true,
      filter: true,
      cellStyle: { color: "#283593", fontWeight: "500" },
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 120,
    },
    {
      headerName: "Comment",
      field: "gaugecomments",
      sortable: true,
      filter: true,
      wrapText: true,
      autoHeight: true,
      width: 200,
      cellStyle: { color: "#4a148c", fontStyle: "italic" },
    },
    {
      headerName: "Bbls OH",
      field: "OnHand",
      sortable: true,
      filter: true,
      cellStyle: { color: "#455a64", fontWeight: "500" },
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 120,
    },
    {
      headerName: "Run Bbls",
      field: "RunBbls",
      sortable: true,
      filter: true,
      cellStyle: { color: "#37474f", fontWeight: "500" },
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 120,
    },
    {
      headerName: "Water Hauled",
      field: "WaterHauledBbls",
      sortable: true,
      filter: true,
      cellStyle: { color: "#01579b", fontWeight: "500" },
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 120,
    },
    {
      headerName: "BS&W Draw",
      field: "DrawBbls",
      sortable: true,
      filter: true,
      cellStyle: { color: "#263238", fontWeight: "500" },
      valueFormatter: (params) =>
        params.value !== null ? parseFloat(params.value).toFixed(2) : "0.00",
      width: 120,
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
      },
    },
    {
      headerName: "Lease ID",
      field: "PrintLeaseID",
      sortable: true,
      filter: true,
      width: 100,
      cellStyle: { color: "#006064", fontWeight: "500" },
    },
    {
      headerName: "Pumper ID",
      field: "PrintPumperID",
      sortable: true,
      filter: true,
      width: 100,
      cellStyle: { color: "#004d40", fontWeight: "500" },
    },
  ];

  if (loading)
    return (
      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
    );
  if (error)
    return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <div
      className="ag-theme-alpine"
      style={{
        padding: "20px",
        background: "#f0f2f5",
        borderRadius: "10px",
        overflowX: "auto",
        marginBottom: "30px",
      }}
    >
      <Title level={2} style={{ textAlign: "center", marginBottom: "20px" }}>
        Current Data Grid
      </Title>
      <Space
        direction="vertical"
        style={{ width: "100%", marginBottom: "20px" }}
      >
        <Input
          placeholder="Search Lease ID / Lease Name / Pumper ID"
          value={searchText}
          onChange={handleSearchChange}
          prefix={<FontAwesomeIcon icon={faSearch} />}
          size="large"
        />
        <Select
          placeholder="Filter by Tag"
          onChange={handleTagChange}
          style={{ width: "100%" }}
          size="large"
        >
          <Option value="">All Tags</Option>
          <Option value="Tag1">Tag1</Option>
          <Option value="Tag2">Tag2</Option>
          <Option value="Tag3">Tag3</Option>
          <Option value="Tag4">Tag4</Option>
        </Select>
      </Space>
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
        }}
        pagination={true}
        paginationPageSize={100}
        domLayout="autoHeight"
        getRowStyle={(params) =>
          params.node.rowIndex === 0
            ? {
                fontWeight: "bold",
                backgroundColor: "#e8f5e9",
              }
            : {}
        }
        components={{
          imageCellRenderer: ImageCellRenderer,
        }}
        style={{
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          borderRadius: "10px",
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
          },
        }}
      >
        {selectedImageUrl && <img src={selectedImageUrl} alt="Selected" />}
        <button onClick={closeModal}>Close</button>
      </Modal>
    </div>
  );
};

export default CurrentDataGrid;
