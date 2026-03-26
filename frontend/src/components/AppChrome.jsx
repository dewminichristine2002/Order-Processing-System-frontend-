export function ButtonLabel({ loading, children, loadingText }) {
  return loading ? (
    <span className="button-label">
      <span className="button-spinner" aria-hidden="true" />
      <span>{loadingText}</span>
    </span>
  ) : (
    <span className="button-label">{children}</span>
  );
}

export function TableSkeleton({ columns = 6, rows = 4, className = "" }) {
  return (
    <div className={`table-skeleton ${className}`.trim()}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="table-skeleton-row"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <span
              key={`${rowIndex}-${columnIndex}`}
              className={`table-skeleton-cell ${
                columnIndex === columns - 1 ? "table-skeleton-cell-short" : ""
              }`.trim()}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 6 }) {
  return (
    <div className="product-grid skeleton-grid">
      {Array.from({ length: cards }).map((_, index) => (
        <article key={index} className="product-card skeleton-card">
          <span className="table-skeleton-cell" />
          <span className="table-skeleton-cell table-skeleton-cell-short" />
          <span className="table-skeleton-cell" />
          <div className="product-actions">
            <span className="table-skeleton-cell" />
            <span className="table-skeleton-cell" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function DetailCardSkeleton({ lines = 3, className = "" }) {
  return (
    <div className={`detail-skeleton ${className}`.trim()}>
      {Array.from({ length: lines }).map((_, index) => (
        <span
          key={index}
          className={`table-skeleton-cell ${
            index % 2 === 1 ? "table-skeleton-cell-short" : ""
          }`.trim()}
        />
      ))}
    </div>
  );
}

export function PageTabs({
  page,
  nextStep,
  cartItemCount,
  orderId,
  cartLength,
  onChange,
}) {
  return (
    <nav className="page-tabs">
      {[
        ["catalog", "🏪 Browse Items"],
        ["cart", `🛒 Cart (${cartItemCount})`],
        ["payment", "💰 Payment"],
        ["shipment", "📦 Delivery"],
        ["inventory-management", "📊 Stock Mgmt"],
        ["history", "📋 Order History"],
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={`${page === value ? "active" : ""} ${
            nextStep?.page === value ? "next-step" : ""
          }`.trim()}
          onClick={() => onChange(value)}
          disabled={
            (value === "cart" && cartItemCount === 0) ||
            (value === "payment" && !orderId) ||
            (value === "shipment" && !orderId)
          }
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

export function FlowBanner({ nextStep }) {
  if (!nextStep) return null;

  return (
    <section className="flow-banner">
      <div className="flow-banner-copy">
        <span className="flow-badge">{nextStep.badge}</span>
        <strong>{nextStep.title}</strong>
        <p>{nextStep.detail}</p>
      </div>
    </section>
  );
}

export function NoticeBanner({ notice, error }) {
  if (!notice && !error) return null;

  return (
    <section className={`notice ${error ? "error" : "success"}`}>
      <div className="notice-content">
        <span className="notice-label">{error ? "Attention" : "Update"}</span>
        <strong>{error || notice}</strong>
      </div>
    </section>
  );
}

export function ToastStack({ notice, error }) {
  if (!notice && !error) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {notice ? (
        <div className="toast-card toast-success">
          <span className="toast-title">Added to cart</span>
          <strong>{notice}</strong>
        </div>
      ) : null}
      {error ? (
        <div className="toast-card toast-error">
          <span className="toast-title">Action failed</span>
          <strong>{error}</strong>
        </div>
      ) : null}
    </div>
  );
}
