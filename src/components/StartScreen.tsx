import { ERAS, HERO_CARDS, TEAM_COLORS } from "../data/constants";
import type { DifficultyFilter, Direction, Question, SetupState } from "../types/game";
import { poolFor } from "../utils/helpers";
import { Sound } from "../utils/sound";
import { IllustrationRibbon } from "./Illustrations";
import { LiteraryMap } from "./LiteraryMap";

interface StartScreenProps {
  setup: SetupState;
  bank: Question[];
  disabled: Record<string, boolean>;
  onChangeSetup: (updater: (prev: SetupState) => SetupState) => void;
  onStart: () => void;
}

export function StartScreen({
  setup,
  bank,
  disabled,
  onChangeSetup,
  onStart,
}: StartScreenProps) {
  const poolCount = poolFor(bank, disabled, setup).length;
  const anyEra = ERAS.some((e) => setup.eras[e.key]);

  const dirs: [Direction, string][] = [
    ["Əsərlər", "📖 Əsərlər"],
    ["Sənətkarlar", "✒ Sənətkarlar"],
    ["Qarışıq", "✦ Qarışıq"],
  ];

  const diffs: [DifficultyFilter, string][] = [
    ["asan", "Asan"],
    ["orta", "Orta"],
    ["cetin", "Çətin"],
    ["qarisiq", "Qarışıq"],
  ];

  const counts: (10 | 20 | 30)[] = [10, 20, 30];

  return (
    <section className="animate-fadeIn">
      <div className="text-center px-2.5 pt-4 pb-2">
        <h1 className="font-serif-literary m-0 text-[clamp(36px,5.8vw,72px)] leading-[1.06] font-bold tracking-tight bg-gradient-to-r from-[#FFB547] via-[#FF6B8B] via-[#B18CFF] via-[#4FD1FF] to-[#3DDC97] bg-clip-text text-transparent drop-shadow-[0_4px_18px_rgba(0,0,0,0.25)]">
          Söz sənətimizin izi ilə
        </h1>
        <p className="mt-2.5 mb-0 text-[#c9d1ff] text-[clamp(17px,2vw,22px)]">
          X sinif ədəbiyyatı üzrə interaktiv yarış: «Dədə Qorqud»dan «Müsibəti-Fəxrəddin»ə qədər
        </p>
        <div className="text-[13px] opacity-75 mt-1.5">
          Mənbə: «Ədəbiyyat – 10» (S.Əliyev, B.Həsənov, A.Mustafayeva)
        </div>
        <IllustrationRibbon items={HERO_CARDS} className="mt-5 mb-1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4.5 mt-5">
        {/* 1. Rejim */}
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-[22px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] min-w-0">
          <h3 className="m-0 mb-3 text-base font-bold uppercase tracking-[1.2px] text-[#c9d1ff] flex items-center gap-2">
            <span className="w-6.5 h-6.5 rounded-lg grid place-items-center text-sm text-white bg-[var(--e1)]">
              1
            </span>
            Rejim
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                Sound.click();
                onChangeSetup((p) => ({ ...p, mode: "team" }));
              }}
              className={`border-2 rounded-[18px] p-4 text-left transition-colors ${
                setup.mode === "team"
                  ? "bg-gradient-to-br from-[#ff8a00]/35 to-[#ff4d7e]/35 border-[#FF9A5B]"
                  : "border-[var(--line)] bg-white/5 hover:bg-white/10"
              }`}
            >
              <span className="text-[30px] block mb-1.5">👥</span>
              <b className="block text-[21px]">Komanda yarışı</b>
              <small className="text-[#c9d1ff] text-sm">2–4 komanda, sinifdə lövhədə</small>
            </button>

            <button
              type="button"
              onClick={() => {
                Sound.click();
                onChangeSetup((p) => ({ ...p, mode: "solo" }));
              }}
              className={`border-2 rounded-[18px] p-4 text-left transition-colors ${
                setup.mode === "solo"
                  ? "bg-gradient-to-br from-[#ff8a00]/35 to-[#ff4d7e]/35 border-[#FF9A5B]"
                  : "border-[var(--line)] bg-white/5 hover:bg-white/10"
              }`}
            >
              <span className="text-[30px] block mb-1.5">🎯</span>
              <b className="block text-[21px]">Fərdi məşq</b>
              <small className="text-[#c9d1ff] text-sm">Evdə telefon və ya kompüterdə</small>
            </button>
          </div>

          {setup.mode === "team" ? (
            <div className="mt-3.5 grid gap-2.5">
              {setup.teams.map((name, i) => (
                <div key={i} className="flex gap-2.5 items-center">
                  <span
                    className="w-4.5 h-4.5 rounded-full flex-none shadow-[0_0_0_3px_rgba(255,255,255,0.15)]"
                    style={{ background: TEAM_COLORS[i] }}
                  />
                  <input
                    value={name}
                    maxLength={28}
                    aria-label="Komandanın adı"
                    onChange={(e) => {
                      const val = e.target.value;
                      onChangeSetup((p) => {
                        const teams = p.teams.slice();
                        teams[i] = val;
                        return { ...p, teams };
                      });
                    }}
                    className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-black/25 text-white text-lg"
                  />
                  {setup.teams.length > 2 && (
                    <button
                      type="button"
                      title="Komandanı sil"
                      onClick={() =>
                        onChangeSetup((p) => ({
                          ...p,
                          teams: p.teams.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--panel2)] rounded-xl px-3.5 py-2.5 font-bold text-base"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {setup.teams.length < 4 && (
                <button
                  type="button"
                  onClick={() =>
                    onChangeSetup((p) => ({
                      ...p,
                      teams: [...p.teams, `${p.teams.length + 1}-ci komanda`],
                    }))
                  }
                  className="border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--panel2)] rounded-xl px-3.5 py-2.5 font-bold text-base text-left"
                >
                  ＋ Komanda əlavə et
                </button>
              )}
            </div>
          ) : (
            <div className="mt-3.5 flex gap-2.5">
              <input
                value={setup.solo}
                maxLength={30}
                placeholder="Adınız (diplom üçün)"
                onChange={(e) =>
                  onChangeSetup((p) => ({ ...p, solo: e.target.value }))
                }
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-black/25 text-white text-lg"
              />
            </div>
          )}
        </div>

        {/* 2, 3, 4 */}
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-[22px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] min-w-0">
          <h3 className="m-0 mb-3 text-base font-bold uppercase tracking-[1.2px] text-[#c9d1ff] flex items-center gap-2">
            <span className="w-6.5 h-6.5 rounded-lg grid place-items-center text-sm text-white bg-[var(--e2)]">
              2
            </span>
            İstiqamət
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {dirs.map(([v, label]) => {
              const sel = setup.dir === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    Sound.click();
                    onChangeSetup((p) => ({ ...p, dir: v }));
                  }}
                  className={`border-2 px-4.5 py-2.5 rounded-2xl text-lg font-bold transition-all whitespace-nowrap ${
                    sel
                      ? "border-transparent bg-gradient-to-br from-[#10C98F] to-[#0E9F8A] shadow-[0_6px_18px_rgba(0,0,0,0.25)] text-white"
                      : "border-[var(--line)] bg-white/5 hover:bg-white/12 text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <h3 className="m-0 mt-5 mb-3 text-base font-bold uppercase tracking-[1.2px] text-[#c9d1ff] flex items-center gap-2">
            <span className="w-6.5 h-6.5 rounded-lg grid place-items-center text-sm text-white bg-[var(--e4)]">
              3
            </span>
            Çətinlik
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {diffs.map(([v, label]) => {
              const sel = setup.diff === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    Sound.click();
                    onChangeSetup((p) => ({ ...p, diff: v }));
                  }}
                  className={`border-2 px-4.5 py-2.5 rounded-2xl text-lg font-bold transition-all whitespace-nowrap ${
                    sel
                      ? "border-transparent bg-gradient-to-br from-[#22B8F0] to-[#4F7CFF] shadow-[0_6px_18px_rgba(0,0,0,0.25)] text-white"
                      : "border-[var(--line)] bg-white/5 hover:bg-white/12 text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <h3 className="m-0 mt-5 mb-3 text-base font-bold uppercase tracking-[1.2px] text-[#c9d1ff] flex items-center gap-2">
            <span className="w-6.5 h-6.5 rounded-lg grid place-items-center text-sm text-white bg-[var(--e5)]">
              4
            </span>
            Sual sayı
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {counts.map((v) => {
              const sel = setup.count === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    Sound.click();
                    onChangeSetup((p) => ({ ...p, count: v }));
                  }}
                  className={`border-2 px-4.5 py-2.5 rounded-2xl text-lg font-bold transition-all tabular-nums ${
                    sel
                      ? "border-transparent bg-gradient-to-br from-[#FF4D7E] to-[#FF8A00] shadow-[0_6px_18px_rgba(0,0,0,0.25)] text-white"
                      : "border-[var(--line)] bg-white/5 hover:bg-white/12 text-white"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Ədəbi xəritə */}
        <div className="lg:col-span-2 bg-[var(--panel)] border border-[var(--line)] rounded-[22px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] min-w-0">
          <h3 className="m-0 mb-3 text-base font-bold uppercase tracking-[1.2px] text-[#c9d1ff] flex items-center gap-2">
            <span className="w-6.5 h-6.5 rounded-lg grid place-items-center text-sm text-white bg-[var(--e3)]">
              5
            </span>
            Ədəbi xəritə — dövrləri seçin (bir neçəsini birlikdə seçmək olar)
          </h3>
          <LiteraryMap
            interactive
            selected={setup.eras}
            onToggleEra={(key) =>
              onChangeSetup((p) => ({
                ...p,
                eras: { ...p.eras, [key]: !p.eras[key] },
              }))
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3.5 mt-5">
        <div className="text-[#c9d1ff] text-[17px] tabular-nums">
          {anyEra ? (
            <>
              Seçiminizə uyğun <b className="text-white">{poolCount}</b> sual var. Oyunda{" "}
              <b className="text-white">{Math.min(poolCount, setup.count)}</b> sual veriləcək +
              final sualı.
            </>
          ) : (
            "Ən azı bir dövr seçin."
          )}
        </div>
        <button
          type="button"
          disabled={!anyEra || poolCount === 0}
          onClick={() => {
            Sound.ensure();
            onStart();
          }}
          className="max-sm:w-full border-0 rounded-[20px] px-9 py-4.5 text-2xl font-black text-[#2a1600] bg-gradient-to-br from-[#FFE066] via-[#FFB020] to-[#FF7A00] shadow-[0_10px_30px_rgba(255,140,0,0.45),inset_0_-4px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-px transition-transform disabled:grayscale disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Yola çıx ➜
        </button>
      </div>

      <div className="text-[13px] text-[#c9d1ff] text-center mt-4">
        Qısayollar:{" "}
        <kbd className="bg-white/15 rounded-md px-1.5 py-0.5 font-extrabold text-white">1</kbd>–
        <kbd className="bg-white/15 rounded-md px-1.5 py-0.5 font-extrabold text-white">4</kbd>{" "}
        variant seçimi ·{" "}
        <kbd className="bg-white/15 rounded-md px-1.5 py-0.5 font-extrabold text-white">Enter</kbd>{" "}
        növbəti ·{" "}
        <kbd className="bg-white/15 rounded-md px-1.5 py-0.5 font-extrabold text-white">
          Boşluq
        </kbd>{" "}
        taymeri dayandırır
      </div>
    </section>
  );
}
