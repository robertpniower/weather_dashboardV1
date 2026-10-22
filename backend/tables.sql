-- 1. The Locations
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. The Hardware Registry
CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    sensor_model VARCHAR(50), -- e.g., 'DHT11', 'HX711', 'BME280'
    sensor_type VARCHAR(50),  -- e.g., 'Environment', 'Scale'
    status BOOLEAN DEFAULT true
);

-- 3. The Generic Data Point
CREATE TABLE readings (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
    value NUMERIC(12, 4) NOT NULL, -- Increased precision for weight
    unit VARCHAR(10) NOT NULL,     -- 'C', '%', 'g', 'kg'
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a room
INSERT INTO rooms (room_name) VALUES ('Living Room');

-- Register a sensor in that room (assuming Living Room is ID 1)
INSERT INTO sensors (room_id, sensor_model, sensor_type) 
VALUES (1, 'DHT11', 'Environment');