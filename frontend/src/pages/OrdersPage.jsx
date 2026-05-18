/**
 * OrdersPage — the signed-in user's order history: each placed order
 * with its items, total and current fulfilment status.
 *
 * @author Frontend (teammate — TBD)
 */
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import api, { describeError } from "../api";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip label={order.status} size="small" color="primary" />
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
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Container>
  );
}
