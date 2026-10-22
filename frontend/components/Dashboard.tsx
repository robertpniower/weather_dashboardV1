"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import RoomCard from "./RoomCard";
import ThemeToggle from "./ThemeToggle";
import { createRoom, getAverages, getReadings, toRooms, type Averages } from "@/lib/api";
import type { Room } from "@/lib/rooms";

const POLL_MS = 10_000;

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pending, setPending] = useState<string[]>([]); // rooms added but without readings yet
  const [averages, setAverages] = useState<Averages>({ temperature: null, humidity: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [readings, avg] = await Promise.all([getReadings(), getAverages()]);
      setRooms(toRooms(readings));
      setAverages(avg);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    const roomName = name.trim();
    if (!roomName || saving) return;
    setSaving(true);
    try {
      await createRoom(roomName);
      setPending((p) => (p.includes(roomName) ? p : [...p, roomName]));
      setName("");
      setError(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? `Could not add room: ${err.message}` : "Could not add room");
    } finally {
      setSaving(false);
    }
  }

  const known = new Set(rooms.map((r) => r.name));
  const empty: Room[] = pending
    .filter((n) => !known.has(n))
    .map((n) => ({ id: n, name: n, temperature: null, humidity: null }));
  const all = [...rooms, ...empty];

  const fmt = (v: number | null, d: number, u: string) => (v === null ? "–" : `${v.toFixed(d)}${u}`);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Home</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Avg {fmt(averages.temperature, 1, "°C")} · {fmt(averages.humidity, 0, "%")} humidity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={onAdd} className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New room"
              aria-label="New room name"
              className="h-9 w-32 rounded-full border border-neutral-200 bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 sm:w-40 dark:border-neutral-800 dark:focus:border-neutral-600"
            />
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="h-9 rounded-full border border-neutral-200 px-4 text-sm text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-40 dark:border-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Add
            </button>
          </form>
          <ThemeToggle />
        </div>
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 px-4 py-3 text-sm text-red-600 dark:border-red-900/60 dark:text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : all.length === 0 && !error ? (
        <p className="text-sm text-neutral-400">No readings yet. Add a room to get started.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </main>
  );
}
