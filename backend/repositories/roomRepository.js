import pool from '../config/db.js';

export const roomRepository = {
    async create(roomName) {
        const query = `
            INSERT INTO rooms (room_name) 
            VALUES ($1) 
            RETURNING id, room_name, created_at;
        `;
        const result = await pool.query(query, [roomName]);
        return result.rows[0];
    }
};