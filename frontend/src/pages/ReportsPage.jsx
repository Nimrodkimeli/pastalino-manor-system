import { useEffect, useState } from "react";
import { Box, Grid, Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip } from "@mui/material";
import api from "../api";

export default function ReportsPage() {
  const [compliance, setCompliance] = useState(null);
  const [expired, setExpired] = useState(null);
  const [renewals, setRenewals] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    api.get("/reports/compliance").then((res) => setCompliance(res.data));
    api.get("/reports/expired").then((res) => setExpired(res.data));
    api.get("/reports/renewals").then((res) => setRenewals(res.data));
    api.get("/incidents").then((res) => setIncidents(res.data));
    api.get("/policies").then((res) => setPolicies(res.data));
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Audit and Compliance Reports
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={1}>
              Compliance Summary
            </Typography>
            {compliance ? (
              <>
                <Typography>Total staff: {compliance.total}</Typography>
                <Typography>Expired documents: {expired?.count ?? "..."}</Typography>
                <Typography>Renewals due: {renewals?.count ?? "..."}</Typography>
                <Typography>Expiring soon: {compliance.expiringSoon}</Typography>
              </>
            ) : (
              <Typography>Loading...</Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={1}>
              Inspection Readiness
            </Typography>
            <Typography>Missing documents: {expired?.count ? "Review required" : "None flagged"}</Typography>
            <Typography>Expired certifications: {expired?.count ? "Present" : "None"}</Typography>
            <Typography>Outstanding incident reports: {incidents.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={1}>
              Policy acknowledgements
            </Typography>
            {policies.map((policy) => (
              <Chip key={policy.id} label={policy.title} sx={{ mr: 1, mb: 1 }} />
            ))}
          </Paper>
        </Grid>
      </Grid>
      <Box mt={4}>
        <Typography variant="h6" mb={2}>
          Upcoming renewals
        </Typography>
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Expires</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renewals?.renewals?.slice(0, 10).map((doc) => {
                const expiresAt = doc.expiresAt ? new Date(doc.expiresAt) : null;
                const daysUntil = expiresAt ? Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24)) : null;
                let color = "default";
                if (daysUntil !== null && daysUntil <= 7) color = "error";
                else if (daysUntil !== null && daysUntil <= 30) color = "warning";
                else color = "success";

                return (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.title}</TableCell>
                    <TableCell>{doc.category}</TableCell>
                    <TableCell>{doc.ownerType}</TableCell>
                    <TableCell>
                      <Chip label={expiresAt ? `${expiresAt.toLocaleDateString()} (${daysUntil}d)` : "N/A"} color={color} size="small" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </Box>
      <Box mt={4}>
        <Typography variant="h6" mb={2}>
          Incident history
        </Typography>
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Incident</TableCell>
                <TableCell>Follow-up</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>{incident.memberId}</TableCell>
                  <TableCell>{incident.description}</TableCell>
                  <TableCell>{incident.followUp || "Pending"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Box>
  );
}
