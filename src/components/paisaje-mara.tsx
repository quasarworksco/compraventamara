/**
 * Paisaje de San Rafael del Moján para la portada.
 *
 * Es un dibujo vectorial hecho a mano, no una fotografía: pesa unos pocos
 * kilobytes, se ve nítido en cualquier pantalla y no depende de que alguien
 * ceda una imagen del pueblo. Retrata lo que se ve desde el malecón: el sol
 * sobre el Golfo de Venezuela, los peñeros, las palmas y el campanario.
 *
 * El movimiento es lento y de poca amplitud a propósito. Una portada que se
 * agita cansa; esta solo respira. Todo se detiene con prefers-reduced-motion.
 */
export function PaisajeMara({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 150"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* El mar aclara hacia el horizonte y se apaga hacia la orilla: es lo
            que separa el agua del cielo, que aquí son del mismo azul. */}
        <linearGradient id="pm-mar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ba4e0" stopOpacity="0.62" />
          <stop offset="22%" stopColor="#2b62b8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#050f22" stopOpacity="0.88" />
        </linearGradient>

        {/* Resplandor bajo sobre el horizonte, para que las siluetas recorten. */}
        <linearGradient id="pm-horizonte" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9dd9b8" stopOpacity="0" />
          <stop offset="75%" stopColor="#9dd9b8" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#cdeddb" stopOpacity="0.42" />
        </linearGradient>

        <radialGradient id="pm-sol" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#cdeddb" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#63bf90" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="pm-tierra" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#143c80" />
          <stop offset="100%" stopColor="#0a1f42" />
        </linearGradient>

        {/* El reflejo del sol se recorta contra el agua. */}
        <clipPath id="pm-agua">
          <rect x="0" y="90" width="400" height="60" />
        </clipPath>
      </defs>

      {/* Luz del horizonte: el fondo contra el que se recorta el pueblo. */}
      <rect x="0" y="44" width="400" height="48" fill="url(#pm-horizonte)" />

      {/* Sol y su halo */}
      <g className="pm-sol">
        <circle cx="308" cy="58" r="46" fill="url(#pm-sol)" />
        <circle cx="308" cy="58" r="13" fill="#eaf7ef" opacity="0.92" />
      </g>

      {/* Costa al fondo */}
      <path
        d="M0 92 L38 84 L74 89 L104 78 L140 88 L176 82 L214 90 L252 83 L296 90 L336 85 L400 91 L400 150 L0 150 Z"
        fill="url(#pm-tierra)"
        opacity="0.92"
      />

      {/* Campanario y casas del pueblo */}
      <g fill="#04101f" opacity="0.96">
        <rect x="128" y="66" width="13" height="26" rx="1.5" />
        <path d="M128 66 L134.5 56 L141 66 Z" />
        <rect x="132.5" y="50" width="2" height="7" rx="1" />
        <rect x="131" y="52.5" width="5" height="2" rx="1" />
        <rect x="112" y="76" width="15" height="16" rx="1.5" />
        <path d="M110 76 L119.5 69 L129 76 Z" />
        <rect x="142" y="79" width="18" height="13" rx="1.5" />
        <path d="M140 79 L151 72 L162 79 Z" />
        <rect x="164" y="82" width="12" height="10" rx="1.5" />
      </g>

      {/* Palmas */}
      <g stroke="#04101f" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.96">
        <g className="pm-palma">
          <path d="M52 92 Q50 80 53 70" />
          <path d="M53 70 Q44 65 38 68" />
          <path d="M53 70 Q45 62 46 55" />
          <path d="M53 70 Q62 64 68 67" />
          <path d="M53 70 Q60 61 60 54" />
        </g>
        <g className="pm-palma pm-palma-2">
          <path d="M358 92 Q360 82 357 74" />
          <path d="M357 74 Q349 69 344 71" />
          <path d="M357 74 Q351 66 352 60" />
          <path d="M357 74 Q365 69 370 71" />
        </g>
      </g>

      {/* Mar, con la línea del horizonte marcada. */}
      <rect x="0" y="90" width="400" height="60" fill="url(#pm-mar)" />
      <rect x="0" y="90" width="400" height="1" fill="#cdeddb" opacity="0.38" />

      {/* Reflejo del sol sobre el agua */}
      <g clipPath="url(#pm-agua)" opacity="0.72">
        <ellipse cx="308" cy="97" rx="28" ry="2.6" fill="#eaf7ef" />
        <ellipse cx="308" cy="106" rx="19" ry="2.1" fill="#cdeddb" opacity="0.75" />
        <ellipse cx="308" cy="116" rx="12" ry="1.7" fill="#cdeddb" opacity="0.55" />
        <ellipse cx="308" cy="126" rx="7" ry="1.4" fill="#cdeddb" opacity="0.4" />
      </g>

      {/* Tres bandas de oleaje que se desplazan a distinta velocidad.
          Cada onda se dibuja dos veces seguidas para que el ciclo no corte. */}
      <g clipPath="url(#pm-agua)" fill="none" strokeLinecap="round">
        <g className="pm-ola pm-ola-1" stroke="#9dd9b8" strokeWidth="1.6" opacity="0.5">
          <path d="M0 107 q20 -5 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" />
        </g>
        <g className="pm-ola pm-ola-2" stroke="#adc6ed" strokeWidth="1.4" opacity="0.42">
          <path d="M0 120 q26 -6 52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0" />
        </g>
        <g className="pm-ola pm-ola-3" stroke="#d5e3f6" strokeWidth="1.2" opacity="0.3">
          <path d="M0 134 q32 -7 64 0 t64 0 t64 0 t64 0 t64 0 t64 0 t64 0" />
        </g>
      </g>

      {/* Peñeros */}
      <g className="pm-barca">
        <path d="M196 112 h30 l-5 7 h-20 z" fill="#04101f" opacity="0.95" />
        <path d="M210 112 v-14 l10 10 z" fill="#eaf7ef" opacity="0.95" />
        <path d="M209 112 v-14" stroke="#eaf7ef" strokeWidth="1.4" opacity="0.95" />
      </g>
      <g className="pm-barca pm-barca-2">
        <path d="M96 126 h20 l-3.5 5 h-13 z" fill="#04101f" opacity="0.8" />
        <path d="M105 126 v-10 l7 7 z" fill="#cdeddb" opacity="0.75" />
      </g>
    </svg>
  );
}
