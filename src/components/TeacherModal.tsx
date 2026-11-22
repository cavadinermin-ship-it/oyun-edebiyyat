import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { DIFF, ERAS, TYPES } from "../data/constants";
import type {
  Difficulty,
  EraKey,
  GameSettings,
  Question,
  QuestionType,
} from "../types/game";
import { Sound } from "../utils/sound";

interface TeacherModalProps {
  open: boolean;
  onClose: () => void;
  bank: Question[];
  customIds: Set<string>;
  disabled: Record<string, boolean>;
  settings: GameSettings;
  onToggleQuestion: (id: string, enabled: boolean) => void;
  onBulkToggle: (ids: string[], enabled: boolean) => void;
  onDeleteCustom: (id: string) => void;
  onAddCustom: (q: Question) => void;
  onImportQuestions: (list: Question[]) => number;
  onResetBank: () => void;
  onUpdateSettings: (next: GameSettings) => void;
  onToast: (msg: string) => void;
}

type TeacherTab = "bank" | "add" | "io" | "set";

export function TeacherModal({
  open,
  onClose,
  bank,
  customIds,
  disabled,
  settings,
  onToggleQuestion,
  onBulkToggle,
  onDeleteCustom,
  onAddCustom,
  onImportQuestions,
  onResetBank,
  onUpdateSettings,
  onToast,
}: TeacherModalProps) {
  const [tab, setTab] = useState<TeacherTab>("bank");

  // Bank filter state
  const [fEra, setFEra] = useState<string>("");
  const [fType, setFType] = useState<string>("");
  const [fDiff, setFDiff] = useState<string>("");
  const [fText, setFText] = useState<string>("");

  // Add form state
  const [aEra, setAEra] = useState<EraKey>(ERAS[0].key);
  const [aDir, setADir] = useState<"Əsərlər" | "Sənətkarlar">("Əsərlər");
  const [aType, setAType] = useState<QuestionType>("test");
  const [aDiff, setADiff] = useState<Difficulty>("orta");
  const [aAuthor, setAAuthor] = useState("");
  const [aWork, setAWork] = useState("");
  const [aPage, setAPage] = useState("");
  const [aPrompt, setAPrompt] = useState("");
  const [aMisra, setAMisra] = useState("");
  const [aOpts, setAOpts] = useState<[string, string, string, string]>(["", "", "", ""]);
  const [aCorrect, setACorrect] = useState(0);
  const [aTfCorrect, setATfCorrect] = useState(0);
  const [aPairs, setAPairs] = useState<[string, string][]>([
    ["", ""],
    ["", ""],
    ["", ""],
    ["", ""],
  ]);
  const [aOrderItems, setAOrderItems] = useState<string[]>(["", "", "", ""]);
  const [aClues, setAClues] = useState<[string, string, string, string]>(["", "", "", ""]);
  const [aHint, setAHint] = useState("");
  const [aIzah, setAIzah] = useState("");

  // Import text
  const [importText, setImportText] = useState("");

  const filteredBank = useMemo(() => {
    const q = fText.trim().toLowerCase();
    return bank.filter((item) => {
      if (fEra && item.dovr !== fEra) return false;
      if (fType && item.nov !== fType) return false;
      if (fDiff && item.cetinlik !== fDiff) return false;
      if (q) {
        const hay = `${item.sual} ${item.senetkar || ""} ${item.eser || ""} ${item.izah || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bank, fEra, fType, fDiff, fText]);

  const activeCount = useMemo(
    () => bank.filter((q) => !disabled[q.id]).length,
    [bank, disabled]
  );

  if (!open) return null;

  const isFourOpt =
    aType === "test" || aType === "misra" || aType === "ipucu-kart" || aType === "final";

  function handleAddSubmit(e: FormEvent) {
    e.preventDefault();
    if (!aPrompt.trim()) {
      onToast("Sual mətnini daxil edin.");
      return;
    }

    const base: Question = {
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dovr: aEra,
      istiqamet: aDir,
      senetkar: aAuthor.trim() || null,
      eser: aWork.trim() || null,
      nov: aType,
      cetinlik: aType === "final" ? "cetin" : aDiff,
      sual: aPrompt.trim(),
      izah: aIzah.trim() || "Müəllim tərəfindən əlavə edilmiş sual.",
      sehife: aPage.trim() || null,
      ipucu: aHint.trim() || undefined,
    };

    if (isFourOpt) {
      if (aOpts.some((o) => !o.trim())) {
        onToast("Bütün 4 variantı doldurun.");
        return;
      }
      base.variantlar = aOpts.map((o) => o.trim());
      base.duzgun = aCorrect;
      if (aType === "misra" || (aType === "final" && aMisra.trim())) {
        base.misra = aMisra.trim() || undefined;
      }
      if (aType === "ipucu-kart") {
        if (aClues.some((c) => !c.trim())) {
          onToast("Bütün 4 ipucu kartını doldurun.");
          return;
        }
        base.ipuclari = aClues.map((c) => c.trim());
      }
    } else if (aType === "dogru-yanlis") {
      base.variantlar = ["Doğru", "Yanlış"];
      base.duzgun = aTfCorrect;
    } else if (aType === "uygunlasdir") {
      const validPairs = aPairs.filter(([l, r]) => l.trim() && r.trim());
      if (validPairs.length < 3) {
        onToast("Ən azı 3 uyğunlaşdırma cütü daxil edin.");
        return;
      }
      base.cutler = validPairs.map(([l, r]) => [l.trim(), r.trim()]);
    } else if (aType === "zaman-lenti" || aType === "sujet-zenciri") {
      const validOrder = aOrderItems.map((s) => s.trim()).filter(Boolean);
      if (validOrder.length < 3) {
        onToast("Ən azı 3 ardıcıllıq bəndi daxil edin.");
        return;
      }
      base.siralama = validOrder;
    }

    onAddCustom(base);
    setAPrompt("");
    setAMisra("");
    setAOpts(["", "", "", ""]);
    setAClues(["", "", "", ""]);
    setAHint("");
    setAIzah("");
    setTab("bank");
  }

  function handleExportJson() {
    const data = JSON.stringify(bank, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "soz-senetimiz-sual-banki.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onToast("Sual bankı JSON faylı kimi endirildi.");
  }

  function handleFileImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "[]"));
        if (!Array.isArray(parsed)) throw new Error("Array deyil");
        const added = onImportQuestions(parsed as Question[]);
        onToast(`${added} sual əlavə edildi / yeniləndi.`);
      } catch {
        onToast("JSON faylı oxunmadı — formatı yoxlayın.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleTextImport() {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error("Array deyil");
      const added = onImportQuestions(parsed as Question[]);
      setImportText("");
      onToast(`${added} sual əlavə edildi / yeniləndi.`);
    } catch {
      onToast("JSON mətni düzgün deyil.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#050819]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Müəllim paneli"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[1100px] max-h-[90vh] flex flex-col rounded-[28px] bg-[#141744] border border-white/20 shadow-2xl overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--line)] bg-white/5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black m-0">✎ Müəllim paneli</h2>
            <p className="text-sm text-[#c9d1ff] m-0">
              Aktiv suallar: <b className="text-white tabular-nums">{activeCount}</b> / {bank.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              Sound.click();
              onClose();
            }}
            className="w-10 h-10 rounded-xl border border-[var(--line)] bg-white/10 hover:bg-white/20 text-white text-xl font-black"
            aria-label="Bağla"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-[var(--line)] bg-white/[0.03]">
          {(
            [
              ["bank", `Sual bankı (${bank.length})`],
              ["add", "＋ Yeni sual"],
              ["io", "⇅ İxrac / İdxal"],
              ["set", "⚙ Parametrlər"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                Sound.click();
                setTab(key);
              }}
              className={`rounded-xl px-4 py-2 text-sm sm:text-base font-extrabold border-2 transition-colors ${
                tab === key
                  ? "bg-[#FFC93C] border-[#FFC93C] text-[#1f1300]"
                  : "bg-white/8 border-[var(--line)] text-white hover:bg-white/15"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "bank" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <select
                  value={fEra}
                  onChange={(e) => setFEra(e.target.value)}
                  className="rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                >
                  <option value="">Bütün dövrlər</option>
                  {ERAS.map((e) => (
                    <option key={e.key} value={e.key}>
                      {e.key}
                    </option>
                  ))}
                </select>
                <select
                  value={fType}
                  onChange={(e) => setFType(e.target.value)}
                  className="rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                >
                  <option value="">Bütün növlər</option>
                  {Object.entries(TYPES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.ic} {v.name}
                    </option>
                  ))}
                </select>
                <select
                  value={fDiff}
                  onChange={(e) => setFDiff(e.target.value)}
                  className="rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                >
                  <option value="">Bütün çətinliklər</option>
                  {Object.entries(DIFF).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <input
                  type="search"
                  value={fText}
                  onChange={(e) => setFText(e.target.value)}
                  placeholder="Axtarış (sual, əsər, müəllif)…"
                  className="rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white placeholder:text-white/45"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-[#c9d1ff] font-bold">
                  Tapıldı: <b className="text-white tabular-nums">{filteredBank.length}</b> sual
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onBulkToggle(
                        filteredBank.map((q) => q.id),
                        true
                      )
                    }
                    className="rounded-xl px-3.5 py-1.5 text-sm font-extrabold bg-[#21D07A]/20 border border-[#21D07A]/50 text-[#8BFFCA] hover:bg-[#21D07A]/30"
                  >
                    Görünənləri yandır
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onBulkToggle(
                        filteredBank.map((q) => q.id),
                        false
                      )
                    }
                    className="rounded-xl px-3.5 py-1.5 text-sm font-extrabold bg-[#FF4D6A]/20 border border-[#FF4D6A]/50 text-[#FF9AAE] hover:bg-[#FF4D6A]/30"
                  >
                    Görünənləri söndür
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-white/10 text-[#c9d1ff]">
                    <tr>
                      <th className="p-3">Aktiv</th>
                      <th className="p-3">Növ</th>
                      <th className="p-3">Dövr / Müəllif</th>
                      <th className="p-3">Sual</th>
                      <th className="p-3">Çətinlik</th>
                      <th className="p-3 text-right">Əməliyyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBank.slice(0, 200).map((q) => {
                      const isEnabled = !disabled[q.id];
                      const tp = TYPES[q.nov];
                      const df = DIFF[q.cetinlik];
                      const isCustom = customIds.has(q.id);

                      return (
                        <tr
                          key={q.id}
                          className={`border-t border-white/10 ${
                            isEnabled ? "" : "opacity-50"
                          }`}
                        >
                          <td className="p-3">
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => onToggleQuestion(q.id, e.target.checked)}
                              />
                              <span />
                            </label>
                          </td>
                          <td className="p-3 whitespace-nowrap font-bold">
                            <span
                              className="px-2 py-0.5 rounded-lg text-xs text-white"
                              style={{ background: tp?.color || "#5B7CFF" }}
                            >
                              {tp?.ic} {tp?.name || q.nov}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-[#c9d1ff]">
                            <div className="font-bold text-white">{q.senetkar || q.eser || "—"}</div>
                            <div>{q.dovr}</div>
                          </td>
                          <td className="p-3 max-w-[380px]">
                            <div className="font-semibold line-clamp-2">{q.sual}</div>
                            {q.sehife && (
                              <div className="text-xs text-[#c9d1ff]">s. {q.sehife}</div>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className="px-2 py-0.5 rounded-lg text-xs font-bold text-white"
                              style={{ background: df?.badgeBg || "#666" }}
                            >
                              {df?.name || q.cetinlik}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => onDeleteCustom(q.id)}
                                className="rounded-lg px-2.5 py-1 bg-[#FF4D6A]/25 hover:bg-[#FF4D6A]/45 text-[#FF9AAE] font-bold border-0"
                                title="Sil"
                              >
                                🗑
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredBank.length > 200 && (
                  <div className="p-3 text-center text-xs text-[#c9d1ff] bg-white/5">
                    İlk 200 nəticə göstərilir — daraltmaq üçün filtrlərdən istifadə edin.
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "add" && (
            <form onSubmit={handleAddSubmit} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#c9d1ff] mb-1">Dövr</label>
                  <select
                    value={aEra}
                    onChange={(e) => setAEra(e.target.value as EraKey)}
                    className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                  >
                    {ERAS.map((e) => (
                      <option key={e.key} value={e.key}>
                        {e.key}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#c9d1ff] mb-1">İstiqamət</label>
                  <select
                    value={aDir}
                    onChange={(e) => setADir(e.target.value as "Əsərlər" | "Sənətkarlar")}
                    className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                  >
                    <option value="Əsərlər">Əsərlər</option>
                    <option value="Sənətkarlar">Sənətkarlar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#c9d1ff] mb-1">Sual növü</label>
                  <select
                    value={aType}
                    onChange={(e) => setAType(e.target.value as QuestionType)}
                    className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                  >
                    {Object.entries(TYPES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.ic} {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#c9d1ff] mb-1">Çətinlik</label>
                  <select
                    value={aType === "final" ? "cetin" : aDiff}
                    disabled={aType === "final"}
                    onChange={(e) => setADiff(e.target.value as Difficulty)}
                    className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    <option value="asan">Asan (100)</option>
                    <option value="orta">Orta (200)</option>
                    <option value="cetin">Çətin (300)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#c9d1ff] mb-1">Sənətkar</label>
                  <input
                    type="text"
                    value={aAuthor}
                    onChange={(e) => setAAuthor(e.target.value)}
                    placeholder="Məs: Nizami Gəncəvi"
                    className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#c9d1ff] mb-1">Əsər</label>
                  <input
                    type="text"
                    value={aWork}
                    onChange={(e) => setAWork(e.target.value)}
                    placeholder="Məs: İskəndərnamə"
                    className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#c9d1ff] mb-1">Dərslik səhifəsi</label>
                  <input
                    type="text"
                    value={aPage}
                    onChange={(e) => setAPage(e.target.value)}
                    placeholder="Məs: 42-43"
                    className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#c9d1ff] mb-1">Sual mətni *</label>
                <textarea
                  rows={2}
                  value={aPrompt}
                  onChange={(e) => setAPrompt(e.target.value)}
                  placeholder="Sualı daxil edin…"
                  className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                />
              </div>

              {(aType === "misra" || aType === "final") && (
                <div>
                  <label className="block text-xs font-bold text-[#c9d1ff] mb-1">
                    Poetik misra / parça
                  </label>
                  <textarea
                    rows={2}
                    value={aMisra}
                    onChange={(e) => setAMisra(e.target.value)}
                    placeholder="Misraları daxil edin…"
                    className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                  />
                </div>
              )}

              {aType === "ipucu-kart" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#c9d1ff]">
                    4 İpucu kartı (ən çətindən ən asana)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {aClues.map((c, i) => (
                      <input
                        key={i}
                        type="text"
                        value={c}
                        onChange={(e) => {
                          const next = [...aClues] as [string, string, string, string];
                          next[i] = e.target.value;
                          setAClues(next);
                        }}
                        placeholder={`İpucu ${i + 1} (${[400, 300, 200, 100][i]} xal)`}
                        className="rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                      />
                    ))}
                  </div>
                </div>
              )}

              {isFourOpt && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#c9d1ff]">
                    4 Variant və düzgün cavab
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {aOpts.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="aCorrect"
                          checked={aCorrect === i}
                          onChange={() => setACorrect(i)}
                          className="accent-[#21D07A] w-4 h-4"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...aOpts] as [string, string, string, string];
                            next[i] = e.target.value;
                            setAOpts(next);
                          }}
                          placeholder={`Variant ${i + 1}`}
                          className="flex-1 rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aType === "dogru-yanlis" && (
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-bold text-[#c9d1ff]">Düzgün cavab:</span>
                  <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="aTf"
                      checked={aTfCorrect === 0}
                      onChange={() => setATfCorrect(0)}
                      className="accent-[#21D07A]"
                    />
                    Doğru
                  </label>
                  <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="aTf"
                      checked={aTfCorrect === 1}
                      onChange={() => setATfCorrect(1)}
                      className="accent-[#FF4D6A]"
                    />
                    Yanlış
                  </label>
                </div>
              )}

              {aType === "uygunlasdir" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#c9d1ff]">
                    Cütlüklər (Sol — Sağ)
                  </label>
                  {aPairs.map(([l, r], i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={l}
                        onChange={(e) => {
                          const next = aPairs.map((p, pi) =>
                            pi === i ? ([e.target.value, p[1]] as [string, string]) : p
                          );
                          setAPairs(next);
                        }}
                        placeholder={`Sol ${i + 1}`}
                        className="rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                      />
                      <input
                        type="text"
                        value={r}
                        onChange={(e) => {
                          const next = aPairs.map((p, pi) =>
                            pi === i ? ([p[0], e.target.value] as [string, string]) : p
                          );
                          setAPairs(next);
                        }}
                        placeholder={`Sağ ${i + 1}`}
                        className="rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                      />
                    </div>
                  ))}
                </div>
              )}

              {(aType === "zaman-lenti" || aType === "sujet-zenciri") && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#c9d1ff]">
                    Düzgün ardıcıllıq (1-dən başlayaraq)
                  </label>
                  {aOrderItems.map((val, i) => (
                    <input
                      key={i}
                      type="text"
                      value={val}
                      onChange={(e) => {
                        const next = [...aOrderItems];
                        next[i] = e.target.value;
                        setAOrderItems(next);
                      }}
                      placeholder={`Mərhələ ${i + 1}`}
                      className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#c9d1ff] mb-1">
                    İpucu (ixtiyari)
                  </label>
                  <input
                    type="text"
                    value={aHint}
                    onChange={(e) => setAHint(e.target.value)}
                    placeholder="İpucu mətni…"
                    className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#c9d1ff] mb-1">
                    İzah (cavabdan sonra göstərilir)
                  </label>
                  <input
                    type="text"
                    value={aIzah}
                    onChange={(e) => setAIzah(e.target.value)}
                    placeholder="Qısa izah…"
                    className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-sm font-bold text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="border-0 rounded-2xl px-6 py-3 text-base font-black bg-[#21D07A] hover:bg-[#19b86b] text-[#082214]"
              >
                ＋ Sualı banka əlavə et
              </button>
            </form>
          )}

          {tab === "io" && (
            <div className="space-y-5 max-w-2xl">
              <div className="rounded-2xl bg-white/6 border border-[var(--line)] p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-lg">Sual bankını ixrac et</div>
                  <div className="text-sm text-[#c9d1ff]">
                    Bütün sualları (.json) fayl kimi kompüterinizə yükləyin.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="border-0 rounded-xl px-4 py-2.5 text-sm font-black bg-[#3FA9FF] hover:bg-[#2d95eb] text-[#051a2e]"
                >
                  ⬇ JSON endir
                </button>
              </div>

              <div className="rounded-2xl bg-white/6 border border-[var(--line)] p-4 space-y-3">
                <div className="font-extrabold text-lg">JSON fayldan idxal et</div>
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={handleFileImport}
                  className="text-sm text-[#c9d1ff] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/15 file:text-white file:font-bold hover:file:bg-white/25"
                />
                <div className="text-xs text-[#c9d1ff]">Və ya JSON massivini aşağı yapışdırın:</div>
                <textarea
                  rows={4}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='[{"id":"...", "dovr":"...", ...}]'
                  className="w-full rounded-xl bg-[#0e1138] border border-[var(--line)] p-3 text-xs font-mono text-white"
                />
                <button
                  type="button"
                  disabled={!importText.trim()}
                  onClick={handleTextImport}
                  className="border-0 rounded-xl px-4 py-2 text-sm font-black bg-[#FFC93C] text-[#1f1300] disabled:opacity-40"
                >
                  ⬆ Mətndən idxal et
                </button>
              </div>

              <div className="rounded-2xl bg-[#FF4D6A]/10 border border-[#FF4D6A]/40 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-lg text-[#FF9AAE]">
                    Orijinal banka qayıt
                  </div>
                  <div className="text-sm text-[#c9d1ff]">
                    Əlavə edilmiş sualları və söndürmə parametrlərini sıfırlayır.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onResetBank}
                  className="border-0 rounded-xl px-4 py-2.5 text-sm font-black bg-[#E8384F] hover:bg-[#d32b42] text-white"
                >
                  ↺ Orijinal banka qayıt
                </button>
              </div>
            </div>
          )}

          {tab === "set" && (
            <div className="space-y-4 max-w-xl">
              <div className="rounded-2xl bg-white/6 border border-[var(--line)] p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-extrabold text-lg">Vaxt sayğacı</div>
                  <div className="text-sm text-[#c9d1ff]">Hər sual üçün geri sayım aktiv olsun</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.timerOn}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, timerOn: e.target.checked })
                    }
                  />
                  <span />
                </label>
              </div>

              <div className="rounded-2xl bg-white/6 border border-[var(--line)] p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-extrabold text-lg">Sual vaxtı (saniyə)</div>
                  <div className="text-sm text-[#c9d1ff]">
                    Uyğunlaşdırma və ardıcıllıq suallarında 1.5× tətbiq olunur
                  </div>
                </div>
                <input
                  type="number"
                  min={10}
                  max={180}
                  step={5}
                  value={settings.timerSec}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      timerSec: Math.max(10, Math.min(180, Number(e.target.value) || 45)),
                    })
                  }
                  className="w-24 rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-lg font-black text-center text-white tabular-nums"
                />
              </div>

              <div className="rounded-2xl bg-white/6 border border-[var(--line)] p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-extrabold text-lg">Susmaya görə sual sayı</div>
                  <div className="text-sm text-[#c9d1ff]">Oyun başlayanda seçilən standart say</div>
                </div>
                <select
                  value={settings.count}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      count: Number(e.target.value) as 10 | 20 | 30,
                    })
                  }
                  className="rounded-xl bg-[#0e1138] border border-[var(--line)] px-3 py-2 text-base font-black text-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </select>
              </div>

              <div className="rounded-2xl bg-white/6 border border-[var(--line)] p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-extrabold text-lg">Səs effektləri</div>
                  <div className="text-sm text-[#c9d1ff]">Düymə, düzgün/səhv və zəfər səsləri</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.sound}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, sound: e.target.checked })
                    }
                  />
                  <span />
                </label>
              </div>

              <div className="rounded-2xl bg-white/6 border border-[var(--line)] p-4 text-sm text-[#c9d1ff] space-y-1">
                <div className="font-extrabold text-white text-base mb-1">Xal hesablama qaydası</div>
                <div>• Asan: 100 xal · Orta: 200 xal · Çətin: 300 xal</div>
                <div>• «Kimdir bu sənətkar?»: açılan kartlara görə 400 / 300 / 200 / 100 xal</div>
                <div>• Sürət bonusu: ilk 10 saniyədə düzgün cavaba +50 xal</div>
                <div>• Seriya bonusu: hər 3 ardıcıl düzgün cavaba +100 xal</div>
                <div>• İpucu jokeri xalı 50% azaldır</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
