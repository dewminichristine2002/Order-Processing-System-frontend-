const { createProxyMiddleware } = require("http-proxy-middleware");

const env = process.env;
const routeTargets = {
  "/orders":
    env.ORDER_SERVICE_URL ||
    "https://order-service.greenisland-18bb041c.southeastasia.azurecontainerapps.io",
  "/inventory":
    env.INVENTORY_SERVICE_URL ||
    "https://inventory-service.nicewave-b507020a.eastasia.azurecontainerapps.io",
  "/payments":
    env.PAYMENTS_SERVICE_URL ||
    "https://payment.gentletree-6b17349b.southeastasia.azurecontainerapps.io",
  "/shipping":
    env.SHIPPING_SERVICE_URL ||
    "https://shipping-service.orangeglacier-dfccfaea.southeastasia.azurecontainerapps.io",
};

module.exports = function setupProxy(app) {
  Object.entries(routeTargets).forEach(([path, target]) => {
    app.use(
      path,
      createProxyMiddleware({
        target,
        changeOrigin: true,
        secure: true,
        onProxyReq(proxyReq) {
          proxyReq.removeHeader("origin");
        },
      }),
    );
  });
};
