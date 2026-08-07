"use client";

import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ReceiptForm from "../components/ReceiptForm";
import ReceiptPreview from "../components/ReceiptPreview";
import { ReceiptData } from "../types/receipt";
import styles from "./page.module.css";
import {
  Eye,
  Edit3,
  Share2,
  Download,
  ChevronDown,
  Image as ImageIcon,
  FileText,
  Check,
  X,
  Loader2,
} from "lucide-react";

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
  
  // Download and Share formats ("png" | "pdf")
  const [downloadFormat, setDownloadFormat] = useState<"png" | "pdf">("png");
  const [shareFormat, setShareFormat] = useState<"png" | "pdf">("png");

  // Dropdown open states
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  const downloadWrapperRef = useRef<HTMLDivElement | null>(null);
  const shareWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("artaries_receipt_draft");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Could not load draft", e);
      }
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        downloadWrapperRef.current &&
        !downloadWrapperRef.current.contains(e.target as Node)
      ) {
        setIsDownloadMenuOpen(false);
      }
      if (
        shareWrapperRef.current &&
        !shareWrapperRef.current.contains(e.target as Node)
      ) {
        setIsShareMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleGenerateReceipt = async (
    actionType: "download" | "share" = "download",
    formatToUse?: "png" | "pdf"
  ) => {
    const element = document.getElementById("receipt-capture-area");
    if (!element) return;

    const format = formatToUse || (actionType === "download" ? downloadFormat : shareFormat);

    setIsGenerating(true);
    setIsDownloadMenuOpen(false);
    setIsShareMenuOpen(false);

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

      // Inline SVG images inside capture area to Data URLs for 100% reliable canvas rendering
      const imgElements = Array.from(element.querySelectorAll("img"));
      const originalSrcs: { img: HTMLImageElement; src: string }[] = [];

      for (const img of imgElements) {
        if (img.src && (img.src.endsWith(".svg") || img.src.includes(".svg"))) {
          try {
            const resp = await fetch(img.src);
            const blob = await resp.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            originalSrcs.push({ img, src: img.src });
            img.src = dataUrl;
          } catch (err) {
            console.warn("Could not inline SVG for canvas export:", err);
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 120));

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: A4_WIDTH_PX,
        height: element.scrollHeight,
      });

      // Restore original image src attributes
      for (const { img, src } of originalSrcs) {
        img.src = src;
      }

      const nameSlug = data.name ? data.name.replace(/\s+/g, "_") : "Customer";
      const pngFilename = `ARTARIES_Receipt_${nameSlug}.png`;
      const pdfFilename = `ARTARIES_Receipt_${nameSlug}.pdf`;

      // Generate jsPDF instance if format is PDF
      let pdfObj: jsPDF | null = null;
      if (format === "pdf") {
        const imgData = canvas.toDataURL("image/png", 1.0);
        pdfObj = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdfObj.addImage(imgData, "PNG", 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      }

      // Action 1: DOWNLOAD
      if (actionType === "download") {
        if (format === "pdf" && pdfObj) {
          pdfObj.save(pdfFilename);
        } else {
          const imgData = canvas.toDataURL("image/png", 1.0);
          const link = document.createElement("a");
          link.download = pngFilename;
          link.href = imgData;

          const isIOS =
            /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

          if (!isIOS) {
            link.click();
          } else {
            setModalImage(imgData);
          }
        }
        setIsGenerating(false);
        return;
      }

      // Action 2: SHARE
      if (actionType === "share") {
        let fileToShare: File | null = null;

        if (format === "pdf" && pdfObj) {
          const pdfBlob = pdfObj.output("blob");
          fileToShare = new File([pdfBlob], pdfFilename, { type: "application/pdf" });
        } else {
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/png", 1.0)
          );
          if (blob) {
            fileToShare = new File([blob], pngFilename, { type: "image/png" });
          }
        }

        if (fileToShare) {
          const canWebShare =
            typeof navigator !== "undefined" &&
            navigator.canShare &&
            navigator.canShare({ files: [fileToShare] });

          if (canWebShare) {
            try {
              await navigator.share({
                title: "Artaries Digital Receipt",
                text: `Digital Receipt for ${data.name || "Customer"}`,
                files: [fileToShare],
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

          // Fallback if Web Share is unavailable
          if (format === "pdf" && pdfObj) {
            pdfObj.save(pdfFilename);
          } else {
            const imgData = canvas.toDataURL("image/png", 1.0);
            setModalImage(imgData);
          }
        }
      }
    } catch (error) {
      console.error("Error generating receipt:", error);
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
                marginRight: "6px",
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
                marginRight: "6px",
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
              {/* 1. Download Split Button with Format Dropdown */}
              <div className={styles.buttonWrapper} ref={downloadWrapperRef}>
                <div className={styles.splitBtnGroup}>
                  <button
                    className={`btn btn-primary ${styles.mainActionBtn}`}
                    onClick={() => handleGenerateReceipt("download")}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    <span>
                      Save {downloadFormat.toUpperCase()}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.dropdownTriggerBtnPrimary}
                    onClick={() => {
                      setIsDownloadMenuOpen(!isDownloadMenuOpen);
                      setIsShareMenuOpen(false);
                    }}
                    title="Choose download format"
                    disabled={isGenerating}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {isDownloadMenuOpen && (
                  <div className={styles.dropdownMenu}>
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${downloadFormat === "png" ? styles.active : ""}`}
                      onClick={() => {
                        setDownloadFormat("png");
                        setIsDownloadMenuOpen(false);
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <ImageIcon size={14} /> PNG Image (.png)
                      </span>
                      {downloadFormat === "png" && <Check size={14} />}
                    </button>
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${downloadFormat === "pdf" ? styles.active : ""}`}
                      onClick={() => {
                        setDownloadFormat("pdf");
                        setIsDownloadMenuOpen(false);
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FileText size={14} /> PDF Document (.pdf)
                      </span>
                      {downloadFormat === "pdf" && <Check size={14} />}
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Share Split Button with Format Dropdown */}
              <div className={styles.buttonWrapper} ref={shareWrapperRef}>
                <div className={styles.splitBtnGroup}>
                  <button
                    className={`btn btn-secondary ${styles.mainActionBtn}`}
                    onClick={() => handleGenerateReceipt("share")}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Share2 size={16} />
                    )}
                    <span>
                      Share {shareFormat.toUpperCase()}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.dropdownTriggerBtnSecondary}
                    onClick={() => {
                      setIsShareMenuOpen(!isShareMenuOpen);
                      setIsDownloadMenuOpen(false);
                    }}
                    title="Choose share format"
                    disabled={isGenerating}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {isShareMenuOpen && (
                  <div className={styles.dropdownMenu}>
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${shareFormat === "png" ? styles.active : ""}`}
                      onClick={() => {
                        setShareFormat("png");
                        setIsShareMenuOpen(false);
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <ImageIcon size={14} /> PNG Image (.png)
                      </span>
                      {shareFormat === "png" && <Check size={14} />}
                    </button>
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${shareFormat === "pdf" ? styles.active : ""}`}
                      onClick={() => {
                        setShareFormat("pdf");
                        setIsShareMenuOpen(false);
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FileText size={14} /> PDF Document (.pdf)
                      </span>
                      {shareFormat === "pdf" && <Check size={14} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* iOS Touch Save Modal */}
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
                Receipt Ready
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
                alt="Generated Receipt PNG"
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
