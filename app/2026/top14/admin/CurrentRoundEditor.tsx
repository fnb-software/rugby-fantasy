"use client";
import { useState } from "react";

const CurrentRoundEditor = ({ initial }: { initial: number }) => {
  const [round, setRound] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/round", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentRound: round }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "save_failed");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="font-semibold">Current round:</label>
      <input
        type="number"
        min={1}
        max={26}
        value={round}
        onChange={(e) => setRound(Number(e.target.value))}
        className="border rounded px-2 py-1 w-20"
      />
      <button
        onClick={onSave}
        disabled={status === "saving"}
        className="rounded px-3 py-1 bg-emerald-500 text-white disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Save"}
      </button>
      {status === "saved" && <span className="text-emerald-700">Saved</span>}
      {status === "error" && <span className="text-red-700">{error}</span>}
    </div>
  );
};

export default CurrentRoundEditor;
