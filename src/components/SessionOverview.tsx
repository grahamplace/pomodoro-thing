import type { TimerMode } from "../types";
import { clsx } from "clsx";
import { requirePomodoroContext } from "../util";

export default function SessionOverview({}) {
  const p = requirePomodoroContext();

  return (
    <div className="z-30 flex flex-col items-center ">
      <p className="text-4xl py-3">
        {getModeEmoji(p.currentMode, p.timeLeftSec)}
      </p>
      <div className="flex flex-row items-center space-x-2 ">
        {Array.from({ length: p.settings?.numSessions ?? 0 }).map((_, idx) => (
          <div
            key={idx}
            className={clsx(
              "rounded-full size-4 ring-white ring-1",
              idx <= p.currentSession ? "bg-white" : " bg-transparent",
              idx === p.currentSession && p.timeLeftSec !== 0 && "animate-pulse"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function getModeEmoji(mode: TimerMode, timeLeftSec: number): string {
  switch (mode) {
    case "long-break":
      return timeLeftSec === 0 ? "✅" : "🌴🌴🌴";
    case "short-break":
      return "🌴";
    case "session":
      return "⚡️";
    default:
      return "error";
  }
}
