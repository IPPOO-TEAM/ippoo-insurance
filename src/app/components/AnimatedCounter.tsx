import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

type Props = {
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function AnimatedCounter({ to, duration = 1800, suffix = "", prefix = "", className, style }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {value.toLocaleString("fr-FR")}
      {suffix}
    </span>
  );
}
