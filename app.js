'use strict';

console.log('Server Starting : ', process.env);

var express = require('express');
const fileUpload = require('express-fileupload');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
const url = require('url');
const ip = require('ip');
const hat = require('hat');
const { Pool } = require('pg');
const { Console } = require('console');

const apiPort = 3000;

const pool = new Pool();

console.log('Pool :', JSON.stringify(pool));

// TODO : move athentication of token username combo into seperate function
// TODO : Add sanitation of user input

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
                        response.status(203);
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
 * TODO : add checks to see if path already exists in the database 
 * TODO : setup bad request respons so doesn't hang
 ********************************************************************/
app.post('/addfile', function (request, response)
{
   console.log("\nAddFile ");
   var returnValue = 'Failed : internal error uploading file';
   try
   {
      const queryObject = url.parse(request.url, true).query;

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
               requ
               return console.error('Error acquiring token client', err.stack)
            }

            client.query(query, (err, result) =>
            {
               if (err)
               {
                  response.send(500, "ERROR : FAILED TO ADD FILE");
                  return console.error('Error executing token query', err.stack);
               }
               var tokenResult = ((result.rows[0]['row']).replace(/\)|\(/g, "")).split(',');
               var dbToken = tokenResult[1];
               var dbUser = tokenResult[0];

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
                  torrent.mv(newTorrentPath, function ()
                  {
                     if (fs.existsSync(newTorrentPath))
                     {
                        var insertIntoQuery = "INSERT INTO useruploadedfiles (path, fileextention, username, tokenused) VALUES ('" + newTorrentPath + "', '" + path.extname(newTorrentPath) + "', '" + user + "', '" + userGivenToken + "')";
                        console.log("AddFile : trying to insert file to DB : " + insertIntoQuery);
                        client.query(insertIntoQuery, (err, result) =>
                        {
                           if (err)
                           {
                              response.status(500);
                              response.send("ERROR : FAILED TO ADD FILE");
                              return console.error('AddFile : Error : executing insert', err.stack);
                           }
                           console.log("AddFile : uploaded file and will send ACCEPTED ");
                           returnValue = 'ACCEPTED: File Uploaded';

                           console.log("AddFile : will return : " + returnValue);
                           response.send(returnValue);
                           return;
                        });
                     }
                  });
               }
               else
               {
                  console.log("AddFile : username token credientals missmatch");
                  response.send(returnValue);
                  return;
               }
            });

         });
        
      }
   }
   catch (err)
   {
      console.error("AddFile : Error trying to add file : " + err.stack);
      response.send(500, "ERROR : FAILED TO ADD FILE");
   }
});


/********************************************************************
 * get List of Files
 * TODO: setup bad request respons so doesn't hang
*********************************************************************/
app.get('/getfiles', function (request, response)
{
   try
   {
      const queryObject = url.parse(request.url, true).query;
      if (queryObject["token"] !== undefined && queryObject["token"] !== null && queryObject["username"] !== undefined && queryObject["username"] !== null)
      {
         var user = JSON.stringify(queryObject["username"]).replace(/"/g, "");
         var userGivenToken = JSON.stringify(queryObject["token"]).replace(/"/g, "");

         var query = "SELECT (username, token) FROM tokens WHERE token = '" + userGivenToken + "'";

         pool.connect((err, client, release) =>
         {
            if (err)
            {
               response.send(500, "ERROR : Failed to a get list");
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

               if (dbToken === userGivenToken && user === dbUser)
               {
                  var queryFileList = "SELECT (id, path) FROM useruploadedfiles WHERE username = '" + user + "' AND fileextention = '.torrent';";
                  client.query({ rowMode: 'array', text: queryFileList }, (err, result) =>
                  {
                     var torrentFiles = {
                        fileCount: result.rowCount,
                        files: []
                     };
                     for (var i = 0; i < result.rowCount; i++)
                     {
                        console.log("getfile : getting info for : " + JSON.stringify(result.rows[i]));
                        var rowID = JSON.stringify(result.rows[i][0]).split(',')[0];
                        rowID = rowID.replaceAll(/\D/g, '');

                        var rowName = JSON.stringify(result.rows[i][0]).split(',')[1];
                        rowName = rowName.replace(/[\\"()]/g, '');
                        rowName = path.basename(rowName, '.torrent');
                        var file = {
                           id: rowID,
                           name: rowName
                        };
                        torrentFiles.files.push(file);
                     }

                     console.log("GetFileList : sending : " + JSON.stringify(torrentFiles));
                     response.send(200, "ACCEPTED : " + JSON.stringify(torrentFiles));
                     return;
                  });
               }
               else
               {
                  response.send(403, "ERROR : Bad credentials");
                  return;
               }
            });
         });
      }
      else
      {
         response.send(400, "ERROR : Failed to a get list");
         return;
      }
   }
   catch (err)
   {
      response.send(500, "ERROR : Failed to a get list");
      console.log(err.stack);
      return;
   }
});

/********************************************************************
 * get a File
*********************************************************************/
app.get('/getfile', function (request, response)
{
   Console.log("Get File Starting");
   try 
   {
      const queryObject = url.parse(request.url, true).query;

      if (queryObject["token"] !== undefined && queryObject["token"] !== null && queryObject["username"] !== undefined && queryObject["username"] !== null && queryObject["id"] !== undefined && queryObject["id"] !== null)
      {
         var user = JSON.stringify(queryObject["username"]).replace(/"/g, "");
         var userGivenToken = JSON.stringify(queryObject["token"]).replace(/"/g, "");
         var fileId = JSON.stringify(queryObject["id"]).replace(/"/g, "");

         var query = "SELECT (username, token) FROM tokens WHERE token = '" + userGivenToken + "'";

         pool.connect((err, client, release) =>
         {
            if (err)
            {
               Console.log("GetFile Error pool error");
               response.send(500, "ERROR : Failed to a get file");
               return console.error('Error acquiring token client', err.stack);
            }
            client.query(query, (err, result) =>
            {

               var tokenResult = ((result.rows[0]['row']).replace(/\)|\(/g, "")).split(',');
               var dbToken = tokenResult[1];
               var dbUser = tokenResult[0];

               if (dbToken === userGivenToken && user === dbUser)
               {
                  var queryFileList = "SELECT (path) FROM useruploadedfiles WHERE username = '" + user + "' AND id = " + id + ";";
                  client.query({ rowMode: 'array', text: queryFileList }, (err, result) =>
                  {
                     // var getFileResult = 
                     console.log("GetFile result : " + result);
                  });



               }
               else
               {
                  Console.Log("GetFile : Bad Credentials")
                  response.status(203);
                  response.send("ERROR : BAD credentials");
                  return;
               }
            });
         });
      }
      else
      {
         console.log("GetFile Bad Request");
         response.status(400);
         response.send("ERROR : BAD REQUEST");
         return;
      }
   }
   catch (err)
   {
      response.status(500);
      response.send("ERROR : BAD FILE REQUEST");
   }

   var testFile = "repo/torrents/cody/Rick Riordan - The Lightning Thief 1.mp3.torrent";
   response.attachment(testFile);
   console.log("GetFile default Respons : " + response.get('Content-Disposition'));
   response.sendfile(testFile)
   //response.send("ACCEPTED");
});



/********************************************************************
 * Unknown GET requests
*********************************************************************/
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

/********************************************************************
 * Start
*********************************************************************/
app.listen(apiPort, () => 
{
   console.log('Example app listening on port : ' + apiPort)
});
