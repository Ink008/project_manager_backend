const express = require("express");
const { query } = require("../config/config");

const router = express.Router();

//Login
router.post('/', async (req, res) => {
    try {
        const username = req.body.username || "";
        const password = req.body.password || "";

        const result = await query(`
        SELECT * FROM user WHERE username = "${username}" AND password = "${password}"
        `);
        if(result.length == 0) res.json(null);
        res.json(result[0]);
    } catch (error) {
        console.log(error);
        res.json(error);
    }
})

//Tìm kiếm user (có thể tìm kiếm)
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || "";

        const result = await query(`
        SELECT * FROM user
        WHERE username LIKE '%${search}%' OR firstname LIKE '%${search}%' OR lastname LIKE '%${search}%'
        ORDER BY is_manager DESC
        `);
        res.json(result.map((value) => {
            value.is_manager = value.is_manager == 1;
            return value;
        }));
    } catch (error) {
        console.log(error);
        res.json(error);
    }
})

//Lấy user không phải manager (có thể tìm kiếm)
router.get('/member', async (req, res) => {
    try {
        const search = req.query.search || "";
        const is_leader = req.query.is_leader == 'true';

        const result = await query(`
        SELECT * FROM user
        WHERE (username LIKE '%${search}%' OR firstname LIKE '%${search}%' OR lastname LIKE '%${search}%')
        AND is_manager = ${is_leader ? '1' : '0'}
        ORDER BY username
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

//Lấy user cụ thể
router.get('/id=:id', async (req, res) => {
    try {
        const id = req.params.id;
        if(id == null) throw new Error("Don't have enough parameter");

        const result = await query(`SELECT * FROM user WHERE id = ${id}`);
        
        if(result.length == 0) {
            res.json(null);
            return;
        }
        result[0].is_manager = result[0].is_manager == 1;
        res.json(result[0]);
    } catch (error) {
        console.log(error);
        res.json(error);
    }
})

router.post('/add', async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const avatar = req.body.avatar;
        const firstname = req.body.firstname;
        const lastname = req.body.lastname;
        const is_manager = req.body.is_manager;

        if(!username || !password || !firstname || !lastname || is_manager == null) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        INSERT INTO user VALUES 
        (NULL, "${username}", "${password}", ${avatar ? `"${avatar}"` : "NULL"}, "${firstname}", "${lastname}", "${is_manager ? 1 : 0}")`);
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
        const username = req.body.username;
        const password = req.body.password;
        const avatar = req.body.avatar;
        const firstname = req.body.firstname;
        const lastname = req.body.lastname;

        if(id == null || !username || !password || !firstname || !lastname) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
        UPDATE user SET 
        username = "${username}",
        password = "${password}",
        avatar =  ${avatar ? `"${avatar}"` : "NULL"},
        firstname = "${firstname}",
        lastname = "${lastname}"
        WHERE id = "${id}"
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

//Cấp hoặc thu hồi quyền manager
router.post('/update_manager', async (req, res) => {
    try {
        const id = req.body.id;
        const is_manager = req.body.is_manager;

        if(id == null || is_manager == null) 
            throw new Error("Don't have enough parameter");

        // Check khi thu hồi quyền Manager
        if(!is_manager) {
            var result = await query(`
            SELECT * FROM workspace
            WHERE manager = ${id}
            `);
            if(result.length > 0) 
                throw new Error("This user is still managing some workspace, please tranfer this user's workspace to other manager");
        }
        
        var result = await query(`
        UPDATE user SET 
        is_manager = "${is_manager ? 1 : 0}"
        WHERE id = "${id}"
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

router.get('/delete', async (req, res) => {
    try {
        const id = req.query.id;
        if(id == null) throw new Error("Don't have enough parameter");

        //Kiểm tra nếu user này có quản lý workspace ko
        const workspaces = await query(`
        SELECT * FROM workspace WHERE manager = ${id}
        `);
        if(workspaces.length > 0) 
            throw new Error("This user is still managing some workspace, please tranfer this user's workspace to other manager");

        const result = await query(`
        DELETE FROM user WHERE ID = '${id}'`);
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