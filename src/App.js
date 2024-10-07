import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import SignInPage from "./components/SignInPage";
import GaugeEntry from "./components/Pumper";
import HomePage from "./components/HomePage";
import Details from "./components/Details";
import Layout from "./components/Layout";
import "./index.css";
import { ThemeProvider } from "./components/ThemeContext";
import { UserProvider } from "./components/UserContext";
import Admin from "./components/admin";
import CurrentProd from "./components/CurrentProd";
import Chart from "./components/Charts";
import Inv from "./components/LeaseInventory";
import ProductionSummary from "./components/ProductionSummary";
import Reports from "./components/Reports";
function TitleUpdater() {
  const location = useLocation();

  React.useEffect(() => {
    const titleMap = {
      "/": "Sign In",
      "/pumper": "Gauge Entry",
      "/prod": "Current Production",
      "/prodSummary": "Production Summary",
      "/inv": "Lease Inventory",
      "/home": "Home",
      "/profile-details": "Profile Details",
      "/admin-panel": "Admin Panel",
      "/Charts": "Charts",
      "/reports": "Reports",
    };

    // Extract the base path without query parameters
    const basePath = location.pathname.split("/").slice(0, 2).join("/");

    // Find the matching title or use default
    const pageTitle =
      titleMap[basePath] || titleMap[location.pathname] || "My App";

    document.title = pageTitle;
  }, [location]);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <TitleUpdater />
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route
            path="/pumper"
            element={
              <Layout>
                <GaugeEntry />
              </Layout>
            }
          />
          <Route
            path="/prod"
            element={
              <Layout>
                <CurrentProd />
              </Layout>
            }
          />
          <Route
            path="/reports"
            element={
              <Layout>
                <Reports />
              </Layout>
            }
          />

          <Route
            path="/prodSummary"
            element={
              <Layout>
                <ProductionSummary />
              </Layout>
            }
          />
          <Route
            path="/inv"
            element={
              <Layout>
                <Inv />
              </Layout>
            }
          />
          <Route
            path="/home"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/profile-details"
            element={
              <Layout>
                <Details />
              </Layout>
            }
          />
          <Route
            path="/Charts"
            element={
              <Layout>
                <Chart />
              </Layout>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <Layout>
                <Admin />
              </Layout>
            }
          />
        </Routes>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
