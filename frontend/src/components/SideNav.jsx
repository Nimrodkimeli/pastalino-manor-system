import { useState } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { AppBar, Toolbar, Typography, Drawer, Box, List, ListItemButton, ListItemIcon, ListItemText, IconButton, Divider, Button } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import ArticleIcon from "@mui/icons-material/Article";
import FolderIcon from "@mui/icons-material/Folder";
import BarChartIcon from "@mui/icons-material/BarChart";
import EventNoteIcon from "@mui/icons-material/EventNote";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import PolicyIcon from "@mui/icons-material/Policy";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import MenuIcon from "@mui/icons-material/Menu";
import { clearSession, getSession } from "../api";

const navItems = [
  { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { label: "Staff", path: "/staff", icon: <PeopleIcon /> },
  { label: "Members", path: "/members", icon: <ArticleIcon /> },
  { label: "Documents", path: "/documents", icon: <FolderIcon /> },
  { label: "Notes", path: "/notes", icon: <ArticleIcon /> },
  { label: "Text", path: "/chat", icon: <PeopleIcon /> },
  { label: "Reports", path: "/reports", icon: <BarChartIcon /> },
  { label: "Compliance", path: "/staff", icon: <HealthAndSafetyIcon /> },
  { label: "Appointments", path: "/notes", icon: <EventNoteIcon /> },
  { label: "Policies", path: "/reports", icon: <PolicyIcon /> },
  { label: "Fire Drills", path: "/fire-drills", icon: <LocalFireDepartmentIcon sx={{ color: "#c62828" }} /> },
];

export default function SideNav({ children }) {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const session = getSession();

  const handleLogout = () => {
    clearSession();
    window.location.href = "/login";
  };

  const hideLayout = location.pathname === "/login";

  if (hideLayout) {
    return <Box>{children}</Box>;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setOpen((prev) => !prev)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Pastalino Manor System
          </Typography>
          {session && (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Drawer variant="persistent" open={open} sx={{ width: 240, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box", mt: 8 } }}>
        <Toolbar />
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItemButton key={item.label} component={RouterLink} to={item.path} selected={location.pathname === item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, ml: open ? "240px" : 0, mt: 8, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
