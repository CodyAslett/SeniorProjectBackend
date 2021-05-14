'use strict';

console.log('Server Starting');

const apiPort = 3000;
const webPort = 80;
//var publicDirPath = path.join(__dirname + '/public');



var express = require('express');
var session = require('express-session')
var bodyParser = require('body-parser')


var app = express();
var web = express();


var sess = {
    secret: 'auto',
    cookie: {}
}
if (web.get('env') === 'production') {
    web.set('trust proxy', 1) //trust first proxy
    sess.cookie.secure = true //serve secure cookies
}
web.use(session(sess));

web.set('port', (process.env.PORT || webPort))
//web.use(express.static(__dirname + '/public'));
web.use(express.static(__dirname + '/public', { extensions: ['html'] }));
web.set('views', __dirname + '/public/views');
web.engine('html', require('ejs').renderFile);
web.set('view engine', 'html');


web.use(bodyParser.urlencoded({
    extended: true
}));

web.use(bodyParser.json());
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
web.get('/', function (request, response) {
    console.log('pages/index' + request.url + " Request");
    response.render('index.html');
});

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
    res.send('Thank you for your API request to get : ' + JSON.stringify(req.body))
    console.log('Get Requested : ' + JSON.stringify(req.headers))
})


/////////////////////////////////////////////////////////////////////
// Error Responses
/////////////////////////////////////////////////////////////////////
// BAD URL // 404 ERROR respons
web.get('*', function (req, res) {
    console.log('BAD 404 Request for ' + req.url);
    res.send("Say Whay??", 404);
});

/////////////////////////////////////////////////////////////////////
// Start
/////////////////////////////////////////////////////////////////////
app.listen(apiPort, () => {
    console.log('Example app listening on port : ' + apiPort)
})

web.listen(webPort, () => {
    console.log('Example app listening on port : ' + webPort)
})