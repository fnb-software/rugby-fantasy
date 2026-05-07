"use client";
import { useMemo, useState } from "react";
import { matchesName } from "../statsUtil";
import {
  entryName,
  entryUncertain,
  type Teamsheet,
  type TeamsheetEntry,
} from "../teamsheets";

type EditableEntry = { name: string; uncertain: boolean };
type ClubTeamsheet = { starters: EditableEntry[]; subs: EditableEntry[] };
type Editable = Record<string, ClubTeamsheet>;

const toEditable = (ts: Teamsheet): ClubTeamsheet => ({
  starters: ts.starters.map((e) => ({
    name: entryName(e),
    uncertain: entryUncertain(e),
  })),
  subs: ts.subs.map((e) => ({
    name: entryName(e),
    uncertain: entryUncertain(e),
  })),
});

const initialFrom = (
  saved: Record<string, Teamsheet>,
  clubs: string[],
): Editable => {
  const out: Editable = {};
  for (const club of clubs) {
    const ts = saved[club];
    out[club] = ts ? toEditable(ts) : { starters: [], subs: [] };
  }
  return out;
};

const TeamsheetsEditor = ({
  round,
  clubs,
  players,
  initial,
}: {
  round: number;
  clubs: string[];
  players: { nom: string; nomcomplet: string; club: string }[];
  initial: Record<string, Teamsheet>;
}) => {
  const [data, setData] = useState<Editable>(() =>
    initialFrom(initial, clubs),
  );
  const [input, setInput] = useState("");
  const [extractStatus, setExtractStatus] = useState<
    "idle" | "extracting" | "error"
  >("idle");
  const [extractError, setExtractError] = useState<string | null>(null);
  const [fetchErrors, setFetchErrors] = useState<
    { url: string; reason: string }[]
  >([]);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const playersByClub = useMemo(() => {
    const map = new Map<string, typeof players>();
    for (const p of players) {
      if (!map.has(p.club)) map.set(p.club, []);
      map.get(p.club)!.push(p);
    }
    return map;
  }, [players]);

  const isMatched = (club: string, name: string): boolean => {
    if (!name.trim()) return false;
    const list = playersByClub.get(club) ?? [];
    return list.some((p) => matchesName(p, name));
  };

  const updateEntry = (
    club: string,
    section: "starters" | "subs",
    index: number,
    patch: Partial<EditableEntry>,
  ) => {
    setSaveStatus("idle");
    setData((prev) => {
      const cur = prev[club] ?? { starters: [], subs: [] };
      const next = [...cur[section]];
      next[index] = { ...next[index], ...patch };
      return { ...prev, [club]: { ...cur, [section]: next } };
    });
  };

  const addEntry = (club: string, section: "starters" | "subs") => {
    setSaveStatus("idle");
    setData((prev) => {
      const cur = prev[club] ?? { starters: [], subs: [] };
      return {
        ...prev,
        [club]: {
          ...cur,
          [section]: [...cur[section], { name: "", uncertain: false }],
        },
      };
    });
  };

  const removeEntry = (
    club: string,
    section: "starters" | "subs",
    index: number,
  ) => {
    setSaveStatus("idle");
    setData((prev) => {
      const cur = prev[club] ?? { starters: [], subs: [] };
      return {
        ...prev,
        [club]: {
          ...cur,
          [section]: cur[section].filter((_, i) => i !== index),
        },
      };
    });
  };

  const onExtract = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setExtractStatus("error");
      setExtractError("Paste URLs or content first");
      return;
    }
    const firstLine = trimmed.split(/\r?\n/, 1)[0]!.trim();
    const isUrlMode = /^https?:\/\//i.test(firstLine);
    const urlList = isUrlMode
      ? trimmed
          .split(/\s+/)
          .map((u) => u.trim())
          .filter(Boolean)
      : [];
    const textList = isUrlMode ? [] : [trimmed];
    setExtractStatus("extracting");
    setExtractError(null);
    setFetchErrors([]);
    try {
      const res = await fetch("/api/admin/teamsheets/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls: urlList, texts: textList, round }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as {
        teamsheets: Record<
          string,
          {
            starters: { name: string; uncertain: boolean }[];
            subs: { name: string; uncertain: boolean }[];
          }
        >;
        fetchErrors: { url: string; reason: string }[];
      };
      setFetchErrors(body.fetchErrors);
      setData((prev) => {
        const next = { ...prev };
        for (const [club, ts] of Object.entries(body.teamsheets)) {
          next[club] = {
            starters: ts.starters.map(({ name, uncertain }) => ({
              name,
              uncertain,
            })),
            subs: ts.subs.map(({ name, uncertain }) => ({ name, uncertain })),
          };
        }
        return next;
      });
      setExtractStatus("idle");
      setSaveStatus("idle");
    } catch (e) {
      setExtractStatus("error");
      setExtractError(e instanceof Error ? e.message : "extract_failed");
    }
  };

  const onSave = async () => {
    setSaveStatus("saving");
    setSaveError(null);
    const payload: Record<string, Teamsheet> = {};
    for (const [club, ts] of Object.entries(data)) {
      const starters = ts.starters
        .filter((e) => e.name.trim())
        .map(
          (e): TeamsheetEntry =>
            e.uncertain
              ? { name: e.name.trim(), uncertain: true }
              : e.name.trim(),
        );
      const subs = ts.subs
        .filter((e) => e.name.trim())
        .map(
          (e): TeamsheetEntry =>
            e.uncertain
              ? { name: e.name.trim(), uncertain: true }
              : e.name.trim(),
        );
      if (starters.length === 0 && subs.length === 0) continue;
      payload[club] = { starters, subs };
    }
    try {
      const res = await fetch("/api/admin/teamsheets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ round, teamsheets: payload }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setSaveStatus("saved");
    } catch (e) {
      setSaveStatus("error");
      setSaveError(e instanceof Error ? e.message : "save_failed");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">Teamsheets — round {round}</h2>

      <div className="flex flex-col gap-2 border rounded p-3 bg-slate-50">
        <label className="text-sm font-semibold">
          Paste URLs (one per line) — or paste lineup text directly if the
          source is paywalled
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          className="border rounded p-2 text-sm font-mono"
          placeholder="https://www.midi-olympique.fr/...&#10;https://www.allrugby.com/...&#10;&#10;…or paste the lineup text directly (anything that doesn&rsquo;t start with http(s):// is treated as content)."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={onExtract}
            disabled={extractStatus === "extracting"}
            className="rounded px-3 py-1 bg-indigo-500 text-white disabled:opacity-50"
          >
            {extractStatus === "extracting" ? "Extracting…" : "Extract"}
          </button>
          {extractStatus === "error" && (
            <span className="text-red-700 text-sm">{extractError}</span>
          )}
        </div>
        {fetchErrors.length > 0 && (
          <div className="text-sm text-amber-700">
            <div className="font-semibold">Could not fetch:</div>
            <ul className="list-disc pl-5">
              {fetchErrors.map((fe, i) => (
                <li key={i}>
                  <span className="font-mono">{fe.url}</span> — {fe.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {clubs.map((club) => (
          <ClubCard
            key={club}
            club={club}
            data={data[club] ?? { starters: [], subs: [] }}
            isMatched={(name) => isMatched(club, name)}
            onChange={(section, index, patch) =>
              updateEntry(club, section, index, patch)
            }
            onAdd={(section) => addEntry(club, section)}
            onRemove={(section, index) => removeEntry(club, section, index)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={saveStatus === "saving"}
          className="rounded px-3 py-1 bg-emerald-500 text-white disabled:opacity-50"
        >
          {saveStatus === "saving" ? "Saving…" : "Save teamsheets"}
        </button>
        {saveStatus === "saved" && (
          <span className="text-emerald-700 text-sm">Saved</span>
        )}
        {saveStatus === "error" && (
          <span className="text-red-700 text-sm">{saveError}</span>
        )}
      </div>
    </div>
  );
};

const ClubCard = ({
  club,
  data,
  isMatched,
  onChange,
  onAdd,
  onRemove,
}: {
  club: string;
  data: ClubTeamsheet;
  isMatched: (name: string) => boolean;
  onChange: (
    section: "starters" | "subs",
    index: number,
    patch: Partial<EditableEntry>,
  ) => void;
  onAdd: (section: "starters" | "subs") => void;
  onRemove: (section: "starters" | "subs", index: number) => void;
}) => (
  <div className="border rounded p-3 bg-white flex flex-col gap-2">
    <div className="font-semibold">{club}</div>
    <Section
      label="Starters"
      entries={data.starters}
      isMatched={isMatched}
      onChange={(i, p) => onChange("starters", i, p)}
      onAdd={() => onAdd("starters")}
      onRemove={(i) => onRemove("starters", i)}
    />
    <Section
      label="Subs"
      entries={data.subs}
      isMatched={isMatched}
      onChange={(i, p) => onChange("subs", i, p)}
      onAdd={() => onAdd("subs")}
      onRemove={(i) => onRemove("subs", i)}
    />
  </div>
);

const Section = ({
  label,
  entries,
  isMatched,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string;
  entries: EditableEntry[];
  isMatched: (name: string) => boolean;
  onChange: (index: number, patch: Partial<EditableEntry>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) => (
  <div className="flex flex-col gap-1">
    <div className="text-xs font-semibold uppercase text-slate-500">
      {label}
    </div>
    {entries.map((e, i) => {
      const matched = isMatched(e.name);
      const empty = !e.name.trim();
      return (
        <div key={i} className="flex items-center gap-1">
          <input
            type="text"
            value={e.name}
            onChange={(ev) => onChange(i, { name: ev.target.value })}
            className={`border rounded px-2 py-1 text-sm flex-1 ${
              empty
                ? "border-slate-200"
                : matched
                ? "border-emerald-400"
                : "border-red-400 bg-red-50"
            }`}
          />
          <label
            className="text-xs flex items-center gap-1 select-none"
            title="Uncertain (probable / 'ou X')"
          >
            <input
              type="checkbox"
              checked={e.uncertain}
              onChange={(ev) => onChange(i, { uncertain: ev.target.checked })}
            />
            ?
          </label>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="text-slate-400 hover:text-red-600 px-1"
            title="Remove"
          >
            ✕
          </button>
        </div>
      );
    })}
    <button
      type="button"
      onClick={onAdd}
      className="text-xs text-indigo-600 hover:underline self-start mt-1"
    >
      + add {label.toLowerCase()}
    </button>
  </div>
);

export default TeamsheetsEditor;
