interface TimerRingProps {
  visible: boolean;
  left: number;
  total: number;
  paused: boolean;
  onTogglePause: () => void;
}

export function TimerRing({
  visible,
  left,
  total,
  paused,
  onTogglePause,
}: TimerRingProps) {
  if (!visible) return null;

  const pct = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  const strokeColor = pct > 0.5 ? "#3DDC97" : pct > 0.25 ? "#FFC93C" : "#FF4D6A";
  const low = !paused && left <= 5 && left > 0;

  return (
    <button
      type="button"
      onClick={onTogglePause}
      title="Boşluq — dayandır / davam et"
      aria-label={paused ? "Taymeri davam etdir" : "Taymeri dayandır"}
      className="relative w-[76px] h-[76px] flex-none bg-transparent border-0 p-0 cursor-pointer"
    >
      <svg width="76" height="76" className="-rotate-90">
        <circle
          cx="38"
          cy="38"
          r="31"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="38"
          cy="38"
          r="31"
          stroke={strokeColor}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="194.8"
          strokeDashoffset={194.8 * (1 - pct)}
        />
      </svg>
      <span
        className={`absolute inset-0 grid place-items-center font-black tabular-nums ${
          paused ? "text-[13px]" : "text-[26px]"
        } ${low ? "text-[#FF6B81] animate-shake" : "text-white"}`}
      >
        {paused ? "PAUZA" : Math.ceil(left)}
      </span>
    </button>
  );
}
