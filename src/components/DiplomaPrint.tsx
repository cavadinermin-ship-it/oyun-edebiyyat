import { ERAS } from "../data/constants";
import type { Team } from "../types/game";

interface DiplomaPrintProps {
  winner: Team | null;
  isTeamMode: boolean;
  selectedEras: Record<string, boolean>;
}

export function DiplomaPrint({ winner, isTeamMode, selectedEras }: DiplomaPrintProps) {
  if (!winner) return null;
  const d = new Date();
  const ds = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${d.getFullYear()}`;
  const eras = ERAS.filter((e) => selectedEras[e.key])
    .map((e) => e.key)
    .join(", ");

  return (
    <div id="diploma">
      <div className="dip">
        <div className="orn">✦ ✦ ✦</div>
        <h1>DİPLOM</h1>
        <div className="sub">«Söz sənətimizin izi ilə» — X sinif ədəbiyyat oyunu</div>
        <div className="who">{winner.name}</div>
        <div className="txt">
          {isTeamMode ? (
            <>
              komandası ədəbiyyat yarışının <b>qalibi</b> olmuş və{" "}
            </>
          ) : (
            <>oyunu uğurla başa vurmuş və </>
          )}
          <span className="score">{winner.score} xal</span> toplamışdır.
          <br />
          Dövrlər: {eras}
        </div>
        <div className="txt">
          Tarix: <b>{ds}</b>
        </div>
        <div className="sig">
          <div>Müəllim</div>
          <div>İmza</div>
        </div>
      </div>
    </div>
  );
}
