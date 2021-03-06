/**
 * MODULE:    CWP Core Module
 *
 * DEVELOPER: Oladotun Sobande
 * DATE:      26th April 2016
 */

//NodeJS Core Modules in /node_modules
var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var redis = require('redis');
var session = require('express-session');
var crypto = require('crypto')
var RedisStore = require('connect-redis')(session);

var obj = JSON.parse(fs.readFileSync('defaults.json'));
console.log("Default: "+obj.redi);
//var jade = require('jade');

//User-Defined Modules in /modules
var ath = require('./modules/auth'); //Import Authentication Module
var rst = require('./modules/rws'); //Import REST Web Service Endpoint Module

//Basic Page Route
var routes = require('./routes/users');
var hashname = "tutpoint";

var app = express();

var usr = redis.createClient(); //Configure Redis client
usr.on('connect', function(){
  var dl = crypto.randomBytes(24).toString('hex');
  console.log('Connected to Redis Server - Gen. Val: '+dl);
});
usr.on('error', function(){
  console.log('Not Connected to Redis Server!');
});
/**usr.hset('tutpoint', 'lang', 'C#', function(err, rep){
  console.log('Hash:tutpoint - lang added | reply:'+rep);
});
usr.hkeys(hashname, function(err, rep){
  console.log("Keys: "+rep.length);
  var val = "lang";
  rep.forEach(function(dt, i){
    if(dt === val){
      usr.del(dt, function(err, rep){
        console.log('Hash:tutpoint | reply:'+rep);
      });
    }
  });
  //console.log('Redis: Hash tutpoint - '+JSON.stringify(rep));
});**/
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
  store: new RedisStore({ host: '10.0.0.83', port: 6379, client: usr }),  //Store session details in Redis
  resave: true,
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: null
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//=====================================================================================
//User Authentication and Authorization

//User Authentication
/**app.use(function(req, res, next) {
  if (req.session && req.session.admin)
    res.locals.admin = true;
    next();

  //return res.redirect('/login');
});**/

//User Authorization to REST API Routes
var authorize = function(req, res, next) {
  if (req.session && req.session.admin)
    return next();
  else
    return res.redirect('/NotAuthorized');
};

function crtm(){
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

// Pages & routes
app.get('/', routes.home);
app.get('/login', routes.login);
app.post('/login', routes.authenticate);
app.get('/logout', routes.logout);
app.get('/NotAuthorized', routes.notauth);
app.get('/NotFound', routes.notfound);
/**app.get('/', function(req, res){
  if(req.session.counter){
    req.session.counter += 1;
  }
  else{
    req.session.counter = 1;
  }
  console.log('Session ID: '+req.sessionID+' | User Counter: '+req.session.counter);
});**/

//REST API Routes
//app.all('/service', authorize);
app.get('/service/modules', rst.getModules);
//app.get('/service', routes.notauth);
//app.get('/service/stocks', routes.notauth);
app.post('/service/stocks', rst.isWSData);  //REST Routing for receiving real-time stock market data

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  logfile.write('['+crtm()+'] REST MSG: '+err.stack+'\r\n');
  //console.log('%s - %s', crtm(), err.stack);
  //res.sendFile('404.html', {root: './public/'});
  next(err);
});

//======================================================================================

//======================================================================================


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
  logfile.write('['+crtm()+'] ERR MSG: '+err.stack+'\r\n');
  console.log('%s - %s', crtm(), err.stack);
  /**res.render('error', {
    title: 'Error Page!',
    message: err.message,
    error: {}
  });**/
});


module.exports = app;
