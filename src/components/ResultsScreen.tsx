import { ERAS, ERA_ILL, eraIndex } from "../data/constants";
import type { GameLogEntry, Team } from "../types/game";
import { Sound } from "../utils/sound";
import { IllustrationRibbon } from "./Illustrations";

interface ResultsScreenProps {
  teams: Team[];
  log: GameLogEntry[];
  isReview: boolean;
  onReviewMistakes: () => void;
  onPrintDiploma: () => void;
  onNewGame: () => void;
}

export function ResultsScreen({
  teams,
  log,
  isReview,
  onReviewMistakes,
  onPrintDiploma,
  onNewGame,
}: ResultsScreenProps) {
  const ranked = teams.slice().sort((a, b) => b.score - a.score);
  const solo = teams.length === 1;

  const playedEras = new Set<number>();
  log.forEach((l) => {
    const ei = eraIndex(l.q.dovr);
    if (ei >= 0) playedEras.add(ei);
  });
  const ribbonItems: [string, string][] = ERA_ILL.map((k, i) =>
    playedEras.has(i) ? ([k, ERAS[i].key] as [string, string]) : null
  ).filter((x): x is [string, string] => x !== null);

  let okCount = 0;
  let badCount = 0;
  const byEra: Record<string, number> = {};
  const bySub: Record<string, number> = {};
  log.forEach((l) => {
    if (l.correct) {
      okCount++;
    } else {
      badCount++;
      byEra[l.q.dovr] = (byEra[l.q.dovr] || 0) + 1;
      const s = l.q.senetkar || l.q.eser || "Ümumi suallar";
      bySub[s] = (bySub[s] || 0) + 1;
    }
  });

  function topKey(obj: Record<string, number>): string {
    let bestKey: string | null = null;
    let bestVal = 0;
    Object.entries(obj).forEach(([k, v]) => {
      if (v > bestVal) {
        bestVal = v;
        bestKey = k;
      }
    });
    return bestKey ? `${bestKey} (${bestVal})` : "—";
  }

  const wrongCount = log.filter((l) => !l.correct && l.q.nov !== "final").length;

  let subTitle = "";
  let soloMedal: [string, string, string] | null = null;
  let soloAcc = 0;
  if (solo) {
    const t = ranked[0];
    const tot = t.correct + t.wrong;
    soloAcc = tot ? Math.round((t.correct * 100) / tot) : 0;
    soloMedal =
      soloAcc >= 80
        ? ["🥇", "p1", "Qızıl medal"]
        : soloAcc >= 60
        ? ["🥈", "p2", "Gümüş medal"]
        : soloAcc >= 40
        ? ["🥉", "p3", "Bürünc medal"]
        : ["📘", "p3", "Məşqə davam!"];
    subTitle = `${soloMedal[2]} · Dəqiqlik: ${soloAcc}%`;
  } else {
    subTitle = `Qalib: ${ranked[0].name} — ${ranked[0].score} xal`;
  }

  const podiumBlockStyle = (rankClass: string) => {
    if (rankClass === "p1")
      return "h-[190px] bg-gradient-to-b from-[#FFE27A] to-[#E8A800]";
    if (rankClass === "p2")
      return "h-[140px] bg-gradient-to-b from-[#F2F5FA] to-[#A9B4C6]";
    return "h-[105px] bg-gradient-to-b from-[#F3B07A] to-[#B8692F]";
  };

  return (
    <section className="animate-fadeIn">
      <div className="text-center mb-4">
        <h2 className="font-serif-literary text-[clamp(36px,5vw,64px)] m-0 font-bold bg-gradient-to-r from-[#FFE066] via-[#FFB020] to-[#FF7A00] bg-clip-text text-transparent">
          {isReview ? "Təkrar raund başa çatdı" : "Yekun nəticələr"}
        </h2>
        <p className="text-[#c9d1ff] mt-1.5 mb-0 text-xl">{subTitle}</p>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 mt-2.5 mb-6 min-h-[280px] sm:min-h-[330px]">
        {solo && soloMedal ? (
          <div className="w-[min(240px,46vw)] text-center animate-rise">
            <div className="text-[44px] sm:text-[60px] leading-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
              {soloMedal[0]}
            </div>
            <div className="text-[22px] font-black mt-1.5 mb-0.5 break-words">
              {ranked[0].name}
            </div>
            <div className="text-[30px] font-black text-[#FFC93C] tabular-nums">
              {ranked[0].score} xal
            </div>
            <div
              className={`mt-2.5 rounded-t-[18px] rounded-b-[6px] grid place-items-center text-[46px] sm:text-[54px] font-black text-black/35 tabular-nums ${podiumBlockStyle(
                soloMedal[1]
              )}`}
            >
              {soloAcc}%
            </div>
          </div>
        ) : (
          [1, 0, 2].map((r) => {
            const t = ranked[r];
            if (!t) return null;
            const medals = ["🥇", "🥈", "🥉"];
            const delay = r === 0 ? "0.3s" : r === 2 ? "0.15s" : "0s";
            const rankClass = `p${r + 1}`;
            return (
              <div
                key={t.name + r}
                style={{ animationDelay: delay }}
                className="w-[min(240px,30vw)] text-center animate-rise"
              >
                <div className="text-[44px] sm:text-[60px] leading-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
                  {medals[r]}
                </div>
                <div className="text-lg sm:text-[22px] font-black mt-1.5 mb-0.5 break-words">
                  {t.name}
                </div>
                <div className="text-2xl sm:text-[30px] font-black text-[#FFC93C] tabular-nums">
                  {t.score}
                </div>
                <div
                  className={`mt-2.5 rounded-t-[18px] rounded-b-[6px] grid place-items-center text-[44px] sm:text-[54px] font-black text-black/35 tabular-nums ${podiumBlockStyle(
                    rankClass
                  )}`}
                >
                  {r + 1}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4.5">
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-[22px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] min-w-0">
          <h3 className="m-0 mb-3 text-base font-bold uppercase tracking-[1.2px] text-[#c9d1ff]">
            {solo ? "Oyunçu statistikası" : "Komandalar üzrə statistika"}
          </h3>
          <table className="w-full border-collapse text-lg tabular-nums">
            <thead>
              <tr className="text-[#c9d1ff] text-sm uppercase tracking-wider">
                <th className="py-2.5 px-2 border-b border-[var(--line)] text-left">Yer</th>
                <th className="py-2.5 px-2 border-b border-[var(--line)] text-left">
                  {solo ? "Oyunçu" : "Komanda"}
                </th>
                <th className="py-2.5 px-2 border-b border-[var(--line)] text-left">Xal</th>
                <th className="py-2.5 px-2 border-b border-[var(--line)] text-left">Düzgün</th>
                <th className="py-2.5 px-2 border-b border-[var(--line)] text-left">Səhv</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((t, i) => (
                <tr key={i}>
                  <td className="py-2.5 px-2 border-b border-[var(--line)]">{i + 1}</td>
                  <td className="py-2.5 px-2 border-b border-[var(--line)]">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ background: t.color }}
                    />
                    {t.name}
                  </td>
                  <td className="py-2.5 px-2 border-b border-[var(--line)] font-black">
                    {t.score}
                  </td>
                  <td className="py-2.5 px-2 border-b border-[var(--line)] text-[#6CF5B0] font-bold">
                    {t.correct}
                  </td>
                  <td className="py-2.5 px-2 border-b border-[var(--line)] text-[#FF9AAE] font-bold">
                    {t.wrong}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-[22px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] min-w-0">
          <h3 className="m-0 mb-3 text-base font-bold uppercase tracking-[1.2px] text-[#c9d1ff]">
            Ümumi göstəricilər
          </h3>
          <div className="grid grid-cols-2 gap-3 tabular-nums">
            <div className="rounded-[18px] p-3.5 bg-white/7">
              <b className="block text-[30px] text-[#6CF5B0]">{okCount}</b>
              <small className="text-[#c9d1ff] text-sm">düzgün cavab</small>
            </div>
            <div className="rounded-[18px] p-3.5 bg-white/7">
              <b className="block text-[30px] text-[#FF9AAE]">{badCount}</b>
              <small className="text-[#c9d1ff] text-sm">səhv cavab</small>
            </div>
            <div className="col-span-2 rounded-[18px] p-3.5 bg-white/7">
              <small className="text-[#c9d1ff] text-sm">Ən çox səhv olunan dövr</small>
              <b className="block text-[21px] mt-0.5">{topKey(byEra)}</b>
            </div>
            <div className="col-span-2 rounded-[18px] p-3.5 bg-white/7">
              <small className="text-[#c9d1ff] text-sm">Ən çox səhv olunan sənətkar / əsər</small>
              <b className="block text-[21px] mt-0.5">{topKey(bySub)}</b>
            </div>
          </div>
        </div>
      </div>

      <IllustrationRibbon items={ribbonItems} className="mt-5 mb-1" />

      <div className="flex flex-wrap gap-3 justify-center mt-5.5">
        <button
          type="button"
          disabled={wrongCount === 0}
          onClick={() => {
            Sound.click();
            onReviewMistakes();
          }}
          className="max-sm:w-full border-0 rounded-[20px] px-9 py-4.5 text-2xl font-black text-[#2a1600] bg-gradient-to-br from-[#FFE066] via-[#FFB020] to-[#FF7A00] shadow-[0_10px_30px_rgba(255,140,0,0.45),inset_0_-4px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-transform disabled:grayscale disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {wrongCount > 0 ? `Səhvlərimi təkrar et (${wrongCount})` : "Səhv yoxdur — əla! ✔"}
        </button>

        <button
          type="button"
          onClick={onPrintDiploma}
          className="border-2 border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--panel2)] rounded-[18px] px-5.5 py-3.5 text-[19px] font-extrabold"
        >
          🖨 Diplomu çap et
        </button>

        <button
          type="button"
          onClick={() => {
            Sound.click();
            onNewGame();
          }}
          className="border-2 border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--panel2)] rounded-[18px] px-5.5 py-3.5 text-[19px] font-extrabold"
        >
          ↻ Yeni oyun
        </button>
      </div>
    </section>
  );
}
