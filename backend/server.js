import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import readingsRouter from './routes/readingRoutes.js';
import { initializeMqttSubscriber } from './mqtt/mqttClient.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', readingsRouter);

// Initialize Background MQTT Consumer
initializeMqttSubscriber();

app.listen(port, () => {
    console.log(`[Server] Running on port ${port}`);
});