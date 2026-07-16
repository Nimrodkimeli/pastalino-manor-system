import { useEffect, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import api, { getSession } from "../api";

export default function TextPage() {
  const [members, setMembers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupDraft, setGroupDraft] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const session = getSession();

  const loadMembers = async () => {
    const response = await api.get("/members");
    setMembers(response.data);
    if (!selectedMemberId && response.data[0]) {
      setSelectedMemberId(response.data[0].id);
    }
  };

  const loadStaffList = async () => {
    const response = await api.get("/staff");
    setStaffList(response.data);
    if (session?.id && !selectedStaffIds.includes(session.id)) {
      setSelectedStaffIds([session.id]);
    }
  };

  const loadMessages = async (memberId) => {
    if (!memberId) {
      return;
    }
    const response = await api.get("/chat", { params: { memberId } });
    setMessages(response.data);
  };

  const loadGroups = async () => {
    const response = await api.get("/chat/groups");
    setGroups(response.data);
    if (!selectedGroupId && response.data[0]) {
      setSelectedGroupId(response.data[0].id);
    }
  };

  const loadGroupMessages = async (groupId) => {
    if (!groupId) {
      return;
    }
    const response = await api.get(`/chat/groups/${groupId}/messages`);
    setGroupMessages(response.data);
  };

  useEffect(() => {
    loadMembers();
    loadStaffList();
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      loadMessages(selectedMemberId);
    }
  }, [selectedMemberId]);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupMessages(selectedGroupId);
    }
  }, [selectedGroupId]);

  const handleSend = async () => {
    if (!draft.trim() || !selectedMemberId) {
      return;
    }

    await api.post("/chat", {
      memberId: selectedMemberId,
      message: draft.trim(),
      senderId: session?.id,
      senderName: session?.name || "Staff",
    });

    setDraft("");
    loadMessages(selectedMemberId);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      return;
    }

    const response = await api.post("/chat/groups", {
      name: groupName.trim(),
      memberIds: selectedStaffIds,
    });

    setGroupName("");
    setSelectedStaffIds(session?.id ? [session.id] : []);
    setSelectedGroupId(response.data.id);
    loadGroups();
    loadGroupMessages(response.data.id);
  };

  const handleSendGroup = async () => {
    if (!groupDraft.trim() || !selectedGroupId) {
      return;
    }

    await api.post(`/chat/groups/${selectedGroupId}/messages`, {
      message: groupDraft.trim(),
    });

    setGroupDraft("");
    loadGroupMessages(selectedGroupId);
  };

  const toggleStaffSelection = (staffId) => {
    setSelectedStaffIds((current) => {
      if (current.includes(staffId)) {
        return current.filter((id) => id !== staffId);
      }
      return [...current, staffId];
    });
  };

  const selectedMember = members.find((member) => member.id === selectedMemberId);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Staff Text
      </Typography>

      <Paper sx={{ p: 2, borderRadius: 3, background: "linear-gradient(135deg, #f6f9ff 0%, #eef4ff 100%)" }}>
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, backgroundColor: "#fff" }}>
            <Typography variant="h6" mb={2}>
              Direct Message
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              {members.map((member) => (
                <Button
                  key={member.id}
                  variant={member.id === selectedMemberId ? "contained" : "outlined"}
                  onClick={() => setSelectedMemberId(member.id)}
                  sx={{ borderRadius: "999px", px: 2, py: 1 }}
                >
                  {member.name}
                </Button>
              ))}
            </Stack>

            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mt: 2, minHeight: 380, display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
              <Typography variant="h6" mb={2}>
                {selectedMember?.name || "Choose a resident"}
              </Typography>

              <Box sx={{ flex: 1, overflowY: "auto", mb: 2, display: "flex", flexDirection: "column", gap: 1, borderRadius: 2, p: 2 }}>
                {messages.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
                    Start a direct message
                  </Typography>
                ) : (
                  messages.map((message) => (
                    <Box key={message.id} sx={{ alignSelf: message.senderName === session?.name ? "flex-end" : "flex-start" }}>
                      <Paper
                        elevation={0}
                        sx={{
                          px: 1.8,
                          py: 1.2,
                          borderRadius: 3,
                          maxWidth: "80%",
                          backgroundColor: message.senderName === session?.name ? "#1976d2" : "#e9eef6",
                          color: message.senderName === session?.name ? "#fff" : "#1f2937",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.3 }}>
                          {message.senderName}
                        </Typography>
                        <Typography variant="body1">{message.message}</Typography>
                      </Paper>
                    </Box>
                  ))
                )}
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField label="Type a direct text" fullWidth value={draft} onChange={(event) => setDraft(event.target.value)} multiline maxRows={4} />
                <Button variant="contained" onClick={handleSend} sx={{ minWidth: 110 }}>
                  Send
                </Button>
              </Stack>
            </Paper>
          </Paper>

          <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, backgroundColor: "#fff" }}>
            <Typography variant="h6" mb={2}>
              Staff Groups
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ minWidth: { xs: "100%", md: 260 } }}>
                <TextField label="Group name" fullWidth value={groupName} onChange={(event) => setGroupName(event.target.value)} sx={{ mb: 2 }} />
                <Typography variant="subtitle2" mb={1}>
                  Add staff to the group
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                  {staffList.map((staff) => (
                    <Button
                      key={staff.id}
                      variant={selectedStaffIds.includes(staff.id) ? "contained" : "outlined"}
                      onClick={() => toggleStaffSelection(staff.id)}
                      size="small"
                    >
                      {staff.name}
                    </Button>
                  ))}
                </Stack>
                <Button variant="contained" onClick={handleCreateGroup} sx={{ mt: 2 }}>
                  Create group
                </Button>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
                  {groups.map((group) => (
                    <Button key={group.id} variant={group.id === selectedGroupId ? "contained" : "outlined"} onClick={() => setSelectedGroupId(group.id)}>
                      {group.name}
                    </Button>
                  ))}
                </Stack>

                <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, minHeight: 320, display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
                  <Typography variant="h6" mb={2}>
                    {selectedGroup?.name || "Select a group"}
                  </Typography>

                  <Box sx={{ flex: 1, overflowY: "auto", mb: 2, display: "flex", flexDirection: "column", gap: 1, borderRadius: 2, p: 2 }}>
                    {groupMessages.length === 0 ? (
                      <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
                        Start the group conversation
                      </Typography>
                    ) : (
                      groupMessages.map((message) => (
                        <Box key={message.id} sx={{ alignSelf: message.senderName === session?.name ? "flex-end" : "flex-start" }}>
                          <Paper
                            elevation={0}
                            sx={{
                              px: 1.8,
                              py: 1.2,
                              borderRadius: 3,
                              maxWidth: "80%",
                              backgroundColor: message.senderName === session?.name ? "#1976d2" : "#e9eef6",
                              color: message.senderName === session?.name ? "#fff" : "#1f2937",
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.3 }}>
                              {message.senderName}
                            </Typography>
                            <Typography variant="body1">{message.message}</Typography>
                          </Paper>
                        </Box>
                      ))
                    )}
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField label="Type a group text" fullWidth value={groupDraft} onChange={(event) => setGroupDraft(event.target.value)} multiline maxRows={4} />
                    <Button variant="contained" onClick={handleSendGroup} sx={{ minWidth: 110 }}>
                      Send
                    </Button>
                  </Stack>
                </Paper>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Paper>
    </Box>
  );
}
