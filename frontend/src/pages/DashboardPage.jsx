import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { openRecordPrintView } from "../utils/printRecord";

const REMINDER_CHANNEL_OPTIONS = ["email", "sms"];

function createEmptyAppointmentForm() {
  return {
    memberId: "",
    title: "",
    appointmentDate: toLocalDateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    location: "",
    contactEmail: "",
    contactPhone: "",
    reminderChannels: ["email"],
    reminderLeadHours: "24",
    notes: "",
  };
}

function toLocalDateInputValue(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function formatDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCalendarDays(currentMonth) {
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const firstCalendarDay = new Date(firstDayOfMonth);
  firstCalendarDay.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstCalendarDay);
    day.setDate(firstCalendarDay.getDate() + index);
    return day;
  });
}

function isSameMonth(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function appointmentToForm(appointment) {
  return {
    memberId: appointment.memberId || "",
    title: appointment.title || "",
    appointmentDate: toLocalDateInputValue(new Date(appointment.appointmentDate)),
    location: appointment.location || "",
    contactEmail: appointment.contactEmail || "",
    contactPhone: appointment.contactPhone || "",
    reminderChannels: appointment.reminderChannels?.length ? appointment.reminderChannels : ["email"],
    reminderLeadHours: String(appointment.reminderLeadHours || 24),
    notes: appointment.notes || "",
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [censusEntries, setCensusEntries] = useState([]);
  const [members, setMembers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dueReminderTotal, setDueReminderTotal] = useState(0);
  const [reminderRuntime, setReminderRuntime] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [appointmentStatus, setAppointmentStatus] = useState(null);
  const [printPageSize, setPrintPageSize] = useState("A4");
  const [censusForm, setCensusForm] = useState({
    houseName: "",
    censusDate: new Date().toISOString().split("T")[0],
    clientNames: "",
    memberCount: "",
    presentCount: "",
    absentCount: "",
    notes: "",
  });
  const [appointmentForm, setAppointmentForm] = useState(createEmptyAppointmentForm());

  const loadDashboard = async () => {
    try {
      const [dashboardRes, censusRes, membersRes, appointmentsRes, dueRemindersRes, reminderRuntimeRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/census"),
        api.get("/members"),
        api.get("/appointments"),
        api.get("/appointments/due-reminders"),
        api.get("/appointments/reminder-status"),
      ]);
      setDashboard(dashboardRes.data);
      setCensusEntries(censusRes.data);
      setMembers(membersRes.data);
      setAppointments(appointmentsRes.data);
      setDueReminderTotal(dueRemindersRes.data.total || 0);
      setReminderRuntime(reminderRuntimeRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCensusSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/census", censusForm);
      setCensusForm({
        houseName: "",
        censusDate: new Date().toISOString().split("T")[0],
        clientNames: "",
        memberCount: "",
        presentCount: "",
        absentCount: "",
        notes: "",
      });
      await loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAppointmentSubmit = async (event) => {
    event.preventDefault();
    setAppointmentStatus(null);

    try {
      const payload = {
        ...appointmentForm,
        appointmentDate: new Date(appointmentForm.appointmentDate).toISOString(),
      };

      if (editingAppointmentId) {
        await api.put(`/appointments/${editingAppointmentId}`, payload);
      } else {
        await api.post("/appointments", payload);
      }

      setAppointmentForm(createEmptyAppointmentForm());
      setEditingAppointmentId(null);
      setAppointmentStatus({
        severity: "success",
        message: editingAppointmentId
          ? "Appointment updated and reminder timing reset."
          : "Appointment saved to the dashboard calendar.",
      });
      await loadDashboard();
    } catch (err) {
      const message = err.response?.data?.errors?.[0]?.msg || "Unable to save appointment.";
      setAppointmentStatus({ severity: "error", message });
    }
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointmentId(appointment.id);
    setAppointmentForm(appointmentToForm(appointment));
    setAppointmentStatus({
      severity: "info",
      message: "Editing appointment. Update the date and time to reschedule it.",
    });
  };

  const handleCancelEdit = () => {
    setEditingAppointmentId(null);
    setAppointmentForm(createEmptyAppointmentForm());
    setAppointmentStatus(null);
  };

  const handleCancelAppointment = async (appointment) => {
    const confirmed = window.confirm(`Cancel appointment \"${appointment.title}\"?`);
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/appointments/${appointment.id}`);
      if (editingAppointmentId === appointment.id) {
        handleCancelEdit();
      }
      setAppointmentStatus({ severity: "success", message: "Appointment cancelled." });
      await loadDashboard();
    } catch (err) {
      setAppointmentStatus({ severity: "error", message: "Unable to cancel appointment." });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintCensusEntry = (entry) => {
    openRecordPrintView({
      title: `Daily Census - ${entry.houseName}`,
      subtitle: "Pastalino Manor LLC - Individual Record Export",
      pageSize: printPageSize,
      fields: [
        { label: "Date", value: entry.censusDate },
        { label: "Staff", value: entry.staffName },
        { label: "House", value: entry.houseName },
        { label: "Client Names", value: entry.clientNames || "-" },
        { label: "Total Members", value: entry.memberCount },
        { label: "Present", value: entry.presentCount },
        { label: "Absent", value: entry.absentCount },
      ],
      body: entry.notes || "",
    });
  };

  const handleMemberSelection = (event) => {
    const selectedMembers = event.target.value;
    setCensusForm((prev) => ({
      ...prev,
      clientNames: selectedMembers.join(", "),
    }));
  };

  const calendarDays = buildCalendarDays(calendarMonth);
  const appointmentMap = appointments.reduce((map, appointment) => {
    const key = formatDateKey(appointment.appointmentDate);
    if (!key) {
      return map;
    }
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(appointment);
    return map;
  }, {});
  const upcomingAppointments = appointments.slice(0, 8);
  const providerStatus = reminderRuntime?.providers;
  const schedulerStatus = reminderRuntime?.scheduler;
  const providerSummary = providerStatus
    ? [
        providerStatus.email?.summary,
        providerStatus.sms?.summary,
      ].filter(Boolean)
    : [];

  if (!dashboard) {
    return <Typography>Loading dashboard...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Dashboard
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(6, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        {Object.entries(dashboard.documents).map(([label, count]) => (
          <Box key={label}>
            <Paper sx={{ p: 2 }}>
              <Typography color="textSecondary" variant="subtitle2">
                {label.replace(/([A-Z])/g, " $1").trim()}
              </Typography>
              <Typography variant="h5">{count}</Typography>
            </Paper>
          </Box>
        ))}
      </Box>
      <Box mt={4}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          <Box>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>
                Staff compliance
              </Typography>
              <Typography>Total staff: {dashboard.staffCompliance.total}</Typography>
              <Typography>At risk: {dashboard.staffCompliance.atRisk}</Typography>
            </Paper>
          </Box>
          <Box>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>
                Member compliance
              </Typography>
              <Typography>Total members: {dashboard.memberCompliance.total}</Typography>
              <Typography>Expiring soon: {dashboard.quickStats.expiringSoon}</Typography>
            </Paper>
          </Box>
          <Box>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>
                Reminder dashboard
              </Typography>
              <Typography>Expired: {dashboard.documents.today}</Typography>
              <Typography>Due in 7 days: {dashboard.documents.due7}</Typography>
              <Typography>Due in 30 days: {dashboard.documents.due30}</Typography>
              <Typography mt={2}>Appointment reminders due: {dueReminderTotal}</Typography>
              <Typography>
                Automatic reminders: {schedulerStatus?.enabled ? "Enabled" : "Disabled"}
              </Typography>
              <Typography>
                Check interval: {schedulerStatus?.intervalMinutes || reminderRuntime?.schedulerIntervalMinutes || 5} minutes
              </Typography>
              <Typography>
                Email provider: {providerStatus?.email?.configured ? "SMTP configured" : "Log fallback"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {providerStatus?.email?.summary || "Email reminders will fall back to the notification log."}
              </Typography>
              <Typography>
                SMS provider: {providerStatus?.sms?.configured ? "Twilio configured" : "Log fallback"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {providerStatus?.sms?.summary || "SMS reminders will fall back to the notification log."}
              </Typography>
              {providerSummary.length > 0 && (
                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
                  {providerSummary.map((summary) => (
                    <Chip key={summary} label={summary} size="small" variant="outlined" />
                  ))}
                </Stack>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>

      <Box mt={4}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h6">Appointments calendar</Typography>
            <Typography color="text.secondary" variant="body2">
              Track appointments and automatically send reminder messages to the saved email and phone contacts.
            </Typography>
          </Box>
        </Stack>
        {providerStatus && (!providerStatus.email?.configured || !providerStatus.sms?.configured) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Reminder delivery falls back to the notification log for any provider that is not configured. Twilio trial accounts also require verified recipient numbers for SMS tests.
          </Alert>
        )}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 5fr) minmax(0, 7fr)",
            },
            gap: 2,
          }}
        >
          <Box>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>
                {editingAppointmentId ? "Edit or reschedule appointment" : "Add appointment"}
              </Typography>
              {appointmentStatus && (
                <Alert severity={appointmentStatus.severity} sx={{ mb: 2 }}>
                  {appointmentStatus.message}
                </Alert>
              )}
              <Box component="form" onSubmit={handleAppointmentSubmit}>
                <Stack spacing={2}>
                  <FormControl fullWidth required>
                    <InputLabel id="appointment-member-label">Member</InputLabel>
                    <Select
                      labelId="appointment-member-label"
                      value={appointmentForm.memberId}
                      label="Member"
                      onChange={(event) => setAppointmentForm((prev) => ({ ...prev, memberId: event.target.value }))}
                    >
                      {members.map((member) => (
                        <MenuItem key={member.id} value={member.id}>
                          {member.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Appointment title"
                    value={appointmentForm.title}
                    onChange={(event) => setAppointmentForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Date and time"
                    type="datetime-local"
                    value={appointmentForm.appointmentDate}
                    onChange={(event) => setAppointmentForm((prev) => ({ ...prev, appointmentDate: event.target.value }))}
                    required
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    label="Location"
                    value={appointmentForm.location}
                    onChange={(event) => setAppointmentForm((prev) => ({ ...prev, location: event.target.value }))}
                    fullWidth
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Reminder email"
                      type="email"
                      value={appointmentForm.contactEmail}
                      onChange={(event) => setAppointmentForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Reminder phone"
                      value={appointmentForm.contactPhone}
                      onChange={(event) => setAppointmentForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                      fullWidth
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel id="reminder-channel-label">Reminder channels</InputLabel>
                      <Select
                        labelId="reminder-channel-label"
                        multiple
                        value={appointmentForm.reminderChannels}
                        onChange={(event) => setAppointmentForm((prev) => ({ ...prev, reminderChannels: event.target.value }))}
                        input={<OutlinedInput label="Reminder channels" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {selected.map((channel) => (
                              <Chip key={channel} label={channel.toUpperCase()} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {REMINDER_CHANNEL_OPTIONS.map((channel) => (
                          <MenuItem key={channel} value={channel}>
                            {channel.toUpperCase()}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Reminder lead hours"
                      type="number"
                      value={appointmentForm.reminderLeadHours}
                      onChange={(event) => setAppointmentForm((prev) => ({ ...prev, reminderLeadHours: event.target.value }))}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label="Notes"
                    multiline
                    minRows={3}
                    value={appointmentForm.notes}
                    onChange={(event) => setAppointmentForm((prev) => ({ ...prev, notes: event.target.value }))}
                    fullWidth
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Button type="submit" variant="contained">
                      {editingAppointmentId ? "Update appointment" : "Save appointment"}
                    </Button>
                    {editingAppointmentId && (
                      <Button type="button" variant="outlined" onClick={handleCancelEdit}>
                        Cancel editing
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Box>
            </Paper>
          </Box>
          <Box>
            <Paper sx={{ p: 3 }}>
              <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" spacing={2} mb={2}>
                <Typography variant="h6">
                  {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                    }
                  >
                    Previous
                  </Button>
                  <Button variant="outlined" onClick={() => setCalendarMonth(new Date())}>
                    Today
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                    }
                  >
                    Next
                  </Button>
                </Stack>
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: 1,
                  mb: 1,
                }}
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                  <Box key={label}>
                    <Typography align="center" color="text.secondary" variant="caption">
                      {label}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: 1,
                }}
              >
                {calendarDays.map((day) => {
                  const dateKey = formatDateKey(day);
                  const dayAppointments = appointmentMap[dateKey] || [];
                  const inCurrentMonth = isSameMonth(day, calendarMonth);
                  const isToday = dateKey === formatDateKey(new Date());

                  return (
                    <Box key={dateKey}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1,
                          minHeight: 118,
                          bgcolor: inCurrentMonth ? "background.paper" : "action.hover",
                          borderColor: isToday ? "primary.main" : "divider",
                        }}
                      >
                        <Typography color={inCurrentMonth ? "text.primary" : "text.secondary"} variant="body2" fontWeight={isToday ? 700 : 500}>
                          {day.getDate()}
                        </Typography>
                        <Stack spacing={0.5} mt={1}>
                          {dayAppointments.slice(0, 2).map((appointment) => (
                            <Chip
                              key={appointment.id}
                              label={`${new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} ${appointment.title}`}
                              size="small"
                              color={appointment.lastReminderSentAt ? "success" : "default"}
                              sx={{ justifyContent: "flex-start" }}
                            />
                          ))}
                          {dayAppointments.length > 2 && (
                            <Typography variant="caption" color="text.secondary">
                              +{dayAppointments.length - 2} more
                            </Typography>
                          )}
                        </Stack>
                      </Paper>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" mb={2}>
          Upcoming appointments
        </Typography>
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Appointment</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Contacts</TableCell>
                <TableCell>Reminder</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {upcomingAppointments.length ? (
                upcomingAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.memberName || appointment.memberId}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{appointment.title}</Typography>
                      <Typography color="text.secondary" variant="caption">
                        {appointment.location || "No location"}
                      </Typography>
                    </TableCell>
                    <TableCell>{new Date(appointment.appointmentDate).toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{appointment.contactEmail || "No email"}</Typography>
                      <Typography color="text.secondary" variant="caption">
                        {appointment.contactPhone || "No phone"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {(appointment.reminderChannels || []).map((channel) => (
                          <Chip key={channel} label={channel.toUpperCase()} size="small" />
                        ))}
                        <Chip
                          label={
                            appointment.lastReminderSentAt
                              ? `Sent ${new Date(appointment.lastReminderSentAt).toLocaleDateString()}`
                              : `${appointment.reminderLeadHours || 24}h lead`
                          }
                          size="small"
                          color={appointment.lastReminderSentAt ? "success" : "default"}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => handleEditAppointment(appointment)}>
                          Edit / reschedule
                        </Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => handleCancelAppointment(appointment)}>
                          Cancel
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>No appointments scheduled yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <Box mt={4} sx={{ "@media print": { backgroundColor: "white" } }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Daily census by house
          </Typography>
          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="census-print-size-label">Print size</InputLabel>
              <Select labelId="census-print-size-label" value={printPageSize} label="Print size" onChange={(event) => setPrintPageSize(event.target.value)}>
                <MenuItem value="A4">A4</MenuItem>
                <MenuItem value="Letter">Letter</MenuItem>
                <MenuItem value="Legal">Legal</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={handlePrint}>
              Print census report
            </Button>
          </Stack>
        </Stack>
        <Paper sx={{ p: 3, "@media print": { boxShadow: "none", border: "1px solid #ddd" } }}>
          <Box component="form" onSubmit={handleCensusSubmit}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="House name"
                  value={censusForm.houseName}
                  onChange={(event) => setCensusForm({ ...censusForm, houseName: event.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Census date"
                  type="date"
                  value={censusForm.censusDate}
                  onChange={(event) => setCensusForm({ ...censusForm, censusDate: event.target.value })}
                  required
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <FormControl fullWidth>
                <InputLabel id="client-name-select-label">Client names</InputLabel>
                <Select
                  labelId="client-name-select-label"
                  multiple
                  value={censusForm.clientNames ? censusForm.clientNames.split(", ") : []}
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
                  value={censusForm.memberCount}
                  onChange={(event) => setCensusForm({ ...censusForm, memberCount: event.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Present"
                  type="number"
                  value={censusForm.presentCount}
                  onChange={(event) => setCensusForm({ ...censusForm, presentCount: event.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Absent"
                  type="number"
                  value={censusForm.absentCount}
                  onChange={(event) => setCensusForm({ ...censusForm, absentCount: event.target.value })}
                  required
                  fullWidth
                />
              </Stack>
              <TextField
                label="Notes"
                multiline
                minRows={3}
                value={censusForm.notes}
                onChange={(event) => setCensusForm({ ...censusForm, notes: event.target.value })}
                fullWidth
              />
              <Button type="submit" variant="contained">
                Save daily census
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>

      <Box mt={4} sx={{ "@media print": { breakInside: "avoid" } }}>
        <Typography variant="h6" mb={2}>
          Recent census entries
        </Typography>
        <Paper sx={{ "@media print": { boxShadow: "none", border: "1px solid #ddd" } }}>
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
                <TableCell>Record Export</TableCell>
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
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => handlePrintCensusEntry(entry)}>
                      Read / Print
                    </Button>
                  </TableCell>
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
