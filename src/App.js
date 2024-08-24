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
function TitleUpdater() {
  const location = useLocation();

  React.useEffect(() => {
    const titleMap = {
      "/": "Sign In",
      "/pumper": "Gauge Entry",
      "/prod": "Current Production",
      "/home": "Home",
      "/profile-details": "Profile Details",
      "/admin-panel": "Admin Panel",
    };

    document.title = titleMap[location.pathname] || "My App";
  }, [location]);

  return null;
}

function App() {
  return (
    <UserProvider>
      <ThemeProvider>
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
      </ThemeProvider>
    </UserProvider>
  );
}

export default App;
