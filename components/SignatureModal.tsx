"use client";

import React, { useRef, useState, useEffect } from "react";
import styles from "./SignatureModal.module.css";
import { X, Eraser, Check, Edit3, Type } from "lucide-react";

interface SignatureModalProps {
  title: string;
  onSave: (signatureDataUrl: string) => void;
  onClose: () => void;
}

export default function SignatureModal({
  title,
  onSave,
  onClose,
}: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");

  useEffect(() => {
    if (mode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // Handle High-DPI screens for crisp sharp signature lines
      const scale = window.devicePixelRatio || 2;
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [mode]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getCanvasCoords(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasDrawn(false);
    setTypedName("");
  };

  const handleSave = () => {
    if (mode === "draw") {
      if (!canvasRef.current || !hasDrawn) {
        alert("Please draw your signature before saving.");
        return;
      }
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSave(dataUrl);
    } else {
      if (!typedName.trim()) {
        alert("Please type your name for signature.");
        return;
      }
      // Render typed text to a canvas to generate a signature image
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 120;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0f172a";
        ctx.font = "italic 44px 'Brush Script MT', 'Dancing Script', cursive, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(typedName.trim(), 200, 60);
      }
      onSave(canvas.toDataURL("image/png"));
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>
            <Edit3 size={18} /> {title}
          </span>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tabBtn} ${mode === "draw" ? styles.active : ""}`}
              onClick={() => setMode("draw")}
            >
              <Edit3 size={14} style={{ display: "inline", marginRight: "4px" }} />
              Draw Signature
            </button>
            <button
              className={`${styles.tabBtn} ${mode === "type" ? styles.active : ""}`}
              onClick={() => setMode("type")}
            >
              <Type size={14} style={{ display: "inline", marginRight: "4px" }} />
              Type Signature
            </button>
          </div>

          {mode === "draw" ? (
            <div className={styles.canvasContainer}>
              {!hasDrawn && (
                <div className={styles.guideText}>Sign here with finger or mouse</div>
              )}
              <div className={styles.guideLine} />
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          ) : (
            <div style={{ padding: "10px 0" }}>
              <label className="form-label" style={{ marginBottom: "8px" }}>
                Type Full Name:
              </label>
              <input
                type="text"
                className={styles.typeInput}
                placeholder="e.g. John Doe"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={clearCanvas}
            style={{ fontSize: "0.85rem", padding: "0.6rem 1rem" }}
          >
            <Eraser size={16} /> Clear
          </button>

          <div className={styles.actionGroup}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              style={{ fontSize: "0.85rem", padding: "0.6rem 1rem" }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              style={{ fontSize: "0.85rem", padding: "0.6rem 1.2rem" }}
            >
              <Check size={16} /> Apply Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
