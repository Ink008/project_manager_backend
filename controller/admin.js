const express = require("express");
const { query } = require("../config/config");

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const username = req.body.username || "";
        const password = req.body.password || "";

        const result = await query(`
        SELECT * FROM admin WHERE username = "${username}" AND password = "${password}"
        `);
        if(result.length == 0) res.json(null);
        res.json(result[0]);
    } catch (error) {
        console.log(error);
        res.json(error);
    }
})

module.exports = router;