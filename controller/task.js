const express = require("express");
const { query } = require("../config/config");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

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

router.get('/notifications', async (req, res) => {
    try {
        const user_id = req.query.user_id;
        if(user_id == null) 
            throw new Error("Don't have enough parameter");
        
        const result = await query(`
        SELECT leader_id, task.* FROM task
        JOIN status ON task.status_id = status.id
        JOIN view ON status.view_id = view.id
        WHERE (leader_id = ${user_id} OR task.assigner = ${user_id})
        AND due_date IS NOT NULL
        ORDER BY due_date
        `);

        res.json(result);
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
        INSERT INTO task VALUES (NULL, '${status_id}', NULL, '${name}', '', '${position}', NULL, NULL, NULL)`);
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
        const completed_date = req.body.completed_date;
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
        if (req.body.hasOwnProperty('completed_date')) 
            sql += `, completed_date = ${completed_date != null ? `'${completed_date}'` : `NULL`}`;

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
        
        // Delete folder
        const folder_path = path.join('uploads', 'task', id);
        if(fs.existsSync(folder_path)) {
            fs.rmSync(folder_path, { recursive: true, force: true });
        }

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

//File Manager API
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { id } = req.params;
        const upload_path = path.join('uploads', 'task', id);
        // Tạo thư mục nếu chưa tồn tại
        try {
            fs.accessSync(upload_path);
        } catch (e) {
            fs.mkdirSync(upload_path, { recursive: true });
        }
        cb(null, upload_path);
    },
    filename: (req, file, cb) => {
        cb(null, Buffer.from(file.originalname, 'latin1').toString('utf8')); // Lưu file với tên gốc
    }
});

const upload = multer({ storage: storage });

router.post('/:id/upload', upload.array('files'), (req, res) => {
    res.json({
        message: true,
        files: req.files,
    });
});

router.get('/:id/file', (req, res) => {
    const { id } = req.params;
    try {
        const folder_path = path.join('uploads', 'task', id);
        if(!fs.existsSync(folder_path)) {
            res.json([]);
        } else {
            const files = fs.readdirSync(folder_path);
            res.json(files);
        }
    } catch (error) {
        console.log(error);
        res.json(error);
    }
});

router.get('/:id/file/download/:name', (req, res) => {
    const { id, name } = req.params;
    console.log('hello');
    try {
        if(id == null || name == null) 
            throw new Error("Don't have enough parameter");
        const file_path = path.join('uploads', 'task', id, name);
        if(!fs.existsSync(file_path)) 
            throw new Error(`${name} doesn't exist`);
        else {
            res.download(file_path);
        }
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

router.get('/:id/file/delete/:name', (req, res) => {
    const { id, name } = req.params;
    console.log('hello');
    try {
        if(id == null || name == null) 
            throw new Error("Don't have enough parameter");
        const file_path = path.join('uploads', 'task', id, name);
        if(!fs.existsSync(file_path)) 
            throw new Error(`${name} doesn't exist`);
        else {
            fs.unlinkSync(file_path);
            res.json({
                success: true
            });
        }
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

router.get('/:id/view', async (req, res) => {
    try {
        const task_id = req.params.id;
        if (task_id == null) {
            throw new Error("Don't have enough parameter");
        }
        const result = await query(`
            SELECT view.*
            FROM task 
            JOIN status ON task.status_id = status.id 
            JOIN view ON status.view_id = view.id
            WHERE task.id = ${task_id}
        `);

        if (result.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const viewDetails = result[0];
        res.json(viewDetails);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;