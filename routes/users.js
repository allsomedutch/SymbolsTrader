//var express = require('express');
//var router = express.Router();

/**var crypto = require('crypto'),
    usr = 'portaluser',
    pwd = 'Progenics_123';

function getHash(password, salt) {
  var out = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return out;
}

function getSalt() {
  return crypto.randomBytes(64).toString('hex');
}
var salt = getSalt();
var hash = getHash(pwd, salt);
console.log('my pwd: ', password, ' salt: ', salt, ' hash: ', hash);
**/

/* GET users listing. */
exports.home = function(req, res){
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
