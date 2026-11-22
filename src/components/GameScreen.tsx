import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CARD_PTS, DIFF, eraIndex, LETTERS, TYPES } from "../data/constants";
import type { FeedbackState, PreparedQuestion, Team } from "../types/game";
import { basePoints, hintText, pageText } from "../utils/helpers";
import { Sound } from "../utils/sound";
import { QuestionIllustration } from "./Illustrations";
import { LiteraryMap } from "./LiteraryMap";
import { TimerRing } from "./TimerRing";

interface GameScreenProps {
  cur: PreparedQuestion;
  idx: number;
  total: number;
  hasFinal: boolean;
  teams: Team[];
  turn: number;
  solo: boolean;
  timerOn: boolean;
  timerLeft: number;
  timerTotal: number;
  timerPaused: boolean;
  selectedEras: Record<string, boolean>;
  feedback: FeedbackState | null;
  onTogglePause: () => void;
  onPickOption: (pos: number) => void;
  onOpenNextCard: () => void;
  onUseFifty: () => void;
  onUseHint: () => void;
  onUseTime: () => void;
  onSelectMatchLeft: (li: number) => void;
  onSelectMatchRight: (ri: number) => void;
  onDropMatchPair: (li: number, ri: number) => void;
  onCheckMatch: () => void;
  onSelectOrderItem: (pos: number) => void;
  onMoveOrderItem: (pos: number, dir: -1 | 1) => void;
  onReorderDrag: (fromPos: number, toPos: number) => void;
  onCheckOrder: () => void;
  onNext: () => void;
}

const OPT_COLORS = [
  "bg-[#E8384F] text-white",
  "bg-[#2F80ED] text-white",
  "bg-[#F5A70D] text-[#231500]",
  "bg-[#17A866] text-white",
];

export function GameScreen({
  cur,
  idx,
  total,
  hasFinal,
  teams,
  turn,
  solo,
  timerOn,
  timerLeft,
  timerTotal,
  timerPaused,
  selectedEras,
  feedback,
  onTogglePause,
  onPickOption,
  onOpenNextCard,
  onUseFifty,
  onUseHint,
  onUseTime,
  onSelectMatchLeft,
  onSelectMatchRight,
  onDropMatchPair,
  onCheckMatch,
  onSelectOrderItem,
  onMoveOrderItem,
  onReorderDrag,
  onCheckOrder,
  onNext,
}: GameScreenProps) {
  const [dragR, setDragR] = useState<number | null>(null);
  const [dragOverL, setDragOverL] = useState<number | null>(null);
  const [dragOrdPos, setDragOrdPos] = useState<number | null>(null);
  const [dragOverOrdPos, setDragOverOrdPos] = useState<number | null>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => {
        nextBtnRef.current?.focus({ preventScroll: true });
      }, 140);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const q = cur.q;
  const tp = TYPES[q.nov];
  const df = DIFF[q.cetinlik];
  const activeTeam = teams[turn];
  const curPts = Math.round(basePoints(q, cur.opened) * (cur.hint ? 0.5 : 1));
  const ei = eraIndex(q.dovr);
  const isFourOpt = q.nov === "test" || q.nov === "misra" || q.nov === "ipucu-kart";
  const isPair = q.nov === "uygunlasdir";
  const isOrd = q.nov === "zaman-lenti" || q.nov === "sujet-zenciri";

  const assign = cur.assign ?? [];
  const rightOrder = cur.right ?? [];
  const ord = cur.ord ?? [];

  const nextLabel =
    idx + 1 >= total ? (hasFinal ? "Final sualına ➜" : "Nəticələr ➜") : "Növbəti ➜";

  return (
    <section className="animate-fadeIn pb-28">
      {/* Compact Literary Map */}
      <div className="mb-3 overflow-x-auto">
        <LiteraryMap compact selected={selectedEras} current={ei} />
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2.5 mb-3.5">
        {teams.map((t, i) => {
          const isTurn = !solo && i === turn;
          return (
            <div
              key={i}
              style={{ "--tc": t.color, borderColor: isTurn ? t.color : undefined } as CSSProperties}
              className={`rounded-2xl px-4 py-2.5 bg-[var(--panel)] border-2 flex items-center gap-3 transition-all ${
                isTurn
                  ? "bg-white/15 -translate-y-0.5 shadow-[0_0_0_5px_color-mix(in_srgb,var(--tc)_28%,transparent)]"
                  : "border-transparent"
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full flex-none"
                style={{ background: t.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[17px] whitespace-nowrap overflow-hidden text-ellipsis">
                  {t.name}
                </div>
                {t.streak >= 2 && (
                  <div className="text-[13px] text-[#FFC93C] font-extrabold">
                    🔥 {t.streak} ardıcıl
                  </div>
                )}
              </div>
              <div className="text-[30px] font-black tabular-nums">{t.score}</div>
            </div>
          );
        })}
      </div>

      {/* Main Question Card */}
      <div className="relative rounded-[28px] p-5 sm:p-6 bg-gradient-to-br from-white/12 to-white/5 border border-[var(--line)] shadow-[0_18px_40px_rgba(0,0,0,0.25)] overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ background: tp.color }}
        />

        {/* Card Metadata Bar */}
        <div className="flex items-center gap-2.5 flex-wrap mb-3">
          <span
            className="px-3.5 py-1.5 rounded-full font-extrabold text-[15px] text-white inline-flex items-center gap-1.5"
            style={{ background: tp.color }}
          >
            {tp.ic} {tp.name}
          </span>
          <span
            className="px-3.5 py-1.5 rounded-full font-extrabold text-[15px] text-white"
            style={{ background: df.badgeBg }}
          >
            {df.name}
          </span>
          <span className="px-3.5 py-1.5 rounded-full font-extrabold text-[15px] bg-[#FFC93C]/20 text-[#FFE58F] border border-[#FFC93C]/40 tabular-nums">
            +{curPts} xal
          </span>
          {!solo && (
            <span
              className="px-3.5 py-1.5 rounded-full font-extrabold text-[15px] bg-white/10 border"
              style={{ borderColor: activeTeam.color, color: "#fff" }}
            >
              Növbə: <span style={{ color: activeTeam.color }}>{activeTeam.name}</span>
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            <span className="font-black text-xl text-[#c9d1ff] tabular-nums">
              {idx + 1} / {total}
            </span>
            <TimerRing
              visible={timerOn}
              left={timerLeft}
              total={timerTotal}
              paused={timerPaused}
              onTogglePause={onTogglePause}
            />
          </div>
        </div>

        {/* Question Prompt & Illustration */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="flex-1 min-w-0 text-[max(24px,min(2.8vw,40px))] font-extrabold leading-[1.25] mt-1.5 mb-4 tracking-tight">
            {q.sual}
            {q.misra && (
              <span className="font-serif-literary block mt-3 italic font-semibold text-[0.92em] px-5 py-4 rounded-2xl bg-white/8 border border-white/18 whitespace-pre-line">
                {q.misra}
              </span>
            )}
          </div>
          <QuestionIllustration q={q} />
        </div>

        {/* Hint Box */}
        {cur.hint && (
          <div className="mb-4 px-4.5 py-3 rounded-2xl bg-[#FFC93C]/14 border border-[#FFC93C]/45 text-[#FFE58F] text-lg font-semibold animate-fadeIn">
            💡 <b>İpucu:</b> {hintText(q)} — <span className="opacity-90">📖 {pageText(q)}</span>{" "}
            <span className="text-sm opacity-80">(xal 50% azalır)</span>
          </div>
        )}

        {/* Type: ipucu-kart 4-card deck */}
        {q.nov === "ipucu-kart" && q.ipuclari && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {q.ipuclari.slice(0, 4).map((txt, ci) => {
              const isOpen = ci < cur.opened;
              const isNext = ci === cur.opened && !cur.answered;
              return (
                <button
                  key={ci}
                  type="button"
                  disabled={!isNext}
                  onClick={() => {
                    if (isNext) onOpenNextCard();
                  }}
                  className={`perspective-800 h-[155px] text-left bg-transparent border-0 p-0 ${
                    isNext ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div
                    className={`relative w-full h-full preserve-3d transition-transform duration-500 ${
                      isOpen ? "rotate-y-180" : ""
                    }`}
                  >
                    {/* Front (closed) */}
                    <div
                      className={`absolute inset-0 backface-hidden rounded-2xl p-3.5 border-2 flex flex-col items-center justify-center text-center gap-1.5 ${
                        isNext
                          ? "bg-[#222866] border-[#06B6D4] shadow-[0_0_18px_rgba(6,182,212,0.35)] hover:bg-[#2a317a]"
                          : "bg-white/6 border-[var(--line)] opacity-75"
                      }`}
                    >
                      <span className="text-xs font-black uppercase tracking-wider text-[#67E8F9]">
                        İpucu {ci + 1} · {CARD_PTS[ci]} xal
                      </span>
                      <span className="text-base font-extrabold text-white">
                        {isNext ? "Kartı aç ↻" : "Kilidlidir"}
                      </span>
                    </div>

                    {/* Back (open) */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl p-3.5 bg-gradient-to-br from-[#0e3447] to-[#132152] border-2 border-[#06B6D4] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs font-black text-[#67E8F9]">
                        <span>İpucu {ci + 1}</span>
                        <span className="tabular-nums">{CARD_PTS[ci]} xal</span>
                      </div>
                      <div className="text-sm sm:text-[15px] font-bold leading-snug text-white overflow-y-auto">
                        {txt}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Type: 4-option multiple choice (test / misra / ipucu-kart) */}
        {isFourOpt && cur.order && q.variantlar && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {cur.order.map((vi, pos) => {
              const gone = cur.goneIndices.includes(vi);
              const isCorrectChoice = cur.answered && vi === q.duzgun;
              const isChosen = cur.answered && cur.chosenVi === vi;
              const isWrongDimmed = cur.answered && vi !== q.duzgun;

              return (
                <button
                  key={vi}
                  type="button"
                  disabled={cur.answered || gone}
                  onClick={() => onPickOption(pos)}
                  className={`flex items-center gap-3.5 text-left border-0 rounded-[20px] px-4.5 py-4 min-h-[64px] sm:min-h-[84px] text-[max(20px,min(2.1vw,30px))] font-extrabold shadow-[inset_0_-5px_0_rgba(0,0,0,0.18),0_8px_20px_rgba(0,0,0,0.2)] transition-all ${
                    OPT_COLORS[pos]
                  } ${
                    !cur.answered && !gone ? "hover:-translate-y-0.5 hover:brightness-110" : ""
                  } ${gone ? "!opacity-15 pointer-events-none scale-95" : ""} ${
                    isCorrectChoice
                      ? "outline-[6px] outline-white shadow-[0_0_0_12px_rgba(33,208,122,0.6),0_10px_30px_rgba(0,0,0,0.3)] animate-popChoice"
                      : ""
                  } ${isWrongDimmed && !gone ? "opacity-45 grayscale-[0.65]" : ""} ${
                    isChosen && !isCorrectChoice
                      ? "!opacity-100 !grayscale-0 outline-[6px] outline-dashed outline-white"
                      : ""
                  }`}
                >
                  <span
                    className={`flex-none w-11.5 h-11.5 rounded-[14px] grid place-items-center text-[22px] font-black ${
                      pos === 2 ? "bg-black/15" : "bg-white/25"
                    }`}
                  >
                    {LETTERS[pos]}
                  </span>
                  <span>{q.variantlar?.[vi]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Type: dogru-yanlis */}
        {q.nov === "dogru-yanlis" && q.variantlar && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1].map((vi) => {
              const isTrue = vi === 0;
              const isCorrectChoice = cur.answered && vi === q.duzgun;
              const isChosen = cur.answered && cur.chosenVi === vi;
              const isWrongDimmed = cur.answered && vi !== q.duzgun;

              return (
                <button
                  key={vi}
                  type="button"
                  disabled={cur.answered}
                  onClick={() => onPickOption(vi)}
                  className={`flex items-center justify-center gap-3 border-0 rounded-[22px] px-6 py-7 text-[max(24px,min(2.6vw,34px))] font-black shadow-[inset_0_-6px_0_rgba(0,0,0,0.2),0_10px_24px_rgba(0,0,0,0.25)] transition-all ${
                    isTrue ? "bg-[#17A866] text-white" : "bg-[#E8384F] text-white"
                  } ${!cur.answered ? "hover:-translate-y-0.5 hover:brightness-110" : ""} ${
                    isCorrectChoice
                      ? "outline-[6px] outline-white shadow-[0_0_0_12px_rgba(33,208,122,0.6),0_10px_30px_rgba(0,0,0,0.3)] animate-popChoice"
                      : ""
                  } ${isWrongDimmed ? "opacity-45 grayscale-[0.65]" : ""} ${
                    isChosen && !isCorrectChoice
                      ? "!opacity-100 !grayscale-0 outline-[6px] outline-dashed outline-white"
                      : ""
                  }`}
                >
                  <span>{isTrue ? "✔" : "✘"}</span>
                  <span>{q.variantlar?.[vi]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Type: uygunlasdir */}
        {isPair && q.cutler && (
          <div>
            <p className="text-base text-[#c9d1ff] mb-3 mt-0">
              Sol tərəfdən bir bəndi, sonra sağ tərəfdən ona uyğun gələni seçin (və ya sağdakı kartı soldakının üzərinə sürükləyin).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left slots */}
              <div className="grid gap-2.5">
                {q.cutler.map((pair, li) => {
                  const assignedRi = assign[li];
                  const isSel = cur.selL === li;
                  const isDragOver = dragOverL === li;
                  const isRowRight = cur.answered && assignedRi === li;
                  const isRowWrong = cur.answered && assignedRi !== li;

                  return (
                    <button
                      key={li}
                      type="button"
                      disabled={cur.answered}
                      onClick={() => onSelectMatchLeft(li)}
                      onDragOver={(e) => {
                        if (cur.answered) return;
                        e.preventDefault();
                        setDragOverL(li);
                      }}
                      onDragLeave={() => setDragOverL(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverL(null);
                        if (!cur.answered && dragR !== null) {
                          onDropMatchPair(li, dragR);
                          setDragR(null);
                        }
                      }}
                      className={`text-left rounded-2xl p-3.5 border-2 transition-all flex flex-col gap-1.5 ${
                        isRowRight
                          ? "bg-[#21D07A]/20 border-[#21D07A]"
                          : isRowWrong
                          ? "bg-[#FF4D6A]/20 border-[#FF4D6A]"
                          : isDragOver
                          ? "bg-[#FFC93C]/20 border-[#FFC93C] scale-[1.01]"
                          : isSel
                          ? "bg-[#3FA9FF]/22 border-[#3FA9FF] shadow-[0_0_0_4px_rgba(63,169,255,0.25)]"
                          : "bg-white/8 border-[var(--line)] hover:bg-white/14"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-extrabold text-lg">
                        <span className="w-7 h-7 rounded-lg bg-white/15 grid place-items-center text-sm font-black flex-none">
                          {li + 1}
                        </span>
                        <span>{pair[0]}</span>
                      </div>
                      <div className="pl-9 text-base font-bold">
                        {assignedRi != null ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EC4899]/30 border border-[#EC4899]/60 text-white">
                            ⇄ {q.cutler?.[assignedRi]?.[1]}
                          </span>
                        ) : (
                          <span className="text-[#c9d1ff]/65 italic">
                            Uyğun cavabı seçin…
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right chips */}
              <div className="grid gap-2.5 content-start">
                {rightOrder.map((ri) => {
                  const usedBy = assign.indexOf(ri);
                  const isUsed = usedBy !== -1;
                  const isSel = cur.selR === ri;

                  return (
                    <button
                      key={ri}
                      type="button"
                      disabled={cur.answered}
                      draggable={!cur.answered}
                      onDragStart={() => setDragR(ri)}
                      onDragEnd={() => {
                        setDragR(null);
                        setDragOverL(null);
                      }}
                      onClick={() => onSelectMatchRight(ri)}
                      className={`text-left rounded-2xl p-3.5 border-2 font-bold text-lg transition-all flex items-center justify-between gap-2 ${
                        isSel
                          ? "bg-[#EC4899]/30 border-[#EC4899] shadow-[0_0_0_4px_rgba(236,72,153,0.25)]"
                          : isUsed
                          ? "bg-white/5 border-white/15 text-[#c9d1ff] opacity-65"
                          : "bg-white/10 border-[var(--line)] hover:bg-white/16 text-white"
                      }`}
                    >
                      <span>{q.cutler?.[ri]?.[1]}</span>
                      {isUsed && (
                        <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-white/15">
                          #{usedBy + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Type: zaman-lenti / sujet-zenciri */}
        {isOrd && q.siralama && (
          <div>
            <p className="text-base text-[#c9d1ff] mb-3 mt-0">
              {q.nov === "zaman-lenti"
                ? "Hadisələri və ya əsərləri xronoloji ardıcıllıqla düzün (yuxarıdan aşağıya: ən əvvəl → ən sonra)."
                : "Süjet mərhələlərini düzgün ardıcıllıqla sıralayın (oxlar, kliklə yerini dəyişmə və ya sürükləmə ilə)."}
            </p>
            <div className="grid gap-2.5">
              {ord.map((origIdx, pos) => {
                const isSel = cur.sel === pos;
                const isDragOver = dragOverOrdPos === pos;
                const isRowRight = cur.answered && origIdx === pos;
                const isRowWrong = cur.answered && origIdx !== pos;

                return (
                  <div
                    key={origIdx}
                    draggable={!cur.answered}
                    onDragStart={() => setDragOrdPos(pos)}
                    onDragEnd={() => {
                      setDragOrdPos(null);
                      setDragOverOrdPos(null);
                    }}
                    onDragOver={(e) => {
                      if (cur.answered) return;
                      e.preventDefault();
                      setDragOverOrdPos(pos);
                    }}
                    onDragLeave={() => setDragOverOrdPos(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverOrdPos(null);
                      if (!cur.answered && dragOrdPos !== null && dragOrdPos !== pos) {
                        onReorderDrag(dragOrdPos, pos);
                      }
                      setDragOrdPos(null);
                    }}
                    onClick={() => {
                      if (!cur.answered) onSelectOrderItem(pos);
                    }}
                    className={`rounded-2xl p-3.5 border-2 flex items-center gap-3 transition-all ${
                      !cur.answered ? "cursor-pointer" : ""
                    } ${
                      isRowRight
                        ? "bg-[#21D07A]/20 border-[#21D07A]"
                        : isRowWrong
                        ? "bg-[#FF4D6A]/20 border-[#FF4D6A]"
                        : isDragOver
                        ? "bg-[#FFC93C]/20 border-[#FFC93C]"
                        : isSel
                        ? "bg-[#F59E0B]/25 border-[#F59E0B] shadow-[0_0_0_4px_rgba(245,158,11,0.25)]"
                        : "bg-white/8 border-[var(--line)] hover:bg-white/14"
                    }`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-white/15 grid place-items-center font-black text-lg flex-none">
                      {pos + 1}
                    </span>
                    <span className="flex-1 font-bold text-lg leading-snug">
                      {q.siralama?.[origIdx]}
                    </span>
                    {!cur.answered && (
                      <div className="flex gap-1.5 flex-none">
                        <button
                          type="button"
                          disabled={pos === 0}
                          aria-label="Yuxarı"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveOrderItem(pos, -1);
                          }}
                          className="w-9 h-9 rounded-xl border border-[var(--line)] bg-white/10 hover:bg-white/20 text-white font-black disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={pos === ord.length - 1}
                          aria-label="Aşağı"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveOrderItem(pos, 1);
                          }}
                          className="w-9 h-9 rounded-xl border border-[var(--line)] bg-white/10 hover:bg-white/20 text-white font-black disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Jokers & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 mt-4.5">
          {isFourOpt && (
            <button
              type="button"
              disabled={cur.answered || !activeTeam.jokers.fifty || cur.fifty}
              onClick={onUseFifty}
              className="border-2 border-[var(--line)] bg-white/8 hover:bg-white/15 text-white rounded-[14px] px-4 py-2.5 text-[17px] font-extrabold inline-flex items-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              ✂ 50/50
            </button>
          )}

          <button
            type="button"
            disabled={cur.answered || !activeTeam.jokers.hint || cur.hint}
            onClick={onUseHint}
            className="border-2 border-[var(--line)] bg-white/8 hover:bg-white/15 text-white rounded-[14px] px-4 py-2.5 text-[17px] font-extrabold inline-flex items-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          >
            💡 İpucu
          </button>

          {timerOn && (
            <button
              type="button"
              disabled={cur.answered || !activeTeam.jokers.time}
              onClick={onUseTime}
              className="border-2 border-[var(--line)] bg-white/8 hover:bg-white/15 text-white rounded-[14px] px-4 py-2.5 text-[17px] font-extrabold inline-flex items-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              ⏱ +15 saniyə
            </button>
          )}

          {q.nov === "ipucu-kart" && !cur.answered && cur.opened < (q.ipuclari?.length ?? 4) && (
            <button
              type="button"
              onClick={onOpenNextCard}
              className="border-2 border-[#06B6D4] bg-[#06B6D4]/20 hover:bg-[#06B6D4]/30 text-[#A5F3FC] rounded-[14px] px-4 py-2.5 text-[17px] font-extrabold inline-flex items-center gap-2 transition-colors"
            >
              🃏 Növbəti ipucunu aç ({CARD_PTS[cur.opened] ?? 100} xal)
            </button>
          )}

          {(isPair || isOrd) && !cur.answered && (
            <button
              type="button"
              onClick={onCheckMatchOrOrder(isPair, onCheckMatch, onCheckOrder)}
              className="ml-auto border-0 rounded-[16px] px-7 py-3 text-xl font-black bg-gradient-to-br from-[#FFE066] to-[#FF9F1C] text-[#231400] shadow-[0_6px_20px_rgba(255,160,0,0.35)] hover:-translate-y-0.5 transition-transform"
            >
              Yoxla ✓
            </button>
          )}
        </div>
      </div>

      {/* Sliding Bottom Feedback Drawer */}
      {feedback && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 animate-fadeIn">
          <div
            className={`max-w-[1200px] mx-auto rounded-3xl p-4 sm:p-5 border-2 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md ${
              feedback.ok
                ? "bg-[#0e3f2d]/95 border-[#21D07A]"
                : "bg-[#4a1223]/95 border-[#FF4D6A]"
            }`}
          >
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-2xl sm:text-3xl font-black">
                {feedback.timeout
                  ? "⏰ Vaxt bitdi!"
                  : feedback.ok
                  ? "✔ Düzgündür!"
                  : "✘ Səhv cavab"}
              </span>

              {feedback.teamName && (
                <span
                  className="px-3 py-1 rounded-full text-sm font-extrabold bg-black/25 border"
                  style={{ borderColor: feedback.teamColor }}
                >
                  {feedback.teamName}
                </span>
              )}

              <span
                className={`px-3.5 py-1 rounded-full text-xl font-black tabular-nums ${
                  feedback.pts > 0
                    ? "bg-[#21D07A]/25 text-[#8BFFCA]"
                    : "bg-black/25 text-white/80"
                }`}
              >
                +{feedback.pts} xal
              </span>

              {feedback.parts.length > 0 && (
                <span className="text-sm font-bold text-white/80">
                  ({feedback.parts.join(" · ")})
                </span>
              )}

              <button
                ref={nextBtnRef}
                type="button"
                onClick={onNext}
                className="ml-auto border-0 rounded-2xl px-6 py-3 text-lg sm:text-xl font-black bg-white text-[#141740] hover:bg-white/90 shadow-lg"
              >
                {nextLabel}
              </button>
            </div>

            {feedback.ansText && (
              <div className="text-base sm:text-lg font-bold text-[#FFE58F] mb-1">
                Düzgün cavab: {feedback.ansText}
              </div>
            )}

            {feedback.ansList && feedback.ansList.length > 0 && (
              <ol className="text-sm sm:text-base font-bold text-[#FFE58F] pl-5 my-1 grid sm:grid-cols-2 gap-x-6 gap-y-0.5">
                {feedback.ansList.map((item, idxItem) => (
                  <li key={idxItem}>{item}</li>
                ))}
              </ol>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-base text-white/95">
              <span>{feedback.izah}</span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-xl text-sm font-extrabold">
                📖 {feedback.page}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function onCheckMatchOrOrder(
  isPair: boolean,
  onCheckMatch: () => void,
  onCheckOrder: () => void
) {
  return () => {
    if (isPair) onCheckMatch();
    else onCheckOrder();
  };
}
