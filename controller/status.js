const express = require("express");
const { query } = require("../config/config");

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const view_id = req.query.view_id;
        if(view_id == null) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        SELECT status.*, COUNT(task.id) AS task_count FROM status 
        LEFT JOIN task ON status.id = task.status_id
        WHERE view_id = '${view_id}'
        GROUP BY status.id
        ORDER BY position
        `);
        res.json(result.map((value) => {
            delete value.view_id;
            return value;
        }))
    } catch (error) {
        console.log(error);
        res.json(error);
    }
})

router.post('/add', async (req, res) => {
    try {
        const view_id = req.body.view_id;
        const name = req.body.name || "";
        const position = req.body.position;
        if(view_id == null || position == null) throw new Error("Don't have enough parameter");

        const result = await query(`
        INSERT INTO status VALUES (NULL, '${view_id}', '${name}', '${position}')
        `);
        res.json({
            success: result.affectedRows > 0
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        });
    }
})

router.post('/update', async (req, res) => {
    try {
        const id = req.body.id;
        const name = req.body.name || '';
        if(id == null) throw new Error("Don't have enough parameter");

        const result = await query(`
        UPDATE status SET name = '${name}' WHERE id = '${id}'`);
        res.json({
            success: result.affectedRows > 0
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        });
    }
})

router.get('/move', async (req, res) => {
    try {
        const id = req.query.id;
        const position = req.query.position;
        if(id == null || position == null) throw new Error("Don't have enough parameter");

        await query(`
        CALL move_status_position('${id}', '${position}')`);
        res.json({
            success: true
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        });
    }
})

router.get('/delete', async (req, res) => {
    try {
        const id = req.query.id;
        if(id == null) throw new Error("Don't have enough parameter");

        const result = await query(`
        CALL delete_status('${id}')`);
        res.json({
            success: true
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false
        });
    }
})

module.exports = router;