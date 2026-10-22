import Gauge from "./Gauge";
import type { Room } from "@/lib/rooms";

const tempColor = (t: number) => {
  if (t < 18) return "#60a5fa"; // cool
  if (t <= 25) return "#34d399"; // comfortable
  if (t <= 28) return "#fbbf24"; // warm
  return "#f87171"; // hot
};

const humidityColor = (h: number) => {
  if (h < 30) return "#fbbf24"; // dry
  if (h <= 60) return "#34d399"; // comfortable
  if (h <= 70) return "#fbbf24"; // humid
  return "#f87171"; // very humid
};

export default function RoomCard({ room }: { room: Room }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 transition-colors dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {room.name}
        </h2>
        {room.updatedAt && (
          <span className="truncate text-xs text-neutral-400 dark:text-neutral-600">
            {room.updatedAt}
          </span>
        )}
      </div>
      <div className="flex items-start justify-around gap-2">
        <Gauge
          value={room.temperature}
          min={0}
          max={40}
          unit="°C"
          label="Temp"
          decimals={1}
          color={tempColor}
        />
        <Gauge
          value={room.humidity}
          min={0}
          max={100}
          unit="%"
          label="Humidity"
          color={humidityColor}
        />
      </div>
    </section>
  );
}
