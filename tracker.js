var Server = require('bittorrent-tracker').Server;
var port = 8000;

var server = new Server({
   udp: true, // enable udp server? [default=true]
   http: true, // enable http server? [default=true]
   ws: true,   // enable websocket server? [default=true]
   stats: true, // enable web-based statistics? [default=true]
   filter: function (infoHash, params, cb)
   {
      // Blacklist/whitelist function for allowing/disallowing torrents. If this option is
      // omitted, all torrents are allowed. It is possible to interface with a database or
      // external system before deciding to allow/deny, because this function is async.

      // It is possible to block by peer id (whitelisting torrent clients) or by secret
      // key (private trackers). Full access to the original HTTP/UDP request parameters
      // are available in `params`.

      // This example only allows one torrent.

      var allowed = (infoHash === 'aaa67059ed6bd08362da625b3ae77f6f4a075aaa')
      if (allowed)
      {
         // If the callback is passed `null`, the torrent will be allowed.
         cb(null)
      } else
      {
         // If the callback is passed an `Error` object, the torrent will be disallowed
         // and the error's `message` property will be given as the reason.
         cb(new Error('disallowed torrent'))
      }
   }
})

server.on('error', function (err)
{
   // fatal server error!
   console.log(err.message);
})

server.on('warning', function (err)
{
   // client sent bad data. probably not a problem, just a buggy client.

   console.log(err.message);
})

server.on('listening', function ()
{
   console.log('tracker server is listening on port : ' + port);
})

// start tracker server listening!
server.listen(port);

// listen for individual tracker messages from peers:

server.on('start', function (addr, params)
{
   console.log('got start message from ' + addr);
   //console.log('params in the message: ' + params)
})

server.on('complete', function (addr, params)
{
   console.log('got complete message from ' + addr);
});
server.on('update', function (addr, params)
{
   console.log('got update message from ' + addr);
});
server.on('stop', function (addr, params)
{
   console.log('got stop message from ' + addr);
});

// get info hashes for all torrents in the tracker server
console.log(Object.keys(server.torrents))

// get info hashes for all torrents in the tracker server
Object.keys(server.torrents)
