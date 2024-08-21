import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faSearch,
  faTimes,
  faUser,
  faEnvelope,
  faPhone,
  faBriefcase,
  faCommentAlt,
  faCheck,
  faBan,
  faSort,
  faFilter,
  faLock,
  faLockOpen,
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "./ThemeContext";
import { baseUrl } from "./config"; // Importing baseUrl from config

const roleDescriptions = {
  A: "Admin",
  O: "Operator",
  P: "Pumper",
  R: "Read Only",
  I: "Investor",
};

const ControlUsers = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const { theme } = useTheme();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/userdetails.php`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleEdit = (user) => setEditingUser(user);
  const handleCancel = () => setEditingUser(null);
  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => setFilterRole(e.target.value);
  const handleSortChange = (e) => setSortBy(e.target.value);
  const toggleSortOrder = () =>
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");

  const handleSave = async (updatedUserData) => {
    try {
      const response = await axios.patch(
        `${baseUrl}/api/userdetails.php`,
        updatedUserData
      );
      if (response.data.success) {
        setUsers(
          users.map((user) =>
            user.UserID === updatedUserData.UserID ? updatedUserData : user
          )
        );
        setEditingUser(null);
      } else {
        console.error("Error updating user details:", response.data.message);
      }
    } catch (error) {
      console.error("Error updating user details:", error);
    }
  };

  const handleDisable = async (userId) => {
    try {
      const response = await axios.patch(`${baseUrl}/api/userdetails.php`, {
        UserID: userId,
        Action: "disable",
      });
      if (response.data.success) {
        setUsers(
          users.map((user) =>
            user.UserID === userId ? { ...user, Disabled: "1" } : user
          )
        );
        alert("User account has been disabled.");
      } else {
        console.error("Error disabling user:", response.data.message);
        alert(
          `Failed to disable user. Server message: ${response.data.message}`
        );
      }
    } catch (error) {
      console.error("Error disabling user:", error);
      alert(
        `An error occurred while disabling the user. Error: ${error.message}`
      );
    }
  };

  const handleEnable = async (userId) => {
    try {
      const response = await axios.patch(`${baseUrl}/api/userdetails.php`, {
        UserID: userId,
        Action: "enable",
      });
      if (response.data.success) {
        setUsers(
          users.map((user) =>
            user.UserID === userId ? { ...user, Disabled: "0" } : user
          )
        );
        alert("User account has been enabled.");
      } else {
        console.error("Error enabling user:", response.data.message);
        alert(
          `Failed to enable user. Server message: ${response.data.message}`
        );
      }
    } catch (error) {
      console.error("Error enabling user:", error);
      alert(
        `An error occurred while enabling the user. Error: ${error.message}`
      );
    }
  };

  const filteredAndSortedUsers = users
    .filter(
      (user) =>
        (filterRole === "All" || user.Role === filterRole) &&
        ((user.FullName &&
          user.FullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.Email &&
            user.Email.toLowerCase().includes(searchTerm.toLowerCase())))
    )
    .sort((a, b) => {
      const factor = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "name")
        return factor * a.FullName.localeCompare(b.FullName);
      if (sortBy === "role") return factor * a.Role.localeCompare(b.Role);
      return 0;
    });

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gray-900 text-gray-100"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">User Management</h1>
        <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-grow w-full md:w-auto">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              className={`w-full px-4 py-2 pl-10 rounded-full border ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800 text-gray-300"
                  : "border-gray-300"
              }`}
            />
            <FontAwesomeIcon
              icon={faSearch}
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <FontAwesomeIcon
              icon={faFilter}
              className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
            />
            <select
              value={filterRole}
              onChange={handleFilterChange}
              className={`px-4 py-2 rounded-lg border ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800 text-gray-300"
                  : "border-gray-300"
              }`}
            >
              <option value="All">All Roles</option>
              <option value="P">Pumper</option>
              <option value="O">Operator</option>
              <option value="A">Admin</option>
              <option value="I">Investor</option>
              <option value="R">Read Only</option>
            </select>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <FontAwesomeIcon
              icon={faSort}
              className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
            />
            <select
              value={sortBy}
              onChange={handleSortChange}
              className={`px-4 py-2 rounded-lg border ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800 text-gray-300"
                  : "border-gray-300"
              }`}
            >
              <option value="name">Sort by Name</option>
              <option value="role">Sort by Role</option>
            </select>
            <button
              onClick={toggleSortOrder}
              className={`px-2 py-1 ${
                theme === "dark"
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-200 text-gray-900"
              } rounded-md`}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedUsers.map(
            (user) =>
              user.UserID !== "unassigned" && (
                <div
                  key={user.UserID}
                  className={`p-6 rounded-lg shadow-lg hover:shadow-xl transition ${
                    theme === "dark" ? "bg-gray-800" : "bg-white"
                  } ${
                    user.Disabled === "1" || user.Disabled === 1
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3
                      className={`text-3xl font-semibold ${
                        theme === "dark" ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {user.FullName}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
                        aria-label="Edit user"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      {user.Disabled === "1" || user.Disabled === 1 ? (
                        <button
                          onClick={() => handleEnable(user.UserID)}
                          className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition"
                          aria-label="Enable user"
                        >
                          <FontAwesomeIcon icon={faLockOpen} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDisable(user.UserID)}
                          className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                          aria-label="Disable user"
                        >
                          <FontAwesomeIcon icon={faLock} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-center">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="mr-2 text-gray-500"
                      />
                      <span className="font-medium">
                        {roleDescriptions[user.Role] || user.Role}
                      </span>
                    </p>
                    <p className="flex items-center">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="mr-2 text-gray-500"
                      />
                      <span>{user.Email}</span>
                    </p>
                    <p className="flex items-center">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="mr-2 text-gray-500"
                      />
                      <span>{user.Phone}</span>
                    </p>
                    <p className="flex items-center">
                      <FontAwesomeIcon
                        icon={faCommentAlt}
                        className="mr-2 text-gray-500"
                      />
                      <span>{user.Message}</span>
                    </p>
                    {user.Disabled === "1" && (
                      <p className="flex items-center text-red-500">
                        <FontAwesomeIcon icon={faLock} className="mr-2" />
                        <span>Disabled</span>
                      </p>
                    )}
                  </div>
                </div>
              )
          )}
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
          <div
            className={`rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden ${
              theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-white"
            }`}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-semibold">
                Edit User: {editingUser.FullName}
              </h2>
              <button
                onClick={handleCancel}
                className="text-white hover:text-gray-200 transition"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            <EditUserForm
              user={editingUser}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const EditUserForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({ ...user });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useTheme();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.Role.trim()) newErrors.Role = "Role is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onSave(formData);
      } catch (error) {
        console.error("Error saving user:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const fields = [
    {
      name: "FullName",
      icon: faUser,
      placeholder: "Full Name",
    },
    {
      name: "Email",
      icon: faEnvelope,
      placeholder: "Email Address",
      type: "email",
    },
    { name: "Phone", icon: faPhone, placeholder: "Phone Number" },
    {
      name: "Role",
      icon: faBriefcase,
      placeholder: "User Role",
      required: true,
    },
    {
      name: "Message",
      icon: faCommentAlt,
      placeholder: "Message",
      textarea: true,
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div
            key={field.name}
            className={`relative ${
              field.name === "Message" ? "md:col-span-2" : ""
            }`}
          >
            <FontAwesomeIcon
              icon={field.icon}
              className="absolute top-3 left-3 text-gray-400"
            />
            {field.name === "Role" ? (
              <select
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${
                  errors[field.name] ? "border-red-500" : "border-gray-300"
                } ${theme === "dark" ? "bg-gray-800 text-gray-300" : ""}`}
              >
                {Object.entries(roleDescriptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : field.textarea ? (
              <textarea
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${
                  errors[field.name] ? "border-red-500" : "border-gray-300"
                } ${theme === "dark" ? "bg-gray-800 text-gray-300" : ""}`}
                rows="4"
              />
            ) : (
              <input
                type={field.type || "text"}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${
                  errors[field.name] ? "border-red-500" : "border-gray-300"
                } ${theme === "dark" ? "bg-gray-800 text-gray-300" : ""}`}
              />
            )}
            {errors[field.name] && (
              <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition flex items-center"
        >
          <FontAwesomeIcon icon={faBan} className="mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <FontAwesomeIcon icon={faCheck} className="mr-2" />
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default ControlUsers;
