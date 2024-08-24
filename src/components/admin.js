import React, { useState, useEffect } from "react";
import { useSpring, animated } from "react-spring";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faFileContract,
  faBriefcase,
  faList,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "react-modal";
import { useTheme } from "./ThemeContext";
import Leases from "./Leases";
import ControlUsers from "./ControlUsers";

Modal.setAppElement("#root");

const Admin = () => {
  const { theme } = useTheme();
  const [activePanel, setActivePanel] = useState("leases");
  const [activeSubPanel, setActiveSubPanel] = useState("leaseList");

  const panelAnimation = useSpring({
    to: { opacity: 1 },
    from: { opacity: 0 },
    config: { tension: 220, friction: 20 },
  });

  const sidePanelClass =
    theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900";
  const sidePanelHoverClass =
    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100";
  const activePanelClass =
    theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-black";

  const handleChangePanel = (panel, subPanel = "") => {
    setActivePanel(panel);
    setActiveSubPanel(subPanel);
  };

  useEffect(() => {
    // Ensure the initial render sets the correct panels
    setActivePanel("leases");
    setActiveSubPanel("leaseList");
  }, []);

  return (
    <div
      className={`min-h-screen flex ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Side Panel Container */}
      <div className={`w-64 ${sidePanelClass} fixed h-full shadow-2xl`}>
        <animated.div style={{ ...panelAnimation }} className="p-6">
          {/* Control Panel Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold border-b-4 border-indigo-120 pb-3">
              Control Panel
            </h1>
          </div>
          <ul className="space-y-2">
            <li
              className={`px-6 py-4 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-200 ${sidePanelHoverClass} ${
                activePanel === "leases" ? activePanelClass : ""
              }`}
              onClick={() => handleChangePanel("leases", "leaseList")}
            >
              <FontAwesomeIcon icon={faFileContract} className="text-xl" />
              <span className="text-lg font-medium">Leases</span>
            </li>
            {activePanel === "leases" && (
              <ul className="pl-8 space-y-2">
                <li
                  className={`px-6 py-4 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-200 ${sidePanelHoverClass} ${
                    activeSubPanel === "leaseList" ? activePanelClass : ""
                  }`}
                  onClick={() => handleChangePanel("leases", "leaseList")}
                >
                  <FontAwesomeIcon icon={faList} className="text-lg" />
                  <span className="text-md">Lease List</span>
                </li>
              </ul>
            )}
            <li
              className={`px-6 py-4 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-200 ${sidePanelHoverClass} ${
                activePanel === "users" ? activePanelClass : ""
              }`}
              onClick={() => handleChangePanel("users", "userList")}
            >
              <FontAwesomeIcon icon={faUsers} className="text-xl" />
              <span className="text-lg font-medium">Users</span>
            </li>
            {activePanel === "users" && (
              <ul className="pl-8 space-y-2">
                <li
                  className={`px-6 py-4 rounded-lg flex items-center gap-3 cursor-pointer transition-colors duration-200 ${sidePanelHoverClass} ${
                    activeSubPanel === "userList" ? activePanelClass : ""
                  }`}
                  onClick={() => handleChangePanel("users", "userList")}
                >
                  <FontAwesomeIcon icon={faList} className="text-lg" />
                  <span className="text-md">User List</span>
                </li>
              </ul>
            )}
          </ul>
        </animated.div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow pl-72 p-10 overflow-y-auto">
        <animated.div style={{ ...panelAnimation }}>
          {activePanel === "leases" && activeSubPanel === "leaseList" ? (
            <Leases />
          ) : activePanel === "users" && activeSubPanel === "userList" ? (
            <ControlUsers />
          ) : null}
        </animated.div>
      </div>
    </div>
  );
};

export default Admin;
