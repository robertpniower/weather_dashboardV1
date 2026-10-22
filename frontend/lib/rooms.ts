export type Room = {
  id: string;
  name: string;
  temperature: number | null; // °C
  humidity: number | null; // %
  updatedAt?: string;
};
