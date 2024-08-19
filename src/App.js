import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignInPage from "./components/SignInPage";
import HomePage from "./components/HomePage";
import HomePageTwo from "./components/HomePageTwo";
import Details from "./components/Details";
import Layout from "./components/Layout";
import "./index.css";
import { ThemeProvider } from "./components/ThemeContext";
import { UserProvider } from "./components/UserContext";
import Admin from "./components/admin";
import CurrentProd from "./components/CurrentProd";
function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route
            path="/pumper"
            element={
              <Layout>
                <HomePage />
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
                <HomePageTwo />
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
