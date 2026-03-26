function InventoryPage({
  actionInFlight,
  ButtonLabel,
  TableSkeleton,
  products,
  formatMoney,
  inventorySearchQuery,
  setInventorySearchQuery,
  inventoryCreateForm,
  setInventoryCreateForm,
  handleCreateInventoryItem,
  inventoryIncreaseForm,
  setInventoryIncreaseForm,
  handleIncreaseInventoryStock,
  inventoryEditForm,
  setInventoryEditForm,
  handleStartEditInventoryItem,
  handleCancelEditInventoryItem,
  handleUpdateInventoryItem,
  handleDeleteInventoryItem,
  handleLoadStockUpdates,
  pendingAction,
  stockUpdates,
  formatDate,
}) {
  const filteredProducts = products.filter((product) => {
    const query = inventorySearchQuery.trim().toLowerCase();
    if (!query) return true;

    return (
      String(product.productId || "").includes(query) ||
      (product.productName || "").toLowerCase().includes(query) ||
      String(product.stockQuantity || "").includes(query)
    );
  });

  const selectedProduct = products.find(
    (product) => String(product.productId) === inventoryIncreaseForm.productId
  );

  return (
    <main className="page-grid">
      <section className="panel hero-panel full-width">
        <div className="hero-copy">
          <p className="section-label">Inventory Management</p>
          <h2>Maintain showroom stock and create products</h2>
          <p>
            Add new inventory items, increase available stock, and review recent
            stock movements in one workspace.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">Create Product</p>
            <h2>Add a new item to inventory</h2>
          </div>
        </div>

        <form
          className="form-grid enterprise-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreateInventoryItem();
          }}
        >
          <input
            type="number"
            min="1"
            value={inventoryCreateForm.productId}
            onChange={(event) =>
              setInventoryCreateForm({
                ...inventoryCreateForm,
                productId: event.target.value,
              })
            }
            placeholder="Product ID"
            required
          />
          <input
            value={inventoryCreateForm.productName}
            onChange={(event) =>
              setInventoryCreateForm({
                ...inventoryCreateForm,
                productName: event.target.value,
              })
            }
            placeholder="Product Name"
            required
          />
          <input
            type="number"
            min="0"
            value={inventoryCreateForm.stockQuantity}
            onChange={(event) =>
              setInventoryCreateForm({
                ...inventoryCreateForm,
                stockQuantity: event.target.value,
              })
            }
            placeholder="Initial Stock"
            required
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={inventoryCreateForm.price}
            onChange={(event) =>
              setInventoryCreateForm({
                ...inventoryCreateForm,
                price: event.target.value,
              })
            }
            placeholder="Unit Price"
            required
          />

          <button type="submit" disabled={actionInFlight}>
            <ButtonLabel
              loading={pendingAction === "create-product"}
              loadingText="Creating Item..."
            >
              Add Item to Inventory
            </ButtonLabel>
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">Increase Stock</p>
            <h2>Restock an existing product</h2>
          </div>
        </div>

        <form
          className="form-grid enterprise-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleIncreaseInventoryStock();
          }}
        >
          <select
            value={inventoryIncreaseForm.productId}
            onChange={(event) =>
              setInventoryIncreaseForm({
                ...inventoryIncreaseForm,
                productId: event.target.value,
              })
            }
            required
          >
            <option value="">Select Product</option>
            {products.map((product) => (
              <option key={product.productId} value={product.productId}>
                #{product.productId} {product.productName}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={inventoryIncreaseForm.quantity}
            onChange={(event) =>
              setInventoryIncreaseForm({
                ...inventoryIncreaseForm,
                quantity: event.target.value,
              })
            }
            placeholder="Add Quantity"
            required
          />
          <input
            value={inventoryIncreaseForm.referenceId}
            onChange={(event) =>
              setInventoryIncreaseForm({
                ...inventoryIncreaseForm,
                referenceId: event.target.value,
              })
            }
            placeholder="Reference ID / GRN / Note"
          />

          <button type="submit" disabled={actionInFlight}>
            <ButtonLabel
              loading={pendingAction === "increase-stock"}
              loadingText="Updating Stock..."
            >
              Increase Stock
            </ButtonLabel>
          </button>
        </form>

        {selectedProduct && (
          <div className="inventory-context-grid">
            <article className="workflow-summary">
              <span>Selected Product</span>
              <strong>{selectedProduct.productName}</strong>
            </article>
            <article className="workflow-summary">
              <span>Current Stock</span>
              <strong>{selectedProduct.stockQuantity}</strong>
            </article>
            <article className="workflow-summary">
              <span>Unit Price</span>
              <strong>{formatMoney(selectedProduct.price)}</strong>
            </article>
          </div>
        )}
      </section>

      <section className="panel full-width">
        <div className="panel-heading">
          <div>
            <p className="section-label">Edit Product</p>
            <h2>Update or remove an inventory item</h2>
          </div>
        </div>

        <form
          className="form-grid enterprise-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleUpdateInventoryItem();
          }}
        >
          <input
            type="number"
            min="1"
            value={inventoryEditForm.productId}
            onChange={(event) =>
              setInventoryEditForm({
                ...inventoryEditForm,
                productId: event.target.value,
              })
            }
            placeholder="Product ID"
            required
          />
          <input
            value={inventoryEditForm.productName}
            onChange={(event) =>
              setInventoryEditForm({
                ...inventoryEditForm,
                productName: event.target.value,
              })
            }
            placeholder="Product Name"
            required
          />
          <input
            type="number"
            min="0"
            value={inventoryEditForm.stockQuantity}
            onChange={(event) =>
              setInventoryEditForm({
                ...inventoryEditForm,
                stockQuantity: event.target.value,
              })
            }
            placeholder="Stock Quantity"
            required
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={inventoryEditForm.price}
            onChange={(event) =>
              setInventoryEditForm({
                ...inventoryEditForm,
                price: event.target.value,
              })
            }
            placeholder="Unit Price"
            required
          />

          <div className="shipment-action-row">
            <button type="submit" disabled={actionInFlight}>
              <ButtonLabel
                loading={pendingAction === "edit-product"}
                loadingText="Updating Item..."
              >
                Update Item
              </ButtonLabel>
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleCancelEditInventoryItem}
              disabled={actionInFlight}
            >
              Reset Edit Form
            </button>
          </div>
        </form>
      </section>

      <section className="panel full-width">
        <div className="panel-heading">
          <div>
            <p className="section-label">Current Inventory</p>
            <h2>Search and manage stock items</h2>
          </div>
        </div>

        <input
          type="text"
          value={inventorySearchQuery}
          onChange={(event) => setInventorySearchQuery(event.target.value)}
          placeholder="Search by product ID, product name, or stock quantity"
        />

        <div className="order-search-results">
          <div className="inventory-table inventory-table-head">
            <span>Product ID</span>
            <span>Product</span>
            <span>Stock</span>
            <span>Price</span>
            <span>Action</span>
          </div>

          {filteredProducts.map((product) => (
            <article key={product.productId} className="inventory-table inventory-table-row">
              <span className="inventory-table-id">#{product.productId}</span>
              <span>{product.productName}</span>
              <span
                className={`status-pill ${
                  product.stockQuantity > 10 ? "status-paid" : "status-pending"
                }`}
              >
                {product.stockQuantity} units
              </span>
              <span>{formatMoney(product.price)}</span>
              <div className="inventory-table-action">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() =>
                    setInventoryIncreaseForm({
                      ...inventoryIncreaseForm,
                      productId: String(product.productId),
                    })
                  }
                >
                  Restock
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleStartEditInventoryItem(product)}
                  disabled={actionInFlight}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => handleDeleteInventoryItem(product.productId)}
                  disabled={actionInFlight}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel full-width">
        <div className="panel-heading">
          <div>
            <p className="section-label">Stock Updates</p>
            <h2>Recent inventory movements</h2>
          </div>
        </div>

        <div className="shipment-action-row">
          <button
            type="button"
            className="secondary-button"
            onClick={() => handleLoadStockUpdates()}
            disabled={actionInFlight}
          >
            <ButtonLabel
              loading={pendingAction === "load-stock-updates"}
              loadingText="Loading Updates..."
            >
              Load Stock Updates
            </ButtonLabel>
          </button>
        </div>

        {pendingAction === "load-stock-updates" && (
          <TableSkeleton columns={6} rows={4} className="order-search-results" />
        )}

        {stockUpdates.length > 0 && (
          <div className="order-search-results">
            <div className="stock-update-table stock-update-table-head">
              <span>Product ID</span>
              <span>Change</span>
              <span>Previous</span>
              <span>New</span>
              <span>Reference</span>
              <span>Updated At</span>
            </div>

            {stockUpdates.map((update) => (
              <article key={update.id} className="stock-update-table stock-update-table-row">
                <span className="inventory-table-id">#{update.productId}</span>
                <span
                  className={`status-pill ${
                    Number(update.changeAmount) >= 0 ? "status-paid" : "status-pending"
                  }`}
                >
                  {Number(update.changeAmount) >= 0 ? "+" : ""}
                  {update.changeAmount}
                </span>
                <span>{update.previousQuantity}</span>
                <span>{update.newQuantity}</span>
                <span>{update.referenceId || update.reason || "N/A"}</span>
                <span>{formatDate(update.createdAt)}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default InventoryPage;
