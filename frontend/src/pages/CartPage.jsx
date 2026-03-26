function CartPage({
  cart,
  cartItemCount,
  cartSubtotal,
  cartTotal,
  formatMoney,
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
              moving to order creation.
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
                  onClick={() => setPage("order-creation")}
                >
                  Continue to Order
                </button>
              </div>
            </section>
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">Cart Summary</p>
            <h2>Basket totals and next actions</h2>
          </div>
        </div>

        <div className="order-overview-grid compact">
          <article className="workflow-summary">
            <span>Distinct Items</span>
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
            <span>Total</span>
            <strong>{formatMoney(cartTotal)}</strong>
          </article>
        </div>
      </section>
    </main>
  );
}

export default CartPage;
