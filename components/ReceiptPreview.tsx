"use client";

import React, { useRef } from "react";
import { ReceiptData } from "../types/receipt";
import styles from "./ReceiptPreview.module.css";
import { numberToWords } from "../utils/numberToWords";

interface ReceiptPreviewProps {
  data: ReceiptData;
}

export default function ReceiptPreview({ data }: ReceiptPreviewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Calculate total
  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.qty * item.rate,
    0,
  );

  const calculatedAmountInWords = numberToWords(totalAmount);

  // Filter out completely empty rows for the sleek digital view
  const displayItems = data.items.filter(
    (item) => item.description || item.qty > 0 || item.rate > 0,
  );

  return (
    <div className={styles.previewWrapper}>
      <div
        className={styles.receiptCard}
        id="receipt-capture-area"
        ref={receiptRef}
      >
        <div className={styles.header}>
          <div className={styles.logoArea}>
            <img
              src="/arterieslogo.svg"
              alt="Artaries Logo"
              className={styles.logoImage}
            />
            <h1 className={styles.companyName}>ARTARIES</h1>
            <div className={styles.motto}>
              ...Your No. 1 Reliable Home to all Gadgets
            </div>
          </div>

          <div className={styles.contactArea}>
            <div>gadgetsbyartaries@gmail.com</div>
            <div>22, Obafemi Awolowo way, Computer Village, Ikeja, Lagos</div>
            <div style={{ marginTop: "4px", fontWeight: 600 }}>
              +234 814 168 1440 &bull; +234 815 608 5767
            </div>
          </div>
        </div>

        <div className={styles.bodyContent}>
          {/* Customer Info */}
          <div className={styles.customerInfo}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Billed To</span>
              <span className={styles.infoValue}>
                {data.name || "Customer"}
              </span>
              <span
                className={styles.infoValue}
                style={{
                  fontSize: "0.85rem",
                  color: "#64748b",
                  fontWeight: "normal",
                }}
              >
                {data.phone}
              </span>
            </div>
            <div
              className={styles.infoBlock}
              style={{ alignItems: "flex-end" }}
            >
              <span className={styles.infoLabel}>Date</span>
              <span className={styles.infoValue}>{data.date}</span>
            </div>
          </div>

          {/* Items List */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>Purchased Items</div>
            {displayItems.length > 0 ?
              displayItems.map((item, i) => (
                <div key={item.id || i} className={styles.itemRow}>
                  <div className={styles.itemDetails}>
                    <div className={styles.itemDesc}>
                      {item.description || "Item Designator"}
                      {(item.sn || item.imei) && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            marginTop: "4px",
                          }}
                        >
                          {item.sn && (
                            <span style={{ marginRight: "12px" }}>
                              S/N: {item.sn}
                            </span>
                          )}
                          {item.imei && <span>IMEI: {item.imei}</span>}
                        </div>
                      )}
                    </div>
                    <div className={styles.itemMeta}>
                      {item.qty} x ₦{item.rate.toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.itemTotal}>
                    ₦{(item.qty * item.rate).toLocaleString()}
                  </div>
                </div>
              ))
            : <div
                className={styles.itemRow}
                style={{ color: "#94a3b8", fontStyle: "italic" }}
              >
                No items added yet.
              </div>
            }
          </div>

          {/* Totals Area */}
          <div className={styles.totalsArea}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total Amount</span>
              <span className={styles.totalValue}>
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>
            <div className={styles.amountInWords}>
              {calculatedAmountInWords}
            </div>
          </div>

          {/* Signatures */}
          <div className={styles.signatures}>
            <div className={styles.sigBlock}>
              <div className={styles.sigLine}></div>
              <span className={styles.sigLabel}>Customer</span>
            </div>
            <div className={styles.sigBlock}>
              <div className={styles.sigLine}></div>
              <span className={styles.sigLabel}>Manager</span>
            </div>
          </div>
        </div>

        {/* Footer Banner */}
        <div className={styles.footerBanner}>
          <strong>Thank you for your business!</strong>
          <br />
          Items purchased in good condition are not returnable.
          <br />
          We offer a one-week warranty (no refunds after payment).
        </div>
      </div>
    </div>
  );
}
