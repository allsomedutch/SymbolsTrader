/**
 * MODULE:    Authentication Module
 *
 * DEVELOPER: Oladotun Sobande
 * DATE:      26th April 2016
 */

var crypto = require('crypto'),
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
 console.log('my pwd: ', pwd, ' salt: ', salt, ' hash: ', hash);

//Again to reiterate hashes aren't designed to be decrypted. However once you have a hash you can check any string is
//equal to that hash by putting it through the same encryption with the same secret.

 var crypto = require('crypto')

 var secret = 'alpha'
 var string = 'bacon'

 var hash = crypto.createHmac('SHA256', secret).update(string).digest('base64');
 // => 'IbNSH3Lc5ffMHo/wnQuiOD4C0mx5FqDmVMQaAMKFgaQ='

 if (hash === crypto.createHmac('SHA256', secret).update(string).digest('base64')) {
  //console.log('match') // logs => 'match'
} else {
  //console.log('no match')
}
