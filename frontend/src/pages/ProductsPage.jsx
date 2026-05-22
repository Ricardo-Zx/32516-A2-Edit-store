/**
 * ProductsPage — the /shop catalogue.
 * Live keyword search (debounced), gender/category chips, price-range
 * presets, and server-side sorting. All filter state lives in the URL so
 * results are shareable and the back button works.
 *
 * @author Mengshan Wang
 */
import {
  Box,
  Chip,
  Container,
  Grid,
  Input,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { getCategories, getProducts } from "../lib/productCache";

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

const GENDER_OPTIONS = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "kids", label: "Kids" },
];

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
    getCategories()
      .then((data) => setCategories(data))
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
      getProducts(params)
        .then((data) => {
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

  const hasActiveFilters =
    Boolean(gender || category || query || minPrice || maxPrice) || sort !== "newest";

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
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
            A refined edit of pieces to wear now.
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
        <Stack spacing={1.25}>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            <Chip
              label="All departments"
              onClick={() => updateParam("gender", "")}
              variant={gender ? "outlined" : "filled"}
              color={gender ? "default" : "primary"}
              sx={{ borderRadius: 999, height: 34 }}
            />
            {GENDER_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                onClick={() => updateParam("gender", gender === option.value ? "" : option.value)}
                variant={gender === option.value ? "filled" : "outlined"}
                color={gender === option.value ? "primary" : "default"}
                sx={{ borderRadius: 999, height: 34 }}
              />
            ))}
          </Stack>
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
          <Chip
            label="Clear all"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            variant="outlined"
            sx={{ borderRadius: 999, height: 34, ml: { lg: 0.5 } }}
          />
        </Stack>
      </Box>

      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={{ xs: 3, md: 4, lg: 5 }}>
          {loading
            ? Array.from({ length: 8 }).map((_, index) => (
                <Grid item xs={6} md={4} xl={3} key={`product-skeleton-${index}`}>
                  <Skeleton variant="rectangular" sx={{ minHeight: 276, bgcolor: "#efe5d7" }} />
                  <Skeleton sx={{ mt: 2, width: "35%", bgcolor: "#efe5d7" }} />
                  <Skeleton sx={{ mt: 1, width: "70%", height: 34, bgcolor: "#efe5d7" }} />
                  <Skeleton sx={{ mt: 1, width: "40%", bgcolor: "#efe5d7" }} />
                </Grid>
              ))
            : products.map((product) => (
                <Grid item xs={6} md={4} xl={3} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
        </Grid>
      )}
    </Container>
  );
}
