

const mssql = require('mssql')

const SQL_DRIVER = process.env.SQL_DRIVER
const SQL_SERVER = process.env.SQL_SERVER
const SQL_DATABASE = process.env.SQL_DATABASE
const SQL_UID = process.env.SQL_UID
const SQL_PWD = process.env.SQL_PWD

/* NOTE IMPORTANT FOR SQLSERVER AFTER REINSTALL 8391
ENABLE TCP/IP
START SERVICE SQL SERVER BROWSER */
const config = {
    driver: SQL_DRIVER,
    server: SQL_SERVER,
    database: SQL_DATABASE,
    user: SQL_UID,
    password: SQL_PWD,
    options: {
        encrypt: false,
        enableArithAbort: false,
    },
    connectionTimeout: 300000,
    requestTimeout: 300000,
    pool: {
        idleTimeoutMillis: 300000,
        max: 100
    },
};

const pool = new mssql.ConnectionPool(config);

module.exports = {
    pool
}