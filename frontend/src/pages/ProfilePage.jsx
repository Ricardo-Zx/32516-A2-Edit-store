/**
 * ProfilePage — the signed-in user's account: read-only profile details
 * plus a change-password form that calls PUT /api/auth/password.
 *
 * @author Yuchang Zhang
 */
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

import api, { describeError } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openPasswordForm, setOpenPasswordForm] = useState(false);

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.new_password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (form.new_password !== form.confirm) {
      setError("New password and confirmation do not match.");
      return;
    }

    setBusy(true);
    try {
      await api.put("/auth/password", {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      showToast("Password updated successfully.", "success");
      setForm({ current_password: "", new_password: "", confirm: "" });
      setOpenPasswordForm(false);
    } catch (err) {
      setError(describeError(err, "Could not update password."));
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="overline" sx={{ letterSpacing: "0.3em", color: "text.secondary" }}>
        ACCOUNT
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Cormorant Garamond", serif',
          fontWeight: 600,
          fontSize: { xs: 36, md: 56 },
          letterSpacing: "-0.02em",
          mb: 4,
        }}
      >
        {user.username}
      </Typography>

      <Stack spacing={3}>
        <Box sx={{ border: "1px solid rgba(72, 57, 46, 0.12)", bgcolor: "background.paper", p: { xs: 3, md: 4 } }}>
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Typography color="text.secondary">Email</Typography>
              <Typography sx={{ textAlign: "right" }}>{user.email}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
              <Typography color="text.secondary">Role</Typography>
              <Chip
                size="small"
                label={user.role}
                color={user.role === "admin" ? "primary" : "default"}
              />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Typography color="text.secondary">Member since</Typography>
              <Typography sx={{ textAlign: "right" }}>{new Date(user.created_at).toLocaleDateString()}</Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ border: "1px solid rgba(72, 57, 46, 0.12)", bgcolor: "background.paper", p: { xs: 3, md: 4 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h6">Password</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                Keep your account secure by updating your password when needed.
              </Typography>
            </Box>
            <Button
              variant={openPasswordForm ? "outlined" : "contained"}
              onClick={() => {
                setError("");
                setOpenPasswordForm((value) => !value);
              }}
            >
              {openPasswordForm ? "Close" : "Change password"}
            </Button>
          </Stack>

          <Collapse in={openPasswordForm} timeout={280}>
            <Divider sx={{ my: 3 }} />
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField
                  label="Current password"
                  type="password"
                  value={form.current_password}
                  onChange={update("current_password")}
                  required
                  size="medium"
                />
                <TextField
                  label="New password"
                  type="password"
                  value={form.new_password}
                  onChange={update("new_password")}
                  required
                  size="medium"
                  inputProps={{ minLength: 6 }}
                />
                <TextField
                  label="Confirm new password"
                  type="password"
                  value={form.confirm}
                  onChange={update("confirm")}
                  required
                  size="medium"
                />
                <Button type="submit" variant="contained" size="large" disabled={busy}>
                  {busy ? "Updating..." : "Update password"}
                </Button>
              </Stack>
            </Box>
          </Collapse>
        </Box>
      </Stack>
    </Container>
  );
}
