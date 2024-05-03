const express = require("express");
const { query } = require("../config/config");

const router = express.Router();

//Lấy workspace (có thể tìm kiếm)
//Có thể đưa Manager id vào để chỉ lấy workspace do Manager này quản lý
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || "";
        const manager_id = req.query.manager_id;

        const result = await query(`
        SELECT workspace.*, username, avatar, firstname, lastname 
        FROM workspace 
        JOIN user ON workspace.manager = user.id
        WHERE name LIKE '%${search}%' 
        ${manager_id == null ? '' : `AND manager = ${manager_id}`}
        ORDER BY name
        `);
        res.json(result.map((value) => {
            var user = {};
            user.id = value.manager;
            user.username = value.username;
            user.avatar = value.avatar;
            user.firstname = value.firstname;
            user.lastname = value.lastname;
            value.manager = user;
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

router.post('/add', async(req, res) => {
    try {
        const manager_id = req.body.manager_id;
        const name = req.body.name;
        if(manager_id == null || !name) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        INSERT INTO workspace (manager, name) VALUES ("${manager_id}", "${name}")`);
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

router.post('/update', async(req, res) => {
    try {
        const id = req.body.id;
        const manager_id = req.body.manager_id;
        const name = req.body.name;
        if(id == null || manager_id == null || !name) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        UPDATE workspace SET 
        manager = "${manager_id}",
        name = "${name}" 
        WHERE ID = "${id}"`);
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

router.get('/delete', async (req, res) => {
    try {
        const id = req.query.id;
        if(id == null) throw new Error("Don't have enough parameter");

        const result = await query(`
        DELETE FROM workspace WHERE ID = '${id}'`);
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

//Lấy danh sách thành viên workspace (có thể tìm kiếm)
router.get('/:id/member', async (req, res) => {
    try {
        const id = req.params.id;
        const search = req.query.search || "";
        if(id == null) throw new Error("Don't have enough parameter");

        const result = await query(`
        SELECT user.*, member.leader FROM user 
        JOIN member ON user.id = member.member_id
        WHERE member.workspace_id = ${id} AND 
        (username LIKE '%${search}%' OR firstname LIKE '%${search}%' OR lastname LIKE '%${search}%')
        ORDER BY member.leader DESC, CONCAT(firstname, ' ', lastname)
        `);
        res.json(result.map((value) => {
            delete value.is_manager;
            delete value.password;
            value.leader = value.leader == 1;
            return value; 
        }));
    } catch (error) {
        console.log(error);
        res.json(error);
    }
})

router.post('/:id/member/add', async (req, res) => {
    try {
        const id = req.params.id;
        const user_id = req.body.user_id;
        const is_leader = req.body.is_leader;
        if(id == null || user_id == null || is_leader == null) 
            throw new Error("Don't have enough parameter");

        //Kiểm tra user có thuộc phòng ban nào không
        var result = await query(`
        SELECT * FROM member 
        JOIN workspace ON member.workspace_id = workspace.id
        WHERE member_id = '${user_id}'
        `);
        if(result.length > 0) 
            throw new Error(`This user's already a member of ${result[0].name} workspace`);

        result = await query(`
        INSERT INTO member VALUES 
        ('${user_id}', '${id}', '${is_leader ? 1 : 0}')
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

//Cấp và thu hồi quyền leader
router.post('/:id/member/update', async (req, res) => {
    try {
        const id = req.params.id;
        const user_id = req.body.user_id;
        const is_leader = req.body.is_leader;
        if(id == null || user_id == null || is_leader == null) 
            throw new Error("Don't have enough parameter");

        result = await query(`
        UPDATE member
        SET leader = '${is_leader ? 1 : 0}'
        WHERE member_id = '${user_id}' AND workspace_id = '${id}'
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

router.post('/:id/member/delete', async (req, res) => {
    try {
        const id = req.params.id;
        const user_id = req.body.user_id;
        if(id == null || user_id == null) 
            throw new Error("Don't have enough parameter");

        result = await query(`
        DELETE FROM member
        WHERE member_id = '${user_id}' AND workspace_id = '${id}'
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

module.exports = router;