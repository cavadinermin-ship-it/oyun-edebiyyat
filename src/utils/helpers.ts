import { CARD_PTS, DIFF, ERAS, TYPES } from "../data/constants";
import type { PreparedQuestion, Question, SetupState } from "../types/game";

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

export function shuffledNotIdentity(n: number): number[] {
  let a: number[] = range(n);
  let guard = 0;
  do {
    a = shuffle(range(n));
    guard++;
  } while (n > 1 && guard < 20 && a.every((v, i) => v === i));
  return a;
}

export function pageText(q: Pick<Question, "sehife">): string {
  return q.sehife ? `Dərslik, s. ${q.sehife}` : "Dərslik: giriş bölməsi";
}

export function hintText(q: Question): string {
  if (q.ipucu) return q.ipucu;
  if (q.nov === "uygunlasdir" && q.cutler?.length) {
    return `Bir cüt: «${q.cutler[0][0]}» — «${q.cutler[0][1]}».`;
  }
  if ((q.nov === "zaman-lenti" || q.nov === "sujet-zenciri") && q.siralama?.length) {
    return `Birinci yerdə: «${q.siralama[0]}».`;
  }
  if (q.nov === "dogru-yanlis") {
    return "Fikrin hər sözünə diqqət edin — bir söz bütün mənanı dəyişə bilər.";
  }
  if (q.variantlar && q.duzgun != null) {
    const a = String(q.variantlar[q.duzgun]).replace(/^[«"(\s]+/, "");
    return `Düzgün cavab «${a.charAt(0).toLocaleUpperCase("az")}» hərfi ilə başlayır.`;
  }
  return "";
}

export function basePoints(q: Question, opened = 1): number {
  if (q.nov === "ipucu-kart") {
    return CARD_PTS[Math.max(0, opened - 1)] ?? 100;
  }
  return DIFF[q.cetinlik]?.pts ?? 200;
}

export function prepareQuestion(q: Question): PreparedQuestion {
  const p: PreparedQuestion = {
    q,
    hint: false,
    fifty: false,
    goneIndices: [],
    answered: false,
    chosenVi: null,
    opened: 1,
  };
  if (q.variantlar) {
    p.order = q.nov === "dogru-yanlis" ? [0, 1] : shuffle(range(q.variantlar.length));
  }
  if (q.nov === "uygunlasdir" && q.cutler) {
    p.right = shuffledNotIdentity(q.cutler.length);
    p.assign = q.cutler.map(() => null);
    p.selL = null;
    p.selR = null;
  }
  if ((q.nov === "zaman-lenti" || q.nov === "sujet-zenciri") && q.siralama) {
    p.ord = shuffledNotIdentity(q.siralama.length);
    p.sel = null;
  }
  return p;
}

export function poolFor(
  bank: Question[],
  disabled: Record<string, boolean>,
  s: Pick<SetupState, "eras" | "dir" | "diff">
): Question[] {
  return bank.filter(
    (q) =>
      !disabled[q.id] &&
      q.nov !== "final" &&
      Boolean(TYPES[q.nov]) &&
      Boolean(s.eras[q.dovr]) &&
      (s.dir === "Qarışıq" || q.istiqamet === s.dir) &&
      (s.diff === "qarisiq" || q.cetinlik === s.diff)
  );
}

export function buildQueue(
  bank: Question[],
  disabled: Record<string, boolean>,
  s: SetupState
): Question[] {
  const pool = poolFor(bank, disabled, s);
  const N = Math.min(s.count, pool.length);
  const eras = ERAS.filter((e) => s.eras[e.key]).map((e) => e.key);
  const byEra: Record<string, Question[]> = {};
  eras.forEach((k) => {
    byEra[k] = [];
  });
  pool.forEach((q) => {
    if (byEra[q.dovr]) byEra[q.dovr].push(q);
  });

  function rrPicker(list: Question[]): Question[] {
    const by: Record<string, Question[]> = {};
    shuffle(list).forEach((q) => {
      (by[q.nov] = by[q.nov] || []).push(q);
    });
    const types = shuffle(Object.keys(by));
    if (by.test && types.length > 2) {
      types.splice(Math.floor(types.length / 2), 0, "test");
    }
    const out: Question[] = [];
    let more = true;
    while (more) {
      more = false;
      types.forEach((t) => {
        if (by[t]?.length) {
          out.push(by[t].pop()!);
          more = true;
        }
      });
    }
    return out;
  }

  const ordered: Record<string, Question[]> = {};
  const quota: Record<string, number> = {};
  eras.forEach((k) => {
    ordered[k] = rrPicker(byEra[k]);
    quota[k] = 0;
  });

  let left = N;
  let guard = 0;
  while (left > 0 && guard < 1000) {
    guard++;
    const avail = shuffle(eras.filter((k) => ordered[k].length > quota[k]));
    if (!avail.length) break;
    avail.forEach((k) => {
      if (left > 0) {
        quota[k]++;
        left--;
      }
    });
  }

  let queue: Question[] = [];
  eras.forEach((k) => {
    queue = queue.concat(ordered[k].slice(0, quota[k]));
  });
  return queue;
}

export function pickFinal(
  bank: Question[],
  disabled: Record<string, boolean>,
  s: SetupState,
  used: Question[]
): Question | null {
  const usedIds = new Set(used.map((q) => q.id));
  let f = bank.filter((q) => q.nov === "final" && !disabled[q.id] && s.eras[q.dovr]);
  if (!f.length) f = bank.filter((q) => q.nov === "final" && !disabled[q.id]);
  if (!f.length) {
    f = bank.filter(
      (q) =>
        q.nov === "test" &&
        q.cetinlik === "cetin" &&
        !disabled[q.id] &&
        !usedIds.has(q.id) &&
        s.eras[q.dovr]
    );
  }
  return f.length ? shuffle(f)[0] : null;
}

export const store = {
  get<T>(k: string, d: T): T {
    try {
      const v = window.localStorage.getItem(k);
      return v == null ? d : (JSON.parse(v) as T);
    } catch {
      return d;
    }
  },
  set(k: string, v: unknown): void {
    try {
      window.localStorage.setItem(k, JSON.stringify(v));
    } catch {
      // ignore storage quota errors
    }
  },
  del(k: string): void {
    try {
      window.localStorage.removeItem(k);
    } catch {
      // ignore
    }
  },
};
