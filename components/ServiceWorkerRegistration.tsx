"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function ServiceWorkerRegistration() {
  const [isOffline, setIsOffline] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Service Worker Registration
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log("Service Worker registered with scope:", registration.scope);
            
            // Check for service worker updates periodically
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                      console.log("New content is available; please refresh.");
                    } else {
                      console.log("Content is cached for offline use.");
                    }
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });
      });
    }

    // Online / Offline Status Detection
    const handleOffline = () => {
      setIsOffline(true);
      setShowStatus(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 4000);
      return () => clearTimeout(timer);
    };

    // Check initial state
    if (typeof window !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
      setShowStatus(true);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: isOffline ? "#0f172a" : "#166534",
        color: "#ffffff",
        padding: "10px 18px",
        borderRadius: "24px",
        fontSize: "0.85rem",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
        zIndex: 99999,
        transition: "all 0.3s ease",
        border: `1px solid ${isOffline ? "#334155" : "#22c55e"}`,
      }}
    >
      {isOffline ? (
        <>
          <WifiOff size={16} style={{ color: "#f87171" }} />
          <span>Offline Mode &bull; Generating receipts locally</span>
        </>
      ) : (
        <>
          <Wifi size={16} style={{ color: "#4ade80" }} />
          <span>Back Online</span>
        </>
      )}
    </div>
  );
}
