import { useState } from "react";

function OrderPage({
  actionInFlight,
  ButtonLabel,
  TableSkeleton,
  allOrders,
  orderSearchQuery,
  setOrderSearchQuery,
  handleLoadAllOrders,
  handleViewOrderDetails,
  pendingAction,
  formatMoney,
}) {
  const [viewOrderModal, setViewOrderModal] = useState(null);

  async function handleOpenOrderModal(order) {
    if (!order) return;

    setViewOrderModal({
      ...order,
      items: Array.isArray(order.items) ? order.items : [],
      isLoadingDetails: true,
    });

    const loadedOrder = await handleViewOrderDetails(order);
    if (loadedOrder) {
      setViewOrderModal({ ...loadedOrder, isLoadingDetails: false });
    } else {
      setViewOrderModal((current) =>
        current ? { ...current, isLoadingDetails: false } : current,
      );
    }
  }

  return (
    <>
      <main className="page-grid">
      <section className="panel full-width">
        <div className="panel-heading">
          <div>
            <p className="section-label">All Orders</p>
            <h2>View order history</h2>
          </div>
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

              {allOrders
                .filter((order) => {
                  const query = orderSearchQuery.trim().toLowerCase();
                  if (!query) {
                    return true;
                  }

                  return (
                    String(order.orderId || "").includes(query) ||
                    (order.customerName || "").toLowerCase().includes(query) ||
                    (order.contactNumber || "").toLowerCase().includes(query) ||
                    (order.status || "").toLowerCase().includes(query) ||
                    String(order.totalAmount || "").toLowerCase().includes(query)
                  );
                })
                .map((order) => (
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
              <div className="order-view-modal-actions">
                {viewOrderModal.isLoadingDetails ? (
                  <span className="modal-loading-note">Loading latest details...</span>
                ) : null}
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setViewOrderModal(null)}
                >
                  Close
                </button>
              </div>
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
                <span>Status</span>
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
    </>
  );
}

export default OrderPage;
