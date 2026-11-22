export type EraKey =
  | "Şifahi xalq ədəbiyyatı və qədim dövr"
  | "İntibah dövrü"
  | "Orta əsrlər"
  | "Erkən yeni dövr"
  | "Maarifçi-realizm dövrü";

export type Direction = "Əsərlər" | "Sənətkarlar" | "Qarışıq";

export type Difficulty = "asan" | "orta" | "cetin";

export type DifficultyFilter = Difficulty | "qarisiq";

export type QuestionType =
  | "test"
  | "dogru-yanlis"
  | "uygunlasdir"
  | "zaman-lenti"
  | "sujet-zenciri"
  | "misra"
  | "ipucu-kart"
  | "final";

export interface Question {
  id: string;
  dovr: EraKey | string;
  istiqamet: "Əsərlər" | "Sənətkarlar";
  senetkar: string | null;
  eser: string | null;
  nov: QuestionType;
  cetinlik: Difficulty;
  sual: string;
  izah: string;
  sehife: string | null;
  variantlar?: string[];
  duzgun?: number;
  misra?: string;
  ipuclari?: string[];
  cutler?: [string, string][];
  siralama?: string[];
  ipucu?: string;
}

export interface GameSettings {
  timerOn: boolean;
  timerSec: number;
  count: 10 | 20 | 30;
  sound: boolean;
}

export interface SetupState {
  mode: "team" | "solo";
  teams: string[];
  solo: string;
  dir: Direction;
  diff: DifficultyFilter;
  count: 10 | 20 | 30;
  eras: Record<string, boolean>;
}

export interface Team {
  name: string;
  color: string;
  score: number;
  streak: number;
  correct: number;
  wrong: number;
  jokers: {
    fifty: boolean;
    hint: boolean;
    time: boolean;
  };
}

export interface GameLogEntry {
  q: Question;
  team: number;
  correct: boolean;
}

export interface PreparedQuestion {
  q: Question;
  hint: boolean;
  fifty: boolean;
  goneIndices: number[];
  answered: boolean;
  chosenVi: number | null;
  opened: number;
  order?: number[];
  right?: number[];
  assign?: (number | null)[];
  selL?: number | null;
  selR?: number | null;
  ord?: number[];
  sel?: number | null;
}

export interface FeedbackState {
  ok: boolean;
  frac: number;
  pts: number;
  parts: string[];
  ansText: string;
  ansList?: string[];
  izah: string;
  page: string;
  teamName?: string;
  teamColor?: string;
  timeout?: boolean;
}

export type ActiveScreen = "start" | "game" | "final" | "results";
