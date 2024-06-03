const express = require("express");
const { query } = require("../config/config");
const nodemailer = require('nodemailer');

const router = express.Router();

const GMAIL = 'quantum111002@gmail.com';
const PASSWORD = 'iqvs szhu bben hpcq';

function sendEmail(option) {
    return new Promise((resolve, reject) => {
        var transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: GMAIL,
                pass: PASSWORD
            }
        });

        transporter.sendMail(option, (err, info) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(info);
        });
    });
}

router.post('/test', async (req, res) => {
    try {
        const email = req.body.email;
        if (email == null) throw new Error("Don't have enough parameter");

        var mailOptions = {
            from: GMAIL,
            to: email,
            subject: 'Sending Email using Node.js',
            text: 'That was easy!'
        };

        var info = await sendEmail(mailOptions);
        res.json({
            success: true,
            message: info.response
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