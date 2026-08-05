"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cx } from "@/lib/format";

type Choice = "light" | "dark" | "system";

const STORAGE_KEY = "rims-theme";
const CHANGED = "rims-theme-changed";

const CHOICES: { value: Choice; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Match system", icon: Monitor },
];

/* The stored preference is browser state, so it is read as an external store
   rather than copied into React state inside an effect. */
function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMediaChange = () => {
    if (readChoice() === "system") applyChoice("system");
    onChange();
  };
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  media.addEventListener("change", onMediaChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
    media.removeEventListener("change", onMediaChange);
  };
}

function readChoice(): Choice {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

/** The server has no preference to read, so it renders the neutral option and
 *  the inline bootstrap script has already painted the right colours. */
const serverChoice = (): Choice => "system";

function applyChoice(choice: Choice) {
  const dark =
    choice === "dark" ||
    (choice === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

/**
 * Warehouse floors are bright and back offices are not, so the theme is a
 * setting rather than a guess. "Match system" keeps following the OS.
 */
export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, readChoice, serverChoice);

  function pick(next: Choice) {
    localStorage.setItem(STORAGE_KEY, next);
    applyChoice(next);
    window.dispatchEvent(new Event(CHANGED));
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded-md border border-line bg-inset p-0.5"
    >
      {CHOICES.map(({ value, label, icon: Icon }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => pick(value)}
            className={cx(
              "flex size-7 cursor-pointer items-center justify-center rounded transition-colors duration-150",
              active
                ? "bg-surface text-fg shadow-[0_1px_2px_rgb(11_22_34/0.12)]"
                : "text-faint hover:text-fg",
            )}
          >
            <Icon size={14} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
