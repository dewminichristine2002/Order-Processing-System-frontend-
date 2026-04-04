import { CardGridSkeleton } from "../components/AppChrome";

function CatalogPage({
  loading,
  products,
  formatMoney,
  addToCartQuantities,
  setAddToCartQuantities,
  handleAddToCart,
}) {
  return (
    <main className="page-grid">
      <section className="panel hero-panel full-width">
        <div className="hero-copy">
          <p className="section-label">Welcome to Our Store</p>
          <h2>Browse our inventory and add items to your cart</h2>
          <p>
            Select the products you want and add them to your shopping cart.
            When you're ready, proceed to checkout.
          </p>
        </div>
      </section>

      <section className="panel full-width">
        <div className="panel-heading">
          <div>
            <p className="section-label">Available Products</p>
            <h2>Our Inventory</h2>
          </div>
        </div>

        {loading ? (
          <CardGridSkeleton />
        ) : products.length === 0 ? (
          <p className="workflow-note">No products available</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <article key={product.productId} className="product-card">
                {product.imageUrl && (
                  <div className="product-image">
                    <img src={product.imageUrl} alt={product.productName || "Product"} loading="lazy" />
                  </div>
                )}
                <div className="product-header">
                  <strong>{product.productName}</strong>
                  <span
                    className={`stock-badge ${
                      product.stockQuantity <= 10 ? "low-stock" : "in-stock"
                    }`}
                  >
                    {product.stockQuantity} in stock
                  </span>
                </div>

                <div className="product-price">
                  <strong>{formatMoney(product.price)}</strong>
                  <span>per unit</span>
                </div>

                <form
                  className="product-actions"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddToCart(product);
                  }}
                >
                  <input
                    type="number"
                    min="1"
                    max={product.stockQuantity}
                    value={addToCartQuantities[product.productId] || 1}
                    onChange={(e) =>
                      setAddToCartQuantities({
                        ...addToCartQuantities,
                        [product.productId]: e.target.value,
                      })
                    }
                    placeholder="Qty"
                  />
                  <button
                    type="submit"
                    className={product.stockQuantity === 0 ? "disabled" : ""}
                    disabled={product.stockQuantity === 0}
                  >
                    {product.stockQuantity === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default CatalogPage;
