import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Stack,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import api from "../api";
import { getSession } from "../api";

export default function StaffPage() {
  const session = getSession();
  const isAdmin = session?.role === "admin";
  const [staff, setStaff] = useState([]);
  const [complianceItems, setComplianceItems] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentCategory, setDocumentCategory] = useState("Staff File");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [staffCreateMessage, setStaffCreateMessage] = useState("");
  const [staffTemporaryPassword, setStaffTemporaryPassword] = useState("");
  const [staffCreateForm, setStaffCreateForm] = useState({
    name: "",
    email: "",
    title: "",
    department: "",
    phone: "",
  });

  useEffect(() => {
    const loadData = async () => {
      const [staffResponse, complianceResponse] = await Promise.all([api.get("/staff"), api.get("/compliance")]);
      setStaff(staffResponse.data);
      setComplianceItems(complianceResponse.data);
      if (!selectedStaffId && staffResponse.data[0]) {
        setSelectedStaffId(staffResponse.data[0].id);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!selectedStaffId) {
      setDocuments([]);
      return;
    }

    api.get("/documents", { params: { ownerType: "staff", ownerId: selectedStaffId } }).then((res) => setDocuments(res.data));
  }, [selectedStaffId]);

  const itemsByStaff = complianceItems.reduce((acc, item) => {
    acc[item.staffId] = acc[item.staffId] || [];
    acc[item.staffId].push(item);
    return acc;
  }, {});

  const handleFileSelection = (event) => {
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

  const handleUpload = async () => {
    if (!selectedStaffId || !documentTitle.trim() || !selectedFile) {
      return;
    }

    setIsUploading(true);
    try {
      await api.post("/documents", {
        ownerType: "staff",
        ownerId: selectedStaffId,
        category: documentCategory || "Staff File",
        title: documentTitle.trim(),
        fileName: selectedFile.name,
        fileUrl: selectedFile.dataUrl,
        expiresAt: expiryDate ? new Date(expiryDate).getTime() : null,
      });

      setDocumentTitle("");
      setDocumentCategory("Staff File");
      setExpiryDate("");
      setSelectedFile(null);
      setUploadKey((value) => value + 1);
      const response = await api.get("/documents", { params: { ownerType: "staff", ownerId: selectedStaffId } });
      setDocuments(response.data);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!isAdmin || !staffCreateForm.name.trim() || !staffCreateForm.email.trim()) {
      return;
    }

    try {
      setStaffTemporaryPassword("");
      const createResponse = await api.post("/staff", {
        name: staffCreateForm.name.trim(),
        email: staffCreateForm.email.trim(),
        title: staffCreateForm.title,
        department: staffCreateForm.department,
        phone: staffCreateForm.phone,
      });

      if (createResponse.data?.temporaryPassword) {
        setStaffTemporaryPassword(createResponse.data.temporaryPassword);
      }
      setStaffCreateMessage(createResponse.data?.message || "Staff employee added.");

      const staffResponse = await api.get("/staff");
      setStaff(staffResponse.data);
      setStaffCreateForm({ name: "", email: "", title: "", department: "", phone: "" });
    } catch (error) {
      setStaffTemporaryPassword("");
      setStaffCreateMessage(error?.response?.data?.message || "Unable to add staff employee.");
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Staff Compliance Center
      </Typography>

      {isAdmin && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" mb={2}>Add Employee / Staff</Typography>
          <Stack spacing={2}>
            <TextField label="Full Name" value={staffCreateForm.name} onChange={(event) => setStaffCreateForm((prev) => ({ ...prev, name: event.target.value }))} fullWidth />
            <TextField label="Email" value={staffCreateForm.email} onChange={(event) => setStaffCreateForm((prev) => ({ ...prev, email: event.target.value }))} fullWidth />
            <TextField label="Title" value={staffCreateForm.title} onChange={(event) => setStaffCreateForm((prev) => ({ ...prev, title: event.target.value }))} fullWidth />
            <TextField label="Department" value={staffCreateForm.department} onChange={(event) => setStaffCreateForm((prev) => ({ ...prev, department: event.target.value }))} fullWidth />
            <TextField label="Phone" value={staffCreateForm.phone} onChange={(event) => setStaffCreateForm((prev) => ({ ...prev, phone: event.target.value }))} fullWidth />
            <Button variant="contained" onClick={handleCreateStaff} disabled={!staffCreateForm.name.trim() || !staffCreateForm.email.trim()}>
              Add Staff Employee
            </Button>
            {staffCreateMessage && (
              <Alert severity={staffCreateMessage.toLowerCase().includes("unable") || staffCreateMessage.toLowerCase().includes("exists") ? "error" : "success"}>
                {staffCreateMessage}
              </Alert>
            )}
            {staffTemporaryPassword && (
              <Alert severity="warning">
                SMTP is not configured. Share this temporary password securely with staff: {staffTemporaryPassword}
              </Alert>
            )}
          </Stack>
        </Paper>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Upload staff files and scanned documents
        </Typography>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="staff-select-label">Select staff</InputLabel>
            <Select labelId="staff-select-label" value={selectedStaffId} label="Select staff" onChange={(event) => setSelectedStaffId(event.target.value)}>
              {staff.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label="Document title" value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} fullWidth />
          <TextField label="Category" value={documentCategory} onChange={(event) => setDocumentCategory(event.target.value)} fullWidth />
          <TextField label="Expiry date" type="date" InputLabelProps={{ shrink: true }} value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} fullWidth />

          <Button variant="outlined" component="label">
            Choose file
            <input key={uploadKey} hidden accept=".pdf,image/*" type="file" onChange={handleFileSelection} />
          </Button>

          {selectedFile ? (
            <Typography variant="body2" color="text.secondary">
              Selected file: {selectedFile.name}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Upload a scanned PDF or image for this staff member.
            </Typography>
          )}

          <Button variant="contained" onClick={handleUpload} disabled={isUploading || !selectedStaffId || !documentTitle.trim() || !selectedFile}>
            {isUploading ? "Uploading..." : "Upload staff file"}
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Uploaded files for {staff.find((item) => item.id === selectedStaffId)?.name || "selected staff"}
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell>Open</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>{document.title}</TableCell>
                <TableCell>{document.category || "Staff File"}</TableCell>
                <TableCell>{document.fileName}</TableCell>
                <TableCell>{document.expiresAt ? new Date(document.expiresAt).toLocaleDateString() : "-"}</TableCell>
                <TableCell>
                  {document.fileUrl ? (
                    <a href={document.fileUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>Required credentials and renewals</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Credentials</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.department}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {(itemsByStaff[item.id] || []).map((credential) => (
                      <Chip
                        key={credential.id}
                        label={credential.name}
                        color={credential.expiryDate && credential.expiryDate < Date.now() ? "error" : "success"}
                        size="small"
                      />
                    ))}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" mb={2}>Compliance items</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Staff</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Issue date</TableCell>
              <TableCell>Expiry date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {complianceItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.staffName}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.issueDate ? new Date(item.issueDate).toLocaleDateString() : "-"}</TableCell>
                <TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "-"}</TableCell>
                <TableCell>{item.status || "current"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
