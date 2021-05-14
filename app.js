'use strict';

console.log('Server Starting');

const apiPort = 3000;

//var publicDirPath = path.join(__dirname + '/public');



var express = require('express');
var session = require('express-session')
var bodyParser = require('body-parser')
const { Client } = require('pg')


var app = express();

const client = new Client({
    user:
});
client.connect()

client.query('SELECT $1::text as message', ['Hello world!'], (err, res) => {
    console.log(err ? err.stack : res.rows[0].message) // Hello World!
    client.end()
})

/*
const server = http.createServer(function (req, res) {
    res.write('You found Cody Aslett\'s syncing Audiobook Player Backend')
    console.log('Http Request : ' + Json.stringify(req.headers))
    res.end()
})


server.listen(webPort, function (error) {
    if (error) {
        console.log('Something went wrong', error)
    } else {
        console.log('Server is listening on port ' + webPort)
    }
})
*/

// respond with "hello world" when a GET request is made to the homepage
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

