export const getPayUrl = (requestId: string) =>
  window.location.hostname === "localhost"
    ? `http://localhost:3001/${requestId}`
    : window.location.hostname.startsWith("dev")
    ? `https://dev-huma-request-apps-pay.netlify.app/${requestId}`
    : `https://huma-request-apps-pay.netlify.app/${requestId}`;
