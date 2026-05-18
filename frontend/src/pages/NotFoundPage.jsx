/**
 * NotFoundPage — branded 404 shown for any unmatched route instead of
 * silently bouncing the user back to the home page.
 *
 * @author Frontend (teammate — TBD)
 */
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 12, md: 20 }, textAlign: "center" }}>
      <Box>
        <Typography
          sx={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 600,
            fontSize: { xs: 96, md: 180 },
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          404
        </Typography>
        <Typography
          variant="overline"
          sx={{ letterSpacing: "0.35em", color: "text.secondary" }}
        >
          PAGE NOT FOUND
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2, mb: 5 }}>
          The piece you are looking for has moved on, or never existed.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
          <Button component={RouterLink} to="/" variant="contained" size="large">
            Back to home
          </Button>
          <Button
            component={RouterLink}
            to="/shop"
            variant="outlined"
            size="large"
            sx={{ borderColor: "black", color: "black" }}
          >
            Continue shopping
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
