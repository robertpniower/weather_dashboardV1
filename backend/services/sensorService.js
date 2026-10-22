import { sensorRepository } from '../repositories/sensorRepository.js';
import { readingRepository } from '../repositories/readingRepository.js';
import { roomRepository } from "../repositories/roomRepository.js";

export const sensorService = {
    async handleIncomingTelemetry(macAddress, temperature, humidity) {
        const sensor = await sensorRepository.findByMac(macAddress);
        if (!sensor) {
            throw new Error(`Unknown device MAC registered: ${macAddress}`);
        }

        await readingRepository.insertBatch(sensor.id, [
            { value: temperature, unit: '°C' },
            { value: humidity, unit: '%' }
        ]);

        return sensor.id;
    },

    async fetchDashboardReadings(limit = 50) {
        return await readingRepository.getRecent(limit);
    },

    async getAverages() {
        return await readingRepository.getAverages();
    },

    async createRoom(roomName) {
        if (!roomName) {
            throw new Error("Room name is required");
        }
        return await roomRepository.create(roomName);
    },

    // Add inside sensorService object:
async getReadingsByInterval(startDate, endDate, days) {
    let start = startDate;
    let end = endDate ? new Date(endDate) : new Date();

    // If 'days' parameter is provided (e.g., ?days=30)
    if (days) {
        const d = new Date();
        d.setDate(d.getDate() - parseInt(days, 10));
        start = d;
    }

    if (!start) {
        throw new Error("Either 'days' or a 'start' date parameter is required");
    }

    return await readingRepository.getByDateRange(start, end);
}
};