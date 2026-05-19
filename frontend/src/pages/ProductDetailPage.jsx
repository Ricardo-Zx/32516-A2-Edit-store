/**
 * ProductDetailPage — single product view with large imagery, metadata
 * and an add-to-bag action; handles loading and not-found states.
 *
 * @author Frontend (teammate — TBD)
 */
import { Box, Button, Chip, CircularProgress, Container, IconButton, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api";
import { useCart } from "../context/CartContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, addingItemId } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    setQty(1);
    setError("");
    setProduct(null);
    setAddedFeedback(false);
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch(() => setError("Product not found."));
  }, [id]);

  const maxQty = product ? Math.min(99, product.stock) : 1;
  const clampQty = (value) => Math.max(1, Math.min(maxQty, value));
  const isAdding = addingItemId === product?.id;

  if (error) {
    return (
      <Container sx={{ py: 8 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button onClick={() => navigate("/shop")}>Back to shop</Button>
      </Container>
    );
  }

  if (!product) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 10 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 4, md: 9 },
          alignItems: { md: "center" },
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: "100%", md: 460 },
            aspectRatio: "1 / 1",
            bgcolor: "#f5f5f5",
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={product.image}
            alt={product.name}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
        <Stack spacing={3} sx={{ width: { xs: "100%", md: 420 }, flexShrink: 0 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                {product.category}
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 40 }, mt: 1 }}>
                {product.name}
              </Typography>
              <Typography variant="h5" sx={{ mt: 2, fontWeight: 500 }}>
                ${product.price.toFixed(2)}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {product.color && <Chip label={product.color} size="small" />}
              {product.product_type && <Chip label={product.product_type} size="small" variant="outlined" />}
            </Stack>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {product.description || "Crafted with care from soft, breathable fabrics for an effortless everyday fit."}
            </Typography>
            {product.stock > 0 && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="overline" sx={{ letterSpacing: "0.2em", color: "text.secondary" }}>
                  Quantity
                </Typography>
                <Stack direction="row" alignItems="center" sx={{ border: "1px solid #d8d2cb" }}>
                  <IconButton
                    size="small"
                    aria-label="decrease quantity"
                    onClick={() => setQty((value) => clampQty(value - 1))}
                    disabled={qty <= 1}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ minWidth: 36, textAlign: "center" }}>{qty}</Typography>
                  <IconButton
                    size="small"
                    aria-label="increase quantity"
                    onClick={() => setQty((value) => clampQty(value + 1))}
                    disabled={qty >= maxQty}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            )}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={async () => {
                if (addedFeedback) {
                  navigate("/cart");
                  return;
                }
                const result = await addItem(product.id, qty);
                if (result?.ok) {
                  setAddedFeedback(true);
                  window.setTimeout(() => setAddedFeedback(false), 1600);
                }
              }}
              disabled={product.stock === 0 || isAdding}
            >
              {product.stock === 0
                ? "Sold out"
                : isAdding
                  ? "Adding..."
                  : addedFeedback
                    ? "Added · View bag"
                    : `Add ${qty} to bag`}
            </Button>
            <Typography variant="caption" color="text.secondary">
              {product.stock} in stock · Department: {product.department || "—"}
            </Typography>
          </Stack>
      </Box>
    </Container>
  );
}
