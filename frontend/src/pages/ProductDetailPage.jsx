/**
 * ProductDetailPage — single product view with large imagery, metadata
 * and an add-to-bag action; handles loading and not-found states.
 *
 * @author Frontend (teammate — TBD)
 */
import { Box, Button, Chip, CircularProgress, Container, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api";
import { useCart } from "../context/CartContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch(() => setError("Product not found."));
  }, [id]);

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
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
      <Grid container spacing={{ xs: 4, md: 8 }}>
        <Grid item xs={12} md={7}>
          <Box
            sx={{
              bgcolor: "#f5f5f5",
              aspectRatio: "1 / 1.2",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src={product.image}
              alt={product.name}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={5}>
          <Stack spacing={3} sx={{ position: "sticky", top: 96 }}>
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
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => addItem(product.id, 1)}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? "Sold out" : "Add to bag"}
            </Button>
            <Typography variant="caption" color="text.secondary">
              {product.stock} in stock · Department: {product.department || "—"}
            </Typography>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
