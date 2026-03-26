function CartPage({
  actionInFlight,
  ButtonLabel,
  pendingAction,
  cart,
  cartItemCount,
  cartSubtotal,
  cartTotal,
  formatMoney,
  customerForm,
  setCustomerForm,
  handleCreateOrder,
  handleCartQuantityChange,
  handleRemoveFromCart,
  handleClearCart,
  setPage,
}) {
  return (
    <main className="page-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">Cart Workspace</p>
            <h2>Review selected inventory lines</h2>
            <p className="workflow-note">
              Adjust quantities, remove lines, and validate the basket before
              placing the order.
            </p>
          </div>
        </div>

        {cart.length === 0 ? (
          <p className="workflow-note">
            Your cart is empty. Go to the catalog to add items.
          </p>
        ) : (
          <>
            <div className="cart-table">
              <div className="cart-table-head">
                <span>Product</span>
                <span>Quantity</span>
                <span>Unit Price</span>
                <span>Line Total</span>
                <span>Action</span>
              </div>
              {cart.map((item) => (
                <article key={item.productId} className="cart-table-row">
                  <div className="cart-line-main">
                    <strong>{item.productName}</strong>
                    <span>Product #{item.productId}</span>
                  </div>

                  <div className="cart-item-quantity">
                    <button
                      type="button"
                      onClick={() =>
                        handleCartQuantityChange(item.productId, item.quantity - 1)
                      }
                      className="qty-btn"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleCartQuantityChange(item.productId, e.target.value)
                      }
                      className="qty-input"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleCartQuantityChange(item.productId, item.quantity + 1)
                      }
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>

                  <span className="cart-line-unit">{formatMoney(item.price)}</span>
                  <strong className="cart-line-total">
                    {formatMoney(item.subtotal)}
                  </strong>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleRemoveFromCart(item.productId)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>

            <section className="cart-summary admin-summary">
              <div className="summary-row">
                <span>Basket Lines</span>
                <strong>{cart.length}</strong>
              </div>
              <div className="summary-row">
                <span>Units Reserved</span>
                <strong>{cartItemCount}</strong>
              </div>
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatMoney(cartSubtotal)}</strong>
              </div>
              <div className="summary-row total">
                <span>Order Total</span>
                <strong>{formatMoney(cartTotal)}</strong>
              </div>

              <div className="cart-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPage("catalog")}
                >
                  Back to Catalog
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={handleClearCart}
                >
                  Clear Basket
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPage("history")}
                >
                  View Order History
                </button>
              </div>
            </section>
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">Order Creation</p>
            <h2>Capture customer and delivery details</h2>
            <p className="workflow-note">
              Complete details and place the order directly from the cart tab.
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
                contactNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
              })
            }
            placeholder="Contact Number"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            title="Contact number must contain exactly 10 digits"
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

          <button type="submit" disabled={actionInFlight || cart.length === 0}>
            <ButtonLabel
              loading={pendingAction === "place-order"}
              loadingText="Placing Order..."
            >
              Place Order
            </ButtonLabel>
          </button>
        </form>

        <div className="order-overview-grid compact cart-order-overview-grid">
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
      </section>
    </main>
  );
}

export default CartPage;
