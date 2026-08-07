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
  Minus,
  Plus,
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

  const updateQty = (id: string, delta: number) => {
    const item = data.items.find((i) => i.id === id);
    if (item) {
      const newQty = Math.max(1, (item.qty || 1) + delta);
      handleItemChange(id, "qty", newQty);
    }
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
          <User size={20} /> Customer &amp; Receipt Info
        </h2>
        <div className={styles.grid}>
          <div className="form-group">
            <label className="form-label">Receipt Number</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ART-84920"
                value={data.receiptNo || ""}
                onChange={(e) => handleChange("receiptNo", e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={generateReceiptNo}
                title="Auto generate receipt number"
                style={{ padding: "0 14px", whiteSpace: "nowrap", height: "46px" }}
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
              style={{ cursor: "pointer", height: "46px" }}
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
              style={{ height: "46px" }}
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
              style={{ height: "46px" }}
            />
          </div>

          <div className="form-group" style={{ gridColumn: "span 1" }}>
            <label className="form-label">Issue Date</label>
            <input
              type="date"
              className="form-input"
              value={data.date}
              onChange={(e) => handleChange("date", e.target.value)}
              style={{ height: "46px" }}
            />
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <ShoppingBag size={20} /> Items ({data.items.length})
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
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. iPhone 15 Pro Max 256GB"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(item.id, "description", e.target.value)
                    }
                    style={{ height: "46px" }}
                  />
                </div>

                <div className={styles.snImeiGroup}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Serial Number (S/N)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Serial No."
                      value={item.sn || ""}
                      onChange={(e) =>
                        handleItemChange(item.id, "sn", e.target.value)
                      }
                      style={{ height: "46px" }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">IMEI Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="IMEI No."
                      value={item.imei || ""}
                      onChange={(e) =>
                        handleItemChange(item.id, "imei", e.target.value)
                      }
                      style={{ height: "46px" }}
                    />
                  </div>
                </div>

                <div className={styles.qtyRateGroup}>
                  {/* Mobile Touch Stepper for Qty */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Quantity</label>
                    <div className={styles.stepperContainer}>
                      <button
                        type="button"
                        className={styles.stepperBtn}
                        onClick={() => updateQty(item.id, -1)}
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        type="number"
                        className={styles.stepperInput}
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
                      <button
                        type="button"
                        className={styles.stepperBtn}
                        onClick={() => updateQty(item.id, 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Currency Prefix Rate Input */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Unit Rate (₦)</label>
                    <div className={styles.currencyInputWrapper}>
                      <span className={styles.currencyPrefix}>₦</span>
                      <input
                        type="number"
                        className={`${styles.currencyInput} form-input`}
                        min="0"
                        placeholder="0"
                        value={item.rate === 0 ? "" : item.rate}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleItemChange(
                            item.id,
                            "rate",
                            val === "" ? 0 : parseInt(val) || 0
                          );
                        }}
                        style={{ height: "46px" }}
                      />
                    </div>
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
          <div className={styles.sigCard}>
            <div className={styles.sigCardHeader}>
              <span>Manager Signature</span>
              {data.managerSignature && (
                <span className={styles.signedBadge}>
                  <CheckCircle2 size={12} /> Signed
                </span>
              )}
            </div>
            {data.managerSignature ? (
              <div className={styles.sigPreviewBox}>
                <img
                  src={data.managerSignature}
                  alt="Manager Signature"
                  className={styles.sigImage}
                />
                <button
                  type="button"
                  onClick={() => removeSignature("manager")}
                  className={styles.sigRemoveBtn}
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
                style={{ width: "100%", fontSize: "0.9rem", padding: "0.75rem" }}
              >
                <PenTool size={16} /> Tap to Sign as Manager
              </button>
            )}
          </div>

          {/* Customer Signature Card */}
          <div className={styles.sigCard}>
            <div className={styles.sigCardHeader}>
              <span>Customer Signature</span>
              {data.customerSignature && (
                <span className={styles.signedBadge}>
                  <CheckCircle2 size={12} /> Signed
                </span>
              )}
            </div>
            {data.customerSignature ? (
              <div className={styles.sigPreviewBox}>
                <img
                  src={data.customerSignature}
                  alt="Customer Signature"
                  className={styles.sigImage}
                />
                <button
                  type="button"
                  onClick={() => removeSignature("customer")}
                  className={styles.sigRemoveBtn}
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
                style={{ width: "100%", fontSize: "0.9rem", padding: "0.75rem" }}
              >
                <PenTool size={16} /> Tap to Sign as Customer
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
