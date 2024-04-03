const mysql = require('mysql');

const db = mysql.createConnection({
    user : "root",
    host : "database",
    port: 3306,
    password : "root",
    database : "docapp",
    multipleStatements: true,
    dateStrings: true,
    authSwitchHandler: function ({ pluginName, pluginData }, cb) {
        if (pluginName === 'caching_sha2_password') {
          // Switch to the mysql_native_password authentication plugin
          cb(null, Buffer.from('mysql_native_password'));
        }
      },
});

module.exports = db;