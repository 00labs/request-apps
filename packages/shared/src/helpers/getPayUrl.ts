export const getPayUrl = (requestId: string): string => {
  if (process.env.REACT_APP_PAYMENT_URL) {
    return `${process.env.REACT_APP_PAYMENT_URL}/${requestId}`;
  }
  return window.location.hostname === "localhost"
    ? `http://localhost:8000/${requestId}`
    : window.location.hostname.startsWith("dev")
    ? `https://dev-huma-request-apps-pay.netlify.app/${requestId}`
    : `https://huma-request-apps-pay.netlify.app/${requestId}`;
};
