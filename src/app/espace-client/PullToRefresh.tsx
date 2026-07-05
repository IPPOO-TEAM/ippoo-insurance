import { useEffect, useRef, useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const THRESHOLD = 70;
const MAX = 110;

export function PullToRefresh({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
    }
    function onTouchMove(e: TouchEvent) {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { setPull(0); return; }
      setPull(Math.min(MAX, dy * 0.5));
    }
    async function onTouchEnd() {
      if (startY.current == null) return;
      startY.current = null;
      if (pull >= THRESHOLD) {
        setRefreshing(true);
        try {
          await qc.refetchQueries({ type: "active" });
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pull, refreshing, qc]);

  return (
    <>
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-center pointer-events-none"
        style={{
          height: pull,
          transform: `translateY(${refreshing ? 16 : 0}px)`,
          transition: startY.current == null ? "all 0.25s ease" : "none",
        }}
      >
        <div className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center" style={{ opacity: Math.min(1, pull / THRESHOLD) }}>
          <RefreshCw className={`w-4 h-4 text-[#FF3B57] ${refreshing ? "animate-spin" : ""}`} style={{ transform: `rotate(${pull * 3}deg)` }} />
        </div>
      </div>
      <div
        style={
          pull > 0 || refreshing
            ? { transform: `translateY(${pull}px)`, transition: startY.current == null ? "transform 0.25s ease" : "none" }
            : undefined
        }
      >
        {children}
      </div>
    </>
  );
}
