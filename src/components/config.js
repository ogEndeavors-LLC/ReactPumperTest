// config.js
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  if (parts.length > 2 && parts[1] === "ogfieldticket") {
    return `https://${parts[0]}.ogpumper.com`;
  }

  return "https://test.ogfieldticket.com"; // Fallback base URL
};

export const baseUrl = getBaseUrl();

export const API_VERSION = "v1";
