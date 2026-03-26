function OrderPage({
  actionInFlight,
  ButtonLabel,
  TableSkeleton,
  allOrders,
  orderSearchQuery,
  setOrderSearchQuery,
  handleLoadAllOrders,
  pendingAction,
  formatMoney,
  setOrderId,
  setCurrentOrderSnapshot,
  setPage,
  setNotice,
  customerForm,
  setCustomerForm,
  handleCreateOrder,
  cart,
  cartItemCount,
  cartSubtotal,
  cartTotal,
}) {
  return (
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
                        onClick={() => {
                          setOrderId(order.orderId ?? null);
                          setCurrentOrderSnapshot({
                            orderId: order.orderId,
                            customerName: order.customerName || "",
                            email: order.email || "",
                            contactNumber: order.contactNumber || "",
                            deliveryAddress: order.deliveryAddress || "",
                            totalAmount: Number(order.totalAmount || 0),
                            items: Array.isArray(order.items) ? order.items : [],
                          });
                          setPage("order-creation");
                          setNotice(`Loaded order #${order.orderId}`);
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

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">Order Creation</p>
            <h2>Capture customer and delivery details</h2>
            <p className="workflow-note">
              Finalize the order profile before the payment and shipment flow begins.
            </p>
          </div>
        </div>

        <form
          className="order-form enterprise-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateOrder();
          }}
        >
          <input
            value={customerForm.customerName}
            onChange={(e) =>
              setCustomerForm({
                ...customerForm,
                customerName: e.target.value,
              })
            }
            placeholder="Full Name"
            required
          />
          <input
            value={customerForm.email}
            onChange={(e) =>
              setCustomerForm({ ...customerForm, email: e.target.value })
            }
            type="email"
            placeholder="Email Address"
            required
          />
          <input
            value={customerForm.contactNumber}
            onChange={(e) =>
              setCustomerForm({
                ...customerForm,
                contactNumber: e.target.value,
              })
            }
            placeholder="Contact Number"
            required
          />
          <textarea
            value={customerForm.deliveryAddress}
            onChange={(e) =>
              setCustomerForm({
                ...customerForm,
                deliveryAddress: e.target.value,
              })
            }
            placeholder="Delivery Address"
            required
          />

          <button type="submit" disabled={actionInFlight}>
            <ButtonLabel
              loading={pendingAction === "place-order"}
              loadingText="Placing Order..."
            >
              Place Order
            </ButtonLabel>
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">Order Summary</p>
            <h2>Review commercial values before submission</h2>
          </div>
        </div>

        <div className="order-overview-grid compact">
          <article className="workflow-summary">
            <span>Basket Lines</span>
            <strong>{cart.length}</strong>
          </article>
          <article className="workflow-summary">
            <span>Total Units</span>
            <strong>{cartItemCount}</strong>
          </article>
          <article className="workflow-summary">
            <span>Subtotal</span>
            <strong>{formatMoney(cartSubtotal)}</strong>
          </article>
          <article className="workflow-summary">
            <span>Order Value</span>
            <strong>{formatMoney(cartTotal)}</strong>
          </article>
        </div>

        <section className="cart-summary admin-summary">
          <div className="order-items">
            {cart.map((item) => (
              <div key={item.productId} className="summary-item">
                <span>
                  {item.productName} x {item.quantity}
                </span>
                <strong>{formatMoney(item.subtotal)}</strong>
              </div>
            ))}
          </div>

          <div className="summary-row total">
            <span>Total Amount</span>
            <strong>{formatMoney(cartTotal)}</strong>
          </div>
        </section>
      </section>
    </main>
  );
}

export default OrderPage;
