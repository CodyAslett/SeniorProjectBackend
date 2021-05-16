'use strict';

console.log('Server Starting');

const apiPort = 3000;
const pgPort = 5432;
const fixedIP = '54.185.209.208';



var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
const url = require('url');
const ip = require('ip');
const hat = require('hat');
const { Pool } = require('pg');
const { cache } = require('ejs');
const { get } = require('http');
var pass;

pass = fs.readFileSync('../pass.txt', 'utf8', function (err, data) {
    if (err)
    {
        return console.log(err);
    }
    return data;    
});
console.log
const pool = new Pool({
    host: fixedIP,
    port: pgPort,
    user: 'remotetesting',
    password: pass,
    database: 'syncaudiobookplayerbackenddb',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
});

// boot db test
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack)
    }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            return console.error('Error executing query', err.stack);
        }
        console.log(result.rows);
    });
});



var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/login', function (request, response) {
    //response.send('login atemped : ' + request.url);
    const queryObject = url.parse(request.url, true).query;
    var user = JSON.stringify(queryObject["username"]).replace(/"/g, "");
    var pass = JSON.stringify(queryObject["password"]).replace(/"/g, "");
    
    var dbRequest;
    pool.connect((err, client, release) => {
        if (err) {
            return console.error('Error acquiring client', err.stack)
        }
        var query = "SELECT * FROM users WHERE name = '" + user + "'";
        console.log('quering : ' + query + '& FROM : ' + JSON.stringify(request.header('x-forwarded-for')));
        client.query(query, (err, result) => {
           // release();
            if (err) {
                return console.error('Error executing query', err.stack);
            }
            if (pass === result.rows[0]['password']) {
                console.log('loginSucess for ' + user);
                dbRequest = result.rows[0];
                var token = hat();
                var tokenPost = "INSERT INTO tokens(username, token, ip) VALUES ('" + user + "', '" + token + "', '" + ip.address() + "')";
                console.log('sending ' + tokenPost);
                client.query(tokenPost, (err, result) => {
                    release();
                    if (err) {
                        return console.error('Error executing query', err.stack);
                    }
                    console.log("sent tokent to db");
                });
            }
            else
                console.log(result.rows[0]['password'] + '!=' + pass);
            
        });
    });
    var queryPass = dbRequest;
    response.send('login atempt : ' + dbRequest);
    console.log('user : ' + user + '   ' + queryPass);
});

// respond to a GET requests
app.get('/', function (req, res) {
    res.send('Thank you for your API request to get : ' + JSON.stringify(req.body))
    console.log('Get Requested : ' + JSON.stringify(req.headers))
})

/////////////////////////////////////////////////////////////////////
// Start
/////////////////////////////////////////////////////////////////////
app.listen(apiPort, () => {
    console.log('Example app listening on port : ' + apiPort)
})
