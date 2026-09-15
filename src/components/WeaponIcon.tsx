import type { WeaponKind } from '../game/loadouts';
export function WeaponIcon({ kind, color }: { kind: WeaponKind; color: string }) {
  return (
    <svg
      className="weapon-icon"
      viewBox="0 0 40 40"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === 'bow' ? (
        <>
          <path d="M12 4Q38 20 12 36L12 4M5 20H34M28 15L34 20L28 25" />
          <path d="M7 16L11 20L7 24" />
        </>
      ) : kind === 'axe' ? (
        <>
          <path d="M10 35L28 5M20 13L27 4Q40 12 31 20L20 13" fill={color + '44'} />
        </>
      ) : kind === 'hammer' ? (
        <>
          <path d="M11 35L25 13" />
          <path d="M15 7L21 1L37 12L32 20Z" fill={color + '55'} />
        </>
      ) : kind === 'boomerang' ? (
        <path d="M7 31L14 7L33 14L30 19L19 17L12 34Z" fill={color + '44'} />
      ) : kind === 'fan' ? (
        <>
          <path d="M20 34L3 13Q20 -4 37 13L20 34ZM20 34L13 8M20 34V6M20 34L27 8" />
        </>
      ) : kind === 'glaive' ? (
        <>
          <path d="M8 35L31 4M21 15Q38 16 33 1L21 15M19 24Q2 22 7 38L19 24" />
        </>
      ) : kind === 'crossbow' ? (
        <>
          <path d="M10 33L31 8M9 8Q28 4 33 28M9 8L22 19L33 28M27 5L34 4L34 12" />
          <path d="M11 23L19 29" />
        </>
      ) : kind === 'scatter' ? (
        <>
          <path d="M6 31L11 20L24 12L34 8L38 20L26 22L16 26L14 35Z" fill={color + '44'} />
        </>
      ) : kind === 'comet' ? (
        <>
          <path d="M9 35L27 12" />
          <circle cx="28" cy="10" r="7" />
          <path d="M27 1V4M37 9H39M19 9H17" />
        </>
      ) : kind === 'daggers' ? (
        <>
          <path d="M5 34L21 11L18 23L5 34M18 35L35 6L31 25L18 35M8 27L15 31" />
        </>
      ) : (
        <>
          <path d="M7 35L33 5L29 18L17 27M11 23L21 31" />
          {kind === 'spear' && <path d="M29 4L36 2L35 13L29 4" />}
        </>
      )}
    </svg>
  );
}
