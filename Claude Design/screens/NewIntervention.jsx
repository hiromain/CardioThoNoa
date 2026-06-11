// CardioThoNoa — Nouvelle Intervention (mode Scroll + mode Wizard)

const { useState: useFormState, useEffect: useFormEffect } = React;

// ── Shared form state helper ──────────────────────────────────────────────────
function emptyForm(defaultSpecialite = 'Thoracique') {
  return {
    patientNom: '', patientPrenom: '', patientDDN: '',
    specialite: defaultSpecialite, types: [], chirurgien: '',
    date: new Date().toISOString().slice(0, 10),
    gestes: [], notes: '',
  };
}

// ── Récapitulatif (commun aux deux modes) ─────────────────────────────────────
function RecapView({ form, onEdit }) {
  const cfg = getSpecialiteConfig(form.specialite);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card padding={14}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Patient</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>
          {form.patientPrenom || '—'} {form.patientNom || '—'}
        </div>
        {form.patientDDN && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>DDN : {formatDate(form.patientDDN)}</div>}
      </Card>
      <Card padding={14}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Intervention</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Spécialité</span>
            <SpecBadge specialite={form.specialite} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Date</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(form.date)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Chirurgien</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{form.chirurgien || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Type(s)</span>
            <div style={{ textAlign: 'right' }}>
              {form.types.length ? form.types.map(t => <div key={t} style={{ fontSize: 13, fontWeight: 600 }}>{t}</div>) : <span style={{ fontSize: 13, color: 'var(--text-3)' }}>—</span>}
            </div>
          </div>
        </div>
      </Card>
      <Card padding={14}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
          Gestes ({form.gestes.length})
        </div>
        {form.gestes.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {form.gestes.map(g => (
              <span key={g} style={{ padding: '5px 11px', borderRadius: 'var(--r-pill)', background: cfg.colorMuted, color: cfg.color, fontSize: 13, fontWeight: 600 }}>{g}</span>
            ))}
          </div>
        ) : <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Aucun geste sélectionné</span>}
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MODE SCROLL
// ────────────────────────────────────────────────────────────────────────────
function NewInterventionScrollScreen({ navigate, onSwitchToWizard, defaultSpecialite }) {
  const [form, setForm] = useFormState(emptyForm(defaultSpecialite));
  const [saved, setSaved] = useFormState(false);

  const cfg = getSpecialiteConfig(form.specialite);
  const chirurgiens = cfg ? cfg.chirurgiens : [];
  const types = cfg ? cfg.types : [];

  function update(key, val) {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === 'specialite') { next.types = []; next.chirurgien = ''; next.gestes = []; }
      return next;
    });
  }

  function toggleType(t) {
    setForm(f => ({
      ...f,
      types: f.types.includes(t) ? f.types.filter(x => x !== t) : [...f.types, t],
    }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => { navigate('dashboard'); }, 1200);
  }

  if (saved) {
    return (
      <Screen>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(39,174,96,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={32} color="#27AE60" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Intervention enregistrée</div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center' }}>Retour au tableau de bord…</div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title="Nouvelle intervention"
        onBack={() => navigate('dashboard')}
        action={
          <button onClick={onSwitchToWizard} style={{ background: 'var(--surface-2)', border: 'none', cursor: 'pointer', borderRadius: 'var(--r-pill)', padding: '5px 11px', fontSize: 12, fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font)' }}>
            Mode étapes
          </button>
        }
      />

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <FormSection title="Patient">
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <Input label="Prénom" value={form.patientPrenom} onChange={v => update('patientPrenom', v)} placeholder="Marie" required />
            </div>
            <div style={{ flex: 1 }}>
              <Input label="Nom" value={form.patientNom} onChange={v => update('patientNom', v)} placeholder="DUPONT" required />
            </div>
          </div>
          <Input label="Date de naissance" type="date" value={form.patientDDN} onChange={v => update('patientDDN', v)} />
        </FormSection>

        <FormSection title="Intervention">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Spécialité *</div>
            <SpecToggle value={form.specialite} onChange={v => update('specialite', v)} />
          </div>
          <Input label="Date d'intervention" type="date" value={form.date} onChange={v => update('date', v)} required />
          <Select
            label="Chirurgien"
            value={form.chirurgien}
            onChange={v => update('chirurgien', v)}
            options={chirurgiens.map(c => ({ value: c.nom, label: c.nom }))}
            placeholder="Choisir un chirurgien"
            required
          />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Type(s) d'intervention</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {types.map(t => (
                <Chip key={t} label={t} selected={form.types.includes(t)} onToggle={() => toggleType(t)} color={cfg.color} colorLight={cfg.colorMuted} />
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection title="Gestes réalisés">
          <GestesGrid specialite={form.specialite} selected={form.gestes} onChange={v => update('gestes', v)} />
          {form.gestes.length > 0 && (
            <div style={{ fontSize: 12, color: cfg.color, fontWeight: 600 }}>
              {form.gestes.length} geste{form.gestes.length > 1 ? 's' : ''} sélectionné{form.gestes.length > 1 ? 's' : ''}
            </div>
          )}
        </FormSection>

        <FormSection title="Notes">
          <TextArea value={form.notes} onChange={v => update('notes', v)} placeholder="Remarques, contexte clinique…" rows={3} />
        </FormSection>

        <Btn variant="primary" fullWidth size="lg" onClick={handleSave}
          disabled={!form.patientNom || !form.patientPrenom || !form.chirurgien}>
          <Icon name="check" size={18} color="#fff" /> Enregistrer l'intervention
        </Btn>

        <div style={{ height: 30 }} />
      </div>
    </Screen>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MODE WIZARD (4 étapes)
// ────────────────────────────────────────────────────────────────────────────
function NewInterventionWizardScreen({ navigate, onSwitchToScroll, defaultSpecialite }) {
  const [step, setStep] = useFormState(0);
  const [form, setForm] = useFormState(emptyForm(defaultSpecialite));
  const [saved, setSaved] = useFormState(false);

  const STEPS = ['Patient', 'Intervention', 'Gestes', 'Récap'];
  const cfg = getSpecialiteConfig(form.specialite);
  const chirurgiens = cfg ? cfg.chirurgiens : [];
  const types = cfg ? cfg.types : [];

  function update(key, val) {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === 'specialite') { next.types = []; next.chirurgien = ''; next.gestes = []; }
      return next;
    });
  }

  function toggleType(t) {
    setForm(f => ({
      ...f,
      types: f.types.includes(t) ? f.types.filter(x => x !== t) : [...f.types, t],
    }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => navigate('dashboard'), 1200);
  }

  if (saved) {
    return (
      <Screen>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(39,174,96,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={32} color="#27AE60" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Intervention enregistrée !</div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title="Nouvelle intervention"
        subtitle={`Étape ${step + 1} sur ${STEPS.length} — ${STEPS[step]}`}
        onBack={step === 0 ? () => navigate('dashboard') : () => setStep(s => s - 1)}
        action={
          <button onClick={onSwitchToScroll} style={{ background: 'var(--surface-2)', border: 'none', cursor: 'pointer', borderRadius: 'var(--r-pill)', padding: '5px 11px', fontSize: 12, fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font)' }}>
            Mode scroll
          </button>
        }
      />

      {/* Progress bar */}
      <div style={{ padding: '0 16px 0', background: 'var(--surface)', paddingBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s ease' }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {STEPS.map((s, i) => (
            <span key={s} style={{ fontSize: 10, color: i === step ? 'var(--primary)' : i < step ? 'var(--text-3)' : 'var(--border)', fontWeight: i === step ? 700 : 400, flex: 1, textAlign: i === 0 ? 'left' : i === STEPS.length - 1 ? 'right' : 'center' }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px', flex: 1 }}>

        {/* Étape 1 — Patient */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Identité patient</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Input label="Prénom" value={form.patientPrenom} onChange={v => update('patientPrenom', v)} placeholder="Marie" required />
              </div>
              <div style={{ flex: 1 }}>
                <Input label="Nom" value={form.patientNom} onChange={v => update('patientNom', v)} placeholder="DUPONT" required />
              </div>
            </div>
            <Input label="Date de naissance" type="date" value={form.patientDDN} onChange={v => update('patientDDN', v)} />
          </div>
        )}

        {/* Étape 2 — Intervention */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Détails de l'intervention</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Spécialité *</div>
              <SpecToggle value={form.specialite} onChange={v => update('specialite', v)} />
            </div>
            <Input label="Date" type="date" value={form.date} onChange={v => update('date', v)} required />
            <Select label="Chirurgien" value={form.chirurgien} onChange={v => update('chirurgien', v)}
              options={chirurgiens.map(c => ({ value: c.nom, label: c.nom }))}
              placeholder="Choisir un chirurgien" required />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Type(s) d'intervention</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {types.map(t => (
                  <Chip key={t} label={t} selected={form.types.includes(t)} onToggle={() => toggleType(t)} color={cfg.color} colorLight={cfg.colorMuted} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Étape 3 — Gestes */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>Gestes réalisés</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>Sélectionnez tous les gestes effectués.</div>
            </div>
            <GestesGrid specialite={form.specialite} selected={form.gestes} onChange={v => update('gestes', v)} />
            {form.gestes.length > 0 && (
              <div style={{ padding: '10px 14px', background: cfg.colorMuted, borderRadius: 'var(--r-md)', fontSize: 13, color: cfg.color, fontWeight: 600 }}>
                ✓ {form.gestes.length} geste{form.gestes.length > 1 ? 's' : ''} sélectionné{form.gestes.length > 1 ? 's' : ''} : {form.gestes.join(', ')}
              </div>
            )}
            <TextArea label="Notes (optionnel)" value={form.notes} onChange={v => update('notes', v)} placeholder="Contexte clinique, remarques…" rows={3} />
          </div>
        )}

        {/* Étape 4 — Récap */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Vérification</div>
            <RecapView form={form} />
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div style={{ padding: '12px 16px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        {step < STEPS.length - 1 ? (
          <Btn variant="primary" fullWidth size="lg"
            onClick={() => setStep(s => s + 1)}
            disabled={step === 0 && (!form.patientNom || !form.patientPrenom)}>
            Continuer <Icon name="chevron" size={16} color="#fff" />
          </Btn>
        ) : (
          <Btn variant="primary" fullWidth size="lg" onClick={handleSave}
            disabled={!form.patientNom || !form.chirurgien}>
            <Icon name="check" size={18} color="#fff" /> Enregistrer
          </Btn>
        )}
      </div>
    </Screen>
  );
}

Object.assign(window, { NewInterventionScrollScreen, NewInterventionWizardScreen, RecapView });
