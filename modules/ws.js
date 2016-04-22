/**
 * Created by admin on 4/21/2016.
 */
var express = require('express');
var fs = require('fs');
var path = require('path');
var logger = require('morgan');
var WebSocket = require('ws').Server;

var app = express();
var ws = new WebSocket({port: '3001'}); //Set WebSocket Endpoint

var logfile = fs.createWriteStream(path.join('./logs/logger.log'), { flag : 'a' });
app.use(logger('common', {stream : logfile}));

var wsclients = []; //WebSocket Clients

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
            else if(startsWith(data, 'sapr') || startsWith(data, 'sdpr')){
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
            else if(startsWith(data, 'skup') || startsWith(data, 'trup') || startsWith(data, 'nwup') || startsWith(data, '<msg id=\"MSG')){
                for(var k in wsclients){
                    wsclients[k][0].send(data.concat('|NSE1'));
                }
            }
            else if(startsWith(data, 'orup')){
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

function addClient(socket, uid){
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
}

function removeClient(socket){
    for(var i = 0; i < wsclients.length; i++){
        if(wsclients[i][0] === socket) {
            var vls = wsclients[i][1].split("_");
            wsclients.splice(i, 1);
        }
        console.log('%s [%s] - Disconnected!', crtm(), vls[1]);
    }
}

function getUniqueId(url){
    var vls = String(url).split('/');
    var uid = vls[2];
    return uid;
}

function startsWith(data, str){
    var status;
    str = String(str);

    if(String(data).match(str) !== null)
        status = true;
    else
        status = false;

    return status;
}

exports.processData = function (req, res){
    var rd = req.body;
    var dt = String(rd.v); //Get JSON object and get the value to the key 'v' in {"v" : "<value>"}

    logfile.write('['+crtm()+'] REST MSG: '+dt+'\r\n');
    console.log('[%s] REST MSG RCVD: %s', crtm(), dt);

    //next(stocksUpdate(String(dt.v))); //Get JSON object and get the value to the key 'v'
    //console.log('[%s] RCVD DATA: %s', crtm(), data);
    if(startsWith(dt, 'skup')){
        var ptn = '\bskup\W\W[A-Z0-9]*\W\W;';
        var rs = dt.match(ptn);
        if(rs === null){
            sendMsg(dt, ''); //send socket message to WS Endpoint
        }
    }
    else if(startsWith(dt, 'orup') || startsWith(dt, 'trup') || startsWith(dt, 'nwup') || startsWith(dt, 'sapr') ||
        startsWith(dt, '<msg id=\"MSG\" >') || startsWith(dt, '<msg ID=\"DPT') || startsWith(dt, '\"ID\":\"DPT.') ||
        startsWith(dt, '<msg ID=\"SKPR.') || startsWith(dt, '<msg ID=\"HSPR.')){
        sendMsg(dt, ''); //send socket message
    }
    else if(startsWith(dt, '<msg id=\"MSG\" cid')){
        var attr = dt.documentElement.getAttribute('cid');
        sendMsg(dt, attr); //send socket message to WS Endpoint
    }
    /**else{
    var atr = data.documentElement.getAttribute('cid');
    sendMsg(data, atr); //send socket message to WS Endpoint
  }**/
};

//module.exports = ws;