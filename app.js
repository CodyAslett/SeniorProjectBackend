'use strict';

console.log('Server Starting : ', process.env);

var express = require('express');
const fileUpload = require('express-fileupload');
var bodyParser = require('body-parser');
var fs = require('fs');
const url = require('url');
const ip = require('ip');
const hat = require('hat');
const { Pool } = require('pg');

const apiPort = 3000;

const pool = new Pool();

console.log('Pool :', JSON.stringify(pool));

/********************************************************************
 * boot Data Base and do quick test
 ********************************************************************/
pool.connect((err, client, release) =>
{
   if (err)
   {
      return console.error('Error acquiring client', JSON.stringify(pool), err.stack, err.message)
   }
   client.query('SELECT NOW()', (err, result) =>
   {
      if (err)
      {
         return console.error('Error executing query', err.stack);
      }
      console.log(result.rows);
   });
   client.query('SELECT COUNT(*) FROM users', (err, result) =>
   {
      if (err)
      {
         return console.error('Error executing query', err.stack);
      }
      console.log('Users found : ', result.rows[0]['count']);
   });
   client.query('SELECT COUNT(*) FROM tokens', (err, result) =>
   {
      if (err)
      {
         return console.error('Error executing query', err.stack);
      }
      console.log('Tokens found : ', result.rows[0]['count']);
   });

   release();
});



var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(fileUpload({ createParentPath: true }));



/********************************************************************
 * Login
 ********************************************************************/
app.get('/login', function (request, response)
{
   try
   {
      //response.send('login atemped : ' + request.url);
      const queryObject = url.parse(request.url, true).query;
      // TODO: Add checks for duplicate tokens
      var token = hat();
      var dbRequest;
      var tokenResult;

      //Token Login
      if (queryObject["token"] !== undefined && queryObject["token"] !== null)
      {
         pool.connect((err, client, release) =>
         {
            if (err)
            {
               return console.error('Error acquiring token client', err.stack)
            }

            var userGivenToken = JSON.stringify(queryObject["token"]).replace(/"/g, "");
            var query = "SELECT (username, token) FROM tokens WHERE token = '" + userGivenToken + "'";

            console.log('making dbRequest : ' + query);

            client.query(query, (err, result) =>
            {
               if (err)
               {
                  return console.error('Error executing token query', err.stack);
               }
               tokenResult = ((result.rows[0]['row']).replace(/\)|\(/g, "")).split(',');
               var dbToken = tokenResult[1];
               var dbUser = tokenResult[0];
               var user;

               console.log(typeof (dbToken));

               console.log('DB request result : ' + dbToken);
               if (queryObject["username"] !== undefined && queryObject["username"] !== null)
               {
                  user = JSON.stringify(queryObject["username"]).replace(/"/g, "");
               }

               if (dbToken === userGivenToken && user === dbUser)
               {
                  console.log('token match ' + userGivenToken)
                  response.send('ACCEPTED');
                  return;
               }
               else
               {
                  console.log('Token Mismatch : ' + dbToken + ' != ' + userGivenToken);
                  response.send('DENIED');
                  return;
               }
            });
         });
      }
      if (queryObject["username"] !== undefined && queryObject["username"] !== null) 
      {
         var user = JSON.stringify(queryObject["username"]).replace(/"/g, "");
         if (queryObject["password"] !== undefined && queryObject["password"] !== null) 
         {
            var pass = JSON.stringify(queryObject["password"]).replace(/"/g, "");

            pool.connect((err, client, release) => 
            {
               if (err) 
               {
                  return console.error('Error : acquiring user client', err.stack)
               }
               var query = "SELECT (password) FROM users WHERE name = '" + user + "'";
               console.log('quering : ' + query + '& FROM : ' + request.connection.remoteAddress);
               client.query(query, (err, result) =>
               {
                  // release();
                  if (err) 
                  {
                     return console.error('Error : executing query', err.stack);
                  }
                  console.log('Result ' + JSON.stringify(result));
                  if (result.rows.length > 0)
                  {
                     if (pass === result.rows[0]['password'])
                     {
                        console.log('loginSucess for ' + user);
                        dbRequest = result.rows[0];
                        var tokenPost = "INSERT INTO tokens(username, token, ip) VALUES ('" + user + "', '" + token + "', '" + ip.address() + "')";
                        console.log('sending ' + tokenPost);
                        client.query(tokenPost, (err, resultToken) => 
                        {
                           release();
                           if (err) 
                           {
                              return console.error('Error executing query', err.stack);
                           }
                           console.log("sent tokent to db");
                        });
                     }
                     else 
                     {
                        console.log(result.rows[0]['password'] + '!=' + pass);
                        response.send('DENIED : PROVIDED USERNAM AND PASSWORD DON\'t MATCH RECORDS');
                        return;
                     }
                  }
                  else
                  {
                     console.log('ERROR : DB requestresult empty :' + JSON.stringify(result));
                     response.send('DENIED : PROVIDED USERNAM AND PASSWORD DON\'t MATCH RECORDS');
                     return;
                  }


                  var queryPass = dbRequest;
                  response.send('ACCEPTED: ' + token);
                  console.log('user : ' + user + '   ' + queryPass);
               });
            });
         }
      }
      else 
      {
         response.send('DENIED');
      }
   }
   catch (err) 
   {
      response.send('ERROR: Bad login Request ' + err.stack);
   }
});



/********************************************************************
 * Add File
 ********************************************************************/
app.post('/addfile', function (request, response)
{
   console.log("\nAddFile ");
   try
   {
      const queryObject = url.parse(request.url, true).query;

      var dbRequest;
      
      var baseFilePath = __dirname + '/repo/torrents';

      if (queryObject["token"] !== undefined && queryObject["token"] !== null && queryObject["username"] !== undefined && queryObject["username"] !== null)
      {
         console.log("AddFile : credentials not null");
         var user = JSON.stringify(queryObject["username"]).replace(/"/g, "");
         var userGivenToken = JSON.stringify(queryObject["token"]).replace(/"/g, "");

         var query = "SELECT (username, token) FROM tokens WHERE token = '" + userGivenToken + "'";

         pool.connect((err, client, release) =>
         {
            if (err)
            {
               return console.error('Error acquiring token client', err.stack)
            }

            client.query(query, (err, result) =>
            {
               if (err)
               {
                  return console.error('Error executing token query', err.stack);
               }
               var tokenResult = ((result.rows[0]['row']).replace(/\)|\(/g, "")).split(',');
               var dbToken = tokenResult[1];
               var dbUser = tokenResult[0];
               var user = JSON.stringify(queryObject["username"]).replace(/"/g, "");

               if (dbToken === userGivenToken && user === dbUser)
               {
                  console.log("AddFile : Good credentials");
                  var userFilePath = baseFilePath + "/" + user;

                  if (!fs.existsSync(userFilePath))
                  {
                     console.log("AddFile : Making file " + user);
                     fs.mkdirSync(userFilePath);
                  }

                  let torrent = request.files.torrent;

                  var newTorrentPath = userFilePath + '/' + torrent.name;
                  torrent.mv(newTorrentPath, function () {
                     if (fs.existsSync(newTorrentPath))
                     {
                        console.log("AddFile : uploaded file : " + newTorrentPath);
                        response.send('ACCEPTED : File Uploaded');
                        return;
                     }
                     else
                     {
                        console.log("AddFile : Failed to upload file : " + newTorrentPath);
                        response.send('Failed : internal error uploading file');
                        return;
                     }
                  });


               }
               else
               {
                  console.log('AddFile : Token Mismatch : ' + dbUser + ':' + dbToken + ' != ' + user + ':' + userGivenToken);
                  response.send('DENIED');
                  return;
               }
            });
         });


      }
      



   }
   catch (err)
   {
      console.error("AddFile : Error trying to add file : " + err.stack);
      response.send("ERROR : FAILED TO ADD FILE");
   }
});


/////////////////////////////////////////////////////////////////////
// get List of Files
/////////////////////////////////////////////////////////////////////
app.get('/getfiles', function (request, response)
{



});

/////////////////////////////////////////////////////////////////////
// Unknown GET requests
/////////////////////////////////////////////////////////////////////
app.get('/', function (req, res)
{
   var temp = [];
   var request = JSON.stringify(req, (key, value) =>
   {
      if (typeof value === 'object' && value !== null)
      {
         if (temp.includes(value))
            return "[CIRCULAR REFFERENCE]";
         temp.push(value);
      }
      return value;
   });
   temp = null;
   temp = [];
   var response = JSON.stringify(res, (key, value) =>
   {
      if (typeof value === 'object' && value !== null)
      {
         if (temp.includes(value))
            return "[CIRCULAR REFFERENCE]";
         temp.push(value);
      }
      return value;
   });
   temp = null;
   console.log('\nGet Requested : ' + JSON.stringify(req.headers) + "\nip:" + JSON.stringify(req.ip) + "\nIPS:" + req.ips + "\n" + req.socket + "\nrequest:" + request + "\nresponse:" + response + "\n");
   res.send('Thank you for your API request : ' + request + "\n\n\n" + "response :" + response);

});

/////////////////////////////////////////////////////////////////////
// Start
/////////////////////////////////////////////////////////////////////
app.listen(apiPort, () => 
{
   console.log('Example app listening on port : ' + apiPort)
});
