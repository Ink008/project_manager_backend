const express = require("express");
const { query } = require("../config/config");

const router = express.Router();

router.post('/add', async (req, res) => {
    try {
        const user_id = req.body.user_id;
        const view_id = req.body.view_id;
        const content = req.body.content;
        if (user_id == null || view_id == null || content == null) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
            INSERT INTO comment (user_id, view_id, content, date)
            VALUES (${user_id}, ${view_id}, '${content}', NOW())
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
});

router.get('/', async (req, res) => {
    try {
        const view_id = req.query.view_id;
        if (view_id == null) 
            throw new Error("Don't have enough parameter");

        const result = await query(`
            SELECT comment.*, user.username, user.avatar, user.firstname, user.lastname
            FROM comment
            LEFT JOIN user ON comment.user_id = user.id
            WHERE comment.view_id = ${view_id}
            ORDER BY comment.date ASC
        `);

        res.json(result);
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        });
    }
});


router.get('/delete', async (req, res) => {
    try {
        const id = req.query.id;
        const user_id = req.query.user_id; 

        if (id == null || user_id == null) throw new Error("Don't have enough parameter");
        const result = await query(`
            SELECT user_id FROM comment WHERE id = '${id}'
        `);
        if (result.length === 0) {
            throw new Error("Comment not found");
        }
        const commentUserId = result[0].user_id;
        if (commentUserId != user_id) {
            throw new Error("You don't have permission to delete this comment");
        }
        await query(`
            DELETE FROM comment WHERE id = '${id}'
        `);

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
});

module.exports = router;
