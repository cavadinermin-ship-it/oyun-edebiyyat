import { useEffect, useRef, type CSSProperties } from "react";
import { LETTERS } from "../data/constants";
import type { Question, Team } from "../types/game";
import { pageText } from "../utils/helpers";
import { Sound } from "../utils/sound";
import { QuestionIllustration } from "./Illustrations";
import { TimerRing } from "./TimerRing";

interface FinalScreenProps {
  finalQ: Question;
  teams: Team[];
  stage: "bet" | "question";
  bets: number[];
  answers: (number | null)[];
  order: number[];
  revealed: boolean;
  timerOn: boolean;
  timerLeft: number;
  timerTotal: number;
  timerPaused: boolean;
  onTogglePause: () => void;
  onSetBet: (teamIdx: number, pct: number) => void;
  onConfirmBets: () => void;
  onSelectAnswer: (teamIdx: number, pos: number) => void;
  onReveal: () => void;
  onFinish: () => void;
}

export function FinalScreen({
  finalQ,
  teams,
  stage,
  bets,
  answers,
  order,
  revealed,
  timerOn,
  timerLeft,
  timerTotal,
  timerPaused,
  onTogglePause,
  onSetBet,
  onConfirmBets,
  onSelectAnswer,
  onReveal,
  onFinish,
}: FinalScreenProps) {
  const solo = teams.length === 1;
  const toResRef = useRef<HTMLButtonElement>(null);
  const revealBoxRef = useRef<HTMLDivElement>(null);

  const stakeOf = (i: number) => {
    const t = teams[i];
    return t.score > 0 ? Math.round((t.score * bets[i]) / 100) : 0;
  };

  useEffect(() => {
    if (revealed) {
      const t = setTimeout(() => {
        revealBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        toResRef.current?.focus({ preventScroll: true });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [revealed]);

  const correctPos = order.indexOf(finalQ.duzgun ?? 0);
  const optColors = [
    "bg-[#E8384F] text-white",
    "bg-[#2F80ED] text-white",
    "bg-[#F5A70D] text-[#231500]",
    "bg-[#17A866] text-white",
  ];

  return (
    <section className="animate-fadeIn">
      <div className="text-center mb-4">
        <h2 className="font-serif-literary text-[clamp(36px,5vw,64px)] m-0 font-bold bg-gradient-to-r from-[#FFE066] via-[#FFB020] to-[#FF7A00] bg-clip-text text-transparent">
          ★ Final sualı ★
        </h2>
        <p className="text-[#c9d1ff] mt-1.5 mb-0 text-xl">
          {stage === "bet"
            ? solo
              ? "Xalınızın bir hissəsini (10–50%) mərcə qoyun. Düzgün cavab — qazanc, səhv — itki."
              : "Hər komanda xalının bir hissəsini (10–50%) mərcə qoyur. Düzgün cavab — mərc qədər qazanc, səhv — mərc qədər itki."
            : "Bütün komandalar eyni anda cavablarını seçir."}
        </p>
      </div>

      {stage === "bet" ? (
        <div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
            {teams.map((t, i) => (
              <div
                key={i}
                className="rounded-[20px] p-4 bg-[var(--panel)] border-2"
                style={{ borderColor: t.color, "--tc": t.color } as CSSProperties}
              >
                <div className="text-[22px] font-black">{t.name}</div>
                <div className="text-[#c9d1ff] text-base tabular-nums">
                  Hazırkı xal: <b className="text-white">{t.score}</b>
                </div>
                <div className="flex flex-wrap gap-2 my-3">
                  {[10, 20, 30, 40, 50].map((v) => {
                    const sel = bets[i] === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          Sound.click();
                          onSetBet(i, v);
                        }}
                        style={sel ? { background: t.color, borderColor: t.color } : undefined}
                        className={`border-2 rounded-xl px-3 py-2.5 text-lg font-extrabold tabular-nums transition-colors ${
                          sel
                            ? "text-[#111]"
                            : "border-[var(--line)] bg-white/5 hover:bg-white/15 text-white"
                        }`}
                      >
                        {v}%
                      </button>
                    );
                  })}
                </div>
                <div className="text-xl font-black text-[#FFC93C] tabular-nums">
                  Mərc: {stakeOf(i)} xal
                </div>
                {t.score <= 0 && (
                  <div className="text-sm text-[#c9d1ff] mt-1">
                    Xal olmadığı üçün final yalnız şərəf üçündür.
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-5.5">
            <button
              type="button"
              onClick={() => {
                Sound.click();
                onConfirmBets();
              }}
              className="max-sm:w-full border-0 rounded-[20px] px-9 py-4.5 text-2xl font-black text-[#2a1600] bg-gradient-to-br from-[#FFE066] via-[#FFB020] to-[#FF7A00] shadow-[0_10px_30px_rgba(255,140,0,0.45),inset_0_-4px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-transform"
            >
              Mərcləri təsdiqlə — sualı göstər ➜
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="relative rounded-[28px] p-5 sm:p-6 bg-gradient-to-br from-white/12 to-white/5 border border-[var(--line)] shadow-[0_18px_40px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-[#EAB308]" />
            <div className="flex items-center gap-2.5 flex-wrap mb-3">
              <span className="px-3.5 py-1.5 rounded-full font-extrabold text-base bg-[#EAB308] text-white inline-flex items-center gap-1.5">
                ★ Final sualı
              </span>
              <span className="px-3.5 py-1.5 rounded-full font-extrabold text-[15px] bg-[#D7334F] text-white">
                Çətin
              </span>
              {finalQ.dovr && (
                <span className="text-[15px] font-semibold text-[#c9d1ff]">
                  · {finalQ.dovr}
                </span>
              )}
              <div className="ml-auto">
                <TimerRing
                  visible={timerOn}
                  left={timerLeft}
                  total={timerTotal}
                  paused={timerPaused}
                  onTogglePause={onTogglePause}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="flex-1 min-w-0 text-[max(26px,min(3.1vw,44px))] font-extrabold leading-[1.25] mt-1.5 mb-4 tracking-tight">
                {finalQ.sual}
                {finalQ.misra && (
                  <span className="font-serif-literary block mt-3 italic font-semibold text-[0.92em] px-5 py-4 rounded-2xl bg-white/8 border border-white/18 whitespace-pre-line">
                    {finalQ.misra}
                  </span>
                )}
              </div>
              <QuestionIllustration q={finalQ} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {order.map((vi, pos) => {
                const isRight = revealed && pos === correctPos;
                const isWrong = revealed && pos !== correctPos;
                const isChosen = solo && revealed && answers[0] === pos;

                return (
                  <button
                    key={vi}
                    type="button"
                    disabled={revealed || !solo}
                    onClick={() => {
                      if (!solo || revealed) return;
                      onSelectAnswer(0, pos);
                    }}
                    className={`flex items-center gap-3.5 text-left border-0 rounded-[20px] px-4.5 py-4 min-h-[64px] sm:min-h-[84px] text-[max(20px,min(2.1vw,30px))] font-extrabold shadow-[inset_0_-5px_0_rgba(0,0,0,0.18),0_8px_20px_rgba(0,0,0,0.2)] transition-all ${
                      optColors[pos]
                    } ${solo && !revealed ? "hover:-translate-y-0.5 hover:brightness-110" : ""} ${
                      isRight
                        ? "outline-[6px] outline-white shadow-[0_0_0_12px_rgba(33,208,122,0.6),0_10px_30px_rgba(0,0,0,0.3)] animate-popChoice"
                        : ""
                    } ${isWrong ? "opacity-55 grayscale-[0.6]" : ""} ${
                      isChosen && isWrong ? "!opacity-100 !grayscale-0 outline-[6px] outline-dashed outline-white" : ""
                    }`}
                  >
                    <span
                      className={`flex-none w-11.5 h-11.5 rounded-[14px] grid place-items-center text-[22px] font-black ${
                        pos === 2 ? "bg-black/15" : "bg-white/25"
                      }`}
                    >
                      {LETTERS[pos]}
                    </span>
                    <span>{finalQ.variantlar?.[vi]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {!solo && (
            <>
              <div className="grid gap-2.5 mt-4">
                {teams.map((t, i) => {
                  const ok = revealed && answers[i] === correctPos;
                  const s = stakeOf(i);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 flex-wrap px-4 py-2.5 rounded-2xl bg-[var(--panel)] border border-[var(--line)]"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-none"
                        style={{ background: t.color }}
                      />
                      <span className="font-black text-xl min-w-[140px]">{t.name}</span>
                      <span className="text-sm text-[#c9d1ff] tabular-nums">
                        mərc: {s}
                      </span>
                      <div className="flex gap-2">
                        {LETTERS.map((L, pos) => {
                          const sel = answers[i] === pos;
                          return (
                            <button
                              key={L}
                              type="button"
                              disabled={revealed}
                              onClick={() => {
                                Sound.click();
                                onSelectAnswer(i, pos);
                              }}
                              style={
                                sel
                                  ? { background: t.color, color: "#111", borderColor: "#fff" }
                                  : undefined
                              }
                              className={`w-[54px] h-[50px] rounded-xl border-2 text-xl font-black transition-colors ${
                                sel
                                  ? ""
                                  : "border-[var(--line)] bg-white/8 hover:bg-white/15 text-white"
                              }`}
                            >
                              {L}
                            </button>
                          );
                        })}
                      </div>
                      {revealed && (
                        <span
                          className={`ml-auto text-[22px] font-black tabular-nums ${
                            ok ? "text-[#6CF5B0]" : "text-[#FF9AAE]"
                          }`}
                        >
                          {ok ? `✔ +${s}` : `✘ −${s}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {!revealed && (
                <div className="flex justify-center mt-5.5">
                  <button
                    type="button"
                    onClick={onReveal}
                    className="max-sm:w-full border-0 rounded-[20px] px-9 py-4.5 text-2xl font-black text-[#2a1600] bg-gradient-to-br from-[#FFE066] via-[#FFB020] to-[#FF7A00] shadow-[0_10px_30px_rgba(255,140,0,0.45),inset_0_-4px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-transform"
                  >
                    Cavabları aç
                  </button>
                </div>
              )}
            </>
          )}

          {revealed && (
            <div
              ref={revealBoxRef}
              className="bg-[var(--panel)] border border-[var(--line)] rounded-[22px] p-5 mt-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            >
              <div className="text-[22px] font-extrabold">
                Düzgün cavab: <b>{finalQ.variantlar?.[finalQ.duzgun ?? 0]}</b>
              </div>
              {finalQ.izah && <div className="mt-2 text-xl leading-snug">{finalQ.izah}</div>}
              <div className="flex flex-wrap items-center gap-3 mt-3.5">
                <span className="inline-flex items-center gap-2 bg-white/18 px-3.5 py-2 rounded-xl font-extrabold text-[17px]">
                  📖 {pageText(finalQ)}
                </span>
                {solo && (
                  <span className="px-3.5 py-1.5 rounded-full font-extrabold text-xl bg-white/12 tabular-nums">
                    {answers[0] === correctPos
                      ? `✔ +${stakeOf(0)}`
                      : `✘ −${stakeOf(0)}`}{" "}
                    xal
                  </span>
                )}
                <button
                  ref={toResRef}
                  type="button"
                  onClick={() => {
                    Sound.click();
                    onFinish();
                  }}
                  className="ml-auto border-0 rounded-2xl px-7 py-3.5 text-[22px] font-black bg-white text-[#1a1a40] hover:bg-white/90"
                >
                  Yekun nəticələr ➜
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
