"use client";

import React from "react";
import { ReceiptData, ReceiptItem } from "../types/receipt";
import styles from "./ReceiptForm.module.css";
import { PlusCircle, Trash2, User, ShoppingBag, FileText } from "lucide-react";

interface ReceiptFormProps {
  data: ReceiptData;
  onChange: (data: ReceiptData) => void;
}

export default function ReceiptForm({ data, onChange }: ReceiptFormProps) {
  const handleChange = (field: keyof ReceiptData, value: string) => {
    onChange({ ...data, [field]: value });
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
    if (data.items.length <= 1) return; // Keep at least one item
    onChange({ ...data, items: data.items.filter((item) => item.id !== id) });
  };

  return (
    <div className={styles.formContainer}>
      {/* Customer Info Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <User size={20} /> Customer Details
        </h2>
        <div className={styles.grid}>
          <div className="form-group">
            <label className="form-label">Name</label>
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
              placeholder="e.g. +234 814..."
              value={data.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
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
          <ShoppingBag size={20} /> Items
        </h2>

        <div className={styles.itemsContainer}>
          {data.items.map((item, index) => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <span>Item #{index + 1}</span>
                {data.items.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className={styles.itemGrid}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. iPhone 15 Pro Max"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(item.id, "description", e.target.value)
                    }
                  />
                </div>

                <div className={styles.qtyRateGroup}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Qty</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={item.qty}
                      onChange={(e) =>
                        handleItemChange(
                          item.id,
                          "qty",
                          parseInt(e.target.value) || 0,
                        )
                      }
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Rate (₦)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={item.rate}
                      onChange={(e) =>
                        handleItemChange(
                          item.id,
                          "rate",
                          parseInt(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                </div>

                <div className={styles.amountPreview}>
                  Amount: ₦{(item.qty * item.rate).toLocaleString()}
                </div>
              </div>
            </div>
          ))}

          <button type="button" className={styles.addBtn} onClick={addItem}>
            <PlusCircle size={20} /> Add Another Item
          </button>
        </div>
      </div>

      {/* Additional Details Section */}
      <div className={styles.section} style={{ marginBottom: 0 }}>
        <h2 className={styles.sectionTitle}>
          <FileText size={20} /> Additional Details
        </h2>
        <div className={styles.grid}>
          <div className="form-group">
            <label className="form-label">S/N</label>
            <input
              type="text"
              className="form-input"
              value={data.sn}
              onChange={(e) => handleChange("sn", e.target.value)}
            />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">IMEI</label>
            <input
              type="text"
              className="form-input"
              value={data.imei}
              onChange={(e) => handleChange("imei", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
