import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Upload,
  RotateCcw,
  Eraser,
  FileSpreadsheet,
  FileBarChart,
  ChevronRight,
  UsersRound,
  Info,
} from 'lucide-react';
import { useData } from '../store/hooks';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { serviceForSemester, specialtyForSemester } from '../lib/queries';
import { formatDate } from '../lib/dates';
import {
  buildExport,
  downloadJSON,
  exportFilename,
  parseImport,
  importSummary,
} from '../lib/exportData';
import { exportExcel } from '../lib/exportExcel';
import {
  exportPatientsJSON,
  exportPatientsCSV,
  parsePatientsJSON,
  parsePatientsCSV,
  patientsMergeSummary,
} from '../lib/exportPatients';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ConfirmDialog, Modal } from './ui/Modal';

function ActionRow({ icon, title, subtitle, onClick, last }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 text-left active:bg-surface-2 transition-colors"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}
    >
      <div className="w-9 h-9 rounded-md bg-surface-2 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-ink-1">{title}</div>
        <div className="text-xs text-ink-3">{subtitle}</div>
      </div>
      <ChevronRight size={16} className="text-ink-3 shrink-0" />
    </button>
  );
}

export function ExportSection() {
  const navigate = useNavigate();
  const data = useData();
  const store = useStore();
  const isPaid = useAuthStore((s) => s.isPaid);
  const isDemo = useAuthStore((s) => s.isDemo);

  const fileRef = useRef(null);
  const patientsFileRef = useRef(null);

  const [confirm, setConfirm] = useState(null);
  const [alert, setAlert] = useState(null);
  const [reportPicker, setReportPicker] = useState(false);
  const [patientExportModal, setPatientExportModal] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [pendingPatientsImport, setPendingPatientsImport] = useState(null);

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
    <>
      {/* Avertissement RGPD */}
      <div className="flex items-start gap-2.5 rounded-xl bg-warning/10 border border-warning/30 px-3.5 py-3">
        <UsersRound size={16} className="text-warning mt-0.5 shrink-0" />
        <p className="text-[12px] text-ink-2 leading-relaxed">
          <span className="font-semibold text-ink-1">Les patients ne sont jamais synchronisés</span>{' '}
          (RGPD). Si tu changes de téléphone, exporte la liste patients{' '}
          <span className="font-semibold">avant</span> et garde le fichier en lieu sûr : c'est le
          seul moyen de retrouver les noms associés à tes interventions.
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
        <Info size={13} /> Seules les statistiques de formation sont dans le cloud — les patients
        restent sur ton appareil (RGPD).
      </p>

      {/* Fichiers cachés */}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onPickFile}
      />
      <input
        ref={patientsFileRef}
        type="file"
        accept="application/json,.json,.csv,text/csv"
        className="hidden"
        onChange={onPickPatientsFile}
      />

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

      {/* Alerte */}
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

      {/* Confirmation d'import données */}
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

      {/* Rapports de formation */}
      <Modal
        open={reportPicker}
        onClose={() => setReportPicker(false)}
        title="Rapports de formation"
      >
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              exportExcel(data);
              setReportPicker(false);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg border text-left active:scale-[0.99] transition-transform"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
          >
            <div className="w-10 h-10 rounded-md bg-success/10 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={20} className="text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-ink-1">Export Excel complet</div>
              <div className="text-[12px] text-ink-3">
                Toutes les interventions, mise en forme, lisible par tous
              </div>
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
                        {service?.name || '—'} · {formatDate(sem.startDate)} →{' '}
                        {formatDate(sem.endDate)}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-ink-3 shrink-0" />
                  </button>
                );
              })}
            {data.semesters.length === 0 && (
              <p className="text-[13px] text-ink-3 text-center py-4">
                Aucun semestre enregistré.
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Export patients */}
      <Modal
        open={patientExportModal}
        onClose={() => setPatientExportModal(false)}
        title="Exporter les patients"
        subtitle={`${data.patients.length} patient(s) local(aux)`}
      >
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              exportPatientsJSON(data.patients);
              setPatientExportModal(false);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg border text-left active:scale-[0.99] transition-transform"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
          >
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Download size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-ink-1">JSON</div>
              <div className="text-[12px] text-ink-3">
                Recommandé — réimportable dans l'application
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-3 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => {
              exportPatientsCSV(data.patients);
              setPatientExportModal(false);
            }}
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
    </>
  );
}
