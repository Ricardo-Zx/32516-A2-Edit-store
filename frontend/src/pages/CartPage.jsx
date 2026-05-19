/**
 * CartPage — the shopping bag: line items, quantity steppers, order
 * summary and a real checkout that creates an order on the backend.
 *
 * @author Yuchang Zhang
 */
import { Box, Button, Container, Divider, IconButton, Stack, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import api, { describeError } from "../api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

export default function CartPage() {
  const { cart, updateItem, removeItem, clear, refresh, pendingItemIds } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleCheckout = async () => {
    if (!cart.items.length || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post("/orders");
      await refresh();
      showToast(`Order placed. ${data.item_count} item(s) confirmed.`, "success");
      navigate("/orders", { state: { justPlaced: true, orderId: data.id } });
    } catch (error) {
      showToast(describeError(error, "Checkout failed."), "error");
    } finally {
      setBusy(false);
    }
  };

  if (!cart.items.length) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Your bag is empty
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Discover something new from this season's edit.
        </Typography>
        <Button component={RouterLink} to="/shop" variant="contained" size="large">
          Continue shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 40 }, mb: 4 }}>
        Shopping bag
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 6 }}>
        <Stack divider={<Divider />} spacing={3}>
          {cart.items.map((item) => (
            <Stack
              key={item.product_id}
              direction="row"
              spacing={3}
              sx={{ opacity: pendingItemIds.includes(item.product_id) ? 0.55 : 1, transition: "opacity 180ms ease" }}
            >
              <Box
                component="img"
                src={item.image}
                alt={item.name}
                sx={{ width: 120, height: 150, objectFit: "cover", bgcolor: "#f5f5f5" }}
              />
              <Stack flex={1} justifyContent="space-between">
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {item.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.color}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    ${item.price.toFixed(2)}
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => updateItem(item.product_id, Math.max(0, item.quantity - 1))}
                      disabled={pendingItemIds.includes(item.product_id)}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ minWidth: 24, textAlign: "center" }}>{item.quantity}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => updateItem(item.product_id, item.quantity + 1)}
                      disabled={pendingItemIds.includes(item.product_id)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography sx={{ fontWeight: 500 }}>${item.subtotal.toFixed(2)}</Typography>
                    <IconButton onClick={() => removeItem(item.product_id)} disabled={pendingItemIds.includes(item.product_id)}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          ))}
        </Stack>

        <Box sx={{ position: { md: "sticky" }, top: 96, alignSelf: "start", bgcolor: "#fafafa", p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Order summary
          </Typography>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Items</Typography>
              <Typography>{cart.item_count}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography>${cart.total.toFixed(2)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Shipping</Typography>
              <Typography>Free</Typography>
            </Stack>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">${cart.total.toFixed(2)}</Typography>
          </Stack>
          <Button variant="contained" fullWidth size="large" onClick={handleCheckout} disabled={busy}>
            {busy ? "Placing order..." : "Checkout"}
          </Button>
          <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => clear()} disabled={busy}>
            Empty bag
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
