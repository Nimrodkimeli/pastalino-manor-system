import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import api from "../api";
import { openRecordPrintView } from "../utils/printRecord";
import { openDocumentInNewTab } from "../utils/documentViewer";

const DRILL_SECTIONS = [
  { key: "disaster_plan_review", label: "Disaster Plan Review" },
  { key: "clients_fire_drills", label: "Clients Fire Drills" },
  { key: "staff_fire_drills", label: "Staff Fire Drills" },
  { key: "smoke_detectors_air_filters", label: "Smoke Detectors Inspection & Air Filters Change" },
];

function createEmptySectionForm() {
  return {
    title: "",
    eventDate: new Date().toISOString().slice(0, 10),
    content: "",
  };
}

export default function FireDrillsPage() {
  const [records, setRecords] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [forms, setForms] = useState(() =>
    DRILL_SECTIONS.reduce((acc, section) => {
      acc[section.key] = createEmptySectionForm();
      return acc;
    }, {})
  );
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [printPageSize, setPrintPageSize] = useState("A4");

  const recordsBySection = useMemo(() => {
    return records.reduce((acc, item) => {
      acc[item.category] = acc[item.category] || [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [records]);

  const loadFireDrillRecords = async () => {
    const response = await api.get("/fire-drills");
    setRecords(response.data);
  };

  const loadUploadedDocuments = async () => {
    const response = await api.get("/documents", {
      params: {
        ownerType: "fire_drill",
        ownerId: "fire-drills",
        category: "Uploaded Previous Fire Drills",
      },
    });
    setUploadedDocuments(response.data);
  };

  useEffect(() => {
    loadFireDrillRecords();
    loadUploadedDocuments();
  }, []);

  const handleSectionFormChange = (sectionKey, field) => (event) => {
    const value = event.target.value;
    setForms((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value,
      },
    }));
  };

  const handleSaveSectionRecord = async (sectionKey) => {
    const draft = forms[sectionKey];
    if (!draft.title.trim() || !draft.content.trim()) {
      return;
    }

    await api.post("/fire-drills", {
      category: sectionKey,
      title: draft.title.trim(),
      eventDate: draft.eventDate,
      content: draft.content.trim(),
    });

    setForms((prev) => ({
      ...prev,
      [sectionKey]: createEmptySectionForm(),
    }));
    await loadFireDrillRecords();
  };

  const handleDeleteFireDrillRecord = async (recordId) => {
    const confirmed = window.confirm("Delete this fire drill record?");
    if (!confirmed) {
      return;
    }

    await api.delete(`/fire-drills/${recordId}`);
    await loadFireDrillRecords();
  };

  const handlePrintFireDrillRecord = (sectionLabel, record) => {
    openRecordPrintView({
      title: record.title || sectionLabel,
      subtitle: "Pastalino Manor LLC - Fire Drill Record",
      noteType: "fire_drills",
      headerLabel: sectionLabel,
      organizationName: "Pastalino Manor LLC",
      organizationFontSize: 48,
      titleFontSize: 24,
      pageSize: printPageSize,
      fields: [
        { label: "Date", value: record.eventDate || "-" },
        { label: "Created", value: new Date(record.createdAt).toLocaleString() },
      ],
      body: record.content || "",
      renderBodyAsSections: true,
    });
  };

  const handlePrintDraft = (sectionLabel, sectionKey) => {
    const draft = forms[sectionKey];
    openRecordPrintView({
      title: draft.title || sectionLabel,
      subtitle: "Pastalino Manor LLC - Fire Drill Draft",
      noteType: "fire_drills",
      headerLabel: sectionLabel,
      organizationName: "Pastalino Manor LLC",
      organizationFontSize: 48,
      titleFontSize: 24,
      pageSize: printPageSize,
      fields: [{ label: "Date", value: draft.eventDate || "-" }],
      body: draft.content || "",
      renderBodyAsSections: true,
    });
  };

  const handleUploadFileSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({ name: file.name, dataUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPreviousFireDrill = async () => {
    if (!uploadTitle.trim() || !selectedFile) {
      return;
    }

    setIsUploading(true);
    try {
      await api.post("/documents", {
        ownerType: "fire_drill",
        ownerId: "fire-drills",
        category: "Uploaded Previous Fire Drills",
        title: uploadTitle.trim(),
        fileName: selectedFile.name,
        fileUrl: selectedFile.dataUrl,
        expiresAt: uploadDate ? new Date(uploadDate).getTime() : null,
      });

      setUploadTitle("");
      setUploadDate("");
      setSelectedFile(null);
      setUploadKey((prev) => prev + 1);
      await loadUploadedDocuments();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteUploadedDocument = async (documentId) => {
    const confirmed = window.confirm("Delete this uploaded fire drill document?");
    if (!confirmed) {
      return;
    }

    await api.delete(`/documents/${documentId}`);
    await loadUploadedDocuments();
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Fire Drills Folder</Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <TextField
          select
          label="Print page size"
          value={printPageSize}
          onChange={(event) => setPrintPageSize(event.target.value)}
          sx={{ width: { xs: "100%", sm: 220 } }}
        >
          <MenuItem value="A4">A4</MenuItem>
          <MenuItem value="Letter">Letter</MenuItem>
          <MenuItem value="Legal">Legal</MenuItem>
        </TextField>
      </Stack>

      {DRILL_SECTIONS.map((section) => {
        const sectionRecords = recordsBySection[section.key] || [];
        const sectionForm = forms[section.key];

        return (
          <Paper key={section.key} sx={{ p: 2, mb: 3 }}>
            <Paper
              variant="outlined"
              sx={{
                width: { xs: "100%", md: "210mm" },
                mx: "auto",
                p: { xs: 2, md: 3 },
                backgroundColor: "#fff",
                mb: 2,
              }}
            >
              <Typography sx={{ textAlign: "center", fontWeight: 700, fontSize: { xs: "2.25rem", md: "48px" }, lineHeight: 1, textTransform: "uppercase" }}>
                Pastalino Manor LLC
              </Typography>
              <Typography sx={{ textAlign: "center", fontWeight: 700, fontSize: { xs: "1.25rem", md: "28px" }, mt: 1 }}>
                {section.label}
              </Typography>
              <Stack spacing={2} mt={2}>
                <TextField label="Title" value={sectionForm.title} onChange={handleSectionFormChange(section.key, "title")} fullWidth />
                <TextField label="Date" type="date" InputLabelProps={{ shrink: true }} value={sectionForm.eventDate} onChange={handleSectionFormChange(section.key, "eventDate")} fullWidth />
                <TextField label="Details" value={sectionForm.content} onChange={handleSectionFormChange(section.key, "content")} multiline minRows={4} fullWidth />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="contained" onClick={() => handleSaveSectionRecord(section.key)} disabled={!sectionForm.title.trim() || !sectionForm.content.trim()}>
                    Save {section.label}
                  </Button>
                  <Button variant="outlined" onClick={() => handlePrintDraft(section.label, section.key)}>
                    Print Draft
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Typography variant="h6" mb={1}>Previous {section.label}</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sectionRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.title}</TableCell>
                    <TableCell>{record.eventDate || "-"}</TableCell>
                    <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => setSelectedRecord(record)}>
                          View
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => handlePrintFireDrillRecord(section.label, record)}>
                          Print
                        </Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteFireDrillRecord(record.id)}>
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {sectionRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>No records yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        );
      })}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>Uploaded Previous Fire Drills</Typography>
        <Stack spacing={2} mb={3}>
          <TextField label="Document title" value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} fullWidth />
          <TextField label="Document date" type="date" InputLabelProps={{ shrink: true }} value={uploadDate} onChange={(event) => setUploadDate(event.target.value)} fullWidth />
          <Button variant="outlined" component="label">
            Choose scanned PDF or image
            <input key={uploadKey} hidden accept=".pdf,image/*" type="file" onChange={handleUploadFileSelection} />
          </Button>
          {selectedFile ? <Typography variant="body2">Selected file: {selectedFile.name}</Typography> : null}
          <Button variant="contained" onClick={handleUploadPreviousFireDrill} disabled={isUploading || !uploadTitle.trim() || !selectedFile}>
            {isUploading ? "Uploading..." : "Upload Previous Fire Drill"}
          </Button>
        </Stack>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uploadedDocuments.map((document) => (
              <TableRow key={document.id}>
                <TableCell>{document.title}</TableCell>
                <TableCell>{document.fileName}</TableCell>
                <TableCell>{document.expiresAt ? new Date(document.expiresAt).toLocaleDateString() : "-"}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="outlined" onClick={() => openDocumentInNewTab(document.fileUrl)} disabled={!document.fileUrl}>
                      View
                    </Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteUploadedDocument(document.id)}>
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {uploadedDocuments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>No uploaded previous fire drill documents yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={Boolean(selectedRecord)} onClose={() => setSelectedRecord(null)} fullWidth maxWidth="md">
        <DialogTitle>{selectedRecord?.title || "Fire Drill Record"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Date: {selectedRecord?.eventDate || "-"}
          </Typography>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>
            {selectedRecord?.content || "No details."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRecord(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
