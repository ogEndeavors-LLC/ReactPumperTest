import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import * as serviceWorker from "./serviceWorker";
import ConfirmModal from "./components/ConfirmModal";
import LoadingModal from "./components/LoadingModal";

const root = ReactDOM.createRoot(document.getElementById("root"));
const RootComponent = () => {
  const [showReloadModal, setShowReloadModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setShowReloadModal(true);
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register("replay-queued-requests");
      });
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const handleReloadConfirm = () => {
    setShowLoadingModal(true);
    setShowReloadModal(false);
    setTimeout(() => {
      window.location.reload();
    }, 1000); // Simulate a loading delay
  };

  const handleReloadCancel = () => {
    setShowReloadModal(false);
  };

  return (
    <React.StrictMode>
      <Router>
        <App />
        <ConfirmModal
          show={showReloadModal}
          onConfirm={handleReloadConfirm}
          onCancel={handleReloadCancel}
          message="You are back online. Reload the page to see the latest updates."
        />
        <LoadingModal show={showLoadingModal} />
      </Router>
    </React.StrictMode>
  );
};

root.render(<RootComponent />);

serviceWorker.register({
  onUpdate: (registration) => {
    const waitingServiceWorker = registration.waiting;

    if (waitingServiceWorker) {
      waitingServiceWorker.addEventListener("statechange", (event) => {
        if (event.target.state === "activated") {
          console.log("New service worker activated.");
        }
      });

      waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    }
  },
  onSuccess: (registration) => {
    console.log("Service Worker registered successfully:", registration);
  },
});
