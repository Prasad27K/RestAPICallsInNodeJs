var connection = require('./MyConnection.js');
var mysql = require('mysql2');
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

connection.connect((err) => {
	if (err) throw err;
	console.log('connected to database.');
});

app.post('/api/signup/', (req, res) => {
	let getData = req.body;
	if(isUserDataValid(res, getData)) {
		getData["token"] = uuidv4();
		const signUpQuery = "insert into users set ?";
		connection.query(signUpQuery, getData, (err, result, fields) => {
			res.send({"Message": "You are signed up."});
		})
	}
})

app.get('/api/signin/', (req, res) => {
	let getData = req.body;
	console.log(getData);
	if(isUserDataValid(res, getData))
	{
		const signInQuery = "select token from  users where userName = ? AND password = ?";
		const values = [req.body.userName, req.body.password]
		const sql = mysql.format(signInQuery, values)
		connection.query(sql, (err, result, fields) => {
			if (err) throw err;
			if(result.length == 0) {
				res.status(400)
				res.send({"Error": "Invalid User Name/Password"})
			}
			res.send(result[0]);
			console.log(result[0]);
		});
	}
})


app.use(validateToken);
app.use(validateUserId);

function validateToken(req, res, next) {
	const token = req.headers.authorization;
	if(token == undefined || token == "")
	{
		res.status(401).send({"Error": "Unauthorized User"})
	}
	else {
		req["token"] = token;
		next();
	}
}

function validateUserId(req, res, next) {
	const token = req["token"];
	const sqlQuery = "SELECT userId FROM users WHERE token = ?";
	const value = [token];
	const sql = mysql.format(sqlQuery, value);
	connection.query(sql, (err, result, fields) => {
		if (err) throw err;
		console.log(result);
		if(result.length == 0) {
			res.status(401).send({"Error": "Unauthorized User"});
		}
		else {
			const userId = result[0]["userId"];
			req["userId"] = userId;
			next();
		}		
	})
}

function isUserDataValid(res, getData) {
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

app.get('/api/syllabus/', (req, res) => {
	const userId = req.userId;
	const sqlQuery = "SELECT * FROM syllabus WHERE userId = ? AND status = 1";
	const value = [userId];
	const sql = mysql.format(sqlQuery, value);
	connection.query(sql, (err, result, fields) => {
		if (err) throw err;
		res.status("200").send(result);
	});
});

function validations(res, postData)
{
	let errorMessage = {};
	let isValid = true;
	if(postData.name == undefined || postData.name == "") {
		errorMessage["name"] = "Name needs value";
		isValid = false
	}
	if(postData.description == undefined || postData.description == "") {
		errorMessage["description"] = "Description needs value";
		isValid = false
	}
	if(postData.learningObjectives == undefined || postData.learningObjectives == "") {
		errorMessage["learningObjectives"] = "Learning Objectives needs value";
		isValid = false
	}
	if(!isValid) {
		res.status(400);
		res.send(errorMessage);
	}
	return isValid;
}

app.post('/api/syllabus/', (req, res) => {
	let postData  = req.body;
	console.log(token);
	if(validations(res, postData)) {
		postData["userId"] = req.userId;
		const insertQUery = `INSERT INTO syllabus SET ?, status = 1`;
		connection.query(insertQUery, postData, (err, result, fields) => {
			if (err) throw err;
			res.status("201");
			const userId = req.userId;
			const values = [result.insertId, userId];
			const sqlQuery = `SELECT * FROM syllabus WHERE id = ? AND userId = ?`;
			const sql = mysql.format(sqlQuery, values)
			connection.query(sql, (err, result, fields) => {
				if (err) throw err;
				console.log(result);
				res.send(result);
			});
		});
	}
});		

app.get('/api/syllabus/:id/', (req, res, next) => {
	let userId = req.userId;
	console.log(req.userId);
	const sqlQuery = `SELECT id from syllabus where id = ? AND userId = ?`;
	const values = [req.params.id, userId];
	const sql = mysql.format(sqlQuery, values);
	connection.query(sql, (err, result, fields) => {
		if(result.length == 0) {
			res.status(404).send({"Error": "Please Provide valid Id"})
		}
		else {
			const sqlQuery = `SELECT * FROM syllabus WHERE id = ?`;
			const value = [req.params.id];
			const sql = mysql.format(sqlQuery, value);
			connection.query(sql, (err, result, fields) => {
				if (err) throw err;
				console.log(result);
				res.send(result);
			});
		}
	});
});

app.put('/api/syllabus/:id/', (req, res, next) => {
	console.log(req.params.id);
	var userId = req.userId;
	const sqlQuery = `SELECT id from syllabus where id = ? AND userId = ?`;
	const value = [req.params.id, userId];
	const sql = mysql.format(sqlQuery, value);
	connection.query(sql, (err, result, fields) => {
		if(result.length == 0) {
			res.status(404);
			res.send({"Error": "Please Provide valid Id"})
		}
		else {
			const updateQuery = "UPDATE syllabus SET name = ?, description = ?, learningObjectives = ? where id = ? AND userId = ?";
			const values = [req.body.name, req.body.description, req.body.learningObjectives, req.params.id, userId];
			const sql = mysql.format(updateQuery, values);
			connection.query(sql, (err, result, fields) => {
				if (err) throw err;
				res.status("200");
				console.log(result);
				const values = [req.params.id, userId];
				const sqlQuery = `SELECT * FROM syllabus WHERE id = ? AND userId = ?` ;
				const sql = mysql.format(sqlQuery, values);
				connection.query(sql, (err, result, fields) => {
					if (err) throw err;
					res.status("201");
					res.send(result);
				});
			});
		}
	});
});

app.delete('/api/syllabus/:id/', (req, res, next) => {
	console.log(req.params.id);
	const userId = req.userId;
	const sqlQuery = `SELECT id from syllabus where id = ? and userId = ?`;
	const value = [req.params.id, userId];
	const sql = mysql.format(sqlQuery, value);
	connection.query(sql, (err, result, fields) => {
		if(result.length == 0) {
			res.status(404);
			res.send({"Error": "Id not found."})
		}
		else {
			const deleteQuery = `UPDATE syllabus SET status = 0 where id = ?`;
			const value = [req.params.id];
			const sql = mysql.format(deleteQuery, value);
			connection.query(sql, (err, result, fields) => {
				if (err) throw err;
				res.status("200");
			});	
		}
	});
});

app.listen(3000);