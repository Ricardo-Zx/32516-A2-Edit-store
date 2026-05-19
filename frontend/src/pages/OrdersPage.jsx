/**
 * OrdersPage — the signed-in user's order history: each placed order
 * with its items, total and current fulfilment status.
 *
 * @author Frontend (teammate — TBD)
 */
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";

import api, { describeError } from "../api";

const STATUS_STYLES = {
  placed: { label: "Placed", color: "default" },
  processing: { label: "Processing", color: "warning" },
  shipped: { label: "Shipped", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
};

export default function OrdersPage() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bannerVisible, setBannerVisible] = useState(Boolean(location.state?.justPlaced));
  const [pendingOrderId, setPendingOrderId] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/orders")
      .then(({ data }) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err, "Could not load orders."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (pendingOrderId) return;
    setPendingOrderId(orderId);
    try {
      const { data } = await api.post(`/orders/${orderId}/cancel`);
      setOrders((current) => current.map((order) => (order.id === orderId ? data : order)));
    } catch (err) {
      setError(describeError(err, "Could not cancel this order."));
    } finally {
      setPendingOrderId("");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
      <Typography variant="overline" sx={{ letterSpacing: "0.28em", color: "text.secondary" }}>
        ORDER HISTORY
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: { xs: 40, md: 68 },
          lineHeight: 0.95,
          mt: 1,
          mb: 5,
        }}
        >
        Your placed orders.
      </Typography>
      {bannerVisible && (
        <Alert severity="success" onClose={() => setBannerVisible(false)} sx={{ mb: 4 }}>
          Order placed successfully. You can track it here while the store processes fulfilment.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : !orders.length ? (
        <Stack spacing={2} alignItems="flex-start">
          <Typography color="text.secondary">You have not placed any orders yet.</Typography>
          <Typography
            component={RouterLink}
            to="/shop"
            sx={{ textDecoration: "none", color: "text.primary", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 12 }}
          >
            Continue shopping
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={3}>
          {orders.map((order) => (
            <Box key={order.id} sx={{ bgcolor: "background.paper", border: "1px solid rgba(72, 57, 46, 0.12)" }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={2}
                sx={{ p: 3 }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    {new Date(order.created_at).toLocaleString()}
                  </Typography>
                  <Typography sx={{ mt: 0.5 }}>Order #{order.id.slice(-6).toUpperCase()}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    {order.status === "cancelled"
                      ? `Cancelled ${new Date(order.updated_at || order.created_at).toLocaleString()}`
                      : `Last updated ${new Date(order.updated_at || order.created_at).toLocaleString()}`}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip
                    label={(STATUS_STYLES[order.status] || STATUS_STYLES.placed).label}
                    size="small"
                    color={(STATUS_STYLES[order.status] || STATUS_STYLES.placed).color}
                  />
                  <Typography sx={{ letterSpacing: "0.06em" }}>${order.total.toFixed(2)}</Typography>
                </Stack>
              </Stack>
              <Divider />
              <Stack spacing={0} sx={{ p: 3 }}>
                {order.items.map((item, index) => (
                  <Stack key={`${order.id}-${item.product_id}`} spacing={0}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 2 }}>
                      <Box
                        component="img"
                        src={item.image}
                        alt={item.name}
                        sx={{ width: 84, height: 108, objectFit: "cover", bgcolor: "#eee6db" }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 28, lineHeight: 1 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {item.color || "Curated piece"} · Qty {item.quantity}
                        </Typography>
                      </Box>
                      <Typography>${item.subtotal.toFixed(2)}</Typography>
                    </Stack>
                    {index < order.items.length - 1 && <Divider />}
                  </Stack>
                ))}
                {(order.status === "placed" || order.status === "processing") && (
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ pt: 3 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      Need to stop this order? Cancel before it ships.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="inherit"
                      disabled={pendingOrderId === order.id}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      {pendingOrderId === order.id ? "Cancelling..." : "Cancel order"}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Container>
  );
}
