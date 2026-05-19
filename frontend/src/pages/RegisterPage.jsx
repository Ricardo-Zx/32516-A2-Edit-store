/**
 * RegisterPage — account creation form with client-side validation
 * before delegating to the auth context.
 *
 * @author Mengshan Wang
 */
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const result = await register(email.trim(), username.trim(), password);
    setBusy(false);
    if (result.ok) navigate("/");
    else setError(result.error);
  };

  return (
    <Container maxWidth="xs" sx={{ py: 10 }}>
      <Typography variant="h4" gutterBottom>
        Create account
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Join to save your bag and check out faster.
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
            size="medium"
          />
          <TextField
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            inputProps={{ minLength: 2, maxLength: 40 }}
            size="medium"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            inputProps={{ minLength: 6 }}
            size="medium"
          />
          <Button type="submit" variant="contained" size="large" disabled={busy}>
            {busy ? "Creating..." : "Create account"}
          </Button>
          <Typography variant="caption" color="text.secondary" align="center">
            Already have one? <RouterLink to="/login">Sign in</RouterLink>
          </Typography>
        </Stack>
      </Box>
    </Container>
  );
}
