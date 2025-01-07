// config.js
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  if (parts.length > 2 && parts[1] === "ogpumper") {
    return `https://${parts[0]}.ogpumper.net`;
  }

  return "https://testtwo.ogpumper.net"; // Fallback base URL
};

export const baseUrl = getBaseUrl();

export const API_VERSION = "v1";
