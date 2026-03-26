function PaymentPage({
  actionInFlight,
  ButtonLabel,
  TableSkeleton,
  DetailCardSkeleton,
  allPayments,
  paymentSearchQuery,
  setPaymentSearchQuery,
  handleLoadAllPayments,
  pendingAction,
  formatMoney,
  setPaymentData,
  setOrderId,
  setCurrentOrderSnapshot,
  setPage,
  setNotice,
  currentOrderSnapshot,
  orderId,
  expectedPaymentAmount,
  paymentForm,
  setPaymentForm,
  handlePaymentMethodChange,
  PAYMENT_METHODS,
  paymentBalance,
  handleVerifyPaymentDetails,
  paymentVerified,
  handleProcessPayment,
  handleLoadPaymentStatus,
  paymentData,
  handleConfirmPayment,
  getPaymentStage,
  formatDate,
}) {
  return (
    <main className="page-grid">
      <section className="panel full-width">
        <div className="panel-heading">
          <div>
            <p className="section-label">All Payments</p>
            <h2>View payment history</h2>
          </div>
        </div>

        <div className="shipment-action-row">
          <button
            type="button"
            className="secondary-button"
            onClick={handleLoadAllPayments}
            disabled={actionInFlight}
          >
            <ButtonLabel
              loading={pendingAction === "load-all-payments"}
              loadingText="Loading Payments..."
            >
              Load All Payments
            </ButtonLabel>
          </button>
        </div>

        {pendingAction === "load-all-payments" && (
          <TableSkeleton columns={6} rows={4} className="payment-search-results" />
        )}

        {allPayments.length > 0 && (
          <>
            <input
              type="text"
              value={paymentSearchQuery}
              onChange={(e) => setPaymentSearchQuery(e.target.value)}
              placeholder="Search by payment ID, order ID, payment method, or status"
            />

            <div className="payment-search-results">
              <div className="payment-table payment-table-head">
                <span>Payment ID</span>
                <span>Order ID</span>
                <span>Method</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {allPayments
                .filter((payment) => {
                  const query = paymentSearchQuery.trim().toLowerCase();
                  if (!query) {
                    return true;
                  }

                  return (
                    String(payment.paymentId || "").includes(query) ||
                    String(payment.orderId || "").includes(query) ||
                    (payment.paymentMethod || "").toLowerCase().includes(query) ||
                    String(payment.amount || "").toLowerCase().includes(query) ||
                    (payment.paymentStatus || "").toLowerCase().includes(query)
                  );
                })
                .map((payment) => (
                  <article
                    key={payment.paymentId}
                    className="payment-table payment-table-row"
                  >
                    <span className="payment-table-id">#{payment.paymentId}</span>
                    <span>#{payment.orderId}</span>
                    <span>{payment.paymentMethod || "N/A"}</span>
                    <span>{formatMoney(payment.amount)}</span>
                    <span
                      className={`status-pill payment-status-badge status-${payment.paymentStatus?.toLowerCase()}`}
                    >
                      {payment.paymentStatus}
                    </span>
                    <div className="payment-table-action">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {
                          setPaymentData(payment);
                          setOrderId(payment.orderId ?? null);
                          setCurrentOrderSnapshot((snapshot) => ({
                            ...(snapshot || {}),
                            orderId: payment.orderId ?? snapshot?.orderId ?? null,
                            totalAmount: Number(payment.amount || snapshot?.totalAmount || 0),
                          }));
                          setPage("payment");
                          setNotice(`Loaded payment #${payment.paymentId}`);
                        }}
                      >
                        View
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          </>
        )}
      </section>

      <section className="panel full-width">
        <div className="panel-heading">
          <div>
            <p className="section-label">Payment Processing</p>
            <h2>Complete your payment</h2>
          </div>
        </div>

        <div className="payment-summary-card">
          <span>Current Order</span>
          <strong>#{currentOrderSnapshot?.orderId || orderId || "N/A"}</strong>
          <span>Order Total</span>
          <strong>{formatMoney(expectedPaymentAmount)}</strong>
        </div>

        {currentOrderSnapshot && (
          <>
            <div className="payment-summary-card compact">
              <span>Customer</span>
              <strong>{currentOrderSnapshot.customerName || "N/A"}</strong>
              <span>Items</span>
              <strong>{currentOrderSnapshot.items?.length || 0}</strong>
            </div>

            <section className="payment-order-context">
              <div className="payment-order-grid">
                <div>
                  <span>Email</span>
                  <strong>{currentOrderSnapshot.email || "N/A"}</strong>
                </div>
                <div>
                  <span>Contact</span>
                  <strong>{currentOrderSnapshot.contactNumber || "N/A"}</strong>
                </div>
                <div className="payment-order-address">
                  <span>Delivery Address</span>
                  <strong>{currentOrderSnapshot.deliveryAddress || "N/A"}</strong>
                </div>
              </div>

              <div className="payment-order-items">
                <div className="payment-order-items-head">
                  <span>Order Items</span>
                  <strong>{currentOrderSnapshot.items?.length || 0} lines</strong>
                </div>

                {(currentOrderSnapshot.items || []).map((item, index) => (
                  <article
                    key={item.orderItemId || `${item.productId}-${index}`}
                    className="payment-order-item"
                  >
                    <div>
                      <strong>{item.productName || `Product #${item.productId}`}</strong>
                      <span>Qty {item.quantity}</span>
                    </div>
                    <strong>{formatMoney(item.subtotal ?? item.price)}</strong>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        <form
          className="payment-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleProcessPayment();
          }}
        >
          {paymentForm.paymentMethod !== "Cash" && (
            <input
              type="number"
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, amount: e.target.value })
              }
              placeholder="Amount"
              step="0.01"
              min="0"
              required
            />
          )}

          <select
            value={paymentForm.paymentMethod}
            onChange={(e) => handlePaymentMethodChange(e.target.value)}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>

          {paymentForm.paymentMethod === "Cash" && (
            <>
              <input
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, amount: e.target.value })
                }
                placeholder="Cash received from customer"
                step="0.01"
                min="0"
                required
              />
              <div className="payment-summary-card compact">
                <span>Required Amount</span>
                <strong>{formatMoney(expectedPaymentAmount)}</strong>
                <span>Balance</span>
                <strong>{formatMoney(paymentBalance)}</strong>
              </div>
            </>
          )}

          {paymentForm.paymentMethod === "BANK_TRANSFER" && (
            <>
              <input
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, amount: e.target.value })
                }
                placeholder="Transferred amount"
                step="0.01"
                min="0"
                required
              />
              <input
                value={paymentForm.accountNumber}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    accountNumber: e.target.value,
                  })
                }
                placeholder="Account number"
                required
              />
              <input
                value={paymentForm.accountName}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    accountName: e.target.value,
                  })
                }
                placeholder="Account name"
                required
              />
              <input
                value={paymentForm.transactionId}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    transactionId: e.target.value,
                  })
                }
                placeholder="Transaction ID"
                required
              />
              <button
                type="button"
                className="secondary-button"
                onClick={handleVerifyPaymentDetails}
                disabled={actionInFlight}
              >
                <ButtonLabel loading={false}>Verify Transfer</ButtonLabel>
              </button>
            </>
          )}

          {paymentForm.paymentMethod === "CHEQUE" && (
            <>
              <input
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, amount: e.target.value })
                }
                placeholder="Cheque amount"
                step="0.01"
                min="0"
                required
              />
              <input
                value={paymentForm.chequeNumber}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    chequeNumber: e.target.value,
                  })
                }
                placeholder="Cheque number"
                required
              />
              <input
                value={paymentForm.bankName}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    bankName: e.target.value,
                  })
                }
                placeholder="Bank name"
                required
              />
              <button
                type="button"
                className="secondary-button"
                onClick={handleVerifyPaymentDetails}
                disabled={actionInFlight}
              >
                <ButtonLabel loading={false}>Verify Cheque</ButtonLabel>
              </button>
            </>
          )}

          {paymentForm.paymentMethod !== "Cash" && paymentVerified && (
            <div className="payment-summary-card compact success-state">
              <span>Verification</span>
              <strong>Verified</strong>
            </div>
          )}

          <button type="submit" disabled={actionInFlight}>
            <ButtonLabel
              loading={pendingAction === "process-payment"}
              loadingText="Processing Payment..."
            >
              Process Payment
            </ButtonLabel>
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">Payment Status</p>
            <h2>View payment details</h2>
          </div>
        </div>

        <div className="form-grid">
          <button
            type="button"
            onClick={handleLoadPaymentStatus}
            disabled={actionInFlight}
          >
            <ButtonLabel
              loading={pendingAction === "load-payment-status"}
              loadingText="Loading Payment..."
            >
              Load Payment Status
            </ButtonLabel>
          </button>
          {paymentData && paymentData.paymentStatus === "PENDING" && (
            <button
              type="button"
              className="secondary-button"
              onClick={handleConfirmPayment}
              disabled={actionInFlight}
            >
              <ButtonLabel
                loading={pendingAction === "confirm-payment"}
                loadingText="Confirming..."
              >
                Confirm Payment
              </ButtonLabel>
            </button>
          )}
        </div>

        {pendingAction === "load-payment-status" && !paymentData && (
          <DetailCardSkeleton lines={6} className="payment-card" />
        )}

        {paymentData && (
          <div className="payment-card">
            <div className="payment-card-header">
              <div>
                <strong>Payment #{paymentData.paymentId}</strong>
                <span>Order #{paymentData.orderId}</span>
              </div>
              <span
                className={`status-pill payment-status-badge status-${paymentData.paymentStatus?.toLowerCase()}`}
              >
                {paymentData.paymentStatus}
              </span>
            </div>

            <div className="payment-timeline">
              {["Created", "Verification", "Processed", "Paid"].map(
                (label, index) => (
                  <div
                    key={label}
                    className={`payment-timeline-step ${
                      index + 1 <= getPaymentStage(paymentData.paymentStatus)
                        ? "completed"
                        : ""
                    }`}
                  >
                    <span>{index + 1}</span>
                    <small>{label}</small>
                  </div>
                )
              )}
            </div>

            <div className="payment-metadata">
              <div>
                <span>Method</span>
                <strong>{paymentData.paymentMethod}</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>{formatMoney(paymentData.amount)}</strong>
              </div>
              <div>
                <span>Recorded At</span>
                <strong>{formatDate(paymentData.paymentDate || paymentData.createdAt)}</strong>
              </div>
            </div>

            {paymentData.paymentStatus === "PAID" && (
              <button
                type="button"
                onClick={() => setPage("shipment")}
                disabled={actionInFlight}
                style={{ marginTop: "12px" }}
              >
                <ButtonLabel loading={false}>Proceed to Shipment</ButtonLabel>
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default PaymentPage;
