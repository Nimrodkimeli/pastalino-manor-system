import { useEffect, useState } from "react";
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import { openRecordPrintView } from "../utils/printRecord";

export default function FaceSheetPage() {
  const [searchParams] = useSearchParams();
  const requestedMemberId = searchParams.get("memberId") || "";
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    guardian: "",
    insurance: "",
    physician: "",
    allergies: "",
    diagnosis: "",
    notes: "",
  });
  const [existingNoteId, setExistingNoteId] = useState(null);
  const [printPageSize, setPrintPageSize] = useState("A4");

  const loadMembers = async () => {
    const response = await api.get("/members");
    setMembers(response.data);
    const requestedMember = requestedMemberId ? response.data.find((member) => member.id === requestedMemberId) : null;
    const initialMember = requestedMember || response.data[0];

    if (!selectedMemberId && initialMember) {
      setSelectedMemberId(initialMember.id);
      loadForMember(initialMember.id);
    }
  };

  const loadForMember = async (memberId) => {
    const response = await api.get(`/members/${memberId}`);
    const note = (response.data.notes || []).find((entry) => entry.type === "face_sheet");
    if (note) {
      setExistingNoteId(note.id);
      try {
        const parsed = JSON.parse(note.content);
        setForm((prev) => ({ ...prev, ...parsed }));
      } catch {
        setForm((prev) => ({ ...prev, notes: note.content }));
      }
    } else {
      setExistingNoteId(null);
      setForm({
        fullName: response.data.name || "",
        dob: response.data.dob || "",
        guardian: response.data.guardian || "",
        insurance: response.data.insurance || "",
        physician: response.data.physician || "",
        allergies: response.data.allergies || "",
        diagnosis: response.data.diagnosis || "",
        notes: response.data.treatmentPlan || "",
      });
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    const payload = {
      memberId: selectedMemberId,
      staffId: "user-staff-1",
      type: "face_sheet",
      title: `Face Sheet - ${form.fullName || "Client"}`,
      content: JSON.stringify(form),
      category: "Face Sheet",
    };

    if (existingNoteId) {
      await api.put(`/notes/${existingNoteId}`, payload);
    } else {
      await api.post("/notes", payload);
    }

    alert("Face sheet updated successfully.");
  };

  const handlePrintFaceSheet = () => {
    const selectedMember = members.find((member) => member.id === selectedMemberId);
    openRecordPrintView({
      title: `Face Sheet - ${form.fullName || selectedMember?.name || "Client"}`,
      subtitle: "Pastalino Manor LLC - Individual Record Export",
      pageSize: printPageSize,
      fields: [
        { label: "Member", value: form.fullName || selectedMember?.name || "" },
        { label: "DOB", value: form.dob },
        { label: "Guardian", value: form.guardian },
        { label: "Insurance", value: form.insurance },
        { label: "Physician", value: form.physician },
        { label: "Allergies", value: form.allergies },
        { label: "Diagnosis", value: form.diagnosis },
      ],
      body: form.notes || "",
      autoPrint: true,
    });
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Face Sheet Editor
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField select label="Client" value={selectedMemberId} onChange={(event) => {
            const memberId = event.target.value;
            setSelectedMemberId(memberId);
            loadForMember(memberId);
          }}>
            {members.map((member) => (
              <MenuItem key={member.id} value={member.id}>
                {member.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Full name" value={form.fullName} onChange={handleChange("fullName")} />
          <TextField label="Date of birth" value={form.dob} onChange={handleChange("dob")} />
          <TextField label="Guardian" value={form.guardian} onChange={handleChange("guardian")} />
          <TextField label="Insurance" value={form.insurance} onChange={handleChange("insurance")} />
          <TextField label="Physician" value={form.physician} onChange={handleChange("physician")} />
          <TextField label="Allergies" value={form.allergies} onChange={handleChange("allergies")} />
          <TextField label="Diagnosis" value={form.diagnosis} onChange={handleChange("diagnosis")} />
          <TextField label="Additional notes" value={form.notes} onChange={handleChange("notes")} multiline rows={4} />
          <TextField select label="Print size" value={printPageSize} onChange={(event) => setPrintPageSize(event.target.value)}>
            <MenuItem value="A4">A4</MenuItem>
            <MenuItem value="Letter">Letter</MenuItem>
            <MenuItem value="Legal">Legal</MenuItem>
          </TextField>
          <Button variant="contained" onClick={handleSave}>
            Save Face Sheet
          </Button>
          <Button variant="outlined" onClick={handlePrintFaceSheet}>
            Print / PDF Face Sheet
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
