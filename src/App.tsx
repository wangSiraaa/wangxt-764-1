import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelector from "@/components/RoleSelector";
import CounterPage from "@/pages/CounterPage";
import { useAppStore } from "@/store/useAppStore";

function AppContent() {
  const role = useAppStore((s) => s.role);
  return role ? <CounterPage /> : <RoleSelector />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}
