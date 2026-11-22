import { illCaption, illKey } from "../data/constants";
import type { Question } from "../types/game";

export function IllustrationSvg({ illId }: { illId: string }) {
  return (
    <svg viewBox="0 0 240 160" role="img" aria-hidden="true" className="block w-full h-auto rounded-2xl shadow-[0_12px_26px_rgba(0,0,0,0.38)]">
      <use href={`#il-${illId}`} />
    </svg>
  );
}

export function IllustrationRibbon({
  items,
  className = "",
}: {
  items: [string, string][];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div
      className={`flex gap-4 justify-start sm:justify-center mx-auto overflow-x-auto px-1.5 pt-2 pb-3 snap-x snap-mandatory ${className}`}
    >
      {items.map(([id, caption], idx) => (
        <figure
          key={`${id}-${idx}`}
          className="ill-ribbon-card flex-none w-[clamp(140px,13.5vw,196px)] m-0 text-center snap-center transition-transform duration-200"
        >
          <IllustrationSvg illId={id} />
          <figcaption className="text-sm font-bold mt-2 text-[#e6e9ff] leading-tight">
            {caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function QuestionIllustration({
  q,
  small = false,
}: {
  q: Pick<Question, "id" | "eser" | "senetkar" | "dovr">;
  small?: boolean;
}) {
  const key = illKey(q);
  const caption = illCaption(q);
  return (
    <figure
      key={`${q.id}-${key}`}
      className={`animate-popIn flex-none text-center max-sm:order-[-1] max-sm:w-[118px] max-sm:self-end max-sm:mb-1 ${
        small ? "w-[clamp(100px,9vw,140px)]" : "w-[clamp(120px,12vw,185px)]"
      } mt-0.5 mb-2.5`}
    >
      <IllustrationSvg illId={key} />
      <figcaption className="max-sm:hidden text-[12.5px] font-bold text-[#c9d1ff] mt-1.5 leading-snug">
        {caption}
      </figcaption>
    </figure>
  );
}
