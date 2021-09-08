var mysql = require('mysql2')
var connection = mysql.createConnection({
	host: '165.22.14.77',
	user: 'b27',
	password: 'b27',
	database: 'syllabusDB'
})
module.exports = connection;