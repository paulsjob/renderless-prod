import React from "react";
import { BUILD } from "../build";

export function BuildBadge() {
  return (
    <div
      className="ml-2 px-2 py-1 rounded-md bg-black/20 border border-white/10 text-[11px] opacity-70 select-none"
      title={`Build updated: ${BUILD.updated}`}
    >
      Build: {BUILD.id}
    </div>
  );
}
