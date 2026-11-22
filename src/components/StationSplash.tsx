import { useEffect, useRef, type CSSProperties } from "react";
import { ERAS, ERA_GALLERY } from "../data/constants";
import { IllustrationSvg } from "./Illustrations";
import { LiteraryMap } from "./LiteraryMap";

interface StationSplashProps {
  eraIdx: number;
  isFirst: boolean;
  selectedEras: Record<string, boolean>;
  onContinue: () => void;
}

export function StationSplash({
  eraIdx,
  isFirst,
  selectedEras,
  onContinue,
}: StationSplashProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const era = ERAS[eraIdx];
  const gallery = ERA_GALLERY[eraIdx] || [];

  useEffect(() => {
    const t = setTimeout(() => {
      btnRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, []);

  if (!era) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 overflow-y-auto"
      style={
        {
          "--c": era.color,
          background: `radial-gradient(circle at 50% 40%, color-mix(in srgb, ${era.color} 55%, #0b1033), #0b1033 75%)`,
        } as CSSProperties
      }
    >
      <div className="text-center max-w-[1100px] w-full animate-zoomIn my-auto py-4">
        <div className="text-xl tracking-[4px] uppercase text-white/85 font-extrabold">
          {isFirst ? "Yola çıxırıq · " : "Yeni stansiya · "}
          {eraIdx + 1}-ci stansiya
        </div>
        <h2 className="font-serif-literary text-[clamp(36px,6.5vw,82px)] mt-1.5 mb-3 font-bold leading-[1.06] drop-shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
          {era.key}
        </h2>

        <div className="flex flex-wrap justify-center gap-4 mt-2 mb-5">
          {gallery.map(([id, cap], i) => (
            <figure
              key={id}
              style={{ animationDelay: `${i * 0.08}s` }}
              className={`animate-popIn m-0 text-center ${
                gallery.length > 3
                  ? "w-[clamp(120px,12vw,165px)]"
                  : "w-[clamp(150px,17vw,230px)]"
              }`}
            >
              <IllustrationSvg illId={id} />
              <figcaption className="text-sm font-bold mt-2 text-[#e6e9ff] leading-tight">
                {cap}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 mt-2.5 mb-6">
          {era.names.map((n) => (
            <span
              key={n}
              className="text-lg sm:text-[22px] font-extrabold px-4.5 py-2 rounded-full bg-white/18 border-2 border-white/40"
            >
              {n}
            </span>
          ))}
        </div>

        <div className="mx-auto mb-7 max-w-[1000px]">
          <LiteraryMap compact selected={selectedEras} current={eraIdx} />
        </div>

        <button
          ref={btnRef}
          type="button"
          onClick={onContinue}
          className="border-0 rounded-[20px] px-9 py-4.5 text-2xl font-black text-[#2a1600] bg-gradient-to-br from-[#FFE066] via-[#FFB020] to-[#FF7A00] shadow-[0_10px_30px_rgba(255,140,0,0.45),inset_0_-4px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-px transition-transform"
        >
          Yola davam ➜
        </button>
      </div>
    </div>
  );
}
