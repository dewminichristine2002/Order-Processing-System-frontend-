import { useEffect, useRef, useState } from "react";

function HistoryPage({
  actionInFlight,
  ButtonLabel,
  TableSkeleton,
  pendingAction,
  formatMoney,
  allOrders,
  orderSearchQuery,
  setOrderSearchQuery,
  handleLoadAllOrders,
  handleViewOrderDetails,
  allPayments,
  paymentSearchQuery,
  setPaymentSearchQuery,
  handleLoadAllPayments,
  handleViewPaymentDetails,
  allShipments,
  shipmentSearchQuery,
  setShipmentSearchQuery,
  handleLoadAllShipments,
  handleViewShipmentDetails,
  formatDate,
}) {
  const [historyView, setHistoryView] = useState("orders");
  const [viewOrderModal, setViewOrderModal] = useState(null);
  const [viewPaymentModal, setViewPaymentModal] = useState(null);
  const [viewShipmentModal, setViewShipmentModal] = useState(null);
  const hasRequestedOrders = useRef(false);
  const hasRequestedPayments = useRef(false);
  const hasRequestedShipments = useRef(false);

  useEffect(() => {
    if (historyView === "orders" && !hasRequestedOrders.current) {
      hasRequestedOrders.current = true;
      handleLoadAllOrders();
    }

    if (historyView === "payments" && !hasRequestedPayments.current) {
      hasRequestedPayments.current = true;
      handleLoadAllPayments();
    }

    if (historyView === "shipments" && !hasRequestedShipments.current) {
      hasRequestedShipments.current = true;
      handleLoadAllShipments();
    }
  }, [historyView, handleLoadAllOrders, handleLoadAllPayments, handleLoadAllShipments]);

  async function handleOpenOrderModal(order) {
    const loadedOrder = await handleViewOrderDetails(order);
    if (loadedOrder) {
      setViewOrderModal(loadedOrder);
    }
  }

  async function handleOpenPaymentModal(payment) {
    const loadedPayment = await handleViewPaymentDetails(payment);
    if (loadedPayment) {
      setViewPaymentModal(loadedPayment);
    }
  }

  async function handleOpenShipmentModal(shipment) {
    const loadedShipment = await handleViewShipmentDetails(shipment);
    if (loadedShipment) {
      setViewShipmentModal(loadedShipment);
    }
  }

  const orderQuery = orderSearchQuery.trim().toLowerCase();
  const paymentQuery = paymentSearchQuery.trim().toLowerCase();
  const shipmentQuery = shipmentSearchQuery.trim().toLowerCase();

  const filteredOrders = allOrders.filter((order) => {
    if (!orderQuery) {
      return true;
    }

    return (
      String(order.orderId || "").includes(orderQuery) ||
      (order.customerName || "").toLowerCase().includes(orderQuery) ||
      (order.contactNumber || "").toLowerCase().includes(orderQuery) ||
      (order.status || "").toLowerCase().includes(orderQuery) ||
      String(order.totalAmount || "").toLowerCase().includes(orderQuery)
    );
  });

  const sortedFilteredOrders = [...filteredOrders].sort((left, right) => {
    const leftTime = new Date(left.createdAt || left.orderDate || 0).getTime();
    const rightTime = new Date(right.createdAt || right.orderDate || 0).getTime();

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return Number(right.orderId || 0) - Number(left.orderId || 0);
  });

  const filteredPayments = allPayments.filter((payment) => {
    if (!paymentQuery) {
      return true;
    }

    return (
      String(payment.paymentId || "").includes(paymentQuery) ||
      String(payment.orderId || "").includes(paymentQuery) ||
      (payment.paymentMethod || "").toLowerCase().includes(paymentQuery) ||
      String(payment.amount || "").toLowerCase().includes(paymentQuery) ||
      (payment.paymentStatus || "").toLowerCase().includes(paymentQuery)
    );
  });

  const filteredShipments = allShipments.filter((shipment) => {
    if (!shipmentQuery) {
      return true;
    }

    return (
      String(shipment.shipmentId).includes(shipmentQuery) ||
      String(shipment.orderId).includes(shipmentQuery) ||
      (shipment.customerName || "").toLowerCase().includes(shipmentQuery) ||
      (shipment.shipmentStatus || "").toLowerCase().includes(shipmentQuery) ||
      (shipment.deliveryPerson || "").toLowerCase().includes(shipmentQuery)
    );
  });

  const visibleOrderValue = filteredOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0,
  );
  const visiblePaymentValue = filteredPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );
  const pendingOrderCount = filteredOrders.filter(
    (order) => (order.status || "").toUpperCase() === "PENDING",
  ).length;
  const paidPaymentCount = filteredPayments.filter(
    (payment) => (payment.paymentStatus || "").toUpperCase() === "PAID",
  ).length;
  const deliveredShipmentCount = filteredShipments.filter(
    (shipment) => (shipment.shipmentStatus || "").toUpperCase() === "DELIVERED",
  ).length;
  const shippedShipmentCount = filteredShipments.filter(
    (shipment) => (shipment.shipmentStatus || "").toUpperCase() === "SHIPPED",
  ).length;

  return (
    <>
      <main className="page-grid">
        <section className="panel full-width">
          <div className="panel-heading">
            <div>
              <p className="section-label">History Workspace</p>
              <h2>Browse processing history by domain</h2>
            </div>
          </div>

          <div className="history-switcher" role="tablist" aria-label="History Lists">
            {["orders", "payments", "shipments"].map((view) => (
              <button
                key={view}
                type="button"
                className={historyView === view ? "active" : ""}
                onClick={() => setHistoryView(view)}
              >
                {view === "orders" && "Orders"}
                {view === "payments" && "Payments"}
                {view === "shipments" && "Shipments"}
              </button>
            ))}
          </div>

          {historyView === "orders" && (
            <>
              <div className="order-overview-grid compact">
                <article className="workflow-summary">
                  <span>Total Orders</span>
                  <strong>{allOrders.length}</strong>
                </article>
                <article className="workflow-summary">
                  <span>Visible Results</span>
                  <strong>{filteredOrders.length}</strong>
                </article>
                <article className="workflow-summary">
                  <span>Visible Value</span>
                  <strong>{formatMoney(visibleOrderValue)}</strong>
                </article>
                <article className="workflow-summary">
                  <span>Pending Orders</span>
                  <strong>{pendingOrderCount}</strong>
                </article>
              </div>

              <div className="shipment-action-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleLoadAllOrders}
                  disabled={actionInFlight}
                >
                  <ButtonLabel
                    loading={pendingAction === "load-all-orders"}
                    loadingText="Loading Orders..."
                  >
                    Load All Orders
                  </ButtonLabel>
                </button>
              </div>

              {pendingAction === "load-all-orders" && (
                <TableSkeleton columns={6} rows={4} className="order-search-results" />
              )}

              {allOrders.length > 0 && (
                <>
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search by order ID, customer, contact, status, or total amount"
                  />

                  <div className="order-search-results">
                    <div className="order-table order-table-head">
                      <span>Order ID</span>
                      <span>Customer</span>
                      <span>Contact</span>
                      <span>Total</span>
                      <span>Status</span>
                      <span>Action</span>
                    </div>

                    {sortedFilteredOrders.map((order) => (
                        <article key={order.orderId} className="order-table order-table-row">
                          <span className="order-table-id">#{order.orderId}</span>
                          <span>{order.customerName || "N/A"}</span>
                          <span>{order.contactNumber || "N/A"}</span>
                          <span>{formatMoney(order.totalAmount)}</span>
                          <span className={`status-pill status-${order.status?.toLowerCase()}`}>
                            {order.status || "N/A"}
                          </span>
                          <div className="order-table-action">
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() => handleOpenOrderModal(order)}
                              disabled={actionInFlight && pendingAction === "load-order-details"}
                            >
                              View
                            </button>
                          </div>
                        </article>
                      ))}
                  </div>
                </>
              )}
            </>
          )}

          {historyView === "payments" && (
            <>
              <div className="order-overview-grid compact">
                <article className="workflow-summary">
                  <span>Total Payments</span>
                  <strong>{allPayments.length}</strong>
                </article>
                <article className="workflow-summary">
                  <span>Visible Results</span>
                  <strong>{filteredPayments.length}</strong>
                </article>
                <article className="workflow-summary">
                  <span>Visible Amount</span>
                  <strong>{formatMoney(visiblePaymentValue)}</strong>
                </article>
                <article className="workflow-summary">
                  <span>Paid Records</span>
                  <strong>{paidPaymentCount}</strong>
                </article>
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

                    {filteredPayments.map((payment) => (
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
                              onClick={() => handleOpenPaymentModal(payment)}
                              disabled={actionInFlight && pendingAction === "load-payment-details"}
                            >
                              View
                            </button>
                          </div>
                        </article>
                      ))}
                  </div>
                </>
              )}
            </>
          )}

          {historyView === "shipments" && (
            <>
              <div className="order-overview-grid compact">
                <article className="workflow-summary">
                  <span>Total Shipments</span>
                  <strong>{allShipments.length}</strong>
                </article>
                <article className="workflow-summary">
                  <span>Visible Results</span>
                  <strong>{filteredShipments.length}</strong>
                </article>
                <article className="workflow-summary">
                  <span>Delivered</span>
                  <strong>{deliveredShipmentCount}</strong>
                </article>
                <article className="workflow-summary">
                  <span>Shipped</span>
                  <strong>{shippedShipmentCount}</strong>
                </article>
              </div>

              <div className="shipment-action-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleLoadAllShipments}
                  disabled={actionInFlight}
                >
                  <ButtonLabel
                    loading={pendingAction === "load-all-shipments"}
                    loadingText="Loading Shipments..."
                  >
                    Load All Shipments
                  </ButtonLabel>
                </button>
              </div>

              {pendingAction === "load-all-shipments" && (
                <TableSkeleton columns={6} rows={4} className="shipment-search-results" />
              )}

              {allShipments.length > 0 && (
                <>
                  <input
                    type="text"
                    value={shipmentSearchQuery}
                    onChange={(e) => setShipmentSearchQuery(e.target.value)}
                    placeholder="Search by shipment ID, order ID, customer, status, or delivery person"
                  />

                  <div className="shipment-search-results">
                    <div className="shipment-table shipment-table-head">
                      <span>Shipment ID</span>
                      <span>Order ID</span>
                      <span>Customer</span>
                      <span>Status</span>
                      <span>Delivery Person</span>
                      <span>Action</span>
                    </div>

                    {filteredShipments.map((shipment) => (
                        <article
                          key={shipment.shipmentId}
                          className="shipment-table shipment-table-row"
                        >
                          <span className="shipment-table-id">#{shipment.shipmentId}</span>
                          <span>#{shipment.orderId}</span>
                          <span>{shipment.customerName || "N/A"}</span>
                          <span className="status-pill">{shipment.shipmentStatus}</span>
                          <span>{shipment.deliveryPerson || "Unassigned"}</span>
                          <div className="shipment-table-action">
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() => handleOpenShipmentModal(shipment)}
                              disabled={actionInFlight && pendingAction === "load-shipment-details"}
                            >
                              View
                            </button>
                          </div>
                        </article>
                      ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </main>

      {viewOrderModal && (
        <div
          className="order-view-modal-backdrop"
          role="presentation"
          onClick={() => setViewOrderModal(null)}
        >
          <section
            className="order-view-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-order-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="order-view-modal-head">
              <div>
                <p className="section-label">Order Details</p>
                <h3 id="view-order-title">Order #{viewOrderModal.orderId}</h3>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setViewOrderModal(null)}
              >
                Close
              </button>
            </div>

            <div className="order-view-modal-grid">
              <div>
                <span>Customer</span>
                <strong>{viewOrderModal.customerName || "N/A"}</strong>
              </div>
              <div>
                <span>Contact</span>
                <strong>{viewOrderModal.contactNumber || "N/A"}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{viewOrderModal.email || "N/A"}</strong>
              </div>
              <div>
                <span>Order Status</span>
                <strong>{viewOrderModal.status || "N/A"}</strong>
              </div>
              <div>
                <span>Payment Status</span>
                <strong>{viewOrderModal.paymentStatus || "N/A"}</strong>
              </div>
              <div>
                <span>Shipping Status</span>
                <strong>{viewOrderModal.shipmentStatus || "N/A"}</strong>
              </div>
              <div className="order-view-modal-address">
                <span>Delivery Address</span>
                <strong>{viewOrderModal.deliveryAddress || "N/A"}</strong>
              </div>
            </div>

            <div className="order-view-modal-items">
              <div className="order-view-modal-items-head">
                <span>Order Lines</span>
                <strong>{viewOrderModal.items?.length || 0}</strong>
              </div>

              {(viewOrderModal.items || []).map((item, index) => (
                <article
                  key={item.orderItemId || `${item.productId}-${index}`}
                  className="order-view-modal-item"
                >
                  <div>
                    <strong>{item.productName || `Product #${item.productId}`}</strong>
                    <span>Qty {item.quantity}</span>
                  </div>
                  <div className="order-view-modal-line-values">
                    <span>{formatMoney(item.price)}</span>
                    <strong>{formatMoney(item.subtotal)}</strong>
                  </div>
                </article>
              ))}
            </div>

            <div className="order-view-modal-total">
              <span>Total Amount</span>
              <strong>{formatMoney(viewOrderModal.totalAmount)}</strong>
            </div>
          </section>
        </div>
      )}

      {viewPaymentModal && (
        <div
          className="order-view-modal-backdrop"
          role="presentation"
          onClick={() => setViewPaymentModal(null)}
        >
          <section
            className="order-view-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-payment-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="order-view-modal-head">
              <div>
                <p className="section-label">Payment Details</p>
                <h3 id="view-payment-title">Payment #{viewPaymentModal.paymentId || "N/A"}</h3>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setViewPaymentModal(null)}
              >
                Close
              </button>
            </div>

            <div className="order-view-modal-grid">
              <div>
                <span>Order ID</span>
                <strong>#{viewPaymentModal.orderId || "N/A"}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{viewPaymentModal.paymentStatus || "N/A"}</strong>
              </div>
              <div>
                <span>Method</span>
                <strong>{viewPaymentModal.paymentMethod || "N/A"}</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>{formatDate(viewPaymentModal.paymentDate)}</strong>
              </div>
            </div>

            <div className="order-view-modal-total">
              <span>Amount</span>
              <strong>{formatMoney(viewPaymentModal.amount)}</strong>
            </div>
          </section>
        </div>
      )}

      {viewShipmentModal && (
        <div
          className="order-view-modal-backdrop"
          role="presentation"
          onClick={() => setViewShipmentModal(null)}
        >
          <section
            className="order-view-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-shipment-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="order-view-modal-head">
              <div>
                <p className="section-label">Shipment Details</p>
                <h3 id="view-shipment-title">
                  Shipment #{viewShipmentModal.shipmentId || "N/A"}
                </h3>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setViewShipmentModal(null)}
              >
                Close
              </button>
            </div>

            <div className="order-view-modal-grid">
              <div>
                <span>Order ID</span>
                <strong>#{viewShipmentModal.orderId || "N/A"}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{viewShipmentModal.shipmentStatus || "N/A"}</strong>
              </div>
              <div>
                <span>Customer</span>
                <strong>{viewShipmentModal.customerName || "N/A"}</strong>
              </div>
              <div>
                <span>Contact</span>
                <strong>{viewShipmentModal.contactNumber || "N/A"}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{viewShipmentModal.email || "N/A"}</strong>
              </div>
              <div>
                <span>Delivery Person</span>
                <strong>{viewShipmentModal.deliveryPerson || "Unassigned"}</strong>
              </div>
              <div>
                <span>Shipment Date</span>
                <strong>{formatDate(viewShipmentModal.shipmentDate)}</strong>
              </div>
              <div>
                <span>Estimated Delivery</span>
                <strong>{formatDate(viewShipmentModal.estimatedDelivery)}</strong>
              </div>
              <div className="order-view-modal-address">
                <span>Delivery Address</span>
                <strong>{viewShipmentModal.deliveryAddress || "N/A"}</strong>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default HistoryPage;
