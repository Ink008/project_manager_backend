const express = require("express");
const { query } = require("../config/config");

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const id = req.query.id;
        if(id == null) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        SELECT task.*, username, avatar, firstname, lastname 
        FROM task
        LEFT JOIN user ON task.assigner = user.id
        WHERE task.ID = ${id}
        `);
        var value = result[0];
        if(value.assigner != null) {
            var user = {};
            user.id = value.assigner;
            user.username = value.username;
            user.avatar = value.avatar;
            user.firstname = value.firstname;
            user.lastname = value.lastname;
            value.assigner = user;
        }
        value.is_complete = value.is_complete == 1;
        delete value.username;
        delete value.avatar;
        delete value.firstname;
        delete value.lastname;
        res.json(value);
    } catch (error) {
        console.log(error);
        res.json(error);
    }
})

router.post('/add', async (req, res) => {
    try {
        const name = req.body.name || '';
        const status_id = req.body.status_id;
        const position = req.body.position;
        if(status_id == null || position == null) throw new Error("Don't have enough parameter");

        const result = await query(`
        INSERT INTO task VALUES (NULL, '${status_id}', NULL, '${name}', '', '${position}', NULL, NULL, 0)`);
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
        const name = req.body.name;
        const assigner_id = req.body.assigner_id;
        const description = req.body.description;
        const due_date = req.body.due_date;
        const reminder_date = req.body.reminder_date;
        const is_complete = req.body.is_complete;
        if(id == null || !name) throw new Error("Don't have enough parameter");
        let sql = `UPDATE task SET Name = '${name}'`;
        if (req.body.hasOwnProperty('description')) 
            sql += `, description = '${description}'`;
        if (req.body.hasOwnProperty('assigner_id')) 
            sql += `, assigner = ${assigner_id != null ? `'${assigner_id}'` : `NULL`}`;
        if (req.body.hasOwnProperty('due_date')) 
            sql += `, due_date = ${due_date != null ? `'${due_date}'` : `NULL`}`;
        if (req.body.hasOwnProperty('reminder_date')) 
            sql += `, reminder_date = ${reminder_date != null ? `'${reminder_date}'` : `NULL`}`;
        if (req.body.hasOwnProperty('is_complete')) 
            sql += `, is_complete = ${is_complete ? `1` : `0`}`;

        sql += ` WHERE task.id = ${id}`;
        const result = await query(sql);
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

router.post('/move', async (req, res) => {
    try {
        const id = req.body.id;
        const status_id = req.body.status_id;
        const position = req.body.position;
        if(id == null || status_id == null || position == null) 
            throw new Error("Don't have enough parameter");

        await query(`
        CALL move_task_position('${id}', '${status_id}', '${position}')`);
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

        await query(`
        CALL delete_task('${id}')`);
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

module.exports = router;