import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Container } from "@mui/material";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StaffPage from "./pages/StaffPage";
import MembersPage from "./pages/MembersPage";
import DocumentsPage from "./pages/DocumentsPage";
import ReportsPage from "./pages/ReportsPage";
import NotesPage from "./pages/NotesPage";
import FaceSheetPage from "./pages/FaceSheetPage";
import ClientChatPage from "./pages/ClientChatPage";
import ResetRequiredPage from "./pages/ResetRequiredPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import SideNav from "./components/SideNav";

function App() {
  return (
    <BrowserRouter>
      <SideNav>
        <Container maxWidth="xl" sx={{ mt: 2, pb: 4 }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={<ProtectedRoute component={DashboardPage} />}
            />
            <Route
              path="/staff"
              element={<ProtectedRoute component={StaffPage} />}
            />
            <Route
              path="/members"
              element={<ProtectedRoute component={MembersPage} />}
            />
            <Route
              path="/documents"
              element={<ProtectedRoute component={DocumentsPage} />}
            />
            <Route
              path="/reports"
              element={<ProtectedRoute component={ReportsPage} />}
            />
            <Route
              path="/notes"
              element={<ProtectedRoute component={NotesPage} />}
            />
            <Route
              path="/members/face-sheet"
              element={<ProtectedRoute component={FaceSheetPage} />}
            />
            <Route path="/face-sheet" element={<Navigate to="/members/face-sheet" replace />} />
            <Route
              path="/chat"
              element={<ProtectedRoute component={ClientChatPage} />}
            />
            <Route
              path="/reset-required"
              element={<ProtectedRoute component={ResetRequiredPage} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </SideNav>
    </BrowserRouter>
  );
}

export default App;
