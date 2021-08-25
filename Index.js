var connection = require('./MyConnection.js')
var bodyParser = require('body-parser');
var express = require('express')
var app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

connection.connect(function(err)
{
	if (err) throw err;
	console.log('connected to database');
});
app.get('/api/syllabus/', function (req, res)
{
	connection.query("SELECT * FROM syllabus", function (err, result, fields)
	{
		if (err) throw err;
		res.status("200")
		console.log(fields);
		res.send(result);
		res.end();
	});
});

app.post('/api/syllabus/', function (req, res)
{
	const postData  = req.body;
	const insertQUery = `INSERT INTO syllabus SET ?, status = 1`;
	console.log(postData);
	connection.query(insertQUery, postData, function (err, result, fields)
	{
		if (err) throw err;
		res.status("201");
		console.log(result);
		const userId = req.body.userId;
		const values = [result.insertId, userId];
		const sqlQuery = `SELECT * FROM syllabus WHERE id = ? AND userId = ?` ;
		connection.query(sqlQuery, values, function (err, result, fields)
		{
			if (err) throw err;
			console.log(result);
			res.send(result);
			res.end();
		});
	});
});		

app.get('/api/syllabus/:id/', function (req, res, next)
{
	const sqlQuery = `SELECT * FROM syllabus WHERE id = ${req.params.id}`;
	connection.query(sqlQuery, function (err, result, fields)
	{
		if (err) throw err;
		console.log(result);
		res.send(result);
		res.end();
	});
});

app.put('/api/syllabus/:id/', function (req, res, next) {
	console.log(req.params.id);
	const updateQuery = "UPDATE syllabus SET name = ?, description = ?, learningObjectives = ? where id = ? AND userId = ?";
	const values = [req.body.name, req.body.description, req.body.learningObjectives, req.params.id, req.body.userId];
	connection.query(updateQuery, values, function (err, result, fields)
	{
		if (err) throw err;
		res.status("201");
		console.log(result);
		const userId = req.body.userId;
		const values = [req.params.id, userId];
		const sqlQuery = `SELECT * FROM syllabus WHERE id = ? AND userId = ?` ;
		connection.query(sqlQuery, values, function (err, result, fields)
		{
			if (err) throw err;
			console.log(result);
			res.send(result);
			res.end();
		});
	});
});

app.delete('/api/syllabus/:id/', function (req, res, next) {
	console.log(req.params.id);
	const deleteQuery = `UPDATE syllabus SET status = 0 where id = ${req.params.id}`;
	connection.query(deleteQuery, function (err, result, fields)
	{
		if (err) throw err;
		res.status("204");
		console.log(result);
		res.end();
	});
})
app.listen(3000);