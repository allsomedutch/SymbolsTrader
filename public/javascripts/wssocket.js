/**
 * Created by admin on 11/4/2015.
 */
//alert("WELCOME!");
var usrdet = '837004778320438_0032838943';
var wsocket = new WebSocket('ws://10.0.0.83:3001/stockupdate/'+usrdet);

wsocket.onopen = function(){
    console.log(">> CONNECTION ESTABLISHED!");
};

wsocket.onclose = function(){
    console.log('Connection Closed!');
};

wsocket.onmessage = function(evt){
    $('span#tgt').html(evt.data);
    console.log('Received Message: '+evt.data);
}
