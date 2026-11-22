import { Sound } from "../utils/sound";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Təsdiqlə",
  cancelLabel = "Ləğv et",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#050819]/75 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[#151842] border border-white/20 p-6 shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className="text-xl font-black text-white m-0 mb-2">
          {title}
        </h3>
        <p className="text-[#c9d1ff] text-base leading-relaxed m-0 mb-6">{message}</p>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              Sound.click();
              onCancel();
            }}
            className="rounded-xl px-4 py-2.5 text-sm font-bold border border-[var(--line)] bg-white/8 hover:bg-white/15 text-white transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              Sound.click();
              onConfirm();
            }}
            className={`rounded-xl px-5 py-2.5 text-sm font-extrabold border-0 transition-colors ${
              danger
                ? "bg-[#E8384F] hover:bg-[#d32b42] text-white"
                : "bg-[#21D07A] hover:bg-[#19b86b] text-[#082214]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
