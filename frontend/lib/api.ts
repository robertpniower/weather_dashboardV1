import type { Room } from "./rooms";

// Requests go to /api/* on this app; next.config.mjs proxies them to BACKEND_URL.

type Raw = Record<string, unknown>;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: "no-store", ...init });
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {}
    throw new Error(`${res.status} ${res.statusText}${detail ? ` – ${detail.slice(0, 120)}` : ""}`);
  }
  return res.json() as Promise<T>;
}

/** Accepts either a bare array or a wrapper like { data: [...] } / { readings: [...] }. */
function toArray(payload: unknown): Raw[] {
  if (Array.isArray(payload)) return payload as Raw[];
  if (payload && typeof payload === "object") {
    for (const v of Object.values(payload as Raw)) {
      if (Array.isArray(v)) return v as Raw[];
    }
  }
  return [];
}

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? undefined : String(v));
const first = (r: Raw, keys: string[]) => {
  for (const k of keys) if (r[k] != null) return r[k];
  return undefined;
};

export type Reading = {
  room: string;
  kind: "temperature" | "humidity";
  value: number;
  sensor?: string;
  time?: string;
};

function normalizeReading(r: Raw): Reading | null {
  const room = str(first(r, ["roomName", "room_name", "room", "name"]));
  const value = Number(first(r, ["value", "reading_value", "reading", "measurement"]));
  if (!room || !Number.isFinite(value)) return null;

  const unit = str(first(r, ["unit", "measurement_unit"]));
  const type = str(first(r, ["type", "sensor_type", "metric", "measurement_type"]))?.toLowerCase();
  let kind: Reading["kind"] | null = null;
  if (unit === "°C" || unit === "C" || type?.includes("temp")) kind = "temperature";
  else if (unit === "%" || type?.includes("hum")) kind = "humidity";
  if (!kind) return null;

  return {
    room,
    kind,
    value,
    sensor: str(first(r, ["sensorModel", "sensor_model", "model", "sensor"])),
    time: str(first(r, ["timestamp", "recorded_at", "created_at", "formattedTime", "formatted_time", "time"])),
  };
}

export async function getReadings(): Promise<Reading[]> {
  const payload = await request<unknown>("/api/readings");
  return toArray(payload).map(normalizeReading).filter((r): r is Reading => r !== null);
}

export type Averages = { temperature: number | null; humidity: number | null };

export async function getAverages(): Promise<Averages> {
  const payload = await request<unknown>("/api/readings/averages");
  const out: Averages = { temperature: null, humidity: null };
  const num = (v: unknown) => (Number.isFinite(Number(v)) && v != null ? Number(v) : null);

  if (Array.isArray(payload) || (payload && Object.values(payload as Raw).some(Array.isArray))) {
    for (const r of toArray(payload)) {
      const unit = str(first(r, ["unit", "measurement_unit"]));
      const avg = num(first(r, ["average_value", "avg", "avg_value", "averageValue", "value"]));
      if (unit === "°C") out.temperature = avg;
      if (unit === "%") out.humidity = avg;
    }
  } else if (payload && typeof payload === "object") {
    const o = payload as Raw;
    out.temperature = num(o["°C"] ?? o["temperature"]);
    out.humidity = num(o["%"] ?? o["humidity"]);
  }
  return out;
}

export type HistoryQuery = { days: number } | { start: string; end: string };

export async function getHistory(q: HistoryQuery): Promise<Reading[]> {
  const qs =
    "days" in q
      ? `days=${q.days}`
      : `start=${encodeURIComponent(q.start)}&end=${encodeURIComponent(q.end)}`;
  const payload = await request<unknown>(`/api/readings/history?${qs}`);
  return toArray(payload).map(normalizeReading).filter((r): r is Reading => r !== null);
}

export async function createRoom(roomName: string): Promise<void> {
  await request<unknown>("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomName }),
  });
}

/** Collapses a list of readings into one card per room, keeping the newest value of each kind. */
export function toRooms(readings: Reading[]): Room[] {
  const rooms = new Map<string, Room & { _t: { temperature?: number; humidity?: number } }>();

  for (const r of readings) {
    let room = rooms.get(r.room);
    if (!room) {
      room = { id: r.room, name: r.room, temperature: null, humidity: null, _t: {} };
      rooms.set(r.room, room);
    }
    // "2026-10-20 20:15:42" -> ISO-like so every browser parses it (Safari rejects the space).
    const t = r.time ? Date.parse(r.time.replace(" ", "T")) : NaN;
    const prev = room._t[r.kind];
    const current = room[r.kind];
    // No parseable timestamps: assume the API returns newest first and keep the first hit.
    const newer =
      current === null ||
      (Number.isFinite(t) && (prev === undefined || t > prev));
    if (newer) {
      room[r.kind] = r.value;
      if (Number.isFinite(t)) room._t[r.kind] = t;
      if (r.time) room.updatedAt = r.time;
    }
  }

  return [...rooms.values()].map(({ _t, ...room }) => room);
}
