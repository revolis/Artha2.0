"use client";

import type { Transition } from "motion/react";
import {
  Children,
  type CSSProperties,
  isValidElement,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { Area, type AreaProps } from "./area";
import type { LineConfig, Margin } from "./chart-context";
import { ChartLoadingLabel } from "./chart-loading-label";
import {
  type ChartPhase,
  type ChartStatus,
  DEFAULT_CHART_STATUS,
  DEFAULT_Y_DOMAIN_TWEEN_MS,
  resolveRestingChartPhase,
} from "./chart-phase";
import { PatternArea } from "./pattern-area";
import { TimeSeriesChartInner } from "./time-series-chart-shell";

export interface AreaChartProps {
  /** Data array - each item should have a date field and numeric values */
  data: Record<string, unknown>[];
  /** Key in data for the x-axis (date). Default: "date" */
  xDataKey?: string;
  /** Chart margins */
  margin?: Partial<Margin>;
  /** Animation duration in milliseconds. Default: 1100 */
  animationDuration?: number;
  /** CSS easing for clip-reveal. Default: cubic-bezier(0.85, 0, 0.15, 1) */
  animationEasing?: string;
  /** Motion enter transition (spring or cubic-bezier tween). */
  enterTransition?: Transition;
  /** Signature of motion URL state — triggers reveal replay when it changes. */
  revealSignature?: string;
  /** Aspect ratio as "width / height". Default: "2 / 1" */
  aspectRatio?: string;
  /** Additional class name for the container */
  className?: string;
  /** Loading vs ready — drives chart phase and loading chrome. Default: `"ready"`. */
  status?: ChartStatus;
  /** Centered shimmer label while loading. */
  loadingLabel?: string;
  /** Animate y-domain over this duration (ms) on status transitions. Default: 500. */
  yDomainTweenDuration?: number;
  /** Animate y-domain when status or target domain changes. Default: true */
  yDomainTween?: boolean;
  /** Visible x-domain for brush zoom. */
  xDomain?: [Date, Date];
  /** Full dataset length for x-scale padding when `xDomain` is set. */
  xDomainSlotCount?: number;
  /** Tween y-domain when brush changes the visible x-range. Default: false */
  tweenYDomainOnXDomainChange?: boolean;
  /** Inline container styles (e.g. fixed height for brush strip). */
  style?: CSSProperties;
  /** Fires when the internal chart phase changes (e.g. OG capture readiness). */
  onPhaseChange?: (phase: ChartPhase) => void;
  /** Child components (Area, Grid, ChartTooltip, etc.) */
  children: ReactNode;
}

const DEFAULT_MARGIN: Margin = { top: 40, right: 40, bottom: 40, left: 40 };

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Measures the container. Replaces `@visx/responsive`'s ParentSize, which
 * relies solely on ResizeObserver — in environments where that never fires the
 * size stays 0 and the chart silently renders nothing. This measures once
 * synchronously on mount and then keeps ResizeObserver (plus a window-resize
 * fallback) for staying responsive.
 */
function useElementSize(ref: React.RefObject<HTMLDivElement | null>) {
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
    // The first measure can land before layout settles. Re-measure on the next
    // frame and shortly after so a zero reading self-corrects even where
    // ResizeObserver never fires.
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

function extractAreaConfigs(children: ReactNode): LineConfig[] {
  const configs: LineConfig[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    const childType = child.type as {
      displayName?: string;
      name?: string;
    };
    const componentName =
      typeof child.type === "function"
        ? childType.displayName || childType.name || ""
        : "";

    const props = child.props as AreaProps | undefined;
    const isPatternArea =
      componentName === "PatternArea" || child.type === PatternArea;
    const isAreaComponent =
      componentName === "Area" ||
      child.type === Area ||
      (props &&
        typeof props.dataKey === "string" &&
        props.dataKey.length > 0 &&
        !isPatternArea);

    if (isAreaComponent && props?.dataKey) {
      configs.push({
        dataKey: props.dataKey,
        stroke: props.stroke || props.fill || "var(--chart-line-primary)",
        strokeWidth: props.strokeWidth || 2,
        yAxisId: props.yAxisId,
      });
    }
  });

  return configs;
}

interface ChartInnerProps {
  width: number;
  height: number;
  data: Record<string, unknown>[];
  xDataKey: string;
  margin: Margin;
  animationDuration: number;
  animationEasing?: string;
  enterTransition?: Transition;
  revealSignature?: string;
  chartStatus: ChartStatus;
  loadingLabel?: string;
  yDomainTweenDuration: number;
  yDomainTween: boolean;
  xDomain?: [Date, Date];
  xDomainSlotCount?: number;
  tweenYDomainOnXDomainChange?: boolean;
  children: ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPhaseChange: (phase: ChartPhase) => void;
}

function ChartInner({
  width,
  height,
  data,
  xDataKey,
  margin,
  animationDuration,
  animationEasing,
  enterTransition,
  revealSignature,
  chartStatus,
  loadingLabel,
  yDomainTweenDuration,
  yDomainTween,
  xDomain,
  xDomainSlotCount,
  tweenYDomainOnXDomainChange,
  children,
  containerRef,
  onPhaseChange,
}: ChartInnerProps) {
  const lines = useMemo(() => extractAreaConfigs(children), [children]);

  return (
    <TimeSeriesChartInner
      animationDuration={animationDuration}
      animationEasing={animationEasing}
      chartStatus={chartStatus}
      clipPathId="chart-area-grow-clip"
      containerRef={containerRef}
      data={data}
      enterTransition={enterTransition}
      height={height}
      lines={lines}
      loadingLabel={loadingLabel}
      margin={margin}
      onPhaseChange={onPhaseChange}
      revealSignature={revealSignature}
      tweenYDomainOnXDomainChange={tweenYDomainOnXDomainChange}
      width={width}
      xDataKey={xDataKey}
      xDomain={xDomain}
      xDomainSlotCount={xDomainSlotCount}
      yDomainTween={yDomainTween}
      yDomainTweenDuration={yDomainTweenDuration}
    >
      {children}
    </TimeSeriesChartInner>
  );
}

export function AreaChart({
  data,
  xDataKey = "date",
  margin: marginProp,
  animationDuration = 1100,
  animationEasing,
  enterTransition,
  revealSignature,
  aspectRatio = "2 / 1",
  className = "",
  status = DEFAULT_CHART_STATUS,
  loadingLabel,
  yDomainTweenDuration = DEFAULT_Y_DOMAIN_TWEEN_MS,
  yDomainTween = true,
  xDomain,
  xDomainSlotCount,
  tweenYDomainOnXDomainChange = false,
  style,
  onPhaseChange,
  children,
}: AreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useElementSize(containerRef);
  const margin = { ...DEFAULT_MARGIN, ...marginProp };
  const [chartPhase, setChartPhase] = useState<ChartPhase>(() =>
    resolveRestingChartPhase(status)
  );
  const handlePhaseChange = useCallback(
    (phase: ChartPhase) => {
      setChartPhase(phase);
      onPhaseChange?.(phase);
    },
    [onPhaseChange]
  );

  const showLoadingLabel = Boolean(
    loadingLabel?.trim() &&
      (chartPhase === "loading" ||
        chartPhase === "exiting" ||
        chartPhase === "gridTweenReady" ||
        chartPhase === "revealingLoading")
  );

  return (
    <div
      className={cn("relative w-full", className)}
      ref={containerRef}
      style={{ aspectRatio, touchAction: "none", ...style }}
    >
      <ChartInner
        animationDuration={animationDuration}
        animationEasing={animationEasing}
        chartStatus={status}
        containerRef={containerRef}
        data={data}
        enterTransition={enterTransition}
        height={size.height}
        loadingLabel={loadingLabel}
        margin={margin}
        onPhaseChange={handlePhaseChange}
        revealSignature={revealSignature}
        tweenYDomainOnXDomainChange={tweenYDomainOnXDomainChange}
        width={size.width}
        xDataKey={xDataKey}
        xDomain={xDomain}
        xDomainSlotCount={xDomainSlotCount}
        yDomainTween={yDomainTween}
        yDomainTweenDuration={yDomainTweenDuration}
      >
        {children}
      </ChartInner>
      {showLoadingLabel ? (
        <ChartLoadingLabel
          exiting={chartPhase !== "loading"}
          text={loadingLabel}
        />
      ) : null}
    </div>
  );
}

export { Area, type AreaProps } from "./area";

export default AreaChart;
