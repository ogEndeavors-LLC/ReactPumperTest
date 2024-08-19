// UserContext.js
import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState("");
  const [userID, setUserID] = useState(null);

  useEffect(() => {
    const storedUserRole = localStorage.getItem("userRole");
    if (storedUserRole) {
      setUserRole(storedUserRole);
    }

    const storedUserID = localStorage.getItem("userID");
    if (storedUserID) {
      setUserID(storedUserID);
    }
  }, []);

  const setUser = (role, id) => {
    setUserRole(role);
    setUserID(id);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userID", id);
  };

  return (
    <UserContext.Provider value={{ userRole, userID, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
