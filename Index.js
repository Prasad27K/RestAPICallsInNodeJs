var connection = require('./MyConnection.js');
var mysql = require('mysql')
var bodyParser = require('body-parser');
var express = require('express');
var app = express();

const { v4: uuidv4 } = require('uuid');
console.log(uuidv4());

var emailValidator = require("email-validator");
console.log(emailValidator.validate("test@email.com"));

var passwordValidator = require('password-validator');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

connection.connect(function(err)
{
	if (err) throw err;
	console.log('connected to database.');
});

function isUserDataValid(res, getData)
{
	let authenticationErrors = {};
	let isValid = true;
	console.log(getData.userName);
	console.log(emailValidator.validate(getData.userName));
	if (!emailValidator.validate(getData.userName)) 
	{
        authenticationErrors["Email/user Name"] = "Please enter valid Email";
        isValid = false;
        console.log(getData.userName)
    }
    let schema = new passwordValidator;
	schema
		.is().min(6)
		.is().max(20)
		.has().symbols(1)
		.has().digits(1)
		.has().not().spaces()
	if (!schema.validate(getData.password)) 
	{
	    authenticationErrors["password"] = `Your Password is week.password should contain aleast 6 characters, one special character($, #, @, &) and one digit.`;
        isValid = false;
	}
	if(!isValid)
	{
		res.status(400);
		res.send(authenticationErrors);
	}
	return isValid;
}

app.post('/api/signup/', (req, res) => {
	let getData = req.body;
	if(isUserDataValid(res, getData))
	{
		getData["token"] = uuidv4();
		const signUpQuery = "insert into users set ?";
		connection.query(signUpQuery, getData, (err, result, fields) => {
			res.send("You are signed up.");
		})
	}
})

app.get('/api/signin/', (req, res) => {
	let getData = req.body;
	console.log(getData);
	if(isUserDataValid(res, getData))
	{
		const signInQuery = "select userId, token from  users where userName = ? AND password = ?";
		const values = [req.body.userName, req.body.password]
		const sql = mysql.format(signInQuery, values)
		connection.query(sql, (err, result, fields) => {
			if (err) throw err;
			res.send("You are signed in.")
			console.log(result);
			res.end();
		});
	}
})

app.get('/api/syllabus/', function (req, res)
{
	connection.query("SELECT * FROM syllabus", (err, result, fields) => {
		if (err) throw err;
		res.status("200")
		console.log(fields);
		res.send(result);
		res.end();
	});
});

function validations(res, postData)
{
	let errorMessage = {};
	let isValid = true;
	if(postData.name == undefined || postData.name == "")
	{
		errorMessage["name"] = "Name needs value";
		isValid = false
	}
	if(postData.description == undefined || postData.description == "")
	{
		errorMessage["description"] = "Description needs value";
		isValid = false
	}
	if(postData.learningObjectives == undefined || postData.learningObjectives == "")
	{
		errorMessage["learningObjectives"] = "Learning Objectives needs value";
		isValid = false
	}
	if(postData.userId == undefined || postData.userId == "")
	{
		errorMessage["userId"] = "User id needs value";
		isValid = false
	}
	if(!isValid)
	{
		res.status(400);
		res.send(errorMessage);
	}
	return isValid;
}
app.post('/api/syllabus/', function (req, res)
{
	let postData  = req.body;
	if(validations(res, postData))
	{
		const insertQUery = `INSERT INTO syllabus SET ?, status = 1`;
		connection.query(insertQUery, postData, function (err, result, fields)
		{
			if (err) throw err;
			res.status("201");
			console.log(result);
			const userId = req.body.userId;
			const values = [result.insertId, userId];
			const sqlQuery = `SELECT * FROM syllabus WHERE id = ? AND userId = ?`;
			const sql = mysql.format(sqlQuery, values)
			connection.query(sql, function (err, result, fields)
			{
				if (err) throw err;
				console.log(result);
				res.send(result);
				res.end();
			});
		});

		// res.send(postData);
	}
});		

app.get('/api/syllabus/:id/', function (req, res, next)
{
	console.log(isIdExist(res, req.params.id));
	if(isIdExist(res, req.params.id))
	{
		const sqlQuery = `SELECT * FROM syllabus WHERE id = ?`;
		const value = [req.params.id];
		const sql = mysql.format(sqlQuery, value);
		connection.query(sql, function (err, result, fields)
		{
			if (err) throw err;
			console.log(result);
			res.send(result);
			res.end();
		});
	}
});

app.put('/api/syllabus/:id/', function (req, res, next)
{
	console.log(req.params.id);
	if(isIdExist(res, req.params.id))
	{
		const updateQuery = "UPDATE syllabus SET name = ?, description = ?, learningObjectives = ? where id = ? AND userId = ?";
		const values = [req.body.name, req.body.description, req.body.learningObjectives, req.params.id, req.body.userId];
		const sql = mysql.format(updateQuery, values);
		connection.query(sql, function (err, result, fields)
		{
			if (err) throw err;
			res.status("201");
			console.log(result);
			const userId = req.body.userId;
			const values = [req.params.id, userId];
			const sqlQuery = `SELECT * FROM syllabus WHERE id = ? AND userId = ?` ;
			const sql = mysql.format(sqlQuery, values);
			connection.query(sql, function (err, result, fields)
			{
				if (err) throw err;
				res.status("201");
				res.send(result);
			});
		});

	}
});

app.delete('/api/syllabus/:id/', function (req, res, next)
{
	console.log(req.params.id);
	if(isIdExist(res, req.params.id))
	{
		const deleteQuery = `UPDATE syllabus SET status = 0 where id = ?`;
		const value = [req.params.id];
		const sql = mysql.format(deleteQuery, value);
		connection.query(sql, function (err, result, fields)
		{
			res.status("200");
		});	
	}
})

function isIdExist(res, id)
{
	var isIdExist = true;
	const sqlQuery = `SELECT id from syllabus where id = ?`;
	const value = [id];
	const sql = mysql.format(sqlQuery, value);
	connection.query(sql, (err, result, fields) => {
		if(result.length == 0)
		{
			console.log("404");
			res.status(404);
			isIdExist = false;
		}
	});
	return isIdExist;
	console.log(isIdExist);
}

app.listen(3000);