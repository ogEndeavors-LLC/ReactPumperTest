// UserContext.js
import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState("");
  const [userID, setUserID] = useState(null);
  const [companyName, setCompanyName] = useState(null);

  useEffect(() => {
    const storedUserRole = localStorage.getItem("userRole");
    if (storedUserRole) {
      setUserRole(storedUserRole);
    }

    const storedUserID = localStorage.getItem("userID");
    if (storedUserID) {
      setUserID(storedUserID);
    }

    const storedCompanyName = localStorage.getItem("companyName");
    if (storedCompanyName) {
      setUserID(storedCompanyName);
    }
  }, []);

  const setUser = (role, id, companyName) => {
    setUserRole(role);
    setUserID(id);
    setCompanyName(companyName);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userID", id);
    localStorage.setItem("companyName", companyName);
  };

  return (
    <UserContext.Provider value={{ userRole, userID, companyName, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
