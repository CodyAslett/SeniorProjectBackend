'use strict';

console.log('server Starting');

//const http = require('http')
const port = 3000;

var express = require('express');
var app = express();
//var https = require('https');
//var fs = requrie('fs');


/*
const server = http.createServer(function (req, res) {
    res.write('You found Cody Aslett\'s syncing Audiobook Player Backend')
    console.log('Http Request : ' + toString(req))
    res.end()
})


server.listen(port, function (error) {
    if (error) {
        console.log('Something went wrong', error)
    } else {
        console.log('Server is listening on port ' + port)
    }
})
*/

app.listen(port, () => {
    console.log('Example app listening on port : ' + port)
})

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
    res.send('Thank you for your request to get : ' + JSON.stringify(req.body))
    console.log('Get Requested : ' + JSON.stringify(req.headers))
})