'use strict';

console.log('Server Starting');

const apiPort = 3000;
const pgPort = 5432;
const fixedIP = '54.185.209.208';


var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var fs = require('fs');
const { Pool } = require('pg');
const { cache } = require('ejs');
var pass;

pass = fs.readFileSync('../pass.txt', 'utf8', function (err, data) {
    if (err)
    {
        return console.log(err);
    }
    return data;   
});
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
    })
});





var app = express();


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
