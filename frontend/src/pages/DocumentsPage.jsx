import { useEffect, useState } from "react";
import { Box, Paper, Typography, TextField, Table, TableBody, TableCell, TableHead, TableRow, Button, Stack } from "@mui/material";
import api from "../api";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    const response = await api.get("/documents", { params: { search } });
    setDocuments(response.data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Manage Documents
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3} alignItems="center">
        <TextField label="Search documents" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Button variant="contained" onClick={load}>
          Search
        </Button>
      </Stack>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>{doc.title}</TableCell>
                <TableCell>{doc.category}</TableCell>
                <TableCell>{doc.ownerType} / {doc.ownerId}</TableCell>
                <TableCell>{doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString() : "None"}</TableCell>
                <TableCell>{doc.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
