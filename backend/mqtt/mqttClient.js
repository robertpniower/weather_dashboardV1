import mqtt from 'mqtt';
import { sensorService } from '../services/sensorService.js';

let mqttClientInstance = null;

export function initializeMqttSubscriber() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://192.168.1.51:1883';
    mqttClientInstance = mqtt.connect(brokerUrl);

    mqttClientInstance.on('connect', () => {
        console.log('[MQTT] Connected to local broker');
        mqttClientInstance.subscribe('+/send', (err) => {
            if (err) {
                console.error('[MQTT] Subscription failed:', err);
            } else {
                console.log('[MQTT] Listening on wildcard topic: +/send');
            }
        });
    });

    mqttClientInstance.on('message', async (topic, payloadString) => {
        try {
            const payload = JSON.parse(payloadString.toString());
            const macAddress = topic.split('/')[0];

            const sensorId = await sensorService.handleIncomingTelemetry(
                macAddress,
                payload.temperature,
                payload.humidity,
                payload.timestamp
            );

            console.log(`[DB Saved], ${payload.timestamp} Sensor ID ${sensorId} (${macAddress}) -> Temp: ${payload.temperature}°C, Hum: ${payload.humidity}%`);
        } catch (err) {
            console.error('[MQTT Pipeline Error]:', err.message);
        }
    });

    mqttClientInstance.on('error', (err) => {
        console.error('[MQTT Error]:', err);
    });

    return mqttClientInstance;
}

export function getMqttClient() {
    return mqttClientInstance;
}