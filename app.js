var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var session = require('express-session');
//var jade = require('jade');
var WebSocket = require('ws').Server;

var routes = require('./routes/users');
//var routes = require('./routes/users');
//var users = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// log file setup
var logfile = fs.createWriteStream(path.join(__dirname+'/logs/logger.log'), { flag : 'a' });
app.use(logger('common', {stream : logfile}));

// sessions and cookies setup
app.use(cookieParser('NP-CHF83RJRG93JERRU97'));
app.use(session({
  secret: 'NP-SDSF83R3JG93JG394',
  saveUninitialized: true,
  resave: true,
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: null
  }
}));

//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

//=====================================================================================
//User Authentication and Authorization

//User Authentication
app.use(function(req, res, next) {
  if (req.session && req.session.admin)
    res.locals.admin = true;
    next();

  //return res.redirect('/login');
});

crtm = function(){
  var currentTime = new Date();
  var currentHours = currentTime.getHours();
  var currentMinutes = currentTime.getMinutes();
  var currentSeconds = currentTime.getSeconds();

  // Pad the minutes and seconds with leading zeros, if required
  currentMinutes = ( currentMinutes < 10 ? "0" : "" ) + currentMinutes;
  currentSeconds = ( currentSeconds < 10 ? "0" : "" ) + currentSeconds;

  // Choose either "AM" or "PM" as appropriate
  var timeOfDay = ( currentHours < 12 ) ? "AM" : "PM";

  // Convert the hours component to 12-hour format if needed
  currentHours = ( currentHours > 12 ) ? currentHours - 12 : currentHours;

  // Convert an hours component of "0" to "12"
  currentHours = ( currentHours === 0 ) ? 12 : currentHours;

  // Compose the string for display
  var currentTimeString = currentHours +":"+ currentMinutes +":"+ currentSeconds +" "+ timeOfDay;

  return String(currentTimeString);
}

//User Authorization to REST API Routes
var authorize = function(req, res, next) {
  if (req.session && req.session.admin)
    return next();
  else
    return res.redirect('/NotAuthorized');
};

//Business Logic for processing data from Consumed REST WebService Endpoint
stocksUpdate = function(data){
  logfile.write('['+crtm()+'] REST MSG: '+JSON.stringify(data)+'\r\n');
  console.log('[%s] REST MSG: %s', crtm(), JSON.stringify(data));
  processData(data);
};

// Pages & routes
app.get('/', routes.home);
app.get('/login', routes.login);
app.post('/login', routes.authenticate);
app.get('/logout', routes.logout);
app.get('/NotAuthorized', routes.notauth);
app.get('/NotFound', routes.notfound);

//REST API Routes
app.all('/service', authorize);
//app.get('/service', routes.notauth);
//app.get('/service/stocks', routes.notauth);
app.post('/service/stocks', function(req, res, next){
  var dt = req.body;
  next(stocksUpdate(String(dt.v))); //Get JSON object and get the value to the key 'v'
});  //REST Routing for receiving real-time stock market data

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  console.log('%s - %s', crtm(), err.stack);
  //res.sendFile('404.html', {root: './public/'});
  next(err);
});

//======================================================================================

//======================================================================================
//WebSocket Endpoint Configuration

var wsclients = []; //WebSocket Clients

//WebSocket Methods
sendMsg = function(data, attr){
  //wsclients[i][0].send(data);
  //console.log('Data [%s]: %s', wsclients[i][1], data);

  var users = wsclients.length;
  if(users > 0){
    if(attr !== ''){
      if(startsWith(data, '<msg id=\"MSG\" cid')){
        for(var i in wsclients){
          if(wsclients[i][1].match(attr) !== null)
            wsclients[i][0].send(data.concat('|NSE1'));
        }
      }
      else{
        for(var i in wsclients){
          if(startsWith(data, attr))
            wsclients[i][0].send(data.concat('|NSE1'));
        }
      }
    }
    else{
      if(startsWith(data, '<msg ID=\"DPT.') || startsWith(data, '<msg ID=\"SKPR.') || startsWith(data, '<msg ID=\"HSPR.') || startsWith(data, '<msg ID=\"DTRD')) {
        for(var k in wsclients) {
          var cid = data.documentElement.getAttribute('ID');
          var dets = String(cid).split('.');
          var vls = wsclients[k][1].split('-');

          for (var j = 1; j < vls.length; j++) {
            if (vls[j] === dets[1])
              wsclients[k][0].send(data.concat('|NSE1'));
          }
        }
      }
      else if(startsWith(data, '{\"ID\":\"DPT.')){
        for(var k in wsclients){
          var atr = data.split('\"');
          var dt = atr[3];
          var ctn = dt.split('\.');
          var stid = ctn[1]; //Retrieve the stock id from the ID attribute value

          var vls = wsclients[k][1].split('-');
          for (var j = 1; j < vls.length; j++) {
            if (vls[j] === stid)
              wsclients[k][0].send(data.concat('|NSE1'));
          }
        }
      }
      else if(startsWith(data, 'sapr(') || startsWith(data, 'sdpr(')){
        for(var k in wsclients){
          var vls = wsclients[k][1].split('-');
          for (var j = 1; j < vls.length; j++) {
            var ctt = data.split('\'');
            var sid = ctt[1];
            if (vls[j] === sid)
              wsclients[k][0].send(data.concat('|NSE1'));
          }
        }
      }
      else if(startsWith(data, 'skup(') || startsWith(data, 'trup(') || startsWith(data, 'nwup(') || startsWith(data, '<msg id=\"MSG')){
        for(var k in wsclients){
          wsclients[k][0].send(data.concat('|NSE1'));
        }
      }
      else if(startsWith(data, 'orup(')){
        for(var k in wsclients){
          var vls = wsclients[k][1].split('-');
          var ids = vls[0].split('\_');
          var val = data.split('\'');

          if(ids[1] === val[1])
            wsclients[k][0].send(data.concat('|NSE1'));
        }
      }
    }
  }
};

addClient = function(socket, uid){
  var cnt = 0;
  for(var i = 0; i < wsclients.length; i++){
    if(wsclients[i][0] !== socket)
      cnt++;
  }

  if(cnt === wsclients.length){
    wsclients.push([socket, uid]);
    var vls = String(uid).split('_');
    console.log('%s [%s] - Connected!', crtm(), vls[1]);
  }
};

removeClient = function(socket){
  for(var i = 0; i < wsclients.length; i++){
    if(wsclients[i][0] === socket) {
      var vls = wsclients[i][1].split("_");
      wsclients.splice(i, 1);
    }
    console.log('%s [%s] - Disconnected!', crtm(), vls[1]);
  }
};

getUniqueId = function(url){
  var vls = String(url).split('/');
  var uid = vls[2];
  return uid;
};


//Set WebSocket Endpoint
var ws = new WebSocket({port: '3001'});

ws.on('connection', function connection(socket) {
  //console.log('%s [%s] - Connection Open', crtm(), getUniqueId(socket.upgradeReq.url));

  addClient(socket, getUniqueId(socket.upgradeReq.url)); //Add connected client

  socket.on('message', function (message) {
    //var vl = getUniqueId(socket.upgradeReq.url);
    //console.log('Received [%s]: %s', vl, message);
    var vl; //User Unique id
    var vals = message.split('-');
    var accid = String(vals[0]);
    var stkid = String(vals[1]);
    var actn = String(vals[2]);

    console.log('%s MSG RCVD FROM [%s]: %s', crtm(), accid, message);
    if(actn === 'ADD'){
      for(var i in wsclients){
        //Check if the User Session ID and Stock Id exist
        vl = wsclients[i][1];
        if(vl.match(accid) !== null && vl.match(stkid) === null)
          wsclients[i][1] = vl.concat('-'+stkid); //Append the stock id to the existing value and update the value in the collection
      }
    }
    else{
      for(var i in wsclients){
        //Check if the User Session ID and Stock Id exist
        vl = wsclients[i][1];
        if(vl.match(accid) !== null && vl.match(stkid) !== null)
          wsclients[i][1] = vl.replace('-'+stkid, ''); //Remove the stock id from the existing value and update the value in the collection
      }
    }
  });

  socket.on('close', function(){
    removeClient(socket);
  });
});


function startsWith(data, str){
  var status;
  str = String(str);

  if(String(data).match(str) !== null)
    status = true;
  else
    status = false;

  return status;
}

function processData(data){
  console.log('[%s] RCVD DATA: %s', crtm(), data);
  if(startsWith(data, 'skup')){
    var ptn = '\bskup\W\W[A-Z0-9]*\W\W;';
    var rs = data.match(ptn);
    if(rs === null){
      sendMsg(data, ''); //send socket message to WS Endpoint
    }
  }
  else if(startsWith(data, 'orup') || startsWith(data, 'trup') || startsWith(data, 'nwup') || startsWith(data, 'sapr') ||
      startsWith(data, '<msg id=\"MSG\" >') || startsWith(data, '<msg ID=\"DPT') || startsWith(data, '\"ID\":\"DPT.') ||
      startsWith(data, '<msg ID=\"SKPR.') || startsWith(data, '<msg ID=\"HSPR.')){
    sendMsg(data, ''); //send socket message
  }
  else if(startsWith(data, '<msg id=\"MSG\" cid')){
    var attr = data.documentElement.getAttribute('cid');
    sendMsg(data, attr); //send socket message to WS Endpoint
  }
  /**else{
    var atr = data.documentElement.getAttribute('cid');
    sendMsg(data, atr); //send socket message to WS Endpoint
  }**/
}

//REST WebService Endpoint Configuration
//app.post('/service/stocks', stocksUpdate);  //REST Routing for receiving real-time stock market data

/**app.all('*', function(req, res) {
  res.send(404);
});**/

//======================================================================================

//===============================================================================================

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    title: 'Error Page!',
    message: err.message,
    error: {}
  });
});


module.exports = app;
