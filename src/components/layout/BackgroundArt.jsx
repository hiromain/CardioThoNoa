// Planche anatomique réaliste et détaillée de l'organe lié à la spécialité.
// Affichée en fond de page (derrière les éléments en glassmorphism) pour donner
// au flou un peu de matière. Light mode uniquement (cf AppLayout).
// Style : Gravure médicale détaillée (silhouette + structure interne complexe).
// Plusieurs calques d'opacité et dégradés subtils pour suggérer le volume chirurgical.

const ART = {
  cardiaque: {
    color: '#A93226', // Rouge légèrement plus profond pour le réalisme
    content: (
      <>
        <defs>
          {/* Dégradé pour le volume du myocarde */}
          <radialGradient id="gradCœurVolume" cx="50%" cy="40%" r="60%" fx="50%" fy="30%">
            <stop offset="0%" stopColor="#A93226" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#A93226" stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* --- VOLUME ET MASSE (MYOCARDE) --- */}
        {/* Ventricules et Oreillettes (Silhouette complexe détaillée) */}
        <path
          d="M120 220 C60 180 20 130 20 85 C20 50 45 25 75 25 C90 25 105 32 115 45 C118 35 125 25 140 25 C170 25 195 50 195 85 C195 110 185 135 170 155 L120 220 Z"
          fill="url(#gradCœurVolume)"
          stroke="none"
        />

        {/* --- STRUCTURES VASCULAIRES MAJEURES --- */}
        <g strokeLinecap="round" strokeWidth="2.8">
          {/* Crosse Aortique détaillée et ses 3 troncs supra-aortiques */}
          <path d="M105 55 C105 30 130 15 155 25 C165 30 172 38 175 48" fill="none" />
          <path d="M130 18 L126 31" fill="none" strokeWidth="2.2" /> {/* Tronc brachiocéphalique */}
          <path d="M148 18 L146 30" fill="none" strokeWidth="2.2" /> {/* Carotide commune G */}
          <path d="M165 24 L161 36" fill="none" strokeWidth="2.2" /> {/* Subclavière G */}

          {/* Tronc Pulmonaire et sa bifurcation */}
          <path d="M140 60 C140 45 155 35 170 40 M170 40 L185 35 M170 40 L180 50" fill="none" strokeOpacity="0.8" />

          {/* Veine Cave Supérieure */}
          <path d="M95 25 L95 55 M85 35 L105 35" fill="none" strokeOpacity="0.8" />
          {/* Veine Cave Inférieure */}
          <path d="M100 180 L100 210" fill="none" strokeOpacity="0.7" />
        </g>

        {/* --- DÉTAILS DE SURFACE ET INTERNES --- */}
        <g fill="none" strokeLinecap="round">
          {/* Sillon interventriculaire (Septum vu de surface) */}
          <path d="M115 65 C105 105 100 155 115 205" strokeWidth="2" strokeOpacity="0.5" strokeDasharray="2 8" />

          {/* RÉSEAU CORONAIRE DENSE (Artères et Veines) - Crucial pour chirurgiens */}
          <g strokeWidth="1.2" strokeOpacity="0.65">
            {/* Coronaire Gauche (Interventriculaire antérieure et Circonflexe) */}
            <path d="M142 62 C155 85 170 120 160 160 C155 180 140 195 125 210" />
            <path d="M150 75 L180 85 M157 95 L182 105 M160 115 L178 125" strokeWidth="1" />
            <path d="M152 65 C165 68 185 75 190 90" strokeDasharray="3 6" /> {/* Circonflexe (postérieure) */}

            {/* Coronaire Droite (et marginales) */}
            <path d="M100 60 C90 80 80 110 85 150 C88 175 100 195 115 210" />
            <path d="M92 75 L70 85 M87 98 L65 110 M85 125 L68 140" strokeWidth="1" />
          </g>
        </g>
      </>
    ),
  },
  thoracique: {
    color: '#1F618D', // Bleu plus profond
    content: (
      <>
        <defs>
          {/* Dégradé radial pour la texture spongieuse des lobes */}
          <radialGradient id="gradPoumonTexture" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1F618D" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#1F618D" stopOpacity="0.5" />
          </radialGradient>
        </defs>

        {/* --- SILHOUETTES LOBFAIRES DÉTAILLÉES (3 à droite, 2 à gauche) --- */}
        <g stroke="none" fill="url(#gradPoumonTexture)">
          {/* Poumon Gauche (2 lobes distincts + Lingula) */}
          <path d="M100 90 C50 100 20 150 25 200 C30 240 65 245 90 225 C115 205 120 170 120 130 C120 110 115 95 100 90 Z" />
          {/* Poumon Droit (3 lobes distincts : Supérieur, Moyen, Inférieur) */}
          <path d="M140 90 C190 100 220 150 215 200 C210 240 175 245 150 225 C125 205 120 170 120 130 C120 110 125 95 140 90 Z" />
        </g>

        {/* --- ARBRE TRACHÉO-BRONCHIQUE DENSE --- */}
        <g fill="none" strokeLinecap="round">
          {/* Trachée avec anneaux cartilagineux détaillés */}
          <path d="M120 5 L120 100" strokeWidth="4" />
          <g strokeWidth="1.5" strokeOpacity="0.7">
            {Array.from({ length: 7 }).map((_, i) => (
              <path key={i} d={`M112 ${15 + i * 12} L128 ${15 + i * 12}`} />
            ))}
          </g>

          {/* Carène et Bronches Souches */}
          <path d="M120 100 C120 115 90 120 75 135 M120 100 C120 115 150 120 165 135" strokeWidth="3" />

          {/* Arborisation Bronchique Segmentaire et Sous-segmentaire (Haute densité) */}
          <g strokeWidth="1.2" strokeOpacity="0.8">
            {/* Gauche (Lobe Supérieur et Inférieur) */}
            <path d="M75 135 C60 145 50 160 45 180 M75 135 C70 155 70 175 80 195" /> {/* Segmentaires */}
            <path d="M45 180 L35 195 M45 180 L50 190 M80 195 L75 210 M80 195 L88 205" strokeWidth="0.8" strokeOpacity="0.6" /> {/* Sous-seg */}
            <path d="M68 142 L55 150 M62 150 L52 162" strokeWidth="1" /> {/* Vers Lobe Supérieur */}

            {/* Droite (Lobe Sup, Moyen, Inf) */}
            <path d="M165 135 C180 145 190 160 195 180 M165 135 C170 155 170 175 160 195" /> {/* Segmentaires */}
            <path d="M195 180 L205 195 M195 180 L190 190 M160 195 L165 210 M160 195 L152 205" strokeWidth="0.8" strokeOpacity="0.6" /> {/* Sous-seg */}
            <path d="M172 142 L185 150 M178 150 L188 162" strokeWidth="1" /> {/* Vers Lobe Supérieur */}
            <path d="M175 165 L190 172" strokeWidth="1" /> {/* Vers Lobe Moyen */}
          </g>
        </g>

        {/* --- SCISSURES LOBAIRES ET DIAPHRAGME --- */}
        <g fill="none" strokeWidth="1.8" strokeOpacity="0.6" strokeLinecap="round">
          {/* Scissure oblique gauche */}
          <path d="M45 160 C65 170 85 185 105 215" />
          {/* Scissures droite (horizontale et oblique) */}
          <path d="M195 160 C175 170 155 185 135 215" />
          <path d="M175 168 L205 155" />

          {/* Coupole diaphragmatique réaliste */}
          <path d="M20 220 C60 250 180 250 220 220" strokeWidth="2.5" strokeOpacity="0.4" />
        </g>

        {/* --- VASCULARISATION PULMONAIRE (Schématique entremêlée) --- */}
        <g fill="none" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="1 4">
          <path d="M110 110 C80 120 60 150 60 180" />
          <path d="M130 110 C160 120 180 150 180 180" />
        </g>
      </>
    ),
  },
  autre: {
    // Le stéthoscope reste inchangé, car il est symbolique par nature
    color: '#6C3483',
    content: (
      <>
        {/* Tubulure du stéthoscope */}
        <path
          d="M58 14 C58 50 58 78 58 92 C58 124 84 148 118 148 C152 148 178 124 178 92 L178 56"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M118 148 L118 168"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Embouts auriculaires */}
        <circle cx="58" cy="10" r="9" fill="none" strokeWidth="2.5" />
        <path d="M58 19 C46 24 40 34 44 46" fill="none" strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" />
        {/* Olive */}
        <circle cx="178" cy="48" r="9" fill="none" strokeWidth="2.5" />
        {/* Pavillon */}
        <circle cx="118" cy="190" r="26" fill="none" strokeWidth="2.5" />
        <circle cx="118" cy="190" r="14" fillOpacity="0.45" stroke="none" />
        {/* Ligne ECG traversant la composition */}
        <path
          d="M10 230 L70 230 L82 200 L98 250 L112 218 L126 230 L230 230"
          fill="none"
          strokeWidth="2"
          strokeOpacity="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Croix médicale */}
        <path d="M196 96 L196 128 M180 112 L212 112" fill="none" strokeWidth="3" strokeOpacity="0.6" strokeLinecap="round" />
      </>
    ),
  },
};

export function BackgroundArt({ type = 'autre' }) {
  const art = ART[type] || ART.autre;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Écho principal en haut à droite - Agrandi significativement (w/h-96 -> w/h-[600px]) */}
      <svg
        viewBox="0 0 240 240"
        className="absolute -top-20 -right-24 w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] md:w-[800px] md:h-[800px]"
        style={{
          stroke: art.color,
          strokeWidth: 2, // Légèrement affiné pour le détail
          opacity: 0.1, // Maintenu très faible pour la discrétion
          transform: 'rotate(-8deg)',
        }}
      >
        {art.content}
      </svg>

      {/* Écho discret en bas à gauche - Agrandi également (w/h-64 -> w/h-[400px]) */}
      <svg
        viewBox="0 0 240 240"
        className="absolute -bottom-32 -left-40 w-[350px] h-[350px] sm:w-[450px] sm:h-[450px]"
        style={{
          stroke: art.color,
          strokeWidth: 2,
          opacity: 0.05, // Encore plus discret en bas
          transform: 'rotate(160deg)',
        }}
      >
        {art.content}
      </svg>
    </div>
  );
}