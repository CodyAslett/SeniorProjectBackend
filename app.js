'use strict';

console.log('Server Starting : ', process.env);

var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
const url = require('url');
const ip = require('ip');
const hat = require('hat');
const { Pool } = require('pg');

const apiPort = 3000;

const pool = new Pool();

console.log('Pool :', JSON.stringify(pool));

// boot db test
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
                  respond.send('DENIED');
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
   try
   {

   }
   catch (err)
   {

   }
});


// respond to a GET requests
app.get('/', function (req, res)
{
   console.log('Get Requested : ' + JSON.stringify(req.headers) + "\nip:" + JSON.stringify(req.ip) + "\nreq:" + req + "\n APP:" + res.app + "\nHeaders:" + res.headersSent + "\nLocals" + JSON.stringify(res.locals) + "\nget:" + res.get('Content-Type'));
   res.send('Thank you for your API request to get : ' + JSON.stringify(req.body))

});

/////////////////////////////////////////////////////////////////////
// Start
/////////////////////////////////////////////////////////////////////
app.listen(apiPort, () => 
{
   console.log('Example app listening on port : ' + apiPort)
});
