"use client";

import React, { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import ReceiptForm from "../components/ReceiptForm";
import ReceiptPreview from "../components/ReceiptPreview";
import { ReceiptData } from "../types/receipt";
import styles from "./page.module.css";
import { Eye, Edit3, Share2, Download } from "lucide-react";

const initialData: ReceiptData = {
  name: "",
  phone: "",
  date: new Date().toISOString().split("T")[0], // Today's date natively
  items: [{ id: "1", description: "", qty: 1, rate: 0 }],
  sn: "",
  imei: "",
};

export default function Home() {
  const [data, setData] = useState<ReceiptData>(initialData);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load saved data from localStorage if exists
    const saved = localStorage.getItem("artaries_receipt_draft");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Could not load draft", e);
      }
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("artaries_receipt_draft", JSON.stringify(data));
    }
  }, [data, isClient]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Artaries Receipt",
          text: `Receipt for ${data.name || "Customer"}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      alert("Sharing is not supported on this browser.");
    }
  };

  const clearForm = () => {
    if (confirm("Are you sure you want to clear the form?")) {
      setData({ ...initialData });
      localStorage.removeItem("artaries_receipt_draft");
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("receipt-capture-area");
    if (!element) return;

    // A4 at 96 DPI = 794 x 1123 pixels
    const A4_WIDTH_PX = 794;

    // Save original inline styles so we can restore after capture
    const originalWidth = element.style.width;
    const originalMinWidth = element.style.minWidth;
    const originalMaxWidth = element.style.maxWidth;
    const originalBorderRadius = element.style.borderRadius;
    const originalBoxShadow = element.style.boxShadow;

    try {
      // Temporarily force element to A4 width for capture
      element.style.width = `${A4_WIDTH_PX}px`;
      element.style.minWidth = `${A4_WIDTH_PX}px`;
      element.style.maxWidth = `${A4_WIDTH_PX}px`;
      element.style.borderRadius = "0";
      element.style.boxShadow = "none";

      // Wait a tick for the browser to reflow at the new width
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Capture the receipt at high resolution
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: A4_WIDTH_PX,
        height: element.scrollHeight,
      });

      // Convert canvas to a downloadable PNG link
      const link = document.createElement("a");
      link.download = `ARTARIES_Receipt_${data.name ? data.name.replace(/\s+/g, "_") : "Customer"}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (error) {
      console.error("Error generating receipt image:", error);
      alert("Failed to generate receipt. Please try again.");
    } finally {
      // Always restore original responsive styles
      element.style.width = originalWidth;
      element.style.minWidth = originalMinWidth;
      element.style.maxWidth = originalMaxWidth;
      element.style.borderRadius = originalBorderRadius;
      element.style.boxShadow = originalBoxShadow;
    }
  };

  if (!isClient) return null; // Avoid hydration mismatch

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1>ARTARIES DIGITAL RECEIPT</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.toggleContainer}>
          <button
            className={`${styles.toggleBtn} ${activeTab === "edit" ? styles.active : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            <Edit3
              size={18}
              style={{
                display: "inline",
                marginRight: "8px",
                verticalAlign: "text-bottom",
              }}
            />
            Edit Details
          </button>
          <button
            className={`${styles.toggleBtn} ${activeTab === "preview" ? styles.active : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            <Eye
              size={18}
              style={{
                display: "inline",
                marginRight: "8px",
                verticalAlign: "text-bottom",
              }}
            />
            Preview Receipt
          </button>
        </div>

        {activeTab === "edit" ?
          <div>
            <ReceiptForm data={data} onChange={setData} />
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button
                className="btn btn-outline"
                onClick={clearForm}
                style={{ color: "#ef4444", borderColor: "#ef4444" }}
              >
                Clear Form
              </button>
            </div>
          </div>
        : <div>
            <div
              style={{
                overflowX: "auto",
                backgroundColor: "#e2e8f0",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
              <ReceiptPreview data={data} />
            </div>

            <div className={styles.actionFooter}>
              <button className="btn btn-secondary" onClick={handleDownloadPDF}>
                <Download size={18} style={{ marginRight: "8px" }} />
                Save Receipt
              </button>
              <button className="btn btn-primary" onClick={handleShare}>
                <Share2 size={18} style={{ marginRight: "8px" }} />
                Share Receipt
              </button>
            </div>

            <p
              style={{
                textAlign: "center",
                marginTop: "1rem",
                fontSize: "0.85rem",
                color: "#64748b",
              }}
            >
              <em>
                Tap &quot;Save Receipt&quot; to download a high-quality image
                you can print or share directly.
              </em>
            </p>
          </div>
        }
      </div>
    </main>
  );
}
