import { Routes, Route, Navigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import { AppLayout } from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Semestres from './pages/Semestres';
import SemestreDetail from './pages/SemestreDetail';
import NewIntervention from './pages/NewIntervention';
import InterventionDetail from './pages/InterventionDetail';
import Statistics from './pages/Statistics';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Settings from './pages/Settings';
import SemesterReport from './pages/SemesterReport';
import { RequireAdmin } from './pages/admin/RequireAdmin';
import AdminDashboard from './pages/admin/AdminDashboard';
import InternDetail from './pages/admin/InternDetail';
import CatalogManage from './pages/admin/CatalogManage';
import UserManage from './pages/admin/UserManage';
import CentreStats from './pages/admin/CentreStats';

// Splash affiché le temps de résoudre la session au démarrage.
function AuthSplash() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center animate-pulse">
        <HeartPulse size={28} className="text-white" strokeWidth={2.2} />
      </div>
      <div className="text-[13px] text-ink-3">Connexion…</div>
    </div>
  );
}

export default function App() {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') return <AuthSplash />;
  if (status !== 'signed-in') return <Login />;

  return (
    <Routes>
      <Route path="/semestres/:id/rapport" element={<SemesterReport />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/semestres" element={<Semestres />} />
        <Route path="/semestres/:id" element={<SemestreDetail />} />
        <Route path="/interventions/nouvelle" element={<NewIntervention />} />
        <Route path="/interventions/:id" element={<InterventionDetail />} />
        <Route path="/interventions/:id/modifier" element={<NewIntervention />} />
        <Route path="/statistiques" element={<Statistics />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/parametres" element={<Settings />} />
        {/* Espace d'administration — gardé par RequireAdmin (et la RLS côté serveur). */}
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/internes/:userId" element={<RequireAdmin><InternDetail /></RequireAdmin>} />
        <Route path="/admin/catalogue" element={<RequireAdmin><CatalogManage /></RequireAdmin>} />
        <Route path="/admin/comptes" element={<RequireAdmin><UserManage /></RequireAdmin>} />
        <Route path="/admin/centres" element={<RequireAdmin><CentreStats /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
