var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var session = require('express-session');
//var jade = require('jade');
var ws = require('./modules/ws');

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
  ws.processData(data);
  //processData(data);
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
