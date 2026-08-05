"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Measures a chart container. Replaces `@visx/responsive`'s ParentSize, which
 * relies solely on ResizeObserver — in environments where that never fires the
 * size stays 0 and the chart silently renders nothing at all. This measures
 * synchronously on mount, re-measures on the next frame and shortly after (so a
 * zero first reading self-corrects), and keeps ResizeObserver plus a
 * window-resize fallback for staying responsive.
 */
export function useElementSize(ref: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const measure = () => {
      const rect = element.getBoundingClientRect();
      setSize((previous) =>
        Math.abs(previous.width - rect.width) < 0.5 &&
        Math.abs(previous.height - rect.height) < 0.5
          ? previous
          : { width: rect.width, height: rect.height }
      );
    };

    measure();
    const frame = requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 150);

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(element);
    }
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref]);

  return size;
}
