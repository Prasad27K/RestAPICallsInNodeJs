var connection = require('./MyConnection.js');
// var mysql = require('mysql2');	
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var cors = require('cors')

const { v4: uuidv4 } = require('uuid');
console.log(uuidv4());

var emailValidator = require("email-validator");
console.log(emailValidator.validate("test@email.com"));

var passwordValidator = require('password-validator');
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.use(validateToken);
app.use(validateUserId);

function isPathExist(req, next) {
	let isPathExist = false;
	const path = req.path;
	if(path == "/api/signin/" || path == "/api/signup/") {
		next();
		isPathExist = true;
	}
	return isPathExist;
}

function validateToken(req, res, next) {
	if(!isPathExist(req, next)) {
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
}

function validateUserId(req, res, next) {
	if(!isPathExist(req, next)) {
		const token = req["token"];
		const sqlQuery = "SELECT userId FROM users WHERE token = ?";
		const value = [token];
		connection.promise().execute(sqlQuery, value)
		.then(([result, fields]) => {
			console.log(result);
			if(result.length == 0) {
				res.status(401).send({"Error": "Unauthorized User"});
			}
			else {
				const userId = result[0]["userId"];
				console.log(userId);
				req["userId"] = userId;
				next();
			}		
		})
		.catch((err) => {
			console.log(err)
			res.status(500);
		})
	}
}

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

app.post('/api/signin/', (req, res) => {
	let getData = req.body;
	console.log(getData);
	if(isUserDataValid(res, getData))
	{
		const signInQuery = "select token from  users where userName = ? AND password = ?";
		const values = [req.body.userName, req.body.password]
		connection.execute(signInQuery, values, (err, result, fields) => {
			if (err) throw err;
			if(result.length == 0) {
				res.status(400)
				console.log({"Error": "Invalid User Name/Password"});
				res.send({"Error": "Invalid User Name/Password"})

			}
			res.send(result[0]);
			console.log(result[0]);
		});
	}
})

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
	connection.promise().execute(sqlQuery, value)
	.then(([rows, fields]) => {
		res.status("200").send(rows);
	})
	.catch((err) => {
		console.log(err)
		res.status(500);
	})
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
	if(validations(res, postData)) {
		const values = [postData.name, postData.description, postData.learningObjectives, req.userId];
		const insertQUery = `INSERT INTO syllabus(name, description, learningObjectives, userId, status) Values(?, ?, ?, ?, 1)`;
		// res.send(values);
		connection.promise().execute(insertQUery, values)
		.then(([result, fields]) => {
			res.status("201");
			return result.insertId;
		})
		.then((result) => {
			const value = [result];
			const sqlQuery = `SELECT * FROM syllabus WHERE id = ?`;
			return connection.promise().execute(sqlQuery, value) 
		})
		.then((result) => {
			console.log(result[0]);
			res.send(result[0]);
		})
		.catch((err) => {
			console.log(err)
			res.status(500);
		})
	}
});

app.get('/api/syllabus/:id/', (req, res, next) => {
	let userId = req.userId;
	console.log(req.userId);
	const sqlQuery = `SELECT id from syllabus where id = ? AND userId = ?`;
	const values = [req.params.id, userId];
	connection.promise().execute(sqlQuery, values)
	.then((result) => {
		console.log(result);
		result = result[0];
		if(result.length == 0) {
			res.status(404).send({"Error": "Please Provide valid Id"})
		}
		return result;
	})
	.then((result) => {
		const id = result[0].id;
		const sqlQuery = `SELECT * FROM syllabus WHERE id = ?`;
		const value = [id];
		return connection.promise().execute(sqlQuery, value)
	})
	.then((result) => {
		res.send(result[0]);
	})
	.catch((err) => {
		console.log(err)
		res.status(500);
	})
});

app.put('/api/syllabus/:id/', (req, res, next) => {
	var userId = req.userId;
	const sqlQuery = `SELECT id from syllabus where id = ? AND userId = ?`;
	const id = req.params.id;
	const values = [id, userId];
	connection.promise().execute(sqlQuery, values)
	.then((result) => {
		result = result[0];
		if(result.length == 0) {
			res.status(404);
			res.send({"Error": "Please Provide valid Id"})
		}
		else
		{
			return result;
		}
	})
	.then((result) => {
		const id = result[0].id;
		const updateQuery = "UPDATE syllabus SET name = ?, description = ?, learningObjectives = ? where id = ?";
		const values = [req.body.name, req.body.description, req.body.learningObjectives, id,];
		connection.promise().execute(updateQuery, values);
		return id;
	})
	.then((result) => {
		const value = [result];
		const sqlQuery = `SELECT * FROM syllabus WHERE id = ?` ;
		return connection.promise().execute(sqlQuery, value);
	})
	.then((result) => {
		res.status("200");
		res.send(result[0]);
	})
	.catch((err) => {
		console.log(err)
		res.status(500);
	})
});

app.delete('/api/syllabus/:id/', (req, res, next) => {
	console.log(req.params.id);
	const userId = req.userId;
	const id = req.params.id;
	const sqlQuery = `SELECT id from syllabus where id = ? and userId = ?`;
	const values = [id, userId];
	connection.promise().execute(sqlQuery, values)
	.then((result) => {
		result = result[0];
		if(result.length == 0) {
			res.status(404);
			res.send({"Error": "Id not found."})
		}
		else
		{
			return result;
		}
	})
	.then((result) => {
		const id = result[0].id;
		const deleteQuery = `UPDATE syllabus SET status = 0 where id = ?`;
		const value = [id];
		connection.promise().execute(deleteQuery, value)
		res.status(200).send("");
	})
	.catch((err) => {
		console.log(err)
		res.status(500);
	})
});
app.listen(3000);