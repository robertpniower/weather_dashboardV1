import pool from '../config/db.js';

export const readingRepository = {
    async insertBatch(sensorId, readings) {
        const queryText = `
            INSERT INTO readings (sensor_id, value, unit) 
            VALUES ($1, $2, $3), ($1, $4, $5)
        `;
        await pool.query(queryText, [
            sensorId,
            readings[0].value, readings[0].unit,
            readings[1].value, readings[1].unit
        ]);
    },

    async getRecent(limit = 50) {
        const queryText = `
           SELECT 
                r.room_name, 
                s.sensor_model, 
                rd.value, 
                rd.unit, 
                TO_CHAR(rd.recorded_at, 'YYYY-MM-DD HH24:MI:SS') AS formatted_time
            FROM readings rd
            JOIN sensors s ON rd.sensor_id = s.id
            JOIN rooms r ON s.room_id = r.id
            ORDER BY rd.recorded_at DESC 
            LIMIT $1;
        `;
        const result = await pool.query(queryText, [limit]);
        return result.rows;
    },
    
    async getAverages(){
        const queryText = `
        SELECT
            unit,
            ROUND(AVG(value), 2) AS average_value
            FROM readings
            GROUP BY unit;
            `;

            const result = await pool.query(queryText);
            return result.rows;
    },

    // Add inside readingRepository object:
async getByDateRange(startDate, endDate) {
    const queryText = `
        SELECT 
            r.room_name, 
            s.sensor_model, 
            rd.value, 
            rd.unit, 
            TO_CHAR(rd.recorded_at, 'YYYY-MM-DD HH24:MI:SS') AS formatted_time
        FROM readings rd
        JOIN sensors s ON rd.sensor_id = s.id
        JOIN rooms r ON s.room_id = r.id
        WHERE rd.recorded_at BETWEEN $1 AND $2
        ORDER BY rd.recorded_at DESC;
    `;
    const result = await pool.query(queryText, [startDate, endDate]);
    return result.rows;
}
};