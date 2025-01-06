import { createContext, ReactNode, useContext, useState } from "react";
import { BreakType, TimerMode } from "../types";
import {
  BREAK_SECONDS,
  LONG_BREAK_SECONDS,
  NUM_SESSIONS,
  SESSION_SECONDS,
} from "../constants";

// TODO: figure out what we can use storage-wise on DeskThing Client, or get this from Server to avoid losing state
export interface PomodoroContextType {
  totalSessions: number;
  currentSession: number;
  setCurrentSession: React.Dispatch<React.SetStateAction<number>>;
  currentMode: TimerMode;
  setCurrentMode: React.Dispatch<React.SetStateAction<TimerMode>>;
  isPaused: boolean;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  timeLeftSec: number;
  setTimeLeftSec: React.Dispatch<React.SetStateAction<number>>;
  isComplete: boolean;
  setIsComplete: React.Dispatch<React.SetStateAction<boolean>>;
  handlePause: () => void;
  handlePrevious: () => void;
  handleNext: () => void;
  handleReset: () => void;
}

export const PomodoroContext = createContext<PomodoroContextType | null>(null);

export const usePomodoroContext = () => useContext(PomodoroContext);

interface PomodoroProviderProps {
  totalSessions?: number;
  children: ReactNode;
}

export const PomodoroProvider: React.FC<PomodoroProviderProps> = ({
  totalSessions = NUM_SESSIONS,
  children,
}) => {
  const [currentSession, setCurrentSession] = useState<number>(0);
  const [currentMode, setCurrentMode] = useState<TimerMode | BreakType>(
    "session"
  );
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(SESSION_SECONDS);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  function handlePause() {
    setIsPaused((prev) => !prev);
  }

  function startSession(sessionNum: number) {
    setIsComplete(false);
    setCurrentMode("session");
    setCurrentSession(Math.max(sessionNum, 0));
    setTimeLeftSec(SESSION_SECONDS);
  }

  function startBreak(sessionNum: number, breakType: BreakType) {
    setCurrentSession(Math.max(sessionNum, 0));
    setIsComplete(false);
    setCurrentMode(breakType);
    switch (breakType) {
      case "short-break":
        setTimeLeftSec(BREAK_SECONDS);
        break;
      case "long-break":
        setTimeLeftSec(LONG_BREAK_SECONDS);
        break;
      default:
        throw new Error("Unimplemented breakType");
    }
  }

  function endLongBreak() {
    setTimeLeftSec(0);
    setIsComplete(true);
  }

  function resetCurrent() {
    setIsComplete(false);
    switch (currentMode) {
      case "session":
        startSession(currentSession);
        break;
      case "long-break":
      case "short-break":
        startBreak(currentSession, currentMode);
        break;
    }
  }

  const handlePrevious = () => {
    // Special case: left click on first session ALWAYS ONLY restarts first session
    if (currentMode === "session" && currentSession === 0) {
      resetCurrent();
      return;
    }
    // If pressed at start of a break, go back one session (this handles "double click" behavior)
    if (
      (currentMode === "short-break" && timeLeftSec === BREAK_SECONDS) ||
      (currentMode === "long-break" && timeLeftSec === LONG_BREAK_SECONDS)
    ) {
      startSession(currentSession - 1);
      return;
    }

    // If pressed at start of a session, go back one break (this handles "double click" behavior)
    if (currentMode === "session" && timeLeftSec === SESSION_SECONDS) {
      startBreak(currentSession - 1, "short-break"); // You can never go backwards from session to long break, since there is no session after long break
      return;
    }

    // Otherwise, restart current
    resetCurrent();
  };

  const handleNext = () => {
    // Case 1: right click during session. Go to next break
    if (currentMode === "session") {
      startBreak(
        currentSession,
        currentSession === totalSessions - 1 ? "long-break" : "short-break"
      );
    }
    // Case 2: right click on any short break. Go to next session
    else if (currentMode === "short-break") {
      startSession(currentSession + 1);
    }
    // Case 3: when long break ends, overall session is complete
    else if (currentMode === "long-break") {
      endLongBreak();
    } else {
      console.error("Unhandled handleNext state");
    }
  };

  const handleReset = () => {
    startSession(0);
    setIsPaused(false);
  };

  return (
    <PomodoroContext.Provider
      value={{
        totalSessions: NUM_SESSIONS,
        currentSession,
        setCurrentSession,
        currentMode,
        setCurrentMode,
        isPaused,
        setIsPaused,
        timeLeftSec,
        setTimeLeftSec,
        isComplete,
        setIsComplete,
        handlePause,
        handlePrevious,
        handleNext,
        handleReset,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};
