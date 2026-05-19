/**
 * HomePage — the editorial landing page: full-bleed hero, a horizontal
 * featured rail, gendered campaign spotlights and category features.
 *
 * @author Frontend (teammate — TBD)
 */
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import api from "../api";
import ProductCard from "../components/ProductCard";

const EDITORIAL = {
  hero: "/editorial/hero-alt-women.jpg",
  women: "/editorial/women-campaign.jpg",
  men: "/editorial/men-campaign.png",
  shoes: "/editorial/shoes-feature.png",
  bags: "/editorial/bags-feature.png",
};

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products", { params: { limit: 200 } }).then(({ data }) => setProducts(data));
  }, []);

  const byGender = useMemo(() => {
    const groups = { women: [], men: [], kids: [] };
    products.forEach((product) => {
      if (groups[product.gender]) groups[product.gender].push(product);
    });
    return groups;
  }, [products]);

  const byCategory = useMemo(() => {
    const groups = {};
    products.forEach((product) => {
      groups[product.category] ||= [];
      groups[product.category].push(product);
    });
    return groups;
  }, [products]);

  const railProducts = useMemo(
    () => [
      ...(byCategory.Accessories || []).slice(0, 2),
      ...(byCategory.Bags || []).slice(0, 1),
      ...(byCategory.Shoes || []).slice(0, 2),
      ...(byCategory.Tops || []).slice(0, 1),
    ].slice(0, 6),
    [byCategory]
  );

  const splitSpotlights = useMemo(
    () => [
      { label: "Women", to: "/shop?gender=women", image: EDITORIAL.women },
      { label: "Men", to: "/shop?gender=men", image: EDITORIAL.men },
    ],
    []
  );

  const categoryFeatures = useMemo(
    () => [
      {
        title: "Shoes",
        subtitle: "Sharp silhouettes and grounded essentials.",
        to: "/shop?category=Shoes",
        products: byCategory.Shoes || [],
        image: EDITORIAL.shoes,
        objectPosition: "center center",
      },
      {
        title: "Bags",
        subtitle: "Compact statements for every exit.",
        to: "/shop?category=Bags",
        products: byCategory.Bags || [],
        image: EDITORIAL.bags,
        objectPosition: "center center",
      },
    ],
    [byCategory]
  );

  const arrivals = useMemo(() => products.slice(0, 8), [products]);

  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: "82vh", md: "92vh" },
          display: "flex",
          alignItems: "flex-end",
          bgcolor: "#d9cec0",
          overflow: "hidden",
        }}
      >
        <Box
          component={motion.img}
          src={EDITORIAL.hero}
          alt="Editorial fashion campaign"
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1 }}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            filter: "sepia(0.12) saturate(0.92) contrast(0.92)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(20,15,12,0.55) 0%, rgba(20,15,12,0.18) 42%, rgba(20,15,12,0.05) 100%)",
          }}
        />
        <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, py: { xs: 8, md: 10 } }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85 }}
          >
            <Stack spacing={2.5} sx={{ maxWidth: 620, color: "#f8f2ea" }}>
              <Typography
                variant="overline"
                sx={{ letterSpacing: "0.45em", color: "rgba(248,242,234,0.78)" }}
              >
                SPRING SUMMER 2026
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontWeight: 600,
                  fontSize: { xs: 58, md: 118 },
                  lineHeight: 0.88,
                  letterSpacing: "-0.04em",
                }}
              >
                Modern tailoring
                <br />
                with a restless edge.
              </Typography>
              <Typography sx={{ maxWidth: 420, color: "rgba(248,242,234,0.82)", lineHeight: 1.8 }}>
                Built like an editorial storefront: statement pieces first, then a clean path
                into women, men, shoes, bags, and the week&apos;s sharpest arrivals.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ pt: 1 }}>
                <Button component={RouterLink} to="/shop" variant="contained" size="large">
                  Shop New Arrivals
                </Button>
                <Button
                  component={RouterLink}
                  to="/shop?category=Accessories"
                  variant="outlined"
                  size="large"
                  sx={{ borderColor: "rgba(248,242,234,0.65)", color: "#f8f2ea" }}
                >
                  Explore Accessories
                </Button>
              </Stack>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 9 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="overline" sx={{ letterSpacing: "0.3em", color: "text.secondary" }}>
              FEATURED OBJECTS
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 34, md: 56 },
                lineHeight: 0.95,
              }}
            >
              The first row should pull you in.
            </Typography>
          </Box>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: { xs: "72%", sm: "44%", md: "23.5%" },
            gap: 3,
            overflowX: "auto",
            pb: 1,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {railProducts.map((product) => (
            <Box key={product.id}>
              <ProductCard product={product} />
            </Box>
          ))}
        </Box>
      </Container>

      <Container maxWidth="xl" sx={{ pb: { xs: 7, md: 12 } }}>
        <Stack spacing={1} sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography variant="overline" sx={{ letterSpacing: "0.3em", color: "text.secondary" }}>
            GENDERED EDITS
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontWeight: 600,
              fontSize: { xs: 36, md: 64 },
              letterSpacing: "-0.03em",
            }}
          >
            Women and men, framed like campaigns.
          </Typography>
        </Stack>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {splitSpotlights.map((spotlight, index) => (
            <Box
              key={spotlight.label}
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
            >
              <Box
                component={RouterLink}
                to={spotlight.to}
                sx={{
                  position: "relative",
                  display: "block",
                  aspectRatio: { xs: "4 / 5", md: "5 / 6" },
                  overflow: "hidden",
                  color: "#fff8f0",
                  textDecoration: "none",
                  "&:hover img": { transform: "scale(1.06)" },
                }}
              >
                <Box
                  component="img"
                  src={spotlight.image}
                  alt={spotlight.label}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: index === 0 ? "center center" : "center 20%",
                    transition: "transform 1.1s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    filter: index === 0 ? "brightness(0.74)" : "brightness(0.82)",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "flex-end",
                    p: { xs: 3, md: 5 },
                    background:
                      "linear-gradient(180deg, rgba(10,8,7,0.02) 40%, rgba(10,8,7,0.62) 100%)",
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography
                      variant="overline"
                      sx={{ letterSpacing: "0.34em", color: "rgba(255,248,240,0.78)" }}
                    >
                      SHOP NOW
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Cormorant Garamond", serif',
                        fontSize: { xs: 42, md: 72 },
                        lineHeight: 0.92,
                      }}
                    >
                      {spotlight.label}
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>

      <Box sx={{ bgcolor: "#fffaf4", py: { xs: 7, md: 12 } }}>
        <Container maxWidth="xl">
          <Stack spacing={6}>
            {categoryFeatures.map((feature, index) => {
              return (
                <Box
                  key={feature.title}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: index % 2 === 0 ? "1.1fr 1fr" : "1fr 1.1fr",
                    },
                    backgroundColor: "#f4ede4",
                  }}
                >
                  <Box sx={{ order: { xs: 1, md: index % 2 === 0 ? 1 : 2 } }}>
                    <Box
                      component="img"
                      src={feature.image}
                      alt={feature.title}
                      sx={{
                        width: "100%",
                        height: "100%",
                        minHeight: { xs: 360, md: 640 },
                        objectFit: "cover",
                        objectPosition: feature.objectPosition,
                      }}
                    />
                  </Box>
                  <Stack
                    spacing={2}
                    justifyContent="center"
                    sx={{
                      order: { xs: 2, md: index % 2 === 0 ? 2 : 1 },
                      p: { xs: 4, md: 8 },
                      minHeight: { md: 640 },
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{ letterSpacing: "0.34em", color: "text.secondary" }}
                    >
                      CATEGORY FOCUS
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Cormorant Garamond", serif',
                        fontSize: { xs: 48, md: 86 },
                        lineHeight: 0.9,
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography sx={{ maxWidth: 360, color: "text.secondary", lineHeight: 1.8 }}>
                      {feature.subtitle}
                    </Typography>
                    <Stack direction="row" spacing={4} sx={{ pt: 1, fontSize: 14, color: "text.secondary" }}>
                      <Box>{feature.products.length} curated pieces</Box>
                      <Box>Editorial storefront layout</Box>
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ letterSpacing: "0.14em", textTransform: "uppercase", pt: 0.5 }}
                    >
                      Enter this edit using the button below
                    </Typography>
                    <Button
                      component={RouterLink}
                      to={feature.to}
                      variant="contained"
                      size="large"
                      sx={{
                        mt: 1,
                        justifyContent: "center",
                        width: "fit-content",
                        minWidth: 180,
                        px: 3,
                        bgcolor: "#1f1a17",
                        color: "#f8f2ea",
                        "&:hover": { bgcolor: "#2a231f" },
                      }}
                    >
                      Shop {feature.title}
                    </Button>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 7, md: 12 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 3, md: 6 }}
          alignItems={{ xs: "flex-start", md: "flex-end" }}
          justifyContent="space-between"
          sx={{ mb: { xs: 4, md: 7 } }}
        >
          <Box>
            <Typography variant="overline" sx={{ letterSpacing: "0.3em", color: "text.secondary" }}>
              NEW ARRIVALS
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 36, md: 62 },
                lineHeight: 0.95,
              }}
            >
              The full rail, cleaned up for browsing.
            </Typography>
          </Box>
          <Button component={RouterLink} to="/shop" sx={{ fontSize: 12 }}>
            View the complete shop
          </Button>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: { xs: 2, md: 4 },
          }}
        >
          {arrivals.map((product) => (
            <Box key={product.id}>
              <ProductCard product={product} />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
