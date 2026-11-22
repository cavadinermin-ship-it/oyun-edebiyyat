import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmModal } from "./components/ConfirmModal";
import { ConfettiCanvas } from "./components/ConfettiCanvas";
import { DiplomaPrint } from "./components/DiplomaPrint";
import { FinalScreen } from "./components/FinalScreen";
import { GameScreen } from "./components/GameScreen";
import { ResultsScreen } from "./components/ResultsScreen";
import { StartScreen } from "./components/StartScreen";
import { StationSplash } from "./components/StationSplash";
import { SvgSprites } from "./components/SvgSprites";
import { TeacherModal } from "./components/TeacherModal";
import { Toast } from "./components/Toast";
import { ERAS, eraIndex, MULTI_TYPES, TEAM_COLORS } from "./data/constants";
import rawQuestions from "./data/questions.json";
import type {
  ActiveScreen,
  FeedbackState,
  GameLogEntry,
  GameSettings,
  PreparedQuestion,
  Question,
  SetupState,
  Team,
} from "./types/game";
import {
  basePoints,
  buildQueue,
  pageText,
  pickFinal,
  prepareQuestion,
  range,
  shuffle,
  store,
} from "./utils/helpers";
import { Sound } from "./utils/sound";

const BASE_QUESTIONS = rawQuestions as Question[];

function defaultEras(): Record<string, boolean> {
  const rec: Record<string, boolean> = {};
  ERAS.forEach((e) => {
    rec[e.key] = true;
  });
  return rec;
}

const DEFAULT_SETTINGS: GameSettings = {
  timerOn: true,
  timerSec: 45,
  count: 10,
  sound: true,
};

interface FinalState {
  q: Question;
  stage: "bet" | "question";
  bets: number[];
  answers: (number | null)[];
  order: number[];
  revealed: boolean;
}

interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export function App() {
  // Persistent Settings
  const [settings, setSettings] = useState<GameSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...store.get<Partial<GameSettings>>("ss_settings", {}),
  }));

  useEffect(() => {
    Sound.enabled = settings.sound;
    store.set("ss_settings", settings);
  }, [settings]);

  // Persistent Bank Override / Custom / Disabled
  const [overrideBank, setOverrideBank] = useState<Question[] | null>(() =>
    store.get<Question[] | null>("ss_bank_override", null)
  );
  const [customQuestions, setCustomQuestions] = useState<Question[]>(() =>
    store.get<Question[]>("ss_custom", [])
  );
  const [disabled, setDisabled] = useState<Record<string, boolean>>(() =>
    store.get<Record<string, boolean>>("ss_disabled", {})
  );

  const bank = useMemo(() => {
    const base = overrideBank ?? BASE_QUESTIONS;
    return [...base, ...customQuestions];
  }, [overrideBank, customQuestions]);

  const customIds = useMemo(
    () => new Set(customQuestions.map((q) => q.id)),
    [customQuestions]
  );

  // Persistent Setup State
  const [setup, setSetup] = useState<SetupState>(() => {
    const saved = store.get<Partial<SetupState>>("ss_setup", {});
    const initSettings = {
      ...DEFAULT_SETTINGS,
      ...store.get<Partial<GameSettings>>("ss_settings", {}),
    };
    return {
      mode: saved.mode === "solo" ? "solo" : "team",
      teams:
        Array.isArray(saved.teams) && saved.teams.length >= 2
          ? saved.teams.slice(0, 4)
          : ["1-ci komanda", "2-ci komanda"],
      solo: saved.solo || "Şagird",
      dir: saved.dir || "Qarışıq",
      diff: saved.diff || "qarisiq",
      count: saved.count || initSettings.count || 10,
      eras: { ...defaultEras(), ...(saved.eras || {}) },
    };
  });

  useEffect(() => {
    store.set("ss_setup", setup);
  }, [setup]);

  // Screen & Game State
  const [screen, setScreen] = useState<ActiveScreen>("start");
  const [teams, setTeams] = useState<Team[]>([]);
  const [queue, setQueue] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [turn, setTurn] = useState(0);
  const [cur, setCur] = useState<PreparedQuestion | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [log, setLog] = useState<GameLogEntry[]>([]);
  const [isReview, setIsReview] = useState(false);
  const [finalState, setFinalState] = useState<FinalState | null>(null);
  const [splash, setSplash] = useState<{ eraIdx: number; isFirst: boolean } | null>(
    null
  );
  const [confetti, setConfetti] = useState(false);

  // Overlays
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmDialogState | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2800);
  }, []);

  // Timer State
  const [timerLeft, setTimerLeft] = useState(settings.timerSec);
  const [timerTotal, setTimerTotal] = useState(settings.timerSec);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const lastTickSecRef = useRef<number>(-1);

  const startTimerFor = useCallback(
    (q: Question) => {
      const mult = MULTI_TYPES[q.nov] || q.nov === "final" ? 1.5 : 1;
      const tot = Math.round(settings.timerSec * mult);
      setTimerTotal(tot);
      setTimerLeft(tot);
      setTimerElapsed(0);
      setTimerPaused(false);
      lastTickSecRef.current = -1;
    },
    [settings.timerSec]
  );

  // Start Game (standard or mistake-review)
  const startGame = useCallback(
    (reviewQuestions?: Question[]) => {
      const reviewMode = Boolean(reviewQuestions && reviewQuestions.length > 0);
      const qList = reviewMode
        ? reviewQuestions!.slice()
        : buildQueue(bank, disabled, setup);

      if (!qList.length) {
        showToast("Seçilmiş parametrlərə uyğun aktiv sual tapılmadı.");
        return;
      }

      const solo = setup.mode === "solo";
      const initTeams: Team[] = solo
        ? [
            {
              name: setup.solo.trim() || "Şagird",
              color: TEAM_COLORS[1],
              score: 0,
              streak: 0,
              correct: 0,
              wrong: 0,
              jokers: { fifty: true, hint: true, time: true },
            },
          ]
        : setup.teams.map((name, i) => ({
            name: name.trim() || `${i + 1}-ci komanda`,
            color: TEAM_COLORS[i % TEAM_COLORS.length],
            score: 0,
            streak: 0,
            correct: 0,
            wrong: 0,
            jokers: { fifty: true, hint: true, time: true },
          }));

      const pickedFinal = reviewMode
        ? null
        : pickFinal(bank, disabled, setup, qList);

      const firstPrepared = prepareQuestion(qList[0]);

      setTeams(initTeams);
      setQueue(qList);
      setIdx(0);
      setTurn(0);
      setCur(firstPrepared);
      setFeedback(null);
      setLog([]);
      setIsReview(reviewMode);
      setConfetti(false);
      setFinalState(
        pickedFinal
          ? {
              q: pickedFinal,
              stage: "bet",
              bets: initTeams.map(() => 20),
              answers: initTeams.map(() => null),
              order: shuffle(range(pickedFinal.variantlar?.length ?? 4)),
              revealed: false,
            }
          : null
      );
      setScreen("game");
      startTimerFor(qList[0]);

      const firstEi = eraIndex(qList[0].dovr);
      if (firstEi >= 0 && !reviewMode) {
        Sound.whoosh();
        setSplash({ eraIdx: firstEi, isFirst: true });
      } else {
        setSplash(null);
      }
    },
    [bank, disabled, setup, showToast, startTimerFor]
  );

  // Finish & score current question
  const finishQuestion = useCallback(
    (
      frac: number,
      ansText: string,
      ansList?: string[],
      timeout = false
    ) => {
      if (!cur || cur.answered) return;
      const q = cur.q;
      const ok = frac >= 1;
      const base = basePoints(q, cur.opened);
      let pts = Math.round(base * frac * (cur.hint ? 0.5 : 1));
      const parts: string[] = [];

      if (frac > 0) {
        parts.push(frac < 1 ? `Qismən +${pts}` : `Əsas +${pts}`);
      }

      if (ok && settings.timerOn && timerElapsed <= 10) {
        pts += 50;
        parts.push("Sürət +50");
      }

      const active = teams[turn];
      let streakBonus = 0;
      if (ok && active && (active.streak + 1) % 3 === 0) {
        streakBonus = 100;
        pts += 100;
        parts.push(`Seriya ×${active.streak + 1} +100`);
      }

      if (cur.hint && frac > 0) {
        parts.push("İpucu ½");
      }

      if (ok) Sound.correct();
      else Sound.wrong();

      setCur((prev) => (prev ? { ...prev, answered: true } : prev));
      setTeams((prev) =>
        prev.map((t, i) => {
          if (i !== turn) return t;
          return {
            ...t,
            score: t.score + pts,
            streak: ok ? t.streak + 1 : 0,
            correct: t.correct + (ok ? 1 : 0),
            wrong: t.wrong + (ok ? 0 : 1),
          };
        })
      );
      setLog((prev) => [...prev, { q, team: turn, correct: ok }]);
      setFeedback({
        ok,
        frac,
        pts,
        parts,
        ansText,
        ansList,
        izah: q.izah,
        page: pageText(q),
        teamName: teams.length > 1 ? active?.name : undefined,
        teamColor: teams.length > 1 ? active?.color : undefined,
        timeout,
      });
      void streakBonus;
    },
    [cur, settings.timerOn, timerElapsed, teams, turn]
  );

  // Pick option (4-choice or dogru-yanlis)
  const handlePickOption = useCallback(
    (pos: number) => {
      if (!cur || cur.answered) return;
      const q = cur.q;
      const vi = cur.order ? cur.order[pos] : pos;
      if (cur.goneIndices.includes(vi)) return;

      const isRight = vi === q.duzgun;
      setCur((prev) => (prev ? { ...prev, chosenVi: vi } : prev));
      const correctTxt = q.variantlar?.[q.duzgun ?? 0] ?? "";
      finishQuestion(isRight ? 1 : 0, isRight ? "" : correctTxt);
    },
    [cur, finishQuestion]
  );

  // Check matching pairs
  const handleCheckMatch = useCallback(() => {
    if (!cur || cur.answered || !cur.q.cutler || !cur.assign) return;
    const total = cur.q.cutler.length;
    let rightCount = 0;
    cur.assign.forEach((ri, li) => {
      if (ri === li) rightCount++;
    });
    const frac = total > 0 ? rightCount / total : 0;
    const list = cur.q.cutler.map(([l, r]) => `${l} — ${r}`);
    finishQuestion(frac, "", frac < 1 ? list : undefined);
  }, [cur, finishQuestion]);

  // Check chronological/plot order
  const handleCheckOrder = useCallback(() => {
    if (!cur || cur.answered || !cur.q.siralama || !cur.ord) return;
    const total = cur.q.siralama.length;
    let rightCount = 0;
    cur.ord.forEach((origIdx, pos) => {
      if (origIdx === pos) rightCount++;
    });
    const frac = total > 0 ? rightCount / total : 0;
    finishQuestion(frac, "", frac < 1 ? cur.q.siralama : undefined);
  }, [cur, finishQuestion]);

  // Final screen reveal
  const revealFinal = useCallback(
    (overrideAnswers?: (number | null)[]) => {
      setFinalState((prev) => {
        if (!prev || prev.revealed) return prev;
        const ans = overrideAnswers ?? prev.answers;
        const correctPos = prev.order.indexOf(prev.q.duzgun ?? 0);
        let anyRight = false;

        setTeams((tPrev) =>
          tPrev.map((t, i) => {
            const stake =
              t.score > 0 ? Math.round((t.score * prev.bets[i]) / 100) : 0;
            const ok = ans[i] === correctPos;
            if (ok) anyRight = true;
            return {
              ...t,
              score: ok ? t.score + stake : Math.max(0, t.score - stake),
              correct: t.correct + (ok ? 1 : 0),
              wrong: t.wrong + (ok ? 0 : 1),
            };
          })
        );

        setLog((lPrev) => [
          ...lPrev,
          {
            q: prev.q,
            team: 0,
            correct: ans[0] === correctPos,
          },
        ]);

        if (anyRight) Sound.correct();
        else Sound.wrong();

        return { ...prev, answers: ans, revealed: true };
      });
    },
    []
  );

  // Timeout handler
  const handleTimeUp = useCallback(() => {
    if (screen === "game" && cur && !cur.answered) {
      const q = cur.q;
      let ansText = "";
      let ansList: string[] | undefined;
      if (q.variantlar && q.duzgun != null) {
        ansText = q.variantlar[q.duzgun] || "";
      } else if (q.cutler) {
        ansList = q.cutler.map(([l, r]) => `${l} — ${r}`);
      } else if (q.siralama) {
        ansList = q.siralama;
      }
      finishQuestion(0, ansText, ansList, true);
    } else if (screen === "final" && finalState?.stage === "question" && !finalState.revealed) {
      revealFinal();
    }
  }, [screen, cur, finalState, finishQuestion, revealFinal]);

  // Timer interval
  const timerRunning =
    settings.timerOn &&
    !timerPaused &&
    !splash &&
    !teacherOpen &&
    !confirmState &&
    ((screen === "game" && Boolean(cur) && !cur!.answered) ||
      (screen === "final" &&
        finalState?.stage === "question" &&
        !finalState.revealed));

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerElapsed((e) => e + 0.1);
      setTimerLeft((prev) => {
        const next = Math.max(0, prev - 0.1);
        const ceil = Math.ceil(next);
        if (ceil <= 5 && ceil >= 1 && ceil !== lastTickSecRef.current) {
          lastTickSecRef.current = ceil;
          Sound.tick();
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (timerRunning && timerLeft <= 0) {
      handleTimeUp();
    }
  }, [timerRunning, timerLeft, handleTimeUp]);

  // Advance to next question / final / results
  const handleNext = useCallback(() => {
    Sound.click();
    setFeedback(null);
    const nextTurn = teams.length > 1 ? (turn + 1) % teams.length : 0;
    setTurn(nextTurn);

    if (idx + 1 >= queue.length) {
      if (finalState) {
        setScreen("final");
      } else {
        setScreen("results");
        setConfetti(true);
        Sound.win();
      }
      return;
    }

    const nextIdx = idx + 1;
    const prevQ = queue[idx];
    const nextQ = queue[nextIdx];
    setIdx(nextIdx);
    setCur(prepareQuestion(nextQ));
    startTimerFor(nextQ);

    const prevEi = eraIndex(prevQ.dovr);
    const nextEi = eraIndex(nextQ.dovr);
    if (nextEi >= 0 && nextEi !== prevEi && !isReview) {
      Sound.whoosh();
      setSplash({ eraIdx: nextEi, isFirst: false });
    }
  }, [teams.length, turn, idx, queue, finalState, startTimerFor, isReview]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (teacherOpen || confirmState) return;

      if (e.code === "Space") {
        if (
          settings.timerOn &&
          ((screen === "game" && cur && !cur.answered) ||
            (screen === "final" &&
              finalState?.stage === "question" &&
              !finalState.revealed))
        ) {
          e.preventDefault();
          Sound.click();
          setTimerPaused((p) => !p);
        }
        return;
      }

      if (e.key === "Enter") {
        if (splash) {
          e.preventDefault();
          Sound.click();
          setSplash(null);
          return;
        }
        if (screen === "game" && feedback) {
          e.preventDefault();
          handleNext();
          return;
        }
        if (screen === "game" && cur && !cur.answered) {
          if (cur.q.nov === "uygunlasdir") {
            e.preventDefault();
            handleCheckMatch();
          } else if (
            cur.q.nov === "zaman-lenti" ||
            cur.q.nov === "sujet-zenciri"
          ) {
            e.preventDefault();
            handleCheckOrder();
          }
          return;
        }
        if (screen === "final" && finalState?.revealed) {
          e.preventDefault();
          setScreen("results");
          setConfetti(true);
          Sound.win();
        }
        return;
      }

      if (["1", "2", "3", "4"].includes(e.key)) {
        const pos = Number(e.key) - 1;
        if (screen === "game" && cur && !cur.answered && !splash) {
          const nov = cur.q.nov;
          if (nov === "test" || nov === "misra" || nov === "ipucu-kart") {
            handlePickOption(pos);
          } else if (nov === "dogru-yanlis" && pos < 2) {
            handlePickOption(pos);
          }
        } else if (
          screen === "final" &&
          finalState?.stage === "question" &&
          !finalState.revealed &&
          teams.length === 1
        ) {
          const nextAns = finalState.answers.slice();
          nextAns[0] = pos;
          revealFinal(nextAns);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    teacherOpen,
    confirmState,
    settings.timerOn,
    screen,
    cur,
    finalState,
    splash,
    feedback,
    teams.length,
    handleNext,
    handleCheckMatch,
    handleCheckOrder,
    handlePickOption,
    revealFinal,
  ]);

  // Jokers & Interactive Question Handlers
  const handleUseFifty = () => {
    if (!cur || cur.answered || cur.fifty || !cur.q.variantlar) return;
    const t = teams[turn];
    if (!t?.jokers.fifty) return;

    const wrongIndices = range(cur.q.variantlar.length).filter(
      (i) => i !== cur.q.duzgun
    );
    const hideTwo = shuffle(wrongIndices).slice(0, 2);

    Sound.flip();
    setTeams((prev) =>
      prev.map((tm, i) =>
        i === turn ? { ...tm, jokers: { ...tm.jokers, fifty: false } } : tm
      )
    );
    setCur((prev) =>
      prev ? { ...prev, fifty: true, goneIndices: hideTwo } : prev
    );
  };

  const handleUseHint = () => {
    if (!cur || cur.answered || cur.hint) return;
    const t = teams[turn];
    if (!t?.jokers.hint) return;

    Sound.flip();
    setTeams((prev) =>
      prev.map((tm, i) =>
        i === turn ? { ...tm, jokers: { ...tm.jokers, hint: false } } : tm
      )
    );
    setCur((prev) => (prev ? { ...prev, hint: true } : prev));
  };

  const handleUseTime = () => {
    if (!cur || cur.answered || !settings.timerOn) return;
    const t = teams[turn];
    if (!t?.jokers.time) return;

    Sound.flip();
    setTeams((prev) =>
      prev.map((tm, i) =>
        i === turn ? { ...tm, jokers: { ...tm.jokers, time: false } } : tm
      )
    );
    setTimerTotal((tot) => Math.max(tot, timerLeft + 15));
    setTimerLeft((l) => l + 15);
    lastTickSecRef.current = -1;
    showToast("+15 saniyə əlavə edildi!");
  };

  const handleOpenNextCard = () => {
    if (!cur || cur.answered || cur.q.nov !== "ipucu-kart") return;
    const max = cur.q.ipuclari?.length ?? 4;
    if (cur.opened >= max) return;
    Sound.flip();
    setCur((prev) => (prev ? { ...prev, opened: prev.opened + 1 } : prev));
  };

  // Matching handlers
  const handleSelectMatchLeft = (li: number) => {
    if (!cur || cur.answered || !cur.assign) return;
    Sound.click();
    if (cur.selR != null) {
      const ri = cur.selR;
      setCur((prev) => {
        if (!prev || !prev.assign) return prev;
        const nextAssign = prev.assign.map((v) => (v === ri ? null : v));
        nextAssign[li] = ri;
        return { ...prev, assign: nextAssign, selL: null, selR: null };
      });
      return;
    }
    if (cur.selL === li) {
      setCur((prev) => (prev ? { ...prev, selL: null } : prev));
      return;
    }
    if (cur.assign[li] != null) {
      setCur((prev) => {
        if (!prev || !prev.assign) return prev;
        const nextAssign = prev.assign.slice();
        nextAssign[li] = null;
        return { ...prev, assign: nextAssign, selL: li };
      });
      return;
    }
    setCur((prev) => (prev ? { ...prev, selL: li } : prev));
  };

  const handleSelectMatchRight = (ri: number) => {
    if (!cur || cur.answered || !cur.assign) return;
    Sound.click();
    if (cur.selL != null) {
      const li = cur.selL;
      setCur((prev) => {
        if (!prev || !prev.assign) return prev;
        const nextAssign = prev.assign.map((v) => (v === ri ? null : v));
        nextAssign[li] = ri;
        return { ...prev, assign: nextAssign, selL: null, selR: null };
      });
      return;
    }
    setCur((prev) =>
      prev ? { ...prev, selR: prev.selR === ri ? null : ri } : prev
    );
  };

  const handleDropMatchPair = (li: number, ri: number) => {
    if (!cur || cur.answered || !cur.assign) return;
    Sound.click();
    setCur((prev) => {
      if (!prev || !prev.assign) return prev;
      const nextAssign = prev.assign.map((v) => (v === ri ? null : v));
      nextAssign[li] = ri;
      return { ...prev, assign: nextAssign, selL: null, selR: null };
    });
  };

  // Order handlers
  const handleSelectOrderItem = (pos: number) => {
    if (!cur || cur.answered || !cur.ord) return;
    Sound.click();
    setCur((prev) => {
      if (!prev || !prev.ord) return prev;
      if (prev.sel == null) return { ...prev, sel: pos };
      if (prev.sel === pos) return { ...prev, sel: null };
      const nextOrd = prev.ord.slice();
      [nextOrd[prev.sel], nextOrd[pos]] = [nextOrd[pos], nextOrd[prev.sel]];
      return { ...prev, ord: nextOrd, sel: null };
    });
  };

  const handleMoveOrderItem = (pos: number, dir: -1 | 1) => {
    if (!cur || cur.answered || !cur.ord) return;
    const to = pos + dir;
    if (to < 0 || to >= cur.ord.length) return;
    Sound.click();
    setCur((prev) => {
      if (!prev || !prev.ord) return prev;
      const nextOrd = prev.ord.slice();
      [nextOrd[pos], nextOrd[to]] = [nextOrd[to], nextOrd[pos]];
      return { ...prev, ord: nextOrd, sel: null };
    });
  };

  const handleReorderDrag = (fromPos: number, toPos: number) => {
    if (!cur || cur.answered || !cur.ord) return;
    Sound.click();
    setCur((prev) => {
      if (!prev || !prev.ord) return prev;
      const nextOrd = prev.ord.slice();
      const [item] = nextOrd.splice(fromPos, 1);
      nextOrd.splice(toPos, 0, item);
      return { ...prev, ord: nextOrd, sel: null };
    });
  };

  // Teacher actions
  const handleToggleQuestion = (id: string, enabled: boolean) => {
    setDisabled((prev) => {
      const next = { ...prev };
      if (enabled) delete next[id];
      else next[id] = true;
      store.set("ss_disabled", next);
      return next;
    });
  };

  const handleBulkToggle = (ids: string[], enabled: boolean) => {
    setDisabled((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        if (enabled) delete next[id];
        else next[id] = true;
      });
      store.set("ss_disabled", next);
      return next;
    });
    showToast(enabled ? "Görünən suallar aktiv edildi." : "Görünən suallar söndürüldü.");
  };

  const handleDeleteCustom = (id: string) => {
    setConfirmState({
      title: "Sualı silmək?",
      message: "Bu müəllim sualını bankdan silmək istəyirsiniz?",
      confirmLabel: "Sil",
      danger: true,
      onConfirm: () => {
        setCustomQuestions((prev) => {
          const next = prev.filter((q) => q.id !== id);
          store.set("ss_custom", next);
          return next;
        });
        setConfirmState(null);
        showToast("Sual silindi.");
      },
    });
  };

  const handleAddCustom = (q: Question) => {
    setCustomQuestions((prev) => {
      const next = [q, ...prev];
      store.set("ss_custom", next);
      return next;
    });
    showToast("Yeni sual banka əlavə olundu!");
  };

  const handleImportQuestions = (list: Question[]): number => {
    const valid = list.filter(
      (q) => q && typeof q === "object" && typeof q.sual === "string" && q.nov
    );
    if (!valid.length) return 0;

    setCustomQuestions((prev) => {
      const byId = new Map(prev.map((q) => [q.id, q]));
      valid.forEach((q, idxItem) => {
        const id = q.id || `imp-${Date.now()}-${idxItem}`;
        byId.set(id, { ...q, id });
      });
      const next = Array.from(byId.values());
      store.set("ss_custom", next);
      return next;
    });
    return valid.length;
  };

  const handleResetBank = () => {
    setConfirmState({
      title: "Orijinal banka qayıtmaq?",
      message:
        "Əlavə etdiyiniz bütün xüsusi suallar və söndürmə seçimləri sıfırlanacaq.",
      confirmLabel: "Sıfırla",
      danger: true,
      onConfirm: () => {
        setOverrideBank(null);
        setCustomQuestions([]);
        setDisabled({});
        store.del("ss_bank_override");
        store.del("ss_custom");
        store.del("ss_disabled");
        setConfirmState(null);
        showToast("Orijinal sual bankı bərpa edildi.");
      },
    });
  };

  // Topbar actions
  const handleBrandClick = () => {
    Sound.click();
    if (screen === "game" || screen === "final") {
      setConfirmState({
        title: "Başlanğıca qayıtmaq?",
        message: "Cari oyun dayandırılacaq və xallar sıfırlanacaq.",
        confirmLabel: "Bəli, çıx",
        onConfirm: () => {
          setConfirmState(null);
          setSplash(null);
          setFeedback(null);
          setScreen("start");
        },
      });
    } else {
      setScreen("start");
    }
  };

  const toggleFullscreen = () => {
    Sound.click();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const rankedTeams = useMemo(
    () => teams.slice().sort((a, b) => b.score - a.score),
    [teams]
  );

  return (
    <>
      <SvgSprites />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-8">
        {/* Topbar */}
        <header className="flex flex-wrap items-center justify-between gap-3 py-4 mb-2">
          <button
            type="button"
            onClick={handleBrandClick}
            className="flex items-center gap-3 bg-transparent border-0 p-0 text-left text-white group"
          >
            <div
              className="w-11 h-11 rounded-[14px] grid place-items-center font-serif-literary font-bold text-[26px] text-[#1a163f] shadow-[0_6px_18px_rgba(255,138,0,0.35)] group-hover:scale-105 transition-transform"
              style={{
                background:
                  "conic-gradient(from 140deg, #ff8a00, #ff4d7e, #9b6bff, #22b8f0, #10c98f, #ff8a00)",
              }}
            >
              Ə
            </div>
            <div>
              <div className="font-extrabold text-xl leading-none">
                Söz sənətimizin izi ilə
              </div>
              <div className="text-xs text-[#c9d1ff] font-semibold mt-0.5">
                X sinif · Ədəbiyyat
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextSound = !settings.sound;
                setSettings((s) => ({ ...s, sound: nextSound }));
                if (nextSound) {
                  Sound.enabled = true;
                  Sound.click();
                }
              }}
              title={settings.sound ? "Səsi söndür" : "Səsi yandır"}
              aria-label={settings.sound ? "Səsi söndür" : "Səsi yandır"}
              className="w-11 h-11 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--panel2)] text-white text-xl grid place-items-center transition-colors"
            >
              {settings.sound ? "🔊" : "🔇"}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title="Tam ekran"
              aria-label="Tam ekran"
              className="w-11 h-11 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--panel2)] text-white text-xl grid place-items-center transition-colors"
            >
              ⛶
            </button>

            <button
              type="button"
              onClick={() => {
                Sound.click();
                setTeacherOpen(true);
              }}
              className="h-11 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--panel2)] text-white px-4 text-base font-extrabold inline-flex items-center gap-2 transition-colors"
            >
              ✎ Müəllim üçün
            </button>
          </div>
        </header>

        {/* Active Screen */}
        <main>
          {screen === "start" && (
            <StartScreen
              setup={setup}
              bank={bank}
              disabled={disabled}
              onChangeSetup={setSetup}
              onStart={() => startGame()}
            />
          )}

          {screen === "game" && cur && (
            <GameScreen
              cur={cur}
              idx={idx}
              total={queue.length}
              hasFinal={Boolean(finalState)}
              teams={teams}
              turn={turn}
              solo={teams.length === 1}
              timerOn={settings.timerOn}
              timerLeft={timerLeft}
              timerTotal={timerTotal}
              timerPaused={timerPaused}
              selectedEras={setup.eras}
              feedback={feedback}
              onTogglePause={() => {
                Sound.click();
                setTimerPaused((p) => !p);
              }}
              onPickOption={handlePickOption}
              onOpenNextCard={handleOpenNextCard}
              onUseFifty={handleUseFifty}
              onUseHint={handleUseHint}
              onUseTime={handleUseTime}
              onSelectMatchLeft={handleSelectMatchLeft}
              onSelectMatchRight={handleSelectMatchRight}
              onDropMatchPair={handleDropMatchPair}
              onCheckMatch={handleCheckMatch}
              onSelectOrderItem={handleSelectOrderItem}
              onMoveOrderItem={handleMoveOrderItem}
              onReorderDrag={handleReorderDrag}
              onCheckOrder={handleCheckOrder}
              onNext={handleNext}
            />
          )}

          {screen === "final" && finalState && (
            <FinalScreen
              finalQ={finalState.q}
              teams={teams}
              stage={finalState.stage}
              bets={finalState.bets}
              answers={finalState.answers}
              order={finalState.order}
              revealed={finalState.revealed}
              timerOn={settings.timerOn}
              timerLeft={timerLeft}
              timerTotal={timerTotal}
              timerPaused={timerPaused}
              onTogglePause={() => {
                Sound.click();
                setTimerPaused((p) => !p);
              }}
              onSetBet={(teamIdx, pct) => {
                setFinalState((prev) => {
                  if (!prev) return prev;
                  const nextBets = prev.bets.slice();
                  nextBets[teamIdx] = pct;
                  return { ...prev, bets: nextBets };
                });
              }}
              onConfirmBets={() => {
                setFinalState((prev) =>
                  prev ? { ...prev, stage: "question" } : prev
                );
                startTimerFor(finalState.q);
              }}
              onSelectAnswer={(teamIdx, pos) => {
                if (teams.length === 1) {
                  const nextAns = finalState.answers.slice();
                  nextAns[0] = pos;
                  revealFinal(nextAns);
                } else {
                  setFinalState((prev) => {
                    if (!prev) return prev;
                    const nextAns = prev.answers.slice();
                    nextAns[teamIdx] = pos;
                    return { ...prev, answers: nextAns };
                  });
                }
              }}
              onReveal={() => revealFinal()}
              onFinish={() => {
                setScreen("results");
                setConfetti(true);
                Sound.win();
              }}
            />
          )}

          {screen === "results" && (
            <ResultsScreen
              teams={teams}
              log={log}
              isReview={isReview}
              onReviewMistakes={() => {
                const wrongQs = log
                  .filter((l) => !l.correct && l.q.nov !== "final")
                  .map((l) => l.q);
                startGame(wrongQs);
              }}
              onPrintDiploma={() => {
                Sound.click();
                window.print();
              }}
              onNewGame={() => {
                setConfetti(false);
                setScreen("start");
              }}
            />
          )}
        </main>
      </div>

      {/* Overlays & Print Layer */}
      {splash && (
        <StationSplash
          eraIdx={splash.eraIdx}
          isFirst={splash.isFirst}
          selectedEras={setup.eras}
          onContinue={() => {
            Sound.click();
            setSplash(null);
          }}
        />
      )}

      <TeacherModal
        open={teacherOpen}
        onClose={() => setTeacherOpen(false)}
        bank={bank}
        customIds={customIds}
        disabled={disabled}
        settings={settings}
        onToggleQuestion={handleToggleQuestion}
        onBulkToggle={handleBulkToggle}
        onDeleteCustom={handleDeleteCustom}
        onAddCustom={handleAddCustom}
        onImportQuestions={handleImportQuestions}
        onResetBank={handleResetBank}
        onUpdateSettings={setSettings}
        onToast={showToast}
      />

      <ConfirmModal
        open={Boolean(confirmState)}
        title={confirmState?.title || ""}
        message={confirmState?.message || ""}
        confirmLabel={confirmState?.confirmLabel}
        danger={confirmState?.danger}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />

      <Toast message={toastMsg} />

      <ConfettiCanvas active={confetti} />

      <DiplomaPrint
        winner={rankedTeams[0] ?? null}
        isTeamMode={teams.length > 1}
        selectedEras={setup.eras}
      />
    </>
  );
}

export default App;
