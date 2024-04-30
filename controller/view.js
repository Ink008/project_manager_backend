const express = require("express");
const { query } = require("../config/config");

const router = express.Router();

//Lấy view (có search)
//Có lựa chọn lấy toàn bộ view của workspace cụ thể (Manager)
//Hoặc lấy những view được giao trọng trách hoặc được truy cập vào (Leader, Member)
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || "";
        const workspace_id = req.query.workspace_id;
        const user_id = req.query.user_id;

        //Chỉ được đưa vào 1 trong 2 giá trị
        if((workspace_id == null && user_id == null) || (workspace_id != null && user_id != null)) 
            throw new Error("Only 1 of 2 parameter can be included (workspace_id or user_id)");

        const result = await query(`
        SELECT view.*, username, avatar, firstname, lastname 
        FROM view
        JOIN user ON view.leader_id = user.id
        JOIN permission ON view.id = permission.view_id
        WHERE name LIKE '%${search}%' AND
        ${workspace_id != null ?
        `workspace_id = '${workspace_id}'` : 
        `(leader_id = '${user_id}' OR member_id = '${user_id}')`
        }
        ORDER BY name
        `);
        res.json(result.map((value) => {
            var user = {};
            user.id = value.leader_id;
            user.username = value.username;
            user.avatar = value.avatar;
            user.firstname = value.firstname;
            user.lastname = value.lastname;
            value.leader = user;
            delete value.leader_id;
            delete value.username;
            delete value.avatar;
            delete value.firstname;
            delete value.lastname;
            return value;
        }));
    } catch (error) {
        console.log(error);
        res.json(error);
    }
})

router.post('/add', async (req, res) => {
    try {
        const workspace_id = req.body.workspace_id;
        const user_id = req.body.user_id;
        const name = req.body.name;
        if(workspace_id == null || !name) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        INSERT INTO view VALUES
        (NULL, '${workspace_id}', ${user_id != null ? `'${user_id}'` : "NULL"}, '${name}')
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
        const user_id = req.body.user_id;
        const name = req.body.name;
        if(id == null || !name) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        UPDATE view SET
        leader_id = ${user_id != null ? `'${user_id}'` : "NULL"},
        name = '${name}'
        WHERE id = ${id}
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

router.post('/delete', async (req, res) => {
    try {
        const id = req.body.id;
        if(id == null) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        DELETE FROM view WHERE id = ${id}
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

//Xem thành viên có trong view cụ thể (không có leader nhá tại id leader có trong view rồi)
//Và tất nhiên là có search
router.get('/:id/member', async (req, res) => {
    try {
        const id = req.params.id;
        const search = req.query.search || "";
        if(id == null) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        SELECT user.* FROM user
        JOIN permission ON user.id = permission.member_id
        WHERE view_id = '${id}' AND
        (username LIKE '%${search}%' OR firstname LIKE '%${search}%' OR lastname LIKE '%${search}%')
        ORDER BY CONCAT(firstname, ' ', lastname)
        `);
        res.json(result.map((value) => {
            delete value.is_manager;
            delete value.password;
            return value; 
        }));
    } catch (error) {
        console.log(error);
        res.json(error);
    }
})

router.get('/:id/member/add', async (req, res) => {
    try {
        const view_id = req.params.id;
        const member_id = req.query.member_id;
        if(member_id == null || view_id == null) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        INSERT INTO permission VALUES
        ('${member_id}', '${view_id}')
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

router.get('/:id/member/delete', async (req, res) => {
    try {
        const view_id = req.params.id;
        const member_id = req.query.member_id;
        if(member_id == null || view_id == null) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        DELETE FROM permission
        WHERE member_id = '${member_id}' AND view_id = '${view_id}'
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

router.get('/:id/content', async (req, res) => {
    try {
        const id = req.params.id;
        if(id == null) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        SELECT * FROM status 
        WHERE view_id = '${id}'
        ORDER BY position
        `);
        for (let i = 0; i < result.length; i++) {
            const status = result[i];
            delete status.view_id;
            const tasks = await query(`
            SELECT task.*, username, avatar, firstname, lastname 
            FROM task
            LEFT JOIN user ON task.assigner = user.id
            WHERE status_id = '${status.id}'
            ORDER BY position
            `);
            status.tasks = tasks.map((value) => {
                value.is_complete = value.is_complete == 1;
                if(value.assigner != null) {
                    var user = {};
                    user.id = value.assigner;
                    user.username = value.username;
                    user.avatar = value.avatar;
                    user.firstname = value.firstname;
                    user.lastname = value.lastname;
                    value.assigner = user;
                }
                delete value.decription;
                delete value.username;
                delete value.avatar;
                delete value.firstname;
                delete value.lastname;
                return value;
            });
        }

        res.json(result);
    } catch (error) {
        console.log(error);
        res.json(error);
    }
})

module.exports = router;