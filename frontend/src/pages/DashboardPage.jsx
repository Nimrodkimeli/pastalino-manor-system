import { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Button,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from "@mui/material";
import api from "../api";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [censusEntries, setCensusEntries] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    houseName: "",
    censusDate: new Date().toISOString().split("T")[0],
    clientNames: "",
    memberCount: "",
    presentCount: "",
    absentCount: "",
    notes: "",
  });

  const loadDashboard = () => {
    api.get("/dashboard").then((res) => setDashboard(res.data));
    api.get("/census").then((res) => setCensusEntries(res.data));
    api.get("/members").then((res) => setMembers(res.data));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/census", form);
      setForm({
        houseName: "",
        censusDate: new Date().toISOString().split("T")[0],
        clientNames: "",
        memberCount: "",
        presentCount: "",
        absentCount: "",
        notes: "",
      });
      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMemberSelection = (event) => {
    const selectedMembers = event.target.value;
    setForm((prev) => ({
      ...prev,
      clientNames: selectedMembers.join(", "),
    }));
  };

  if (!dashboard) {
    return <Typography>Loading dashboard...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Dashboard
      </Typography>
      <Grid container spacing={2}>
        {Object.entries(dashboard.documents).map(([label, count]) => (
          <Grid item xs={12} sm={6} md={2} key={label}>
            <Paper sx={{ p: 2 }}>
              <Typography color="textSecondary" variant="subtitle2">
                {label.replace(/([A-Z])/g, " $1").trim()}
              </Typography>
              <Typography variant="h5">{count}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Box mt={4}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>
                Staff compliance
              </Typography>
              <Typography>Total staff: {dashboard.staffCompliance.total}</Typography>
              <Typography>At risk: {dashboard.staffCompliance.atRisk}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>
                Member compliance
              </Typography>
              <Typography>Total members: {dashboard.memberCompliance.total}</Typography>
              <Typography>Expiring soon: {dashboard.quickStats.expiringSoon}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>
                Reminder dashboard
              </Typography>
              <Typography>Expired: {dashboard.documents.today}</Typography>
              <Typography>Due in 7 days: {dashboard.documents.due7}</Typography>
              <Typography>Due in 30 days: {dashboard.documents.due30}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      <Box mt={4} sx={{ '@media print': { backgroundColor: 'white' } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Daily census by house
          </Typography>
          <Button variant="outlined" onClick={handlePrint}>
            Print census report
          </Button>
        </Stack>
        <Paper sx={{ p: 3, '@media print': { boxShadow: 'none', border: '1px solid #ddd' } }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="House name"
                  value={form.houseName}
                  onChange={(e) => setForm({ ...form, houseName: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Census date"
                  type="date"
                  value={form.censusDate}
                  onChange={(e) => setForm({ ...form, censusDate: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              <FormControl fullWidth>
                <InputLabel id="client-name-select-label">Client names</InputLabel>
                <Select
                  labelId="client-name-select-label"
                  multiple
                  value={form.clientNames ? form.clientNames.split(", ") : []}
                  onChange={handleMemberSelection}
                  input={<OutlinedInput label="Client names" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((name) => (
                        <Chip key={name} label={name} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {members.map((member) => (
                    <MenuItem key={member.id} value={member.name}>
                      {member.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Total members"
                  type="number"
                  value={form.memberCount}
                  onChange={(e) => setForm({ ...form, memberCount: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Present"
                  type="number"
                  value={form.presentCount}
                  onChange={(e) => setForm({ ...form, presentCount: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Absent"
                  type="number"
                  value={form.absentCount}
                  onChange={(e) => setForm({ ...form, absentCount: e.target.value })}
                  required
                  fullWidth
                />
              </Stack>
              <TextField
                label="Notes"
                multiline
                minRows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                fullWidth
              />
              <Button type="submit" variant="contained">
                Save daily census
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
      <Box mt={4} sx={{ '@media print': { breakInside: 'avoid' } }}>
        <Typography variant="h6" mb={2}>
          Recent census entries
        </Typography>
        <Paper sx={{ '@media print': { boxShadow: 'none', border: '1px solid #ddd' } }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>House</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Staff</TableCell>
                <TableCell>Clients</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Present</TableCell>
                <TableCell>Absent</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {censusEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.houseName}</TableCell>
                  <TableCell>{entry.censusDate}</TableCell>
                  <TableCell>{entry.staffName}</TableCell>
                  <TableCell>{entry.clientNames || "-"}</TableCell>
                  <TableCell>{entry.memberCount}</TableCell>
                  <TableCell>{entry.presentCount}</TableCell>
                  <TableCell>{entry.absentCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
      <Box mt={4}>
        <Typography variant="h6" mb={2}>
          Staff compliance details
        </Typography>
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Next expiry</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboard.staffCompliance.details.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.nextExpiry ? new Date(row.nextExpiry).toLocaleDateString() : "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Box>
  );
}
