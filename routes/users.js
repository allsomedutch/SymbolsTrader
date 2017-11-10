/**
 * MODULE:    Basic HTML Page Router
 *
 * DEVELOPER: Oladotun Sobande
 * DATE:      26th April 2016
 */

/* GET users listing. */
exports.home = function(req, res){
  console.log('Session ID: '+req.session.id);
  res.sendFile('index.html', {root: './public/'});
};

exports.notauth = function(req, res){
  res.sendFile('401.html', {root: './public/'});
};

exports.notfound = function(req, res){
  res.sendFile('404.html', {root: './public/'});
};

exports.login = function(req, res, next) {
  //res.render('login');
  res.sendFile('login.html', {root: './public/'});
};

exports.logout = function(req, res, next) {
  req.session.destroy();
  res.redirect('/');
};

exports.authenticate = function(req, res, next) {
  req.session.user = user;
  req.session.admin = user.admin;
  res.redirect('/admin');
};

//module.exports = router;
