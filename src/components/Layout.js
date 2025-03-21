import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSpring, animated } from "react-spring";
import styled, { css, createGlobalStyle } from "styled-components";
import { useTheme } from "./ThemeContext";
import { useUser } from "./UserContext";
import OutsideClickHandler from "react-outside-click-handler";
import HomeIcon from "@mui/icons-material/Home";
import ReportIcon from "@mui/icons-material/Assessment";
import PumperIcon from "@mui/icons-material/BuildCircle";
import ChartIcon from "@mui/icons-material/ShowChart"; // Import the Chart Icon
import Footer from "./Footer";
import logo from "../assets/100.png";
import moment from "moment";

/* ------------------------- BREAKPOINTS ------------------------- */
const TABLET_BREAKPOINT = "1024px";

/* ------------------------- GLOBAL STYLE ------------------------- */
const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'Inter', sans-serif;
    color: ${({ theme }) => (theme === "dark" ? "#E0E0E0" : "#333")};
    background-color: ${({ theme }) =>
      theme === "dark" ? "#121212" : "#FFFFFF"};
    text-align: center; /* Center ALL text globally */
  }
`;

/* ------------------------- DROPDOWN COMPONENTS ------------------------- */
const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownSummary = styled.summary`
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  user-select: none;

  &:hover {
    background-color: ${({ theme }) =>
      theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"};
  }

  &::after {
    content: "▼";
    font-size: 0.7em;
    margin-left: 0.5em;
  }
`;

const DropdownContent = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: ${({ theme }) =>
    theme === "dark" ? "#2d3748" : "#ffffff"};
  min-width: 160px;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 2;
  border-radius: 4px;
  overflow: hidden;
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: ${({ isOpen }) => (isOpen ? "1" : "0")};
  transform: ${({ isOpen }) =>
    isOpen ? "translateY(0)" : "translateY(-10px)"};
  pointer-events: ${({ isOpen }) => (isOpen ? "all" : "none")};
`;

const NavDropdownItem = styled.div`
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  text-align: center; /* Center the dropdown items */
  color: ${({ theme }) => (theme === "dark" ? "#e2e8f0" : "#2d3748")};
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme }) =>
      theme === "dark" ? "#4a5568" : "#edf2f7"};
  }
`;

const NavDropdown = ({ children, theme }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownContainer
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <DropdownSummary theme={theme}>{children[0]}</DropdownSummary>
      <DropdownContent theme={theme} isOpen={isOpen}>
        {children.slice(1)}
      </DropdownContent>
    </DropdownContainer>
  );
};

/* ------------------------- NAVBAR ------------------------- */
const NavBarContainer = styled(animated.nav)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  width: 100%;
  background: ${({ theme }) =>
    theme === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)"};
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;

  @media (max-width: ${TABLET_BREAKPOINT}) {
    padding: 0.5rem 1rem;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;

  svg,
  .fa-icon {
    font-size: 30px;
    fill: currentColor;
  }

  .fa-icon {
    color: ${({ theme }) => (theme === "dark" ? "#FFFFFF" : "#333")};
    margin-right: 0.5rem;
  }

  span {
    font-weight: 600;
    font-size: 1.5rem;
    background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &:hover {
    transform: translateY(-2px);
  }
`;

/* Wrap nav items so we can show/hide them on iPad/mobile */
const NavItemsWrapper = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: ${TABLET_BREAKPOINT}) {
    position: fixed;
    top: 60px;
    right: 0;
    width: 50%; /* Further reduced from 60% to 50% */
    height: calc(100vh - 60px);
    background: ${({ theme }) =>
      theme === "dark" ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.9)"};
    backdrop-filter: blur(8px);
    flex-direction: column;
    justify-content: flex-start;
    align-items: center; /* Center the items horizontally */
    padding: 1rem;
    box-shadow: -2px 0 15px rgba(0, 0, 0, 0.1);
    transform: ${({ isMobileMenuOpen }) =>
      isMobileMenuOpen ? "translateX(0)" : "translateX(100%)"};
    opacity: ${({ isMobileMenuOpen }) => (isMobileMenuOpen ? "1" : "0")};
    transition: transform 0.4s ease, opacity 0.3s ease;
    z-index: 99;
  }
`;

const NavItems = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  flex-wrap: wrap;

  @media (max-width: ${TABLET_BREAKPOINT}) {
    flex-direction: column;
    width: 100%;
    margin-top: 1rem;
    align-items: center; /* Center items in column direction */
    text-align: center; /* Center the text of each item */
  }

  .material-symbols-outlined {
    font-size: 24px;
    cursor: pointer;
    &:hover {
      color: #ddd;
    }
  }
`;

const NavItem = styled(animated.div)`
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  .material-symbols-outlined {
    font-size: 24px;
    color: inherit;
  }

  @media (max-width: ${TABLET_BREAKPOINT}) {
    border-radius: 6px;
    width: 100%;
    justify-content: center; /* Center icon/text horizontally */
    padding: 10px 20px;

    &:hover {
      background-color: ${({ theme }) =>
        theme === "dark" ? "rgba(255,255,255,0.1)" : "#f5f5f5"};
    }
  }
`;

/* ------------------------- HAMBURGER BUTTON ------------------------- */
const HamburgerButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;

  @media (max-width: ${TABLET_BREAKPOINT}) {
    display: inline-flex;
    flex-direction: column;
    justify-content: space-around;
    width: 32px;
    height: 24px;

    &:focus {
      outline: none;
    }

    div {
      width: 32px;
      height: 3px;
      background: ${({ theme }) => (theme === "dark" ? "#FFF" : "#333")};
      border-radius: 3px;
      transition: all 0.3s ease;
      transform-origin: 1px;
    }

    /* Top bar transform */
    div:first-child {
      transform: ${({ isMobileMenuOpen }) =>
        isMobileMenuOpen ? "rotate(45deg) translate(5px, 5px)" : "rotate(0)"};
    }

    /* Middle bar fades out when open */
    div:nth-child(2) {
      opacity: ${({ isMobileMenuOpen }) => (isMobileMenuOpen ? "0" : "1")};
      transform: ${({ isMobileMenuOpen }) =>
        isMobileMenuOpen ? "translateX(-20px)" : "translateX(0)"};
    }

    /* Bottom bar transform */
    div:last-child {
      transform: ${({ isMobileMenuOpen }) =>
        isMobileMenuOpen ? "rotate(-45deg) translate(6px, -6px)" : "rotate(0)"};
    }
  }
`;

/* ------------------------- ADMIN BUTTON ------------------------- */
const AdminButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) =>
    theme === "dark" ? "#4285F4" : "#FFFFFF"};
  color: ${({ theme }) => (theme === "dark" ? "#FFFFFF" : "#4285F4")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.3s ease, background-color 0.3s ease, color 0.3s ease,
    transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
    background-color: ${({ theme }) =>
      theme === "dark" ? "#3367D6" : "#F2F2F2"};
  }

  @media (max-width: 768px) {
    display: none;
  }

  svg {
    margin-right: 8px;
    transition: transform 0.5s ease;
  }

  &:hover svg {
    transform: rotate(360deg);
  }
`;

/* ------------------------- THEME TOGGLE BUTTON ------------------------- */
const ThemeToggleButton = styled(NavItem)`
  transition: transform 0.5s ease;

  ${({ spinning }) =>
    spinning &&
    css`
      animation: spin 0.4s linear;
    `}

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

/* ------------------------- PROFILE CARD ------------------------- */
const ProfileCard = styled(animated.div)`
  position: absolute;
  top: 60px;
  right: 0;
  width: 300px;
  background: ${({ theme }) =>
    theme === "dark"
      ? "linear-gradient(145deg, #1a202c, #2d3748)"
      : "linear-gradient(145deg, #f7fafc, #edf2f7)"};
  color: ${({ theme }) => (theme === "dark" ? "#f7fafc" : "#1a202c")};
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2), 0 10px 20px rgba(0, 0, 0, 0.15);
  border-radius: 15px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  z-index: 1001;
  backdrop-filter: blur(12px);
  border: 1px solid ${({ theme }) => (theme === "dark" ? "#4a5568" : "#cbd5e0")};
  transition: all 0.5s ease-in-out;
`;

const UserAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #ddd;
  margin-bottom: 20px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserName = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 10px;
  color: ${({ theme }) => (theme === "dark" ? "#FFFFFF" : "#222222")};
`;

const UserRole = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 16px;
  color: ${({ theme }) => (theme === "dark" ? "#AAAAAA" : "#555555")};
  margin-bottom: 20px;
`;

const DetailsButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 50px;
  background-color: ${({ theme }) =>
    theme === "dark" ? "#4E9F3D" : "#76C893"};
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: ${({ theme }) =>
      theme === "dark" ? "#3d7a2e" : "#5da671"};
    transform: translateY(-2px);
  }
`;

const SignOutButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 50px;
  background-color: #ff4d4d;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #e60000;
  }
`;

const CloseIcon = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  color: ${({ theme }) => (theme === "dark" ? "#fff" : "#000")};
  transition: color 0.3s ease;

  &:hover {
    color: #ff4d4d;
  }
`;

/* ------------------------- MAIN LAYOUT COMPONENT ------------------------- */
function Layout({ children }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { userRole, userID, setUser, companyName } = useUser();

  const [spinning, setSpinning] = useState(false);
  const [profileCardVisible, setProfileCardVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* Spring animations */
  const profileCardAnimation = useSpring({
    opacity: profileCardVisible ? 1 : 0,
    transform: profileCardVisible ? "translateY(0)" : "translateY(-20px)",
    config: { mass: 1, tension: 210, friction: 20 },
  });

  const navBarAnimation = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
  });

  /* Handlers */
  const handleSignOut = useCallback(() => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userID");
    setUser("", "");
    navigate("/");
  }, [navigate, setUser]);

  const handleThemeToggle = useCallback(() => {
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      toggleTheme();
    }, 1000);
  }, [toggleTheme]);

  const capitalizeFirstLetter = useCallback((string) => {
    if (string && typeof string === "string") {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    return "";
  }, []);

  const handleDetailsClick = useCallback(() => {
    navigate("/profile-details");
    setProfileCardVisible(false);
  }, [navigate]);

  const toggleProfileCard = useCallback(() => {
    setProfileCardVisible((prev) => !prev);
  }, []);

  /* Toggle for hamburger menu */
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
    // Ensure the profile card is closed when opening the menu
    setProfileCardVisible(false);
  }, []);

  /**
   * Helper to navigate and close the mobile menu
   */
  const handleNavigate = (path) => {
    navigate(path);
    // Once we navigate away, close the sandwich menu
    setIsMobileMenuOpen(false);
  };

  return (
    <div
      className={
        theme === "dark"
          ? "bg-gray-900 text-gray-100"
          : "bg-gray-50 text-gray-900"
      }
    >
      <GlobalStyle theme={theme} />
      <NavBarContainer style={navBarAnimation} theme={theme}>
        {/* Logo/Home */}
        <Logo onClick={() => handleNavigate("/home")} theme={theme}>
          {!isMobileMenuOpen && <HomeIcon />}
          <span>
            {companyName && companyName.length > 3
              ? companyName
              : "ogFieldTicket"}
          </span>
        </Logo>

        {/* Hamburger (for iPad & iPhone up to 1024px) */}
        <HamburgerButton
          theme={theme}
          isMobileMenuOpen={isMobileMenuOpen}
          onClick={toggleMobileMenu}
        >
          <div />
          <div />
          <div />
        </HamburgerButton>

        {/* Nav items (hidden behind hamburger on iPad/iPhone) */}
        <NavItemsWrapper theme={theme} isMobileMenuOpen={isMobileMenuOpen}>
          <NavItems>
            {/* Admin panel if userRole != 'P' */}
            {userRole !== "P" && (
              <AdminButton
                theme={theme}
                onClick={() => handleNavigate("/admin-panel")}
              >
                Admin Panel
              </AdminButton>
            )}

            {/* Production */}
            <NavItem onClick={() => handleNavigate("/prod")} theme={theme}>
              {isMobileMenuOpen ? "Production" : "Current Production"}
            </NavItem>

            {/* Gauge Entry */}
            <NavItem onClick={() => handleNavigate("/pumper")} theme={theme}>
              {isMobileMenuOpen ? "Gauge Entry" : "Gauge Entry"}
            </NavItem>

            {/* Charts */}
            <NavItem onClick={() => handleNavigate("/Charts")} theme={theme}>
              {isMobileMenuOpen ? "Charts" : "Charts"}
            </NavItem>

            <NavItem onClick={() => handleNavigate("/loads")} theme={theme}>
              {isMobileMenuOpen ? "Loads" : "Loads"}
            </NavItem>

            {/* Inventory Dropdown */}
            <NavDropdown theme={theme}>
              <summary>{isMobileMenuOpen ? "Inventory" : "Inventory"}</summary>
              <NavDropdownItem
                theme={theme}
                onClick={() => handleNavigate("/inv?type=lease")}
              >
                By Lease
              </NavDropdownItem>
              <NavDropdownItem
                theme={theme}
                onClick={() => {
                  const startDate = moment()
                    .subtract(1, "month")
                    .startOf("month")
                    .format("YYYY-MM-DD");
                  const thruDate = moment().format("YYYY-MM-DD");
                  handleNavigate(
                    `/reports?Rpt=O&LeaseID=&StartDate=${startDate}&Thru=${thruDate}`
                  );
                }}
              >
                By Tank
              </NavDropdownItem>
            </NavDropdown>

            {/* Reports Dropdown */}
            <NavDropdown theme={theme}>
              <summary>{isMobileMenuOpen ? "Reports" : "Reports"}</summary>
              <NavDropdownItem
                theme={theme}
                onClick={() => handleNavigate("/reports")}
              >
                By Lease
              </NavDropdownItem>
              <NavDropdownItem
                theme={theme}
                onClick={() => handleNavigate("/prodSummary")}
              >
                Production Summary
              </NavDropdownItem>
            </NavDropdown>

            {/* Profile Icon or Text */}
            <NavItem onClick={toggleProfileCard} theme={theme}>
              {isMobileMenuOpen ? (
                "Profile"
              ) : (
                <span className="material-symbols-outlined">
                  account_circle
                </span>
              )}
            </NavItem>

            {/* Theme Toggle */}
            <ThemeToggleButton
              onClick={handleThemeToggle}
              spinning={spinning}
              theme={theme}
            >
              {isMobileMenuOpen ? (
                "Toggle Theme"
              ) : (
                <span className="material-symbols-outlined">
                  {theme === "dark" ? "dark_mode" : "light_mode"}
                </span>
              )}
            </ThemeToggleButton>

            {/* Sign Out */}
            <NavItem onClick={handleSignOut} theme={theme}>
              {isMobileMenuOpen ? (
                "Sign Out"
              ) : (
                <span className="material-symbols-outlined">logout</span>
              )}
            </NavItem>

            {/* Profile Card (shown when profile icon is clicked) */}
            {profileCardVisible && (
              <OutsideClickHandler
                onOutsideClick={() => setProfileCardVisible(false)}
              >
                <ProfileCard style={profileCardAnimation} theme={theme}>
                  <CloseIcon onClick={toggleProfileCard}>
                    <span className="material-symbols-outlined">close</span>
                  </CloseIcon>
                  <UserAvatar>
                    <img src={logo} alt="Logo" />
                  </UserAvatar>
                  <UserName>{userID || "Signed in"}</UserName>
                  <UserRole>Hello {capitalizeFirstLetter(userID)}!</UserRole>
                  <DetailsButton onClick={handleDetailsClick} theme={theme}>
                    Profile Details
                  </DetailsButton>
                </ProfileCard>
              </OutsideClickHandler>
            )}
          </NavItems>
        </NavItemsWrapper>
      </NavBarContainer>

      {/* MAIN CONTENT */}
      <main style={{ paddingTop: "4rem" }}>{children}</main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

export default Layout;
