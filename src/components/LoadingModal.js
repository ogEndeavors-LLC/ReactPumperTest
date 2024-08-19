// src/components/LoadingModal.js
import React from "react";

const LoadingModal = ({ show }) => {
  if (!show) {
    return null;
  }

  const loaderStyles = {
    border: "4px solid rgba(0, 0, 0, 0.1)",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    borderLeftColor: "#4f46e5",
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  };

  const modalStyles = {
    animation: "fadeIn 0.5s ease-in-out",
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
      <div
        className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm mx-auto"
        style={modalStyles}
      >
        <h2 className="text-3xl font-extrabold mb-4 text-indigo-600 animate-bounce">
          Loading
        </h2>
        <div className="loader mb-4" style={loaderStyles}></div>
        <p className="text-gray-700">May take up to 15 seconds to catch up</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingModal;
