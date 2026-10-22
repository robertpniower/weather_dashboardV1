import { Router } from 'express';
import { sensorService } from '../services/sensorService.js';

const router = Router();

// Existing readings route
router.get('/readings', async (req, res) => {
    try {
        const readings = await sensorService.fetchDashboardReadings(50);
        res.json(readings);
    } catch (err) {
        console.error('Error fetching dashboard readings:', err);
        res.status(500).json({ error: "Database query failed" });
    }
});

// NEW: Get Average Temperature & Humidity
router.get('/readings/averages', async (req, res) => {
    try {
        const averages = await sensorService.getAverages();
        res.json(averages);
    } catch (err) {
        console.error('Error fetching averages:', err);
        res.status(500).json({ error: "Failed to calculate averages" });
    }
});

// NEW: Add a New Room
router.post('/rooms', async (req, res) => {
    try {
        const { roomName } = req.body;
        const newRoom = await sensorService.createRoom(roomName);
        res.status(201).json({
            message: "Room created successfully",
            room: newRoom
        });
    } catch (err) {
        console.error('Error creating room:', err);
        res.status(400).json({ error: err.message || "Failed to create room" });
    }
});

// NEW: Get historical readings by time interval
router.get('/readings/history', async (req, res) => {
    try {
        const { start, end, days } = req.query;
        const readings = await sensorService.getReadingsByInterval(start, end, days);
        res.json(readings);
    } catch (err) {
        console.error('Error fetching interval readings:', err);
        res.status(400).json({ error: err.message || "Failed to fetch historical readings" });
    }
});

export default router;