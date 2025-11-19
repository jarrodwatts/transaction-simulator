import { useEffect, useRef, useState } from "react";

export function useAnimatedCounter(
  targetValue: number,
  duration: number = 300
): number {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const rafRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);
  const startValueRef = useRef(targetValue);

  useEffect(() => {
    // If target hasn't changed, don't animate
    if (displayValue === targetValue) {
      return;
    }

    startValueRef.current = displayValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const current = Math.round(
        startValueRef.current + (targetValue - startValueRef.current) * easeProgress
      );

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}

