import { motion } from "framer-motion";

interface ClimateTwinProps {
  trend: "rising" | "stable" | "falling" | "loading";
  scoreLabel?: string;
}

/**
 * The Climate Twin — CarbonIQ's signature visual element.
 * A layered glass orb built from concentric arcs, not a mascot.
 * Color and pulse speed encode trend: green/slow = improving,
 * terracotta/fast = rising footprint, neutral = stable.
 */
export function ClimateTwin({ trend, scoreLabel }: ClimateTwinProps) {
  const palette = {
    rising: { core: "#E0563F", ring: "#F0A593", glow: "rgba(224,86,63,0.18)" },
    falling: { core: "#1D9E75", ring: "#8FCBB0", glow: "rgba(29,158,117,0.18)" },
    stable: { core: "#3C6FB7", ring: "#9BBBE0", glow: "rgba(60,111,183,0.16)" },
    loading: { core: "#9CA89E", ring: "#D6DCD3", glow: "rgba(156,168,158,0.14)" },
  }[trend];

  const pulseDuration = trend === "rising" ? 2.2 : trend === "falling" ? 4.5 : 3.5;

  return (
    <div className="relative flex items-center justify-center w-56 h-56 mx-auto">
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: palette.glow }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg viewBox="0 0 200 200" className="relative w-full h-full" role="img" aria-label={`Climate twin, trend ${trend}`}>
        <defs>
          <radialGradient id="twinCore" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="40%" stopColor={palette.core} stopOpacity="0.85" />
            <stop offset="100%" stopColor={palette.core} stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Outer arcs — concentric, slightly offset, like orbit rings */}
        {[88, 76, 64].map((r, i) => (
          <motion.circle
            key={r}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke={palette.ring}
            strokeWidth="1"
            strokeDasharray={i === 0 ? "4 10" : i === 1 ? "1 6" : "none"}
            opacity={0.5 - i * 0.1}
            animate={{ rotate: 360 }}
            transition={{ duration: 40 + i * 15, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "100px 100px" }}
          />
        ))}

        {/* Core orb */}
        <motion.circle
          cx="100"
          cy="100"
          r="52"
          fill="url(#twinCore)"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "100px 100px" }}
        />
      </svg>

      {scoreLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-sm font-medium text-white drop-shadow-sm">{scoreLabel}</span>
        </div>
      )}
    </div>
  );
}
