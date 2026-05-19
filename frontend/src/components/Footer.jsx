/**
 * Footer — minimal site footer with the academic-use disclaimer.
 *
 * @author Mengshan Wang
 */
import { Box, Container, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box component="footer" sx={{ mt: 8, py: 4, borderTop: "1px solid #efefef" }}>
      <Container maxWidth="xl">
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ display: "block", letterSpacing: "0.25em", textTransform: "uppercase" }}
        >
          ÉDIT · A 32516 Assignment 2 Demo · Product imagery courtesy of H&M
        </Typography>
      </Container>
    </Box>
  );
}
