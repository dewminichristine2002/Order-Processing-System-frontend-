import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  ButtonLabel,
  DetailCardSkeleton,
  FlowBanner,
  NoticeBanner,
  PageTabs,
  TableSkeleton,
  ToastStack,
} from "./components/AppChrome";
import CatalogPage from "./pages/CatalogPage";
import CartPage from "./pages/CartPage";
import OrderPage from "./pages/OrderPage";
import PaymentPage from "./pages/PaymentPage";
import InventoryPage from "./pages/InventoryPage";

const DEFAULT_API = "";
const PAYMENT_METHODS = ["Cash", "BANK_TRANSFER", "CHEQUE"];
const SHIPMENT_STATUSES = ["PENDING", "SHIPPED", "DELIVERED"];

const emptyCustomerForm = {
  customerName: "",
  email: "",
  contactNumber: "",
  deliveryAddress: "",
};

const emptyPaymentForm = {
  amount: "",
  paymentMethod: "Cash",
  accountNumber: "",
  accountName: "",
  transactionId: "",
  chequeNumber: "",
  bankName: "",
};

const emptyShipmentForm = {
  orderId: "",
  customerName: "",
  contactNumber: "",
  deliveryAddress: "",
  email: "",
  shipmentStatus: "SHIPPED",
};

const emptyInventoryCreateForm = {
  productId: "",
  productName: "",
  stockQuantity: "",
  price: "",
};

const emptyInventoryIncreaseForm = {
  productId: "",
  quantity: "",
  referenceId: "",
};

async function requestJson(baseUrl, path, options = {}) {
  const normalizedBase = (baseUrl || "").trim().replace(/\/+$/, "");
  const response = await fetch(`${normalizedBase}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      (typeof data === "string" && data) ||
        data?.message ||
        data?.error ||
        `HTTP ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return Number.isNaN(amount)
    ? value
    : `LKR ${amount.toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getPaymentStage(status) {
  const normalized = (status || "").toUpperCase();
  if (!normalized) return 1;
  if (normalized === "PENDING") return 2;
  if (normalized === "PAID") return 4;
  return 3;
}

function App() {
  const [apiBase] = useState(DEFAULT_API);
  const [page, setPage] = useState("catalog");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  // Data state
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [currentOrderSnapshot, setCurrentOrderSnapshot] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [paymentData, setPaymentData] = useState(null);
  const [allPayments, setAllPayments] = useState([]);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("");
  const [shipmentData, setShipmentData] = useState(null);
  const [allShipments, setAllShipments] = useState([]);
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState("");
  const [stockUpdates, setStockUpdates] = useState([]);
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");

  // Form state
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [shipmentForm, setShipmentForm] = useState(emptyShipmentForm);
  const [shipmentStatusFormByOrder, setShipmentStatusFormByOrder] = useState("");
  const [deliveryPersonForm, setDeliveryPersonForm] = useState("");
  const [inventoryCreateForm, setInventoryCreateForm] = useState(
    emptyInventoryCreateForm
  );
  const [inventoryIncreaseForm, setInventoryIncreaseForm] = useState(
    emptyInventoryIncreaseForm
  );

  // UI state for product adding
  const [addToCartQuantities, setAddToCartQuantities] = useState({});
  const actionInFlight = Boolean(pendingAction);

  async function api(path, options = {}) {
    return requestJson(apiBase, path, options);
  }

  const refreshProducts = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    }

    try {
      const productsResult = await requestJson(apiBase, "/inventory");
      setProducts(Array.isArray(productsResult) ? productsResult : []);
    } catch (err) {
      setError(`Failed to load products: ${err.message}`);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [apiBase]);

  // Load products on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ops-dashboard-api-base");
    }

    setError("");
    refreshProducts(true);
  }, [refreshProducts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  useEffect(() => {
    if (!notice && !error) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice("");
      setError("");
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [notice, error]);

  async function runAction(action, successMessage, actionKey = "") {
    if (pendingAction) {
      return;
    }
    setNotice("");
    setError("");
    setPendingAction(actionKey);
    try {
      await action();
      setNotice(successMessage);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setPendingAction("");
    }
  }

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cartSubtotal;
  }, [cartSubtotal]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cart]);

  const expectedPaymentAmount = useMemo(() => {
    if (paymentData?.amount) {
      return Number(paymentData.amount);
    }
    if (currentOrderSnapshot?.totalAmount) {
      return Number(currentOrderSnapshot.totalAmount);
    }
    return Number(cartTotal || 0);
  }, [paymentData, currentOrderSnapshot, cartTotal]);

  const cashGiven = Number(paymentForm.amount || 0);
  const paymentBalance = paymentForm.paymentMethod === "Cash"
    ? Math.max(cashGiven - expectedPaymentAmount, 0)
    : 0;

  const nextStep = useMemo(() => {
    if (!cart.length && !orderId) {
      return {
        page: "catalog",
        badge: "Catalog",
        title: "Add products to the cart",
        detail: "Start by selecting inventory items and building the basket.",
      };
    }

    if (cart.length > 0 && !orderId) {
      return {
        page: "order-creation",
        badge: "Place Order",
        title: "Submit the order details",
        detail: "Complete customer and delivery information, then place the order.",
      };
    }

    if (orderId && !paymentData) {
      return {
        page: "payment",
        badge: "Payment",
        title: "Process the payment for the active order",
        detail: `Order #${orderId} is ready for payment processing.`,
      };
    }

    if (paymentData?.paymentStatus === "PENDING") {
      return {
        page: "payment",
        badge: "Payment",
        title: "Confirm the pending payment",
        detail: `Payment #${paymentData.paymentId} is pending confirmation before shipment.`,
      };
    }

    if (paymentData?.paymentStatus === "PAID" && !shipmentData) {
      return {
        page: "shipment",
        badge: "Shipment",
        title: "Create the shipment for the paid order",
        detail: `Order #${orderId} is paid and ready for shipment creation.`,
      };
    }

    if (shipmentData && !shipmentData.deliveryPerson) {
      return {
        page: "shipment",
        badge: "Shipment",
        title: "Assign a delivery person",
        detail: `Shipment #${shipmentData.shipmentId} exists but still needs a delivery assignment.`,
      };
    }

    if (shipmentData && shipmentData.shipmentStatus !== "DELIVERED") {
      return {
        page: "shipment",
        badge: "Shipment",
        title: "Update the shipment status",
        detail: `Shipment #${shipmentData.shipmentId} is currently ${shipmentData.shipmentStatus}.`,
      };
    }

    if (shipmentData?.shipmentStatus === "DELIVERED") {
      return {
        page: "shipment",
        badge: "Completed",
        title: "Order flow completed",
        detail: `Order #${orderId} has been delivered successfully.`,
      };
    }

    return null;
  }, [cart.length, orderId, paymentData, shipmentData]);

  // Handlers for catalog page
  function handleAddToCart(product) {
    const qty = Number(addToCartQuantities[product.productId] || 1);
    if (qty <= 0) {
      setError("Please select a quantity greater than 0");
      return;
    }
    if (qty > product.stockQuantity) {
      setError(`Only ${product.stockQuantity} units available`);
      return;
    }

    const subtotal = qty * product.price;
    const existingItem = cart.find(
      (item) => item.productId === product.productId,
    );

    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (newQty > product.stockQuantity) {
        setError(`Only ${product.stockQuantity} units available in total`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: newQty, subtotal: newQty * item.price }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.productId,
          productName: product.productName,
          price: product.price,
          quantity: qty,
          subtotal,
        },
      ]);
    }

    setNotice(`Added ${qty} ${product.productName} to cart`);
    setAddToCartQuantities({ ...addToCartQuantities, [product.productId]: 1 });
  }

  async function handleCreateInventoryItem() {
    if (
      !inventoryCreateForm.productId ||
      !inventoryCreateForm.productName ||
      inventoryCreateForm.stockQuantity === "" ||
      inventoryCreateForm.price === ""
    ) {
      setError("Product ID, name, stock quantity, and price are required");
      return;
    }

    await runAction(async () => {
      await api("/inventory/products", {
        method: "POST",
        body: JSON.stringify({
          productId: Number(inventoryCreateForm.productId),
          productName: inventoryCreateForm.productName,
          stockQuantity: Number(inventoryCreateForm.stockQuantity),
          price: Number(inventoryCreateForm.price),
        }),
      });

      setInventoryCreateForm(emptyInventoryCreateForm);
      await refreshProducts();
      await handleLoadStockUpdates(true);
    }, "Inventory item created successfully.", "create-product");
  }

  async function handleIncreaseInventoryStock() {
    if (!inventoryIncreaseForm.productId || !inventoryIncreaseForm.quantity) {
      setError("Select a product and enter the quantity to add");
      return;
    }

    await runAction(async () => {
      await api(`/inventory/increase-stock/${inventoryIncreaseForm.productId}`, {
        method: "PUT",
        body: JSON.stringify({
          quantity: Number(inventoryIncreaseForm.quantity),
          referenceId: inventoryIncreaseForm.referenceId || null,
        }),
      });

      setInventoryIncreaseForm(emptyInventoryIncreaseForm);
      await refreshProducts();
      await handleLoadStockUpdates(true);
    }, "Inventory stock updated successfully.", "increase-stock");
  }

  function handleRemoveFromCart(productId) {
    setCart(cart.filter((item) => item.productId !== productId));
  }

  function handleCartQuantityChange(productId, newQty) {
    const product = products.find((p) => p.productId === productId);
    if (!product) return;

    const qty = Number(newQty);
    if (qty === 0) {
      handleRemoveFromCart(productId);
      return;
    }

    if (qty > product.stockQuantity) {
      setError(`Only ${product.stockQuantity} units available`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: qty, subtotal: qty * item.price }
          : item,
      ),
    );
    setError("");
  }

  function handleClearCart() {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      setCart([]);
      setNotice("Cart cleared");
    }
  }

  // Order creation handler
  async function handleCreateOrder() {
    if (
      !customerForm.customerName ||
      !customerForm.email ||
      !customerForm.contactNumber ||
      !customerForm.deliveryAddress
    ) {
      setError("Please fill in all customer information");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }

    await runAction(async () => {
      const orderItems = cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      }));

      const newOrder = await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: customerForm.customerName,
          email: customerForm.email,
          contactNumber: customerForm.contactNumber,
          deliveryAddress: customerForm.deliveryAddress,
          totalAmount: cartTotal,
          items: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
        }),
      });

      setOrderId(newOrder.orderId);
      setCurrentOrderSnapshot({
        orderId: newOrder.orderId,
        customerName: newOrder.customerName || customerForm.customerName,
        email: newOrder.email || customerForm.email,
        contactNumber: newOrder.contactNumber || customerForm.contactNumber,
        deliveryAddress: newOrder.deliveryAddress || customerForm.deliveryAddress,
        totalAmount: Number(newOrder.totalAmount ?? cartTotal),
        items: Array.isArray(newOrder.items) && newOrder.items.length > 0
          ? newOrder.items
          : orderItems,
      });
      setPaymentForm({
        ...emptyPaymentForm,
        paymentMethod: "Cash",
        amount: "",
      });
      setPaymentData(null);
      setCart([]);
      setCustomerForm(emptyCustomerForm);
      setPage("payment");
    }, "Order created successfully! Proceed to payment.", "place-order");
  }

  async function handleLoadStockUpdates(silent = false) {
    const load = async () => {
      const result = await api("/inventory/stock-updates?size=20");
      const updates = Array.isArray(result)
        ? result
        : Array.isArray(result?.content)
          ? result.content
          : [];
      setStockUpdates(updates);
    };

    if (silent) {
      try {
        await load();
      } catch {
        // Keep inventory actions usable even if the stock history request fails.
      }
      return;
    }

    await runAction(load, "Stock updates loaded.", "load-stock-updates");
  }

  async function handleLoadAllOrders() {
    await runAction(async () => {
      const orders = await api("/orders");
      setAllOrders(Array.isArray(orders) ? orders : []);
    }, "All orders loaded.", "load-all-orders");
  }

  // Payment handlers
  async function handleProcessPayment() {
    if (!paymentForm.amount || !orderId) {
      setError("Amount and order are required");
      return;
    }

    if (paymentForm.paymentMethod === "Cash" && cashGiven < expectedPaymentAmount) {
      setError("Cash amount is less than the order total");
      return;
    }

    if (paymentForm.paymentMethod !== "Cash" && !paymentVerified) {
      setError("Verify the payment details before processing payment");
      return;
    }

    await runAction(async () => {
      const payment = await api("/payments/process", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          amount:
            paymentForm.paymentMethod === "Cash"
              ? expectedPaymentAmount
              : Number(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
        }),
      });

      setPaymentData(payment);
      setPaymentVerified(false);
      setNotice("Payment processed. Confirm the payment to proceed.");
    }, "Payment processed", "process-payment");
  }

  async function handleLoadPaymentStatus() {
    if (!orderId) {
      setError("Order ID is required");
      return;
    }

    await runAction(async () => {
      const payment = await api(`/payments/${orderId}`);
      setPaymentData(payment);
      if (!currentOrderSnapshot || currentOrderSnapshot.orderId !== payment.orderId) {
        setCurrentOrderSnapshot((snapshot) => ({
          ...(snapshot || {}),
          orderId: payment.orderId,
          totalAmount: Number(payment.amount || snapshot?.totalAmount || 0),
        }));
      }
    }, "Payment loaded", "load-payment-status");
  }

  async function handleConfirmPayment() {
    if (!paymentData?.paymentId) {
      setError("No payment to confirm");
      return;
    }

    await runAction(async () => {
      const confirmed = await api(
        `/payments/${paymentData.paymentId}/confirm`,
        {
          method: "PUT",
        },
      );

      setPaymentData(confirmed);
      setPaymentForm(emptyPaymentForm);
      setPaymentVerified(false);
    }, "Payment confirmed! You can now proceed to shipment.", "confirm-payment");
  }

  async function handleLoadAllPayments() {
    await runAction(async () => {
      try {
        const payments = await api("/payments");
        setAllPayments(Array.isArray(payments) ? payments : []);
        return;
      } catch (paymentsError) {
        if (paymentsError.status && ![403, 404, 405].includes(paymentsError.status)) {
          throw paymentsError;
        }
      }

      const orders = await api("/orders");
      const orderList = Array.isArray(orders) ? orders : [];

      const paymentResults = await Promise.allSettled(
        orderList.map((order) => api(`/payments/${order.orderId}`))
      );

      const mappedPayments = paymentResults
        .filter((result) => result.status === "fulfilled" && result.value)
        .map((result) => result.value)
        .sort((left, right) => Number(right.paymentId || 0) - Number(left.paymentId || 0));

      setAllPayments(mappedPayments);
    }, "All payments loaded.", "load-all-payments");
  }

  function handlePaymentMethodChange(method) {
    setPaymentForm({
      ...emptyPaymentForm,
      paymentMethod: method,
      amount: method === "Cash" ? "" : String(expectedPaymentAmount || ""),
    });
    setPaymentVerified(false);
    setError("");
    setNotice("");
  }

  function handleVerifyPaymentDetails() {
    if (paymentForm.paymentMethod === "BANK_TRANSFER") {
      if (!paymentForm.accountNumber || !paymentForm.accountName || !paymentForm.transactionId) {
        setError("Account number, account name, and transaction ID are required");
        return;
      }
    }

    if (paymentForm.paymentMethod === "CHEQUE") {
      if (!paymentForm.chequeNumber || !paymentForm.bankName) {
        setError("Cheque number and bank name are required");
        return;
      }
    }

    setPaymentVerified(true);
    setError("");
    setNotice("Payment details verified. You can now process payment.");
  }

  useEffect(() => {
    if (page !== "shipment" || !orderId) {
      return;
    }

    async function loadShipmentPage() {
      setNotice("");
      setError("");

      try {
        const existingShipment = await requestJson(apiBase, `/shipping/${orderId}`);
        setShipmentData(existingShipment);
        setShipmentForm({
          orderId: String(existingShipment.orderId ?? orderId),
          customerName: existingShipment.customerName || "",
          contactNumber: existingShipment.contactNumber || "",
          deliveryAddress: existingShipment.deliveryAddress || "",
          email: existingShipment.email || "",
          shipmentStatus: existingShipment.shipmentStatus || "SHIPPED",
        });
        setDeliveryPersonForm(existingShipment.deliveryPerson || "");
        return;
      } catch (shipmentError) {
        if (shipmentError.status !== 404) {
          setError(shipmentError.message);
          return;
        }
      }

      try {
        const orderDetails = await requestJson(apiBase, `/shipping/order-details/${orderId}`);
        setShipmentData(null);
        setShipmentForm({
          orderId: String(orderDetails.orderId ?? orderId),
          customerName: orderDetails.customerName || "",
          contactNumber: orderDetails.contactNumber || "",
          deliveryAddress: orderDetails.deliveryAddress || "",
          email: orderDetails.email || "",
          shipmentStatus: "SHIPPED",
        });
      } catch (orderError) {
        setError(orderError.message);
      }
    }

    loadShipmentPage();
  }, [page, orderId, apiBase]);

  async function handleCreateShipment() {
    if (!shipmentForm.orderId) {
      setError("Order ID is required to create a shipment");
      return;
    }

    await runAction(async () => {
      const createdShipment = await api("/shipping/create", {
        method: "POST",
        body: JSON.stringify({
          orderId: Number(shipmentForm.orderId),
          customerName: shipmentForm.customerName,
          contactNumber: shipmentForm.contactNumber,
          deliveryAddress: shipmentForm.deliveryAddress,
          email: shipmentForm.email,
          shipmentStatus: shipmentForm.shipmentStatus,
        }),
      });

      setShipmentData(createdShipment);
      setDeliveryPersonForm(createdShipment.deliveryPerson || "");
    }, "Shipment created successfully.", "create-shipment");
  }

  async function handleLoadShipmentDetails() {
    if (!orderId) {
      setError("Order ID is required");
      return;
    }

    await runAction(async () => {
      const loadedShipment = await api(`/shipping/${orderId}`);
      setShipmentData(loadedShipment);
      setShipmentForm({
        orderId: String(loadedShipment.orderId ?? orderId),
        customerName: loadedShipment.customerName || "",
        contactNumber: loadedShipment.contactNumber || "",
        deliveryAddress: loadedShipment.deliveryAddress || "",
        email: loadedShipment.email || "",
        shipmentStatus: loadedShipment.shipmentStatus || "SHIPPED",
      });
      setDeliveryPersonForm(loadedShipment.deliveryPerson || "");
    }, "Shipment loaded.", "load-shipment");
  }

  async function handleUpdateShipmentStatusByOrder() {
    if (!orderId || !shipmentStatusFormByOrder) {
      setError("Order ID and status are required");
      return;
    }

    await runAction(async () => {
      const updated = await api(
        `/shipping/update-status/order/${orderId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            shipmentStatus: shipmentStatusFormByOrder,
          }),
        }
      );
      setShipmentData(updated);
      setShipmentStatusFormByOrder("");
    }, "Shipment status updated", "update-shipment-status");
  }

  async function handleAssignDeliveryPersonByOrder() {
    if (!orderId || !deliveryPersonForm) {
      setError("Order ID and delivery person name are required");
      return;
    }

    await runAction(async () => {
      const updated = await api(
        `/shipping/assign-delivery/order/${orderId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            deliveryPerson: deliveryPersonForm,
          }),
        }
      );
      setShipmentData(updated);
      setDeliveryPersonForm("");
    }, "Delivery person assigned", "assign-delivery");
  }

  async function handleLoadAllShipments() {
    await runAction(async () => {
      const shipments = await api("/shipping");
      setAllShipments(Array.isArray(shipments) ? shipments : []);
    }, "All shipments loaded.", "load-all-shipments");
  }

  return (
    <div className="app-shell">
      <ToastStack notice={notice} error={error} />

      <PageTabs
        page={page}
        nextStep={nextStep}
        cartItemCount={cartItemCount}
        orderId={orderId}
        cartLength={cart.length}
        onChange={setPage}
      />

      <FlowBanner nextStep={nextStep} />

      <NoticeBanner notice={notice} error={error} />

      {loading && page === "catalog" ? (
        <section className="panel loading-panel">Loading products...</section>
      ) : null}

      {page === "catalog" && (
        <CatalogPage
          loading={loading}
          products={products}
          formatMoney={formatMoney}
          addToCartQuantities={addToCartQuantities}
          setAddToCartQuantities={setAddToCartQuantities}
          handleAddToCart={handleAddToCart}
        />
      )}

      {page === "inventory-management" && (
        <InventoryPage
          actionInFlight={actionInFlight}
          ButtonLabel={ButtonLabel}
          TableSkeleton={TableSkeleton}
          products={products}
          formatMoney={formatMoney}
          inventorySearchQuery={inventorySearchQuery}
          setInventorySearchQuery={setInventorySearchQuery}
          inventoryCreateForm={inventoryCreateForm}
          setInventoryCreateForm={setInventoryCreateForm}
          handleCreateInventoryItem={handleCreateInventoryItem}
          inventoryIncreaseForm={inventoryIncreaseForm}
          setInventoryIncreaseForm={setInventoryIncreaseForm}
          handleIncreaseInventoryStock={handleIncreaseInventoryStock}
          handleLoadStockUpdates={handleLoadStockUpdates}
          pendingAction={pendingAction}
          stockUpdates={stockUpdates}
          formatDate={formatDate}
        />
      )}

      {page === "cart" && (
        <CartPage
          cart={cart}
          cartItemCount={cartItemCount}
          cartSubtotal={cartSubtotal}
          cartTotal={cartTotal}
          formatMoney={formatMoney}
          handleCartQuantityChange={handleCartQuantityChange}
          handleRemoveFromCart={handleRemoveFromCart}
          handleClearCart={handleClearCart}
          setPage={setPage}
        />
      )}

      {page === "order-creation" && (
        <OrderPage
          actionInFlight={actionInFlight}
          ButtonLabel={ButtonLabel}
          TableSkeleton={TableSkeleton}
          allOrders={allOrders}
          orderSearchQuery={orderSearchQuery}
          setOrderSearchQuery={setOrderSearchQuery}
          handleLoadAllOrders={handleLoadAllOrders}
          pendingAction={pendingAction}
          formatMoney={formatMoney}
          setOrderId={setOrderId}
          setCurrentOrderSnapshot={setCurrentOrderSnapshot}
          setPage={setPage}
          setNotice={setNotice}
          customerForm={customerForm}
          setCustomerForm={setCustomerForm}
          handleCreateOrder={handleCreateOrder}
          cart={cart}
          cartItemCount={cartItemCount}
          cartSubtotal={cartSubtotal}
          cartTotal={cartTotal}
        />
      )}

      {page === "payment" && (
        <PaymentPage
          actionInFlight={actionInFlight}
          ButtonLabel={ButtonLabel}
          TableSkeleton={TableSkeleton}
          DetailCardSkeleton={DetailCardSkeleton}
          allPayments={allPayments}
          paymentSearchQuery={paymentSearchQuery}
          setPaymentSearchQuery={setPaymentSearchQuery}
          handleLoadAllPayments={handleLoadAllPayments}
          pendingAction={pendingAction}
          formatMoney={formatMoney}
          setPaymentData={setPaymentData}
          setOrderId={setOrderId}
          setCurrentOrderSnapshot={setCurrentOrderSnapshot}
          setPage={setPage}
          setNotice={setNotice}
          currentOrderSnapshot={currentOrderSnapshot}
          orderId={orderId}
          expectedPaymentAmount={expectedPaymentAmount}
          paymentForm={paymentForm}
          setPaymentForm={setPaymentForm}
          handlePaymentMethodChange={handlePaymentMethodChange}
          PAYMENT_METHODS={PAYMENT_METHODS}
          paymentBalance={paymentBalance}
          handleVerifyPaymentDetails={handleVerifyPaymentDetails}
          paymentVerified={paymentVerified}
          handleProcessPayment={handleProcessPayment}
          handleLoadPaymentStatus={handleLoadPaymentStatus}
          paymentData={paymentData}
          handleConfirmPayment={handleConfirmPayment}
          getPaymentStage={getPaymentStage}
          formatDate={formatDate}
        />
      )}

      {/* CART PAGE */}
      {false && page === "cart" && (
        <main className="page-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">Cart Workspace</p>
                <h2>Review selected inventory lines</h2>
                <p className="workflow-note">
                  Adjust quantities, remove lines, and validate the basket
                  before moving to order creation.
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
                            handleCartQuantityChange(
                              item.productId,
                              item.quantity - 1,
                            )
                          }
                          className="qty-btn"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleCartQuantityChange(
                              item.productId,
                              e.target.value,
                            )
                          }
                          className="qty-input"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleCartQuantityChange(
                              item.productId,
                              item.quantity + 1,
                            )
                          }
                          className="qty-btn"
                        >
                          +
                        </button>
                      </div>

                      <span className="cart-line-unit">{formatMoney(item.price)}</span>
                      <strong className="cart-line-total">{formatMoney(item.subtotal)}</strong>

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
      )}

      {/* ORDER CREATION PAGE */}
      {false && page === "order-creation" && (
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
                  Finalize the order profile before the payment and shipment
                  flow begins.
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
      )}

      {/* PAYMENT PAGE */}
      {false && page === "payment" && (
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
                    ),
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
      )}

      {/* SHIPMENT PAGE */}
      {page === "shipment" && (
        <main className="page-grid">
          <section className="panel full-width">
            <div className="panel-heading">
              <div>
                <p className="section-label">All Shipments</p>
                <h2>View shipment history</h2>
              </div>
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

                  {allShipments
                    .filter((shipment) => {
                      const query = shipmentSearchQuery.trim().toLowerCase();
                      if (!query) {
                        return true;
                      }

                      return (
                        String(shipment.shipmentId).includes(query) ||
                        String(shipment.orderId).includes(query) ||
                        (shipment.customerName || "").toLowerCase().includes(query) ||
                        (shipment.shipmentStatus || "").toLowerCase().includes(query) ||
                        (shipment.deliveryPerson || "").toLowerCase().includes(query)
                      );
                    })
                    .map((shipment) => (
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
                            onClick={() => {
                              setShipmentData(shipment);
                              setShipmentForm({
                                orderId: String(shipment.orderId || ""),
                                customerName: shipment.customerName || "",
                                contactNumber: shipment.contactNumber || "",
                                deliveryAddress: shipment.deliveryAddress || "",
                                email: shipment.email || "",
                                shipmentStatus: shipment.shipmentStatus || "SHIPPED",
                              });
                              setDeliveryPersonForm(shipment.deliveryPerson || "");
                              setShipmentStatusFormByOrder("");
                              setOrderId(shipment.orderId ?? orderId ?? null);
                              setPage("shipment");
                              setNotice(`Loaded shipment #${shipment.shipmentId}`);
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
                <p className="section-label">Shipment Creation</p>
                <h2>Create shipment with autofilled order data</h2>
              </div>
            </div>

            {!orderId ? (
              <p className="workflow-note">
                Create and pay for an order first. The shipment page uses the current order ID to load autofilled data.
              </p>
            ) : (
              <>
                <div className="shipment-order-banner">
                  <span>Current Order</span>
                  <strong>#{orderId}</strong>
                </div>

                <form
                  className="order-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateShipment();
                  }}
                >
                  <input
                    value={shipmentForm.orderId}
                    onChange={(e) =>
                      setShipmentForm({ ...shipmentForm, orderId: e.target.value })
                    }
                    placeholder="Order ID"
                    type="number"
                    required
                  />
                  <input
                    value={shipmentForm.customerName}
                    onChange={(e) =>
                      setShipmentForm({ ...shipmentForm, customerName: e.target.value })
                    }
                    placeholder="Customer name"
                    required
                  />
                  <input
                    value={shipmentForm.contactNumber}
                    onChange={(e) =>
                      setShipmentForm({ ...shipmentForm, contactNumber: e.target.value })
                    }
                    placeholder="Contact number"
                    required
                  />
                  <input
                    value={shipmentForm.email}
                    onChange={(e) =>
                      setShipmentForm({ ...shipmentForm, email: e.target.value })
                    }
                    placeholder="Email"
                    type="email"
                    required
                  />
                  <textarea
                    value={shipmentForm.deliveryAddress}
                    onChange={(e) =>
                      setShipmentForm({
                        ...shipmentForm,
                        deliveryAddress: e.target.value,
                      })
                    }
                    placeholder="Delivery address"
                    required
                  />
                  <select
                    value={shipmentForm.shipmentStatus}
                    onChange={(e) =>
                      setShipmentForm({
                        ...shipmentForm,
                        shipmentStatus: e.target.value,
                      })
                    }
                  >
                    {SHIPMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <div className="shipment-action-row">
                    <button type="submit" disabled={actionInFlight}>
                      <ButtonLabel
                        loading={pendingAction === "create-shipment"}
                        loadingText="Creating Shipment..."
                      >
                        Create Shipment
                      </ButtonLabel>
                    </button>
                    {shipmentData && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={handleLoadShipmentDetails}
                        disabled={actionInFlight}
                      >
                        <ButtonLabel
                          loading={pendingAction === "load-shipment"}
                          loadingText="Loading Shipment..."
                        >
                          Load Existing Shipment
                        </ButtonLabel>
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </section>

          {shipmentData && (
            <section className="panel full-width">
              <div className="panel-heading">
                <div>
                  <p className="section-label">Shipment Details</p>
                  <h2>Shipment information</h2>
                </div>
              </div>

              <div className="shipment-card">
                <div className="shipment-header-info">
                  <div>
                    <span>Shipment ID</span>
                    <strong>#{shipmentData.shipmentId}</strong>
                  </div>
                  <div>
                    <span>Order ID</span>
                    <strong>#{shipmentData.orderId}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong className="status-pill">
                      {shipmentData.shipmentStatus}
                    </strong>
                  </div>
                </div>

                <div className="shipment-grid">
                  <div>
                    <span>Customer Name</span>
                    <strong>{shipmentData.customerName || "N/A"}</strong>
                  </div>
                  <div>
                    <span>Contact Number</span>
                    <strong>{shipmentData.contactNumber || "N/A"}</strong>
                  </div>
                  <div>
                    <span>Address</span>
                    <strong>{shipmentData.deliveryAddress || "N/A"}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{shipmentData.email || "N/A"}</strong>
                  </div>
                  <div>
                    <span>Shipment Date</span>
                    <strong>{formatDate(shipmentData.shipmentDate)}</strong>
                  </div>
                  <div>
                    <span>Estimated Delivery</span>
                    <strong>{formatDate(shipmentData.estimatedDelivery)}</strong>
                  </div>
                  <div>
                    <span>Delivery Person</span>
                    <strong>{shipmentData.deliveryPerson || "Not assigned"}</strong>
                  </div>
                </div>
              </div>
            </section>
          )}

          {pendingAction === "load-shipment" && !shipmentData && (
            <section className="panel full-width">
              <div className="panel-heading">
                <div>
                  <p className="section-label">Shipment Details</p>
                  <h2>Shipment information</h2>
                </div>
              </div>

              <DetailCardSkeleton lines={7} className="shipment-card" />
            </section>
          )}

          {shipmentData && (
            <section className="panel full-width">
              <div className="panel-heading">
                <div>
                  <p className="section-label">Delivery Assignment + Status Update</p>
                  <h2>Manage delivery operations</h2>
                </div>
              </div>

              <div className="two-columns-grid">
                <form
                  className="form-grid"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAssignDeliveryPersonByOrder();
                  }}
                >
                  <p className="section-label">Assign Delivery</p>
                  <input
                    value={deliveryPersonForm}
                    onChange={(e) => setDeliveryPersonForm(e.target.value)}
                    placeholder="Delivery person"
                    required
                  />
                  <button
                    type="submit"
                    className="secondary-button"
                    disabled={actionInFlight}
                  >
                    <ButtonLabel
                      loading={pendingAction === "assign-delivery"}
                      loadingText="Assigning..."
                    >
                      Assign
                    </ButtonLabel>
                  </button>
                </form>

                <form
                  className="form-grid"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateShipmentStatusByOrder();
                  }}
                >
                  <p className="section-label">Update Status</p>
                  <select
                    value={shipmentStatusFormByOrder}
                    onChange={(e) =>
                      setShipmentStatusFormByOrder(e.target.value)
                    }
                    required
                  >
                    <option value="">Select new status</option>
                    {["SHIPPED", "DELIVERED"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button type="submit" disabled={actionInFlight}>
                    <ButtonLabel
                      loading={pendingAction === "update-shipment-status"}
                      loadingText="Updating..."
                    >
                      Update Status
                    </ButtonLabel>
                  </button>
                </form>
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
