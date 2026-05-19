/**
 * MUI theme — the editorial, Zara-inspired look: warm paper palette,
 * Cormorant Garamond display headings, square corners, blurred app bar.
 *
 * @author Mengshan Wang
 */
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#181513" },
    secondary: { main: "#8d8378" },
    background: { default: "#f6f1ea", paper: "#fffdf9" },
    text: { primary: "#1f1915", secondary: "#6f655b" },
  },
  typography: {
    fontFamily: '"Manrope", sans-serif',
    h1: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, letterSpacing: "-0.03em" },
    h2: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, letterSpacing: "-0.025em" },
    h3: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, letterSpacing: "-0.02em" },
    h4: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, letterSpacing: "-0.015em" },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500, letterSpacing: "0.08em" },
    button: { textTransform: "none", letterSpacing: "0.12em", fontWeight: 500 },
  },
  shape: { borderRadius: 0 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f6f1ea",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 0, paddingInline: 22, paddingBlock: 10 },
        containedPrimary: {
          backgroundColor: "#1d1713",
          "&:hover": { backgroundColor: "#362c25" },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderBottom: "1px solid rgba(72, 57, 46, 0.12)",
          backdropFilter: "blur(14px)",
          backgroundColor: "rgba(246, 241, 234, 0.82)",
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
  },
});

export default theme;
