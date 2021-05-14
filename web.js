console.log('Server Starting');

const webPort = 80;

var express = require('express');
var session = require('express-session')
var bodyParser = require('body-parser')

var web = express();

web.use(express.static(__dirname + '/public', { extensions: ['html'] }));
web.set('views', __dirname + '/public/views');
web.engine('html', require('ejs').renderFile);
web.set('view engine', 'html');

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

web.get('/', function (request, response) {
    console.log('pages/index' + request.url + " Request");
    response.render('index.html');
});

/////////////////////////////////////////////////////////////////////
// Error Responses
/////////////////////////////////////////////////////////////////////
// BAD URL // 404 ERROR respons
web.get('*', function (req, res) {
    console.log('BAD 404 Request for ' + req.url);
    res.send("Say Whay??", 404);
});

web.listen(webPort, () => {
    console.log('Example app listening on port : ' + webPort)
})