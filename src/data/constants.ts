import type { Difficulty, EraKey, Question, QuestionType } from "../types/game";

export interface EraInfo {
  key: EraKey;
  short: string;
  color: string;
  names: string[];
}

export const ERAS: EraInfo[] = [
  {
    key: "Şifahi xalq ədəbiyyatı və qədim dövr",
    short: "Şifahi xalq ədəbiyyatı və qədim dövr",
    color: "#FF8A00",
    names: ["«Kitabi-Dədə Qorqud»"],
  },
  {
    key: "İntibah dövrü",
    short: "İntibah dövrü",
    color: "#10C98F",
    names: ["Nizami Gəncəvi"],
  },
  {
    key: "Orta əsrlər",
    short: "Orta əsrlər",
    color: "#9B6BFF",
    names: ["Nəsimi", "Xətayi", "Füzuli"],
  },
  {
    key: "Erkən yeni dövr",
    short: "Erkən yeni dövr",
    color: "#22B8F0",
    names: ["«Koroğlu»", "Vaqif"],
  },
  {
    key: "Maarifçi-realizm dövrü",
    short: "Maarifçi-realizm dövrü",
    color: "#FF4D7E",
    names: ["Zakir", "Axundzadə", "Aşıq Ələsgər", "S.Ə.Şirvani", "Vəzirov"],
  },
];

export const TYPES: Record<QuestionType, { name: string; color: string; ic: string }> = {
  test: { name: "Test", color: "#5B7CFF", ic: "?" },
  "dogru-yanlis": { name: "Doğru, yoxsa yanlış?", color: "#14B8A6", ic: "±" },
  uygunlasdir: { name: "Uyğunlaşdır", color: "#EC4899", ic: "⇄" },
  "zaman-lenti": { name: "Zaman lenti", color: "#F59E0B", ic: "⏳" },
  "sujet-zenciri": { name: "Süjet zənciri", color: "#F97316", ic: "⛓" },
  misra: { name: "Misra kimindir?", color: "#A855F7", ic: "❝" },
  "ipucu-kart": { name: "Kimdir bu sənətkar?", color: "#06B6D4", ic: "🃏" },
  final: { name: "Final sualı", color: "#EAB308", ic: "★" },
};

export const DIFF: Record<Difficulty, { name: string; pts: number; badgeBg: string }> = {
  asan: { name: "Asan", pts: 100, badgeBg: "#1E9E62" },
  orta: { name: "Orta", pts: 200, badgeBg: "#D98A00" },
  cetin: { name: "Çətin", pts: 300, badgeBg: "#D7334F" },
};

export const CARD_PTS = [400, 300, 200, 100];
export const TEAM_COLORS = ["#FF5D73", "#3FA9FF", "#FFC93C", "#3DDC97"];
export const LETTERS = ["A", "B", "C", "D"];
export const MULTI_TYPES: Partial<Record<QuestionType, boolean>> = {
  uygunlasdir: true,
  "zaman-lenti": true,
  "sujet-zenciri": true,
  "ipucu-kart": true,
};

export const ILL_KEYS = new Set([
  "dq",
  "qazan",
  "niz",
  "isk",
  "sig",
  "xet",
  "deh",
  "mcu",
  "lm",
  "kor",
  "vaq",
  "peri",
  "zak",
  "bs",
  "axu",
  "mj",
  "ak",
  "dag",
  "ele",
  "gq",
  "mf",
  "umumi",
]);

const ILL_ALIAS: Record<string, string> = {
  nes: "sig",
  fuz: "mcu",
  sas: "gq",
  vez: "mf",
};

const ILL_MATCH: [string, string][] = [
  ["Qorqud", "dq"],
  ["Qazan", "qazan"],
  ["İskəndər", "isk"],
  ["Nizami", "niz"],
  ["Sığmazam", "sig"],
  ["Nəsimi", "sig"],
  ["Dəhnamə", "deh"],
  ["Xətayi", "xet"],
  ["Leyli", "lm"],
  ["candan", "mcu"],
  ["Füzuli", "mcu"],
  ["Koroğlu", "kor"],
  ["Pəri", "peri"],
  ["Vaqif", "vaq"],
  ["Badi", "bs"],
  ["Zakir", "zak"],
  ["Jordan", "mj"],
  ["kəvakib", "ak"],
  ["Axundzadə", "axu"],
  ["Dağlar", "dag"],
  ["Ələsgər", "ele"],
  ["Guş", "gq"],
  ["Şirvani", "gq"],
  ["Fəxrəddin", "mf"],
  ["Vəzirov", "mf"],
];

export const ERA_ILL = ["dq", "isk", "lm", "kor", "mf"];

export const HERO_CARDS: [string, string][] = [
  ["dq", "«Kitabi-Dədə Qorqud»"],
  ["isk", "«İskəndərnamə»"],
  ["lm", "«Leyli və Məcnun»"],
  ["kor", "«Koroğlu»"],
  ["ak", "«Aldanmış kəvakib»"],
  ["mf", "«Müsibəti-Fəxrəddin»"],
];

export const ERA_GALLERY: [string, string][][] = [
  [
    ["dq", "«Kitabi-Dədə Qorqud»"],
    ["qazan", "«Salur Qazanın evinin yağmalandığı boy»"],
  ],
  [
    ["niz", "Nizami — «Xəmsə»"],
    ["isk", "«İskəndərnamə»"],
  ],
  [
    ["sig", "Nəsimi — «Sığmazam»"],
    ["deh", "Xətayi — «Dəhnamə»"],
    ["lm", "Füzuli — «Leyli və Məcnun»"],
  ],
  [
    ["kor", "«Koroğlu»"],
    ["peri", "Vaqif — «Pəri»"],
  ],
  [
    ["bs", "Zakir — «Badi-səba...»"],
    ["mj", "«Müsyö Jordan...»"],
    ["ak", "«Aldanmış kəvakib»"],
    ["dag", "Ələsgər — «Dağlar»"],
    ["gq", "S.Ə.Şirvani — «Guş qıl...»"],
    ["mf", "«Müsibəti-Fəxrəddin»"],
  ],
];

export function eraIndex(key: string): number {
  return ERAS.findIndex((e) => e.key === key);
}

export function illKey(q: Pick<Question, "id" | "eser" | "senetkar" | "dovr">): string {
  const p = String(q.id || "").split("-")[0];
  if (ILL_ALIAS[p]) return ILL_ALIAS[p];
  if (ILL_KEYS.has(p) && p !== "umumi") return p;
  const text = `${q.eser || ""} ${q.senetkar || ""}`;
  for (const [needle, key] of ILL_MATCH) {
    if (text.includes(needle)) return key;
  }
  if (p === "umumi") return "umumi";
  const ei = eraIndex(q.dovr);
  return ei >= 0 ? ERA_ILL[ei] : "umumi";
}

export function illCaption(q: Pick<Question, "eser" | "senetkar" | "dovr">): string {
  if (q.eser) return q.eser.includes("«") ? q.eser : `«${q.eser}»`;
  if (q.senetkar) return q.senetkar;
  const e = ERAS[eraIndex(q.dovr)];
  return e ? e.key : "Ədəbiyyat";
}
