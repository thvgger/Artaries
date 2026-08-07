"use client";

import React, { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import ReceiptForm from "../components/ReceiptForm";
import ReceiptPreview from "../components/ReceiptPreview";
import { ReceiptData } from "../types/receipt";
import styles from "./page.module.css";
import { Eye, Edit3, Share2, Download, X, Loader2 } from "lucide-react";

const initialData: ReceiptData = {
  name: "",
  phone: "",
  date: new Date().toISOString().split("T")[0],
  items: [{ id: "1", description: "", qty: 1, rate: 0 }],
};

export default function Home() {
  const [data, setData] = useState<ReceiptData>(initialData);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isClient, setIsClient] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load saved draft from localStorage
    const saved = localStorage.getItem("artaries_receipt_draft");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Could not load draft", e);
      }
    }
  }, []);

  // Persist to localStorage whenever form data updates
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("artaries_receipt_draft", JSON.stringify(data));
    }
  }, [data, isClient]);

  const clearForm = () => {
    if (confirm("Are you sure you want to clear the form?")) {
      setData({ ...initialData });
      localStorage.removeItem("artaries_receipt_draft");
    }
  };

  const handleGenerateReceipt = async (action: "save" | "share" = "save") => {
    const element = document.getElementById("receipt-capture-area");
    if (!element) return;

    setIsGenerating(true);

    // Standard A4 rendering dimensions for sharp PDF/Image output
    const A4_WIDTH_PX = 794;

    const originalWidth = element.style.width;
    const originalMinWidth = element.style.minWidth;
    const originalMaxWidth = element.style.maxWidth;
    const originalBorderRadius = element.style.borderRadius;
    const originalBoxShadow = element.style.boxShadow;

    try {
      element.style.width = `${A4_WIDTH_PX}px`;
      element.style.minWidth = `${A4_WIDTH_PX}px`;
      element.style.maxWidth = `${A4_WIDTH_PX}px`;
      element.style.borderRadius = "0";
      element.style.boxShadow = "none";

      await new Promise((resolve) => setTimeout(resolve, 120));

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: A4_WIDTH_PX,
        height: element.scrollHeight,
      });

      const filename = `ARTARIES_Receipt_${data.name ? data.name.replace(/\s+/g, "_") : "Customer"}.png`;

      // Convert canvas to Blob for native iOS Web Share API
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );

      if (blob) {
        const file = new File([blob], filename, { type: "image/png" });

        // Check native Web Share support (iOS Safari & iOS PWA Standalone Mode)
        const canWebShare =
          typeof navigator !== "undefined" &&
          navigator.canShare &&
          navigator.canShare({ files: [file] });

        if (canWebShare && action === "share") {
          try {
            await navigator.share({
              title: "Artaries Digital Receipt",
              text: `Digital Receipt for ${data.name || "Customer"}`,
              files: [file],
            });
            setIsGenerating(false);
            return;
          } catch (err: any) {
            if (err.name === "AbortError") {
              setIsGenerating(false);
              return;
            }
          }
        }

        // Direct download trigger for Desktop / Android
        const imgData = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement("a");
        link.download = filename;
        link.href = imgData;

        const isIOS =
          /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

        if (!isIOS) {
          link.click();
        } else {
          // On iOS, present the modal preview for seamless touch saving
          setModalImage(imgData);
        }
      }
    } catch (error) {
      console.error("Error generating receipt image:", error);
      alert("Failed to generate receipt. Please try again.");
    } finally {
      element.style.width = originalWidth;
      element.style.minWidth = originalMinWidth;
      element.style.maxWidth = originalMaxWidth;
      element.style.borderRadius = originalBorderRadius;
      element.style.boxShadow = originalBoxShadow;
      setIsGenerating(false);
    }
  };

  if (!isClient) return null;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <img
            src="/arterieslogo.svg"
            alt="Artaries Logo"
            className={styles.headerLogo}
          />
          <h1>ARTARIES RECEIPT GENERATOR</h1>
          <span className={styles.badge}>OFFLINE READY</span>
        </div>
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

        {activeTab === "edit" ? (
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
        ) : (
          <div>
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
              <button
                className="btn btn-secondary"
                onClick={() => handleGenerateReceipt("save")}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 size={18} className="animate-spin" style={{ marginRight: "8px" }} />
                ) : (
                  <Download size={18} style={{ marginRight: "8px" }} />
                )}
                Save Receipt
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleGenerateReceipt("share")}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 size={18} className="animate-spin" style={{ marginRight: "8px" }} />
                ) : (
                  <Share2 size={18} style={{ marginRight: "8px" }} />
                )}
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
        )}
      </div>

      {/* iOS & Touch Save Modal */}
      {modalImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                backgroundColor: "#1e3a5f",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                Receipt Generated
              </span>
              <button
                onClick={() => setModalImage(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                padding: "12px",
                backgroundColor: "#f8fafc",
                fontSize: "0.85rem",
                color: "#334155",
                textAlign: "center",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              💡 <strong>Long-press the image below</strong> and select &quot;Save to Photos&quot; or &quot;Share&quot;.
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                justifyContent: "center",
                backgroundColor: "#f1f5f9",
              }}
            >
              <img
                src={modalImage}
                alt="Generated Receipt"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
            </div>

            <div
              style={{
                padding: "16px",
                backgroundColor: "#ffffff",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                gap: "12px",
              }}
            >
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setModalImage(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
