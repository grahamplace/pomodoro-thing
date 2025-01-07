import { DeskThing, SocketData } from "deskthing-client";
import { coerceSettings, requirePomodoroContext } from "../util";
import { useEffect, useState } from "react";
import { PomodoroSettings } from "../types";
import {
  BREAK_MINUTES,
  COLOR_A_DEFAULT,
  COLOR_B_DEFAULT,
  IS_DEV,
  LONG_BREAK_MINUTES,
  NUM_SESSIONS,
  SESSION_MINUTES,
} from "../constants";

const DEFAULT_SETTINGS = {
  devMode: IS_DEV,
  numSessions: NUM_SESSIONS,
  sessionMinutes: SESSION_MINUTES,
  shortBreakMinutes: BREAK_MINUTES,
  longBreakMinutes: LONG_BREAK_MINUTES,
  audioEnabled: true,
  colorA: COLOR_A_DEFAULT,
  colorB: COLOR_B_DEFAULT,
};

export default function ConfigBridge() {
  const [data, setData] = useState<any>(null);
  const [hasReceivedUpdate, setHasReceivedUpdate] = useState<boolean>(false);
  const p = requirePomodoroContext();

  const setCssProperty = (property: string, value: string) => {
    const root = document.documentElement;
    root.style.setProperty(property, value);
  };

  const handleSettings = (
    source: "initial" | "update",
    settings: PomodoroSettings
  ) => {
    setCssProperty("--themeA", settings.colorA);
    setCssProperty("--themeB", settings.colorB);
    p.handleSettingsChange(settings);
    setData(JSON.stringify({ source, ...settings }, undefined, 2));
  };

  const handleError = () => {};

  // Initial settings are configured by a proactive call to the server to fetch settings data on mount:
  useEffect(() => {
    const fetchSettingsFromServer = async () => {
      setData("fetchSettingsFromServer: fetching data");
      const serverData = await DeskThing.fetchData<SocketData>(
        "initial-settings",
        {
          type: "get",
          request: "initial-settings",
        }
      );
      let settings = DEFAULT_SETTINGS;
      if (serverData) {
        settings = coerceSettings(serverData, handleError);
      }
      handleSettings("initial", settings);
      p.setTimeLeftSec(settings.sessionMinutes * 60);
      p.setIsPaused(false);
    };

    fetchSettingsFromServer();
  }, []);

  useEffect(() => {
    // Settings changes saved while running are sent from the server to the client:
    DeskThing.on("settings-update", (data) => {
      setHasReceivedUpdate(true);
      handleSettings("update", coerceSettings(data.payload, handleError));
    });
  });

  return p.settings?.devMode ? (
    <div className="h-[250px] text-black bg-white">
      <p>Has received update: {hasReceivedUpdate ? "true" : "false"}</p>
      <pre>
        <code>{data}</code>
      </pre>
    </div>
  ) : (
    <></>
  );
}
