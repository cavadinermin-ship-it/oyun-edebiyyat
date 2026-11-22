import type { CSSProperties } from "react";
import { ERAS } from "../data/constants";
import { Sound } from "../utils/sound";

interface LiteraryMapProps {
  interactive?: boolean;
  compact?: boolean;
  selected: Record<string, boolean>;
  current?: number;
  onToggleEra?: (eraKey: string) => void;
}

export function LiteraryMap({
  interactive = false,
  compact = false,
  selected,
  current = -1,
  onToggleEra,
}: LiteraryMapProps) {
  const pct = current < 0 ? 0 : (current / (ERAS.length - 1)) * 100;

  return (
    <div className="overflow-x-auto pb-1">
      <div className={`map ${compact ? "compact" : ""}`}>
        <div className="road">
          <div
            className="road-fill"
            style={
              {
                width: `${pct}%`,
                "--fillpct": Math.max(pct, 1),
              } as CSSProperties
            }
          />
        </div>
        <div className="grid grid-cols-5 relative">
          {ERAS.map((e, i) => {
            const on = Boolean(selected[e.key]);
            const st = i < current ? " passed" : i === current ? " current" : "";
            const cls = `station ${on ? "on" : "off opacity-45"}${st} flex flex-col items-center bg-transparent border-0 px-1 text-center text-white`;
            const style = { "--c": e.color } as CSSProperties;

            const inner = (
              <>
                {!compact && (
                  <div className="h-[118px] flex flex-col justify-end items-center gap-1 pb-2">
                    {e.names.map((n) => (
                      <span
                        key={n}
                        className="text-[13px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border"
                        style={{
                          background: on
                            ? `color-mix(in srgb, ${e.color} 30%, transparent)`
                            : "rgba(255,255,255,0.1)",
                          borderColor: on ? e.color : "rgba(255,255,255,0.18)",
                        }}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                )}
                <div className="st-dot">{i < current && on ? "✓" : i + 1}</div>
                <div
                  className={`font-extrabold leading-tight ${
                    compact ? "text-xs mt-1" : "text-[15px] mt-2"
                  }`}
                >
                  {e.short}
                </div>
                {interactive && (
                  <div
                    className={`mt-1 text-xs ${
                      on ? "text-white font-semibold" : "text-[#c9d1ff]"
                    }`}
                  >
                    {on ? "✔ seçilib" : "seçilməyib"}
                  </div>
                )}
              </>
            );

            return interactive ? (
              <button
                key={e.key}
                type="button"
                className={cls}
                style={style}
                title="Seçmək üçün toxunun"
                onClick={() => {
                  Sound.click();
                  onToggleEra?.(e.key);
                }}
              >
                {inner}
              </button>
            ) : (
              <div key={e.key} className={cls} style={style}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
