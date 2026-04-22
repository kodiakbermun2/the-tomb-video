"use client";

import { useRouter } from "next/navigation";

type ProductBackButtonProps = {
  fallbackHref?: string;
};

export function ProductBackButton({ fallbackHref = "/" }: ProductBackButtonProps) {
  const router = useRouter();

  function onBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Go back"
      className="inline-flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-white/30 bg-black/60 text-zinc-100 transition hover:border-lime-300/70 hover:text-lime-300"
    >
      <span aria-hidden="true" className="text-xl leading-none">&larr;</span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]">Back</span>
    </button>
  );
}
