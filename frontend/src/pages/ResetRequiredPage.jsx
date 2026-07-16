import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container, Paper, TextField, Typography, Alert } from "@mui/material";
import api, { getSession, updateSessionUser } from "../api";

export default function ResetRequiredPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      await api.post("/auth/change-temporary-password", {
        currentPassword,
        newPassword,
      });

      const session = getSession();
      if (session) {
        updateSessionUser({ ...session, mustResetPassword: false });
      }

      setSuccess("Password updated. Redirecting...");
      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update password.");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }} elevation={3}>
        <Typography variant="h5" mb={1}>
          Reset Temporary Password
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Your admin approved your account. Use the temporary password from email, then set a new password.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Temporary Password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <TextField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          <Button type="submit" variant="contained" size="large">
            Update Password
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
