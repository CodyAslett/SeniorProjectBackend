var Server = require('bittorrent-tracker').Server
var port = 8000

var server = new Server({
   udp: true, // enable udp server? [default=true]
   http: true // enable http server? [default=true]
})

server.on('error', function (err)
{
   // fatal server error!
   console.log(err.message)
})

server.on('warning', function (err)
{
   // client sent bad data. probably not a problem, just a buggy client.

   console.log(err.message)
})

server.on('listening', function ()
{
   console.log('tracker server is listening on port : ' + port)
})

// start tracker server listening!
server.listen(port)

// listen for individual tracker messages from peers:

server.on('start', function (addr, params)
{
   console.log('got start message from ' + addr)
   //console.log('params in the message: ' + params)
})

server.on('complete', function (addr, params) { })
server.on('update', function (addr, params) { })
server.on('stop', function (addr, params) { })

// get info hashes for all torrents in the tracker server
console.log(Object.keys(server.torrents))