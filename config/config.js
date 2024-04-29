const mysql = require("mysql");
const Client_URL = "http://localhost:3000";

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "project_manager"
});

//Dùng hàm này để truy vấn sql
function query(sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, result) => {
            if(err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

module.exports = {
    Client_URL: Client_URL,
    query: query
}