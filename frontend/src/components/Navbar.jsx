/**
 * Navbar — sticky top bar: slide-out shop menu, centred wordmark,
 * cart badge and the account menu (sign in / out).
 *
 * @author Mengshan Wang
 */
import {
  AppBar,
  Badge,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [navAnchor, setNavAnchor] = useState(null);

  const handleLogout = () => {
    logout();
    setAccountAnchor(null);
    navigate("/");
  };

  const shopLinks = [
    { label: "New Arrivals", to: "/shop" },
    { label: "Women", to: "/shop?gender=women" },
    { label: "Men", to: "/shop?gender=men" },
    { label: "Kids", to: "/shop?gender=kids" },
    { label: "Shoes", to: "/shop?category=Shoes" },
    { label: "Bags", to: "/shop?category=Bags" },
    { label: "Accessories", to: "/shop?category=Accessories" },
  ];

  return (
    <AppBar position="sticky" color="inherit" elevation={0}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 78, gap: 2 }}>
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={(event) => setNavAnchor(event.currentTarget)} color="inherit" aria-label="open navigation">
              <MenuIcon />
            </IconButton>
            <Typography
              sx={{
                fontSize: 13,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                display: { xs: "none", sm: "block" },
              }}
            >
              Menu
            </Typography>
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center", gap: 1.25 }}>
            <Button component={RouterLink} to="/shop?gender=women" color="inherit" sx={{ fontSize: 12 }}>
              Women
            </Button>
            <Button component={RouterLink} to="/shop?gender=men" color="inherit" sx={{ fontSize: 12 }}>
              Men
            </Button>
            <Button component={RouterLink} to="/shop?category=Shoes" color="inherit" sx={{ fontSize: 12 }}>
              Shoes
            </Button>
            <Button component={RouterLink} to="/shop?category=Bags" color="inherit" sx={{ fontSize: 12 }}>
              Bags
            </Button>
            {user?.role === "admin" && (
              <Button component={RouterLink} to="/admin" color="inherit" sx={{ fontSize: 12 }}>
                Admin
              </Button>
            )}
          </Box>

          <Typography
            component={RouterLink}
            to="/"
            sx={{
              position: { xs: "static", md: "absolute" },
              left: { md: "50%" },
              transform: { md: "translateX(-50%)" },
              fontFamily: '"Cormorant Garamond", serif',
              fontWeight: 700,
              fontSize: { xs: 34, md: 44 },
              color: "inherit",
              textDecoration: "none",
              letterSpacing: "0.08em",
              lineHeight: 1,
            }}
          >
            EDIT
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton component={RouterLink} to="/cart" color="inherit" aria-label="cart">
              <Badge badgeContent={cart.item_count} color="primary">
                <ShoppingBagOutlinedIcon />
              </Badge>
            </IconButton>
            <IconButton onClick={(event) => setAccountAnchor(event.currentTarget)} color="inherit" aria-label="account">
              <PersonOutlineIcon />
            </IconButton>
            <Menu anchorEl={accountAnchor} open={Boolean(accountAnchor)} onClose={() => setAccountAnchor(null)}>
              {user ? (
                [
                  <MenuItem key="hello" disabled>
                    Hi, {user.username}
                  </MenuItem>,
                  <MenuItem
                    key="profile"
                    onClick={() => {
                      setAccountAnchor(null);
                      navigate("/profile");
                    }}
                  >
                    My account
                  </MenuItem>,
                  <MenuItem
                    key="orders"
                    onClick={() => {
                      setAccountAnchor(null);
                      navigate("/orders");
                    }}
                  >
                    Orders
                  </MenuItem>,
                  <MenuItem key="logout" onClick={handleLogout}>
                    Sign out
                  </MenuItem>,
                ]
              ) : (
                [
                  <MenuItem
                    key="login"
                    onClick={() => {
                      setAccountAnchor(null);
                      navigate("/login");
                    }}
                  >
                    Sign in
                  </MenuItem>,
                  <MenuItem
                    key="register"
                    onClick={() => {
                      setAccountAnchor(null);
                      navigate("/register");
                    }}
                  >
                    Create account
                  </MenuItem>,
                ]
              )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
      <Menu
        anchorEl={navAnchor}
        open={Boolean(navAnchor)}
        onClose={() => setNavAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 240,
            border: "1px solid rgba(72, 57, 46, 0.12)",
            boxShadow: "0 24px 70px rgba(31, 25, 21, 0.12)",
          },
        }}
      >
        {shopLinks.map((link) => (
          <MenuItem
            key={link.label}
            onClick={() => {
              setNavAnchor(null);
              navigate(link.to);
            }}
            sx={{ minHeight: 46, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12 }}
          >
            {link.label}
          </MenuItem>
        ))}
        {user?.role === "admin" && (
          <MenuItem
            onClick={() => {
              setNavAnchor(null);
              navigate("/admin");
            }}
            sx={{ minHeight: 46, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12 }}
          >
            Admin
          </MenuItem>
        )}
      </Menu>
    </AppBar>
  );
}
