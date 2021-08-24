var connection = require('./MyConnection.js')
var express = require('express')
var app = express()

connection.connect(function(err)
{
	console.log('connected to database');
	if (err) throw err;
});

app.get('/api/syllabus/', function (req, res)
{
	console.log("");
	connection.query("SELECT * FROM course", function (err, result, fields)
	{
		res.status()
		if (err) throw err;
		console.log(result);
		res.send(result)
	});
});

app.post('/api/syllabus/', function (req, res)
{
	console.log("");
	connection.query("SELECT * FROM course", function (err, result, fields)
	{
		res.status()
		if (err) throw err;
		console.log(result);
		res.send(result)
	});
});		
app.listen(3000)
