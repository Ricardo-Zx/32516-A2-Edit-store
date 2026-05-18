/**
 * ProductsPage — the /shop catalogue.
 * Live keyword search (debounced), gender/category chips, price-range
 * presets, and server-side sorting. All filter state lives in the URL so
 * results are shareable and the back button works.
 *
 * @author Frontend (teammate — TBD)
 */
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Input,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api";
import ProductCard from "../components/ProductCard";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A–Z" },
];

const PRICE_BANDS = [
  { label: "Under $30", min: "", max: "30" },
  { label: "$30 – $60", min: "30", max: "60" },
  { label: "$60 – $90", min: "60", max: "90" },
  { label: "$90+", min: "90", max: "" },
];

const HEADLINES = {
  women: "For her.",
  men: "For him.",
  kids: "Little edits.",
};

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const gender = searchParams.get("gender") || "";
  const sort = searchParams.get("sort") || "newest";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";

  useEffect(() => {
    api
      .get("/products/categories")
      .then(({ data }) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = { sort };
    if (query) params.q = query;
    if (category) params.category = category;
    if (gender) params.gender = gender;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;

    const handle = setTimeout(() => {
      api
        .get("/products", { params })
        .then(({ data }) => {
          if (!cancelled) setProducts(data);
        })
        .catch(() => {
          if (!cancelled) setError("Could not load products. Please retry.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, category, gender, sort, minPrice, maxPrice]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const setPriceBand = (band) => {
    const next = new URLSearchParams(searchParams);
    const isActive = minPrice === band.min && maxPrice === band.max;
    if (isActive) {
      next.delete("min_price");
      next.delete("max_price");
    } else {
      band.min ? next.set("min_price", band.min) : next.delete("min_price");
      band.max ? next.set("max_price", band.max) : next.delete("max_price");
    }
    setSearchParams(next, { replace: true });
  };

  const subtitle = useMemo(() => {
    if (loading) return "Loading...";
    if (!products.length) return "No products match your filters.";
    return `${products.length} item${products.length === 1 ? "" : "s"}`;
  }, [loading, products]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="overline" sx={{ letterSpacing: "0.3em", color: "text.secondary" }}>
        {gender ? gender.toUpperCase() : "ALL"}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Cormorant Garamond", serif',
          fontWeight: 600,
          fontSize: { xs: 36, md: 64 },
          letterSpacing: "-0.02em",
          mt: 1,
        }}
      >
        {HEADLINES[gender] || "The collection."}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        {subtitle}
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", py: { xs: 3, md: 6 } }}>
        <Input
          placeholder="What are you looking for?"
          value={query}
          onChange={(event) => updateParam("q", event.target.value)}
          inputProps={{ "aria-label": "search products" }}
          sx={{
            width: { xs: "100%", md: 560 },
            fontSize: { xs: 18, md: 22 },
            letterSpacing: "0.18em",
            "& input": { textAlign: "center", textTransform: "uppercase", py: 1.5 },
            "&:before": { borderBottom: "1px solid #1a1a1a" },
            "&:hover:not(.Mui-disabled):before": { borderBottom: "1px solid #1a1a1a !important" },
            "&:after": { borderBottom: "2px solid #1a1a1a" },
          }}
        />
      </Box>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          <Chip
            label="All"
            onClick={() => updateParam("category", "")}
            variant={category ? "outlined" : "filled"}
            color={category ? "default" : "primary"}
          />
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => updateParam("category", category === cat ? "" : cat)}
              variant={category === cat ? "filled" : "outlined"}
              color={category === cat ? "primary" : "default"}
            />
          ))}
        </Stack>
        <TextField
          select
          size="small"
          label="Sort by"
          value={sort}
          onChange={(event) => updateParam("sort", event.target.value)}
          sx={{ minWidth: 200 }}
        >
          {SORT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 5 }}>
        {PRICE_BANDS.map((band) => {
          const active = minPrice === band.min && maxPrice === band.max;
          return (
            <Chip
              key={band.label}
              label={band.label}
              size="small"
              onClick={() => setPriceBand(band)}
              variant={active ? "filled" : "outlined"}
              color={active ? "primary" : "default"}
            />
          );
        })}
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {products.map((product) => (
            <Grid item xs={6} sm={4} md={3} key={product.id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
