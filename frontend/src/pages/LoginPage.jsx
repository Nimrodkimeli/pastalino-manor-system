import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container, Paper, TextField, Typography, Alert } from "@mui/material";
import api, { saveSession, getSession } from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (getSession()) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const response = await api.post("/auth/login", { email, password });
      saveSession(response.data.user, response.data.token);
      if (response.data.user?.mustResetPassword) {
        navigate("/reset-required");
        return;
      }
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Check credentials.");
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 12 }}>
      <Paper sx={{ p: 4 }} elevation={3}>
        <Typography variant="h5" mb={2}>
          Sign in to Pastalino
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: "grid", gap: 2 }}>
          <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" variant="contained" size="large">
            Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
