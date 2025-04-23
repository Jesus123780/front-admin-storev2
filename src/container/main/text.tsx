import { useEffect, useState } from "react";

/**
 * Animated counter similar to YouTube's view counter
 * @param {number} value - Final number to animate to
 * @param {number} duration - Total animation duration in ms
 */
export const AnimatedCounter = ({
  value,
  duration = 1500,
}: {
  value: number;
  duration?: number;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const startValue = displayValue;
    const diff = value - startValue;

    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const nextValue = Math.floor(startValue + diff * progress);
      setDisplayValue(nextValue);
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  const formatNumber = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {formatNumber(displayValue)}
    </span>
  );
};
