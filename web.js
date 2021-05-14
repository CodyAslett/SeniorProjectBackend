console.log('Server Starting');

const webPort = 80;

var express = require('express');
var session = require('express-session')
var bodyParser = require('body-parser')

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
web.use(bodyParser.urlencoded({
    extended: true
}));

web.use(bodyParser.json());

// respond with "hello world" when a GET request is made to the homepage
web.get('/', function (request, response) {
    console.log('pages/index' + request.url + " Request");
    response.render('index.html');
});

web.listen(webPort, () => {
    console.log('Example app listening on port : ' + webPort)
})