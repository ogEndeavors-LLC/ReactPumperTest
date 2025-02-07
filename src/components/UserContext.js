// UserContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState("");
  const [userID, setUserID] = useState(null);
  const [companyName, setCompanyName] = useState(null);
  const [jobRole, setJobRole] = useState("");

  // New fields for Email & Phone
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");

  useEffect(() => {
    const storedUserRole = localStorage.getItem("userRole");
    const storedUserID = localStorage.getItem("userID");
    const storedCompanyName = localStorage.getItem("companyName");
    const storedJobRole = localStorage.getItem("jobRole");

    // Check for newly added items
    const storedUserEmail = localStorage.getItem("userEmail");
    const storedUserPhone = localStorage.getItem("userPhone");

    if (storedUserRole) setUserRole(storedUserRole);
    if (storedUserID) setUserID(storedUserID);
    if (storedCompanyName) setCompanyName(storedCompanyName);
    if (storedJobRole) setJobRole(storedJobRole);

    // Set email & phone if present in localStorage
    if (storedUserEmail) setUserEmail(storedUserEmail);
    if (storedUserPhone) setUserPhone(storedUserPhone);
  }, []);

  /**
   * Updates all user info in context and localStorage.
   *
   * @param {string} role - User role
   * @param {string|number} id - User ID
   * @param {string} company - Company name
   * @param {string} jRole - Job role
   * @param {string} email - User email
   * @param {string} phone - User phone number
   */
  const setUser = (role, id, company, jRole, email, phone) => {
    setUserRole(role);
    setUserID(id);
    setCompanyName(company);
    setJobRole(jRole);
    setUserEmail(email || "");
    setUserPhone(phone || "");

    localStorage.setItem("userRole", role);
    localStorage.setItem("userID", id);
    localStorage.setItem("companyName", company);
    localStorage.setItem("jobRole", jRole);
    localStorage.setItem("userEmail", email || "");
    localStorage.setItem("userPhone", phone || "");
  };

  return (
    <UserContext.Provider
      value={{
        userRole,
        userID,
        companyName,
        jobRole,
        userEmail,
        userPhone,
        setUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
