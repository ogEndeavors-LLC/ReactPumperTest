// GridLoader.jsx

import React from "react";

const GridLoader = ({ isDarkMode, rows = 10, columns = 5 }) => {
  const skeletonRows = Array.from({ length: rows });

  const shimmerClass = `relative overflow-hidden rounded-lg ${
    isDarkMode ? "bg-gray-800" : "bg-gray-200"
  }`;
  const shimmerInnerClass = `absolute inset-0 -translate-x-full bg-gradient-to-r ${
    isDarkMode
      ? "from-gray-800 via-gray-700 to-gray-800"
      : "from-gray-200 via-gray-100 to-gray-200"
  } animate-shimmer`;

  return (
    <div
      className={`p-4 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      } min-h-screen flex items-center justify-center`}
    >
      <div className="space-y-4 w-full max-w-6xl">
        {skeletonRows.map((_, idxRow) => (
          <div key={idxRow} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, idxCol) => (
              <div key={idxCol} className={`flex-1 h-8 ${shimmerClass}`}>
                <div className={shimmerInnerClass}></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GridLoader;
