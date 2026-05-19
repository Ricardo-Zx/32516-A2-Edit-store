/**
 * LoginPage — email/password sign-in form with inline error handling.
 *
 * @author Mengshan Wang
 */
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await login(email.trim(), password);
    setBusy(false);
    if (result.ok) navigate("/");
    else setError(result.error);
  };

  return (
    <Container maxWidth="xs" sx={{ py: 10 }}>
      <Typography variant="h4" gutterBottom>
        Sign in
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Welcome back. Enter your details to continue.
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
            size="medium"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
            size="medium"
          />
          <Button type="submit" variant="contained" size="large" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </Button>
          <Typography variant="caption" color="text.secondary" align="center">
            New here? <RouterLink to="/register">Create an account</RouterLink>
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center">
            Demo: demo@example.com / Demo@123 · admin@example.com / Admin@123
          </Typography>
        </Stack>
      </Box>
    </Container>
  );
}
