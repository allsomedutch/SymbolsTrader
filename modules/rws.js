/**
 * MODULE:    REST Web Service Endpoint Module
 *
 * DEVELOPER: Oladotun Sobande
 * DATE:      26th April 2016
 */

var express = require('express');
var fs = require('fs');
var path = require('path');
var logger = require('morgan');

var ws = require('./wbs'); //Import WebSocket Endpoint Module

var app = express();

var lf = fs.createWriteStream(path.join('logs/logger.log'), { flag : 'a' });
app.use(logger('common', {stream : lf}));

exports.isWSData = function(req, res){
    var dt = req.body;
    lf.write('['+crtm()+'] REST MSG: '+JSON.stringify(dt)+'\r\n');
    console.log('[%s] REST MSG RCVD: %s', crtm(), JSON.stringify(dt));
    ws.processData(dt);
};

exports.getModules = function(req, res){
    console.log('[%s] REQ.: Portal Modules', crtm());
    var mdl = [
        { name: 'Dashboard', id: 'dashboard' },
        { name: 'Cash Accounts', id: 'cashAccount' },
        { name: 'Equities', id: 'equities' },
        { name: 'Loans', id: 'loans' },
        { name: 'Deposits', id: 'deposits' },
        { name: 'Profile', id: 'profile' }
    ];
    res.set('Content-type','application/json');
    res.send(mdl);
    //res.sendFile(mdl);
    console.log('[%s] RES. DATA SENT: %s', crtm(), JSON.stringify(mdl));
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
