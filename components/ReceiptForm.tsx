"use client";

import React, { useState } from "react";
import { ReceiptData, ReceiptItem } from "../types/receipt";
import styles from "./ReceiptForm.module.css";
import SignatureModal from "./SignatureModal";
import {
  PlusCircle,
  Trash2,
  User,
  ShoppingBag,
  Hash,
  PenTool,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ReceiptFormProps {
  data: ReceiptData;
  onChange: (data: ReceiptData) => void;
}

export default function ReceiptForm({ data, onChange }: ReceiptFormProps) {
  const [activeSigner, setActiveSigner] = useState<"manager" | "customer" | null>(null);

  const handleChange = (field: keyof ReceiptData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const generateReceiptNo = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    onChange({ ...data, receiptNo: `ART-${randomNum}` });
  };

  const handleItemChange = (
    id: string,
    field: keyof ReceiptItem,
    value: string | number,
  ) => {
    const newItems = data.items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItem: ReceiptItem = {
      id: crypto.randomUUID(),
      description: "",
      qty: 1,
      rate: 0,
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const removeItem = (id: string) => {
    if (data.items.length <= 1) return;
    onChange({ ...data, items: data.items.filter((item) => item.id !== id) });
  };

  const handleSaveSignature = (dataUrl: string) => {
    if (activeSigner === "manager") {
      onChange({ ...data, managerSignature: dataUrl });
    } else if (activeSigner === "customer") {
      onChange({ ...data, customerSignature: dataUrl });
    }
    setActiveSigner(null);
  };

  const removeSignature = (signer: "manager" | "customer") => {
    if (signer === "manager") {
      const { managerSignature, ...rest } = data;
      onChange({ ...rest });
    } else {
      const { customerSignature, ...rest } = data;
      onChange({ ...rest });
    }
  };

  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.qty * item.rate,
    0
  );

  return (
    <div className={`${styles.formContainer} animate-fade-in`}>
      {/* Customer & Order Metadata Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <User size={20} /> Receipt & Customer Information
        </h2>
        <div className={styles.grid}>
          <div className="form-group">
            <label className="form-label">Receipt Number (Optional)</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ART-8492"
                value={data.receiptNo || ""}
                onChange={(e) => handleChange("receiptNo", e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={generateReceiptNo}
                title="Auto generate receipt number"
                style={{ padding: "0 12px", whiteSpace: "nowrap" }}
              >
                <Hash size={16} /> Auto
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select
              className="form-input"
              value={data.paymentMethod || "Transfer"}
              onChange={(e) => handleChange("paymentMethod", e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="Transfer">Bank Transfer</option>
              <option value="POS / Card">POS / Card</option>
              <option value="Cash">Cash</option>
              <option value="Split Payment">Split Payment</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Customer Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. John Doe"
              value={data.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="e.g. +234 814 168 1440"
              value={data.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <div className="form-group" style={{ gridColumn: "span 1" }}>
            <label className="form-label">Issue Date</label>
            <input
              type="date"
              className="form-input"
              value={data.date}
              onChange={(e) => handleChange("date", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <ShoppingBag size={20} /> Purchased Items ({data.items.length})
        </h2>

        <div className={styles.itemsContainer}>
          {data.items.map((item, index) => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <span className={styles.itemBadge}>Item #{index + 1}</span>
                {data.items.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className={styles.itemGrid}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Item Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. iPhone 15 Pro Max (256GB - Natural Titanium)"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(item.id, "description", e.target.value)
                    }
                  />
                </div>

                <div className={styles.qtyRateGroup}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Serial Number (S/N)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. F2LX..."
                      value={item.sn || ""}
                      onChange={(e) =>
                        handleItemChange(item.id, "sn", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">IMEI Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 3520..."
                      value={item.imei || ""}
                      onChange={(e) =>
                        handleItemChange(item.id, "imei", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className={styles.qtyRateGroup}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={item.qty === 0 ? "" : item.qty}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleItemChange(
                          item.id,
                          "qty",
                          val === "" ? 0 : parseInt(val) || 0
                        );
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Unit Rate (₦)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={item.rate === 0 ? "" : item.rate}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleItemChange(
                          item.id,
                          "rate",
                          val === "" ? 0 : parseInt(val) || 0
                        );
                      }}
                    />
                  </div>
                </div>

                <div className={styles.amountPreview}>
                  Subtotal: ₦{(item.qty * item.rate).toLocaleString()}
                </div>
              </div>
            </div>
          ))}

          <button type="button" className={styles.addBtn} onClick={addItem}>
            <PlusCircle size={20} /> Add Another Item
          </button>
        </div>

        {/* Live Total Summary Bar */}
        <div className={styles.summaryBar}>
          <div>
            <div className={styles.summaryLabel}>Total Receipt Value</div>
            <div style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
              {data.items.length} item{data.items.length > 1 ? "s" : ""} included
            </div>
          </div>
          <div className={styles.summaryValue}>
            ₦{totalAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Digital Signatures Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <PenTool size={20} /> Digital Signatures
        </h2>
        <div className={styles.grid}>
          {/* Manager / Issuer Signature Card */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e3a5f" }}>
              Manager / Issuer Signature
            </span>
            {data.managerSignature ? (
              <div
                style={{
                  width: "100%",
                  height: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  position: "relative",
                }}
              >
                <img
                  src={data.managerSignature}
                  alt="Manager Signature"
                  style={{ maxHeight: "70px", maxWidth: "90%", objectFit: "contain" }}
                />
                <button
                  type="button"
                  onClick={() => removeSignature("manager")}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                  }}
                  title="Remove signature"
                >
                  <XCircle size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActiveSigner("manager")}
                style={{ width: "100%", fontSize: "0.85rem", padding: "0.6rem" }}
              >
                <PenTool size={16} /> Sign as Manager
              </button>
            )}
          </div>

          {/* Customer Signature Card */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e3a5f" }}>
              Customer Signature
            </span>
            {data.customerSignature ? (
              <div
                style={{
                  width: "100%",
                  height: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  position: "relative",
                }}
              >
                <img
                  src={data.customerSignature}
                  alt="Customer Signature"
                  style={{ maxHeight: "70px", maxWidth: "90%", objectFit: "contain" }}
                />
                <button
                  type="button"
                  onClick={() => removeSignature("customer")}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                  }}
                  title="Remove signature"
                >
                  <XCircle size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActiveSigner("customer")}
                style={{ width: "100%", fontSize: "0.85rem", padding: "0.6rem" }}
              >
                <PenTool size={16} /> Sign as Customer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {activeSigner && (
        <SignatureModal
          title={
            activeSigner === "manager"
              ? "Manager / Issuer Signature"
              : "Customer Signature"
          }
          onSave={handleSaveSignature}
          onClose={() => setActiveSigner(null)}
        />
      )}
    </div>
  );
}
