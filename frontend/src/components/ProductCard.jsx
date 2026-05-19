/**
 * ProductCard — a single catalogue tile: image with hover zoom,
 * category, name, colour and price; links to the detail page.
 *
 * @author Frontend (teammate — TBD)
 */
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box
        component={RouterLink}
        to={`/product/${product.id}`}
        sx={{
          display: "block",
          textDecoration: "none",
          color: "inherit",
          "&:hover .product-image": { transform: "scale(1.03)" },
          "&:hover .product-meta": { transform: "translateY(-3px)" },
        }}
      >
        <Box
          sx={{
            overflow: "hidden",
            minHeight: { xs: 250, md: 276 },
            bgcolor: "#f4ede4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 2, md: 2.75 },
          }}
        >
          <Box
            sx={{
              width: "min(100%, 256px)",
              aspectRatio: "1 / 1",
              bgcolor: "#fbfaf7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              className="product-image"
              src={product.image}
              alt={product.name}
              loading="lazy"
              sx={{
                width: "100%",
                maxWidth: 256,
                aspectRatio: "1 / 1",
                objectFit: "contain",
                transition: "transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
            />
          </Box>
        </Box>
        <Box className="product-meta" sx={{ pt: 2.25, pb: 4, transition: "transform 280ms ease" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ letterSpacing: "0.18em", textTransform: "uppercase", fontSize: 10 }}
          >
            {product.category}
          </Typography>
          <Typography
            sx={{
              mt: 0.6,
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 25,
              lineHeight: 1.05,
            }}
            noWrap
          >
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {product.color || product.product_type || "Curated piece"}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.9, letterSpacing: "0.06em" }}>
            ${product.price.toFixed(2)}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}
