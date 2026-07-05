import type { CSSProperties } from "react";

const base: CSSProperties = {
  background: "linear-gradient(90deg,#EEF0F4 0%,#F7F8FB 50%,#EEF0F4 100%)",
  backgroundSize: "200% 100%",
  animation: "ippooShimmer 1.4s ease-in-out infinite",
};

export function Skeleton({ className, style, w, h, rounded = "rounded-lg" }: {
  className?: string;
  style?: CSSProperties;
  w?: string | number;
  h?: string | number;
  rounded?: string;
}) {
  return (
    <div
      className={`${rounded} ${className ?? ""}`}
      style={{ ...base, width: w, height: h, ...style }}
    />
  );
}

export function SkeletonStyles() {
  return (
    <style>{`@keyframes ippooShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
  );
}

export function ListCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Skeleton w={44} h={44} rounded="rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton h={14} w="60%" />
            <Skeleton h={10} w="40%" />
          </div>
        </div>
        <Skeleton w={68} h={22} rounded="rounded-full" />
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton w={40} h={40} rounded="rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton h={12} w="35%" />
          <Skeleton h={10} w="55%" />
        </div>
      </div>
      <Skeleton w={60} h={22} rounded="rounded-full" />
    </div>
  );
}
