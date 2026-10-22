import pool from '../config/db.js';

export const sensorRepository = {
    async findByMac(macAddress) {
        const result = await pool.query(
            'SELECT id FROM sensors WHERE mac_address = $1',
            [macAddress]
        );
        return result.rows[0] || null;
    }
};