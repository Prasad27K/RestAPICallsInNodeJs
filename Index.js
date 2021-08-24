var connection = require('./MyConnection.js')
var bodyParser = require('body-parser');
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
	connection.query("SELECT * FROM Syllabus", function (err, result, fields)
	{
		if (err) throw err;
		res.status("200")
		console.log(result);
		res.send(result);
		res.end();
	});
});

app.post('/api/syllabus/', function (req, res)
{
	var postData  = req.body;
	connection.query("INSERT INTO Syllabus SET ?", postData, function (err, result, fields)
	{
		if (err) throw err;
		res.status("201");
		console.log(result);
		res.send(result)
	});
});		

app.listen(3000)