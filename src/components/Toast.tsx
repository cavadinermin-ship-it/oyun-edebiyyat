interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 bottom-6 -translate-x-1/2 z-[60] bg-[#1e245c] border border-white/25 text-white px-5 py-3 rounded-2xl font-extrabold text-base shadow-[0_12px_30px_rgba(0,0,0,0.4)] animate-fadeIn"
    >
      {message}
    </div>
  );
}
