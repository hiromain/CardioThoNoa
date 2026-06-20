import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pencil,
  Trash2,
  Plus,
  ChevronRight,
  Building2,
  Stethoscope,
  Scissors,
  Download,
  Upload,
  RotateCcw,
  Eraser,
  Check,
  Info,
  Calendar,
  Archive,
  ArchiveRestore,
  FileSpreadsheet,
  FileBarChart,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  User,
  UserPlus,
  UsersRound,
  Sparkles,
  SlidersHorizontal,
  ListChecks,
  Database,
  Smartphone,
  Share,
  MoreVertical,
  SquarePlus,
  Lock,
  BadgeCheck,
  KeyRound,
  Mail,
} from 'lucide-react';
import { useData } from '../store/hooks';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { triggerManualSync } from '../lib/syncEngine';
import {
  canPromptInstall,
  subscribeInstallPrompt,
  promptInstall,
  isStandalone,
} from '../lib/installPrompt';
import {
  APP_VERSION,
  getSpecialty,
  SCOPES,
} from '../data/constants';
import {
  serviceForSemester,
  specialtyForSemester,
  surgeonName,
  procLabel,
  serviceUsage,
  surgeonInterventionCount,
  procedureUsageCount,
  semesterInterventionCount,
} from '../lib/queries';
import { formatDate, semesterStatus, STATUS_LABELS } from '../lib/dates';
import { buildExport, downloadJSON, exportFilename, parseImport, importSummary } from '../lib/exportData';
import { exportExcel } from '../lib/exportExcel';
import {
  exportPatientsJSON,
  exportPatientsCSV,
  parsePatientsJSON,
  parsePatientsCSV,
  patientsMergeSummary,
} from '../lib/exportPatients';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Accordion } from '../components/ui/Accordion';
import { Badge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Button } from '../components/ui/Button';
import { SpecBadge } from '../components/SpecBadge';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Field';
import { ServiceFormModal } from '../components/forms/ServiceFormModal';
import { SurgeonFormModal } from '../components/forms/SurgeonFormModal';
import { ProcedureTypeFormModal } from '../components/forms/ProcedureTypeFormModal';
import { SemesterFormModal } from '../components/forms/SemesterFormModal';
import { ProfileFormModal } from '../components/forms/ProfileFormModal';

const scopeLabel = (v) => SCOPES.find((s) => s.value === v)?.label || v;

export default function Settings() {
  const navigate = useNavigate();
  const data = useData();
  const theme = useStore((s) => s.theme);
  const blocMode = useStore((s) => s.blocMode);
  const setTheme = useStore((s) => s.setTheme);
  const setBlocMode = useStore((s) => s.setBlocMode);
  const currentSemesterId = useStore((s) => s.currentSemesterId);
  const setCurrentSemester = useStore((s) => s.setCurrentSemester);
  const profile = useStore((s) => s.profile);
  const syncStatus = useStore((s) => s.syncStatus);
  const lastSyncedAt = useStore((s) => s.lastSyncedAt);
  const store = useStore();

  const user = useAuthStore((s) => s.user);
  const isDemo = useAuthStore((s) => s.isDemo);
  const isPaid = useAuthStore((s) => s.isPaid);
  const plan = useAuthStore((s) => s.plan);
  const planEndDate = useAuthStore((s) => s.planEndDate);
  const signOut = useAuthStore((s) => s.signOut);
  const setAuthView = useAuthStore((s) => s.setAuthView);
  const configured = useAuthStore((s) => s.configured);
  const authProvider = useAuthStore((s) => s.authProvider);
  const updatePassword = useAuthStore((s) => s.updatePassword);

  // Modale « changer le mot de passe » (comptes email uniquement).
  const [pwModal, setPwModal] = useState(false);
  const [pwValue, setPwValue] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  async function submitPassword() {
    setPwBusy(true);
    const ok = await updatePassword(pwValue);
    setPwBusy(false);
    if (ok) {
      setPwDone(true);
      setPwValue('');
      setTimeout(() => {
        setPwModal(false);
        setPwDone(false);
      }, 1200);
    }
  }

  const fileRef = useRef(null);
  const patientsFileRef = useRef(null);
  const [modal, setModal] = useState({ type: null, item: null });
  const [confirm, setConfirm] = useState(null);
  const [alert, setAlert] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [pendingPatientsImport, setPendingPatientsImport] = useState(null);
  const [reportPicker, setReportPicker] = useState(false);
  const [patientExportModal, setPatientExportModal] = useState(false);
  const [canInstall, setCanInstall] = useState(canPromptInstall());
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(
    () =>
      subscribeInstallPrompt(() => {
        setCanInstall(canPromptInstall());
        setInstalled(isStandalone());
      }),
    []
  );

  const activeSemesters = [...data.semesters]
    .filter((s) => !s.archived)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  // ── Suppression sûre ──────────────────────────────────────────────────────
  function tryDelete(kind, item) {
    let reason = null;
    if (kind === 'service') {
      const u = serviceUsage(data, item.id);
      if (u.surgeons || u.semesters)
        reason = `Service utilisé par ${u.surgeons} chirurgien(s) et ${u.semesters} semestre(s).`;
    } else if (kind === 'surgeon') {
      const n = surgeonInterventionCount(data, item.id);
      if (n) reason = `Chirurgien lié à ${n} intervention(s).`;
    } else if (kind === 'procedure') {
      const n = procedureUsageCount(data, item.id);
      if (n) reason = `Geste utilisé dans ${n} intervention(s).`;
    } else if (kind === 'semester') {
      const n = semesterInterventionCount(data, item.id);
      if (n) reason = `Semestre lié à ${n} intervention(s). Archivez-le plutôt que de le supprimer.`;
    }
    if (reason) {
      setAlert(`Suppression impossible. ${reason}`);
      return;
    }
    setConfirm({
      title: 'Supprimer ce semestre ?',
      message: 'Cette action est définitive.',
      onConfirm: () => {
        if (kind === 'service') store.deleteService(item.id);
        if (kind === 'surgeon') store.deleteSurgeon(item.id);
        if (kind === 'procedure') store.deleteProcedureType(item.id);
        if (kind === 'semester') store.deleteSemester(item.id);
      },
    });
  }

  // ── Import ────────────────────────────────────────────────────────────────
  function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = parseImport(reader.result);
        setPendingImport({ data: d, summary: importSummary(d) });
      } catch (err) {
        setAlert(err.message || 'Fichier illisible.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function onPickPatientsFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const patients = isCSV
          ? parsePatientsCSV(reader.result)
          : parsePatientsJSON(reader.result);
        const summary = patientsMergeSummary(data.patients, patients);
        setPendingPatientsImport({ patients, summary });
      } catch (err) {
        setAlert(err.message || 'Fichier illisible.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div>
      <TopBar title="Réglages" />

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Compte & synchronisation */}
        <Accordion
          icon={<User size={18} className="text-primary" />}
          title="Compte"
          subtitle={isDemo ? 'Mode démo' : user?.email || 'Non connecté'}
          defaultOpen
        >
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-xl font-extrabold text-white shrink-0">
              {profile.initiales}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-ink-1">
                {profile.prenom} {profile.nom}
              </div>
              <div className="text-[13px] text-ink-2 mt-0.5">Interne · {profile.promotion}</div>
              <div className="text-xs text-ink-3 mt-0.5 truncate">{profile.hopital}</div>
            </div>
            <button
              type="button"
              onClick={() => setModal({ type: 'profile', item: null })}
              className="p-2 text-ink-3 shrink-0"
              aria-label="Modifier le profil"
            >
              <Pencil size={16} />
            </button>
          </div>

          {isDemo ? (
            <Card padding="p-0">
              <div className="flex items-start gap-3 p-4 border-b border-line">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-ink-1">Mode démo</div>
                  <div className="text-xs text-ink-3 mt-0.5 leading-relaxed">
                    Tu explores l'application avec des données d'exemple. Crée un
                    compte pour saisir et sauvegarder tes propres données.
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-2.5">
                <Button
                  fullWidth
                  onClick={() => {
                    setAuthView('signup');
                    signOut();
                  }}
                >
                  <UserPlus size={16} /> Créer un compte
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    signOut();
                  }}
                  className="text-[13px] text-ink-3 font-medium text-center"
                >
                  Tu as déjà un compte ? Se connecter
                </button>
              </div>
            </Card>
          ) : !isPaid ? (
            <Card padding="p-0">
              <div className="flex items-start gap-3 p-4 border-b border-line">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Lock size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-ink-1">Accès limité</div>
                  <div className="text-xs text-ink-3 mt-0.5 leading-relaxed">
                    Contacte l'administrateur pour demander l'accès complet à l'application.
                  </div>
                </div>
              </div>
              <div className="px-3 py-3 flex flex-col gap-2">
                <Button
                  fullWidth
                  onClick={() => {
                    const subject = encodeURIComponent("Demande d'accès CardioThoNoa");
                    const body = encodeURIComponent(
                      `Bonjour,\n\nJe souhaiterais obtenir l'accès complet à l'application CardioThoNoa.\n\nMon adresse email : ${user?.email ?? ''}\n\nMerci !`
                    );
                    window.location.href = `mailto:romain.hittinger@gmail.com?subject=${subject}&body=${body}`;
                  }}
                >
                  <Mail size={16} /> Demander l'accès
                </Button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirm({
                      title: 'Se déconnecter ?',
                      message: 'Tu devras te reconnecter pour revenir.',
                      confirmLabel: 'Se déconnecter',
                      onConfirm: () => signOut(),
                    })
                  }
                  className="text-[13px] text-ink-3 font-medium text-center py-1"
                >
                  Se déconnecter
                </button>
              </div>
            </Card>
          ) : (
            <Card padding="p-0">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
                <BadgeCheck size={18} className="text-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-ink-1">
                    {planDisplayLabel(plan)}
                  </div>
                  <div className="text-[11px] text-ink-3 mt-0.5">
                    {planEndDate ? `Renouvellement le ${formatDate(planEndDate.slice(0, 10))}` : 'Aucun renouvellement automatique'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border-b border-line">
                <SyncStatusIcon status={syncStatus} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-ink-1 truncate">
                    {user?.email || 'Non connecté'}
                  </div>
                  <div className="text-xs text-ink-3">{syncLabel(syncStatus, lastSyncedAt)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => triggerManualSync()}
                  disabled={!configured || syncStatus === 'syncing'}
                  className="flex items-center gap-1 text-xs text-primary font-semibold disabled:opacity-40"
                >
                  <RefreshCw size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                  Synchroniser
                </button>
              </div>
              <ActionRow
                icon={<LogOut size={18} className="text-cardiac" />}
                title="Se déconnecter"
                subtitle="Les données restent sur cet appareil"
                last
                onClick={() =>
                  setConfirm({
                    title: 'Se déconnecter ?',
                    message:
                      'Tu devras te reconnecter avec ton email et ton mot de passe. Tes données locales sont conservées.',
                    confirmLabel: 'Se déconnecter',
                    onConfirm: () => signOut(),
                  })
                }
              />
            </Card>
          )}

          {/* Sécurité (comptes réels uniquement) */}
          {!isDemo && (
            <Card padding="p-0">
              <div className="flex items-center gap-3 p-4 border-b border-line">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  {authProvider === 'google' ? (
                    <GoogleMark />
                  ) : (
                    <Lock size={18} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-ink-1">Connexion</div>
                  <div className="text-xs text-ink-3 mt-0.5">
                    {authProvider === 'google'
                      ? 'Connecté via Google'
                      : 'Email et mot de passe'}
                  </div>
                </div>
              </div>
              {authProvider !== 'google' && (
                <ActionRow
                  icon={<KeyRound size={18} className="text-ink-2" />}
                  title="Modifier le mot de passe"
                  last
                  onClick={() => {
                    setPwValue('');
                    setPwDone(false);
                    setPwModal(true);
                  }}
                />
              )}
            </Card>
          )}

          <p className="text-[11px] text-ink-3 flex items-center gap-1.5 px-1">
            <Info size={13} /> Les patients ne sont jamais synchronisés (RGPD).
          </p>
        </Accordion>

        {/* Stage actuel */}
        <Accordion
          icon={<Calendar size={18} className="text-primary" />}
          title="Stage actuel"
          subtitle={
            data.semesters.find((s) => s.id === currentSemesterId)?.label || 'Aucun stage sélectionné'
          }
          defaultOpen
        >
          <div className="flex flex-col gap-2">
            {activeSemesters.map((sem) => {
              const cfg = specialtyForSemester(data, sem.id);
              const service = serviceForSemester(data, sem.id);
              const selected = currentSemesterId === sem.id;
              return (
                <button
                  key={sem.id}
                  type="button"
                  onClick={() => setCurrentSemester(sem.id)}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left"
                  style={{
                    borderColor: selected ? cfg.color : 'var(--border)',
                    background: selected ? cfg.muted : 'var(--surface)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center text-xl shrink-0"
                    style={{ background: selected ? cfg.color : 'var(--surface-2)' }}
                  >
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-bold" style={{ color: selected ? cfg.color : 'var(--text-1)' }}>
                        {sem.label}
                      </span>
                      <span className="text-sm text-ink-2">— {cfg.label}</span>
                    </div>
                    <div className="text-xs text-ink-3 truncate">{service?.name}</div>
                    <div className="text-[11px] text-ink-3 mt-0.5">
                      {formatDate(sem.startDate)} → {formatDate(sem.endDate)}
                    </div>
                  </div>
                  <span
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: selected ? cfg.color : 'var(--border)', background: selected ? cfg.color : 'transparent' }}
                  >
                    {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
            {activeSemesters.length === 0 && (
              <p className="text-[13px] text-ink-3">Aucun semestre actif.</p>
            )}
          </div>
        </Accordion>

        {/* Préférences */}
        <Accordion icon={<SlidersHorizontal size={18} className="text-primary" />} title="Préférences">
          <Card padding="p-0">
            <div className="flex justify-between items-center p-4 border-b border-line">
              <div>
                <div className="text-[15px] font-medium text-ink-1">Thème</div>
                <div className="text-xs text-ink-3">Apparence de l'interface</div>
              </div>
              <div className="w-40">
                <SegmentedControl
                  options={[
                    { value: 'light', label: '☀️' },
                    { value: 'dark', label: '🌙' },
                  ]}
                  value={theme}
                  onChange={setTheme}
                />
              </div>
            </div>
            <div className="flex justify-between items-center p-4">
              <div className="pr-3">
                <div className="text-[15px] font-medium text-ink-1">Mode bloc opératoire</div>
                <div className="text-xs text-ink-3">Force le thème sombre (faible luminosité)</div>
              </div>
              <Toggle checked={blocMode} onChange={setBlocMode} />
            </div>
          </Card>
        </Accordion>

        {/* Installation sur l'écran d'accueil */}
        <Accordion
          icon={<Smartphone size={18} className="text-primary" />}
          title="Installer l'application"
          subtitle={installed ? 'Déjà installée' : 'Ajouter à l\'écran d\'accueil'}
        >
          {installed ? (
            <p className="text-[13px] text-success flex items-center gap-1.5 px-1">
              <Check size={15} /> L'application est installée sur cet appareil.
            </p>
          ) : (
            <>
              {canInstall && (
                <Button fullWidth onClick={() => promptInstall()}>
                  <Download size={16} /> Installer l'application
                </Button>
              )}
              <Card padding="p-0">
                <div className="flex items-start gap-3 p-4 border-b border-line">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Share size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-ink-1">Sur iPhone (Safari)</div>
                    <div className="text-xs text-ink-3 mt-0.5 leading-relaxed">
                      Appuie sur l'icône <strong>Partager</strong> (carré avec une flèche vers le
                      haut) dans la barre du bas, puis choisis{' '}
                      <strong>« Sur l'écran d'accueil »</strong>.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <MoreVertical size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-ink-1">Sur Android (Chrome)</div>
                    <div className="text-xs text-ink-3 mt-0.5 leading-relaxed">
                      {canInstall ? (
                        <>
                          Ou appuie sur le menu <strong>⋮</strong> en haut à droite, puis choisis{' '}
                          <strong>« Installer l'application »</strong>.
                        </>
                      ) : (
                        <>
                          Appuie sur le menu <strong>⋮</strong> en haut à droite, puis choisis{' '}
                          <strong>« Ajouter à l'écran d'accueil »</strong> ou{' '}
                          <strong>« Installer l'application »</strong>.
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
              <p className="text-[11px] text-ink-3 flex items-center gap-1.5 px-1">
                <SquarePlus size={13} /> Une fois ajoutée, l'application s'ouvre en plein écran
                comme une vraie app, sans la barre du navigateur.
              </p>
            </>
          )}
        </Accordion>

        {/* Gestion des listes */}
        <Accordion
          icon={<ListChecks size={18} className="text-primary" />}
          title="Gestion des listes"
          subtitle="Semestres, services, chirurgiens, gestes"
        >
          <div className="flex flex-col gap-2">
            <SemesterManagerCard
              semesters={[...data.semesters].sort((a, b) => b.startDate.localeCompare(a.startDate))}
              data={data}
              onAdd={() => setModal({ type: 'semester', item: null })}
              onEdit={(sem) => setModal({ type: 'semester', item: sem })}
              onArchive={(sem) => store.toggleArchiveSemester(sem.id)}
              onDelete={(sem) => tryDelete('semester', sem)}
            />
            <ManagerCard
              icon={<Building2 size={18} className="text-primary" />}
              title="Services"
              count={data.services.length}
              onAdd={() => setModal({ type: 'service', item: null })}
              items={data.services.map((s) => {
                const cfg = getSpecialty(s.type);
                return {
                  id: s.id,
                  primary: s.name,
                  secondary: `${cfg.label}${s.city ? ` · ${s.city}` : ''}`,
                  color: cfg.color,
                  raw: s,
                };
              })}
              onEdit={(it) => setModal({ type: 'service', item: it.raw })}
              onDelete={(it) => tryDelete('service', it.raw)}
            />
            <ManagerCard
              icon={<Stethoscope size={18} className="text-primary" />}
              title="Chirurgiens"
              count={data.surgeons.length}
              onAdd={() => setModal({ type: 'surgeon', item: null })}
              items={data.surgeons.map((s) => {
                const svc = data.services.find((x) => x.id === s.serviceId);
                const cfg = getSpecialty(svc?.type);
                return {
                  id: s.id,
                  primary: surgeonName(s),
                  secondary: svc?.name || 'Service inconnu',
                  color: cfg.color,
                  raw: s,
                };
              })}
              onEdit={(it) => setModal({ type: 'surgeon', item: it.raw })}
              onDelete={(it) => tryDelete('surgeon', it.raw)}
            />
            <ManagerCard
              icon={<Scissors size={18} className="text-primary" />}
              title="Gestes"
              count={data.procedureTypes.length}
              onAdd={() => setModal({ type: 'procedure', item: null })}
              items={data.procedureTypes.map((p) => {
                const cfg = getSpecialty(p.serviceType);
                const stepsCount = p.internSteps?.length || 0;
                return {
                  id: p.id,
                  primary: procLabel(p),
                  secondary: `${cfg.label} · ${scopeLabel(p.scope)}${stepsCount ? ` · ${stepsCount} sous-gestes` : ''}`,
                  color: cfg.color,
                  raw: p,
                };
              })}
              onEdit={(it) => setModal({ type: 'procedure', item: it.raw })}
              onDelete={(it) => tryDelete('procedure', it.raw)}
            />
          </div>
        </Accordion>

        {/* Données */}
        <Accordion icon={<Database size={18} className="text-primary" />} title="Données">
          {/* Avertissement patients */}
          <div className="flex items-start gap-2.5 rounded-xl bg-warning/10 border border-warning/30 px-3.5 py-3">
            <UsersRound size={16} className="text-warning mt-0.5 shrink-0" />
            <p className="text-[12px] text-ink-2 leading-relaxed">
              <span className="font-semibold text-ink-1">Les patients ne sont jamais synchronisés</span> (RGPD).
              Si tu changes de téléphone, exporte la liste patients <span className="font-semibold">avant</span> et garde le fichier en lieu sûr :
              c'est le seul moyen de retrouver les noms associés à tes interventions.
            </p>
          </div>

          <Card padding="p-0">
            <ActionRow
              icon={<Download size={18} className="text-primary" />}
              title="Exporter (JSON)"
              subtitle="Sauvegarde complète de toutes les données"
              onClick={() => downloadJSON(buildExport(store), exportFilename())}
            />
            <ActionRow
              icon={<FileBarChart size={18} className="text-primary" />}
              title="Rapports de formation"
              subtitle="Excel ou synthèse PDF d'un semestre"
              onClick={() => setReportPicker(true)}
            />
            <ActionRow
              icon={<UsersRound size={18} className="text-warning" />}
              title="Exporter les patients"
              subtitle="JSON (réimportable) ou CSV (tableur)"
              onClick={() => setPatientExportModal(true)}
            />
            <ActionRow
              icon={<Upload size={18} className="text-primary" />}
              title="Importer (JSON)"
              subtitle="Restaurer une sauvegarde complète"
              onClick={() => fileRef.current?.click()}
            />
            <ActionRow
              icon={<Upload size={18} className="text-warning" />}
              title="Importer les patients"
              subtitle="Fusionner JSON ou CSV — ne supprime rien"
              onClick={() => patientsFileRef.current?.click()}
            />
            {(!isPaid || isDemo) && (
              <ActionRow
                icon={<RotateCcw size={18} className="text-warning" />}
                title="Réinitialiser la démo"
                subtitle="Recharger le jeu de données d'exemple"
                onClick={() =>
                  setConfirm({
                    title: 'Réinitialiser les données ?',
                    message: 'Toutes vos données seront remplacées par le jeu de démonstration.',
                    danger: true,
                    confirmLabel: 'Réinitialiser',
                    onConfirm: () => store.resetDemo(),
                  })
                }
              />
            )}
            <ActionRow
              icon={<Eraser size={18} className="text-cardiac" />}
              title="Tout effacer"
              subtitle="Supprimer définitivement toutes les données"
              last
              onClick={() =>
                setConfirm({
                  title: 'Tout effacer ?',
                  message: "Cette action supprime définitivement l'ensemble des données locales.",
                  danger: true,
                  confirmLabel: 'Tout effacer',
                  onConfirm: () => store.clearAll(),
                })
              }
            />
          </Card>
          <p className="text-[11px] text-ink-3 flex items-center gap-1.5 px-1">
            <Info size={13} /> Seules les statistiques de formation sont dans le cloud — les patients restent sur ton appareil (RGPD).
          </p>
        </Accordion>

        {/* À propos */}
        <Accordion icon={<Info size={18} className="text-primary" />} title="À propos" subtitle={`Version ${APP_VERSION}`}>
          <AboutRow label="Application" value="CardioThoNoa" />
          <AboutRow label="Version" value={APP_VERSION} />
          <AboutRow label="Données" value="Local + cloud (hors patients)" valueColor="#27AE60" />
          <AboutRow label="Développée par" value="Romain Hittinger" />
          <AboutRow label="Profession" value="Chirurgien cardiaque" />
          <div className="mt-3 pt-3 border-t border-line flex flex-col gap-1.5 text-[12px] text-ink-3 leading-relaxed">
            <p>🫀 Codée entre deux gardes, avec amour (et beaucoup de café).</p>
            <p>📈 Garantie sans complication — contrairement à certaines suites opératoires.</p>
            <p>🪛 Bugs traités en urgence, comme au bloc.</p>
            <p>🤖 Co-écrite avec une IA qui n'a jamais touché un bistouri.</p>
          </div>
        </Accordion>

        <div className="text-center text-[11px] text-ink-3 pt-1">
          Fait avec ❤️ pour {profile.prenom}
        </div>
      </div>

      {/* Modales d'édition */}
      <SemesterFormModal
        open={modal.type === 'semester'}
        onClose={() => setModal({ type: null, item: null })}
        initial={modal.item}
        onSubmit={(d) => (modal.item ? store.updateSemester(modal.item.id, d) : store.addSemester(d))}
      />
      <ServiceFormModal
        open={modal.type === 'service'}
        onClose={() => setModal({ type: null, item: null })}
        initial={modal.item}
        onSubmit={(d) => (modal.item ? store.updateService(modal.item.id, d) : store.addService(d))}
      />
      <SurgeonFormModal
        open={modal.type === 'surgeon'}
        onClose={() => setModal({ type: null, item: null })}
        initial={modal.item}
        onSubmit={(d) => (modal.item ? store.updateSurgeon(modal.item.id, d) : store.addSurgeon(d))}
      />
      <ProcedureTypeFormModal
        open={modal.type === 'procedure'}
        onClose={() => setModal({ type: null, item: null })}
        initial={modal.item}
        allProcedures={data.procedureTypes}
        onSubmit={(d) =>
          modal.item ? store.updateProcedureType(modal.item.id, d) : store.addProcedureType(d)
        }
      />
      <ProfileFormModal
        open={modal.type === 'profile'}
        onClose={() => setModal({ type: null, item: null })}
      />

      {/* Changer le mot de passe */}
      <Modal
        open={pwModal}
        onClose={() => setPwModal(false)}
        title="Modifier le mot de passe"
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setPwModal(false)}>
              Annuler
            </Button>
            <Button
              fullWidth
              onClick={submitPassword}
              disabled={pwBusy || pwDone || pwValue.length < 6}
            >
              {pwDone ? 'Enregistré ✓' : pwBusy ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <Input
          label="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          placeholder="6 caractères minimum"
          value={pwValue}
          onChange={(e) => setPwValue(e.target.value)}
        />
      </Modal>

      {/* Confirmation générique */}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel || 'Confirmer'}
        danger={confirm?.danger}
      />

      {/* Alerte (suppression bloquée, import invalide) */}
      <Modal
        open={!!alert}
        onClose={() => setAlert(null)}
        title="Information"
        footer={
          <Button fullWidth onClick={() => setAlert(null)}>
            Compris
          </Button>
        }
      >
        <p className="text-sm text-ink-2 leading-relaxed">{alert}</p>
      </Modal>

      {/* Confirmation d'import */}
      <ConfirmDialog
        open={!!pendingImport}
        onClose={() => setPendingImport(null)}
        onConfirm={() => store.replaceAll(pendingImport.data)}
        title="Importer ces données ?"
        message={
          pendingImport
            ? `Remplacer les données actuelles par : ${pendingImport.summary.interventions} interventions, ${pendingImport.summary.patients} patients, ${pendingImport.summary.semesters} semestres, ${pendingImport.summary.surgeons} chirurgiens.`
            : ''
        }
        confirmLabel="Importer"
        danger
      />

      {/* Rapports de formation : Excel global ou synthèse PDF par semestre */}
      <Modal
        open={reportPicker}
        onClose={() => setReportPicker(false)}
        title="Rapports de formation"
      >
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => { exportExcel(data); setReportPicker(false); }}
            className="w-full flex items-center gap-3 p-3 rounded-lg border text-left active:scale-[0.99] transition-transform"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
          >
            <div className="w-10 h-10 rounded-md bg-success/10 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={20} className="text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-ink-1">Export Excel complet</div>
              <div className="text-[12px] text-ink-3">Toutes les interventions, mise en forme, lisible par tous</div>
            </div>
            <ChevronRight size={16} className="text-ink-3 shrink-0" />
          </button>

          <div className="flex items-center gap-2 text-[11px] text-ink-3 px-1">
            <FileBarChart size={13} className="text-primary shrink-0" />
            Synthèse PDF — choisir un semestre :
          </div>

          <div className="flex flex-col gap-2">
          {[...data.semesters]
            .sort((a, b) => b.startDate.localeCompare(a.startDate))
            .map((sem) => {
              const cfg = specialtyForSemester(data, sem.id);
              const service = serviceForSemester(data, sem.id);
              return (
                <button
                  key={sem.id}
                  type="button"
                  onClick={() => {
                    setReportPicker(false);
                    navigate(`/semestres/${sem.id}/rapport`);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border text-left active:scale-[0.99] transition-transform"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
                >
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center text-xl shrink-0"
                    style={{ background: cfg.muted }}
                  >
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-ink-1 truncate">{sem.label}</div>
                    <div className="text-[12px] text-ink-3 truncate">
                      {service?.name || '—'} · {formatDate(sem.startDate)} → {formatDate(sem.endDate)}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-ink-3 shrink-0" />
                </button>
              );
            })}
          {data.semesters.length === 0 && (
            <p className="text-[13px] text-ink-3 text-center py-4">Aucun semestre enregistré.</p>
          )}
          </div>
        </div>
      </Modal>

      {/* Export patients — choix du format */}
      <Modal
        open={patientExportModal}
        onClose={() => setPatientExportModal(false)}
        title="Exporter les patients"
        subtitle={`${data.patients.length} patient(s) local(aux)`}
      >
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => { exportPatientsJSON(data.patients); setPatientExportModal(false); }}
            className="w-full flex items-center gap-3 p-3 rounded-lg border text-left active:scale-[0.99] transition-transform"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
          >
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Download size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-ink-1">JSON</div>
              <div className="text-[12px] text-ink-3">Recommandé — réimportable dans l'application</div>
            </div>
            <ChevronRight size={16} className="text-ink-3 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => { exportPatientsCSV(data.patients); setPatientExportModal(false); }}
            className="w-full flex items-center gap-3 p-3 rounded-lg border text-left active:scale-[0.99] transition-transform"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
          >
            <div className="w-10 h-10 rounded-md bg-success/10 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={20} className="text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-ink-1">CSV</div>
              <div className="text-[12px] text-ink-3">Tableur éditable (Excel, Numbers…)</div>
            </div>
            <ChevronRight size={16} className="text-ink-3 shrink-0" />
          </button>
        </div>
      </Modal>

      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onPickFile} />
      <input ref={patientsFileRef} type="file" accept="application/json,.json,.csv,text/csv" className="hidden" onChange={onPickPatientsFile} />

      {/* Confirmation import patients */}
      <ConfirmDialog
        open={!!pendingPatientsImport}
        onClose={() => setPendingPatientsImport(null)}
        onConfirm={() => {
          store.mergePatients(pendingPatientsImport.patients);
          setPendingPatientsImport(null);
        }}
        title="Importer ces patients ?"
        message={
          pendingPatientsImport
            ? `${pendingPatientsImport.summary.added} patient(s) ajouté(s), ${pendingPatientsImport.summary.updated} mis à jour. Aucun patient existant ne sera supprimé.`
            : ''
        }
        confirmLabel="Importer"
      />
    </div>
  );
}

// ── Sous-composants ─────────────────────────────────────────────────────────
const STATUS_COLORS = {
  en_cours: '#27AE60',
  termine: '#8896AB',
  a_venir: '#1E3A5F',
  archive: '#E67E22',
};

function SemesterManagerCard({ semesters, data, onAdd, onEdit, onArchive, onDelete }) {
  const [open, setOpen] = useState(false);
  const count = semesters.length;

  return (
    <Card padding="p-0">
      <div className="flex items-center justify-between p-3.5">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 flex-1 text-left">
          <Calendar size={18} className="text-primary" />
          <div>
            <div className="text-sm font-medium text-ink-1">Semestres</div>
            <div className="text-xs text-ink-3">{count} élément{count > 1 ? 's' : ''}</div>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 text-xs text-primary font-semibold"
          >
            <Plus size={14} strokeWidth={2.6} /> Ajouter
          </button>
          <ChevronRight
            size={16}
            className="text-ink-3 transition-transform"
            style={{ transform: open ? 'rotate(90deg)' : 'none' }}
            onClick={() => setOpen((o) => !o)}
          />
        </div>
      </div>

      {open && (
        <div className="border-t border-line">
          {semesters.length === 0 && (
            <div className="px-4 py-3 text-[13px] text-ink-3">Aucun semestre.</div>
          )}
          {semesters.map((sem, idx) => {
            const status = semesterStatus(sem);
            const statusColor = STATUS_COLORS[status];
            const service = serviceForSemester(data, sem.id);
            const cfg = specialtyForSemester(data, sem.id);
            const isArchived = !!sem.archived;
            return (
              <div
                key={sem.id}
                className="flex items-center gap-2.5 px-4 py-2.5"
                style={{
                  borderBottom: idx < semesters.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: isArchived ? 0.6 : 1,
                }}
              >
                {/* Indicateur couleur spécialité */}
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg?.color || statusColor }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-medium text-ink-1 truncate">{sem.label}</span>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                      style={{ background: statusColor + '22', color: statusColor }}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-3 truncate">
                    {service?.name || '—'} · {formatDate(sem.startDate)} → {formatDate(sem.endDate)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onArchive(sem)}
                    className="p-1.5 text-ink-3"
                    aria-label={isArchived ? 'Désarchiver' : 'Archiver'}
                    title={isArchived ? 'Désarchiver' : 'Archiver'}
                  >
                    {isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(sem)}
                    className="p-1.5 text-ink-3"
                    aria-label="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(sem)}
                    className="p-1.5 text-cardiac"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// Petit logo Google pour la ligne « méthode de connexion ».
function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.2 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.3 0-1.3-.1-2.7-.4-4z" />
    </svg>
  );
}

function ManagerCard({ icon, title, count, items, onAdd, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <Card padding="p-0">
      <div className="flex items-center justify-between p-3.5">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 flex-1 text-left">
          {icon}
          <div>
            <div className="text-sm font-medium text-ink-1">{title}</div>
            <div className="text-xs text-ink-3">{count} élément{count > 1 ? 's' : ''}</div>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 text-xs text-primary font-semibold"
          >
            <Plus size={14} strokeWidth={2.6} /> Ajouter
          </button>
          <ChevronRight
            size={16}
            className="text-ink-3 transition-transform"
            style={{ transform: open ? 'rotate(90deg)' : 'none' }}
            onClick={() => setOpen((o) => !o)}
          />
        </div>
      </div>

      {open && (
        <div className="border-t border-line">
          {items.length === 0 && <div className="px-4 py-3 text-[13px] text-ink-3">Liste vide.</div>}
          {items.map((it, idx) => (
            <div
              key={it.id}
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: it.color }} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink-1 truncate">{it.primary}</div>
                  {it.secondary && <div className="text-[11px] text-ink-3 truncate">{it.secondary}</div>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => onEdit(it)} className="p-1.5 text-ink-3" aria-label="Modifier">
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => onDelete(it)} className="p-1.5 text-cardiac" aria-label="Supprimer">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ActionRow({ icon, title, subtitle, onClick, last }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 text-left active:bg-surface-2 transition-colors"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}
    >
      <div className="w-9 h-9 rounded-md bg-surface-2 flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-ink-1">{title}</div>
        <div className="text-xs text-ink-3">{subtitle}</div>
      </div>
      <ChevronRight size={16} className="text-ink-3 shrink-0" />
    </button>
  );
}

const SYNC_META = {
  idle: { color: '#27AE60', Icon: Cloud },
  pending: { color: '#E67E22', Icon: Cloud },
  syncing: { color: '#2171B5', Icon: RefreshCw },
  error: { color: '#C0392B', Icon: CloudOff },
};

const PLAN_LABELS = { semester: 'Semestre (6 mois)', annual: 'Annuel', lifetime: 'À vie' };
function planDisplayLabel(plan) {
  return plan ? PLAN_LABELS[plan] ?? plan : 'Accès complet';
}

function SyncStatusIcon({ status }) {
  const { color, Icon } = SYNC_META[status] || SYNC_META.idle;
  return (
    <div
      className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
      style={{ background: color + '1f' }}
    >
      <Icon size={18} style={{ color }} className={status === 'syncing' ? 'animate-spin' : ''} />
    </div>
  );
}

function syncLabel(status, lastSyncedAt) {
  if (status === 'syncing') return 'Synchronisation en cours…';
  if (status === 'pending') return 'Modifications en attente…';
  if (status === 'error') return 'Échec de synchronisation';
  if (lastSyncedAt) return `Synchronisé ${formatRelative(lastSyncedAt)}`;
  return 'Jamais synchronisé';
}

function formatRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `le ${formatDate(iso.slice(0, 10))}`;
}

function AboutRow({ label, value, valueColor }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-[13px] text-ink-2">{label}</span>
      <span className="text-[13px] font-semibold" style={{ color: valueColor || 'var(--text-1)' }}>
        {value}
      </span>
    </div>
  );
}
