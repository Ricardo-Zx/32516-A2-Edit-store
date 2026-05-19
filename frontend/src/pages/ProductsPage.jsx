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

function formatPriceBand(minPrice, maxPrice) {
  if (!minPrice && !maxPrice) return "";
  if (!minPrice) return `Under $${maxPrice}`;
  if (!maxPrice) return `$${minPrice}+`;
  return `$${minPrice}-$${maxPrice}`;
}

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

  const activeFilters = useMemo(() => {
    const filters = [];
    if (gender) filters.push(gender);
    if (category) filters.push(category);
    if (query) filters.push(`"${query}"`);
    const priceLabel = formatPriceBand(minPrice, maxPrice);
    if (priceLabel) filters.push(priceLabel);
    if (sort !== "newest") {
      const sortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label;
      if (sortLabel) filters.push(sortLabel);
    }
    return filters;
  }, [gender, category, query, minPrice, maxPrice, sort]);

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (gender) next.set("gender", gender);
    setSearchParams(next, { replace: true });
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Box
        sx={{
          borderTop: "1px solid rgba(72, 57, 46, 0.12)",
          borderBottom: "1px solid rgba(72, 57, 46, 0.12)",
          py: { xs: 3, md: 4.5 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.1fr) minmax(320px, 0.9fr)" },
          gap: { xs: 3, md: 6 },
          alignItems: "end",
        }}
      >
        <Box>
          <Typography variant="overline" sx={{ letterSpacing: "0.3em", color: "text.secondary" }}>
            {gender ? gender.toUpperCase() : "ALL COLLECTION"}
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontWeight: 600,
              fontSize: { xs: 34, md: 68 },
              letterSpacing: "-0.03em",
              mt: 0.75,
              lineHeight: 0.95,
            }}
          >
            {HEADLINES[gender] || "The collection."}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 520, lineHeight: 1.7 }}>
            A curated edit shaped by clean lines, warmer neutrals and everyday pieces that still feel composed.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
          <Input
            placeholder="Search by name, colour or type"
            value={query}
            onChange={(event) => updateParam("q", event.target.value)}
            inputProps={{ "aria-label": "search products" }}
            sx={{
              width: "100%",
              fontSize: { xs: 15, md: 16 },
              letterSpacing: "0.12em",
              "& input": {
                py: 1.25,
                textTransform: "uppercase",
              },
              "&:before": { borderBottom: "1px solid rgba(72, 57, 46, 0.24)" },
              "&:hover:not(.Mui-disabled):before": { borderBottom: "1px solid rgba(72, 57, 46, 0.4) !important" },
              "&:after": { borderBottom: "1px solid #1a1a1a" },
            }}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              color: "text.secondary",
            }}
          >
            <Typography variant="caption" sx={{ letterSpacing: "0.16em", textTransform: "uppercase" }}>
              {subtitle}
            </Typography>
            <TextField
              select
              size="small"
              label="Sort by"
              value={sort}
              onChange={(event) => updateParam("sort", event.target.value)}
              sx={{
                minWidth: 220,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.35)",
                  borderRadius: 0,
                  fontSize: 14,
                },
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </Box>

      {activeFilters.length > 0 && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", md: "center" }}
          sx={{ mt: 2.5, mb: 1 }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Current filters
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            {activeFilters.map((filter) => (
              <Chip key={filter} label={filter} size="small" variant="outlined" />
            ))}
          </Stack>
          <Typography
            component="button"
            onClick={clearFilters}
            sx={{
              border: 0,
              bgcolor: "transparent",
              p: 0,
              cursor: "pointer",
              color: "text.primary",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontSize: 12,
            }}
          >
            Clear filters
          </Typography>
        </Stack>
      )}

      <Box
        sx={{
          mt: 3.5,
          mb: 5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) auto" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          <Chip
            label="All"
            onClick={() => updateParam("category", "")}
            variant={category ? "outlined" : "filled"}
            color={category ? "default" : "primary"}
            sx={{ borderRadius: 999, height: 34 }}
          />
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => updateParam("category", category === cat ? "" : cat)}
              variant={category === cat ? "filled" : "outlined"}
              color={category === cat ? "primary" : "default"}
              sx={{ borderRadius: 999, height: 34 }}
            />
          ))}
        </Stack>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, justifyContent: { xs: "flex-start", lg: "flex-end" } }}>
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
                sx={{ borderRadius: 999, height: 34 }}
              />
            );
          })}
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={{ xs: 3, md: 4, lg: 5 }}>
          {products.map((product) => (
            <Grid item xs={6} md={4} xl={3} key={product.id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
