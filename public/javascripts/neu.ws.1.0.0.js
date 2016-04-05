/*
 * Main JS Script for Symbols Trader
 * SYMBOLS TRADER
 * 
 * Author:               Oladotun Sobande
 * Last Date Modified:   8th October 2015
 * Neulogic Solutions Limited
 * 
 */

    var wsocket;
    var sd = null;
    var count = 0;
    var cid;
    var acctbal; //Account balance
    var amtlien; //Amount in lien
    var stks; //All the stock list containing the index - stock_id|stock_name
    var sprc;
    var user = ""; //User Session ID
    var accusr; //Account ID of current user
    var accdt; //Customer account details i.e. account id : account name
    var dyprcs = []; //All DAY prices and the times for the day for all stocks whose pop-ups are open
    var updprc = []; //Updated ADD price and time for all stocks
    var updates = []; //All stock updates
    var cses; //User's customized session id
    var popups = 0; //Number of popup windows opened
    var byslcount = 0; //Number of Buy/Sell popup windows opened
    var intrady = 0; //Intra-Day stock data availibility for DAY prices: 1 - Data available, 0 - Data Not Available
    var intraad = 0; //Intra-Day stock data availibility for ADD prices: 1 - Data available, 0 - Data Not Available
    var conn = 0; //Connection count
    var wsconn = 0; //WebSocket Endpoint Connection status: 1 - Connected, 0 - Not Connected
    var mktstt = 0; //NSE Market Status: 0 - Closed, 1 - Open
    var mktopn = 0; //Market Open counter
    var mktct = 0; //Market Status counter
    var dblink = 0; //Database link data count
    var mktdtcnt = 0;
    var mkttrcnt = 0;
    var mktnwcnt = 0;
    var cusordcnt = 0;
    var cusdtlcnt = 0;
    var lnkstt = 1; //Portal Link: 1 - Connected, 0 - Not Connected
    var crdt = "031115"; //Current date as version number suffix - change everyday [ddmmyy]
    var wrkspcid; //Workspace ID
    var infoc = "200"; //Value of the z-index of the pop-up window currently in focus
    var outfoc = "100"; //Value of the z-index of the pop-up window(s) out of focus
    var wndopn = []; //Popup windows opened.
    var cprcs = []; //Current prices of popup stocks
    var odrf = 0; //Order refresh count
    var orrf = 0; //Order refresh req
    var ordcncl = []; //Orders cancelled
    var crtm; //Current time
    var sestmot = 1; //Session Timeout indicator: 1 - Session Valid, 0 - Session Timed Out
   
    //<img src=\"wwv_flow_file_mgr.get_file?p_security_group_id="+wrkspcid+"&amp;p_fname=\" alt=\"\">  
    
    //WebSocket client functions
    
    function connect(){
        conn++;
        
        user = $("#usrses").val();
        accusr = $("#P1_ACCT_ID").val();
        
        var usrdet = user+"_"+accusr;
        
        var prtcl = $("#P1_PRTCL").val(); //WebSocket protocol - ws / wss
        var host = $("#P1_HOST").val(); //Server host IP address/host name
        var port = $("#P1_PORT").val(); //Server Port
        var path = $("#P1_PATH").val(); //WebSocket URL path
        wrkspcid = $("#P1_WRKSPC_IDN").val(); //APEX Workspace ID
        var mkt_stt = $("#P1_MKT_STT").val(); //Market status data
        setMktStt(mkt_stt); //Set Market Status
        
        wsocket = new WebSocket(prtcl+"://"+host+":"+port+"/"+path+"/"+usrdet);
        
        wsocket.onopen = function(){
            wsconn = 1; //Connection available
            console.log(">> CONNECTION ESTABLISHED!");
        };
        wsocket.onerror = function(){    
            wsconn = 0; //No connection
        };
        wsocket.onmessage = function(evt){
            onSend(evt); //Send data
        };
        wsocket.onclose = function(){    
            wsconn = 0; //No connection
        };
    }
    
    function connStatus(){
        var rdst = wsocket.readyState;
        //console.log("Server ReadyState code: "+wsocket.readyState);
        //var dat = $('#P1_MKT_STT').val();
        //setMktStt(dat);
        
        if(rdst === 3){
            if((wsconn === 0 && mktstt === 0) || (wsconn === 0 && mktstt === 1) || (wsconn === 0 && lnkstt === 1)){
                $(".connstat").css('background', function(){
                    return '#ee3b3b';
                });
                $(".connstat").html("<span style=\"margin-left: 9px; color: #ffffff;\">SERVER: <b>DATA-LINK DOWN</b></span>");
                console.log("WS Server - Error in Connection!");
                if(sestmot === 1){
                    connect();
                }
            }
            else if(wsconn === 0 && lnkstt === 0){
                $(".connstat").css('background', function(){
                    return '#ee3b3b';
                });
                $(".connstat").html("<span style=\"margin-left: 10px; color: #ffffff;\">SERVER: <b>NOT CONNECTED</b></span>");
                console.log("PORTAL LINK - Error in Connection!");
            }
        }
        else if(rdst === 1){
            if(wsconn === 1 && mktstt === 0 && lnkstt === 1){
                $(".connstat").css('background', function(){
                    return 'Orange';
                });
                $(".connstat").html("<span style=\"margin-left: 38px; color: #333333;\">MARKET: <b>CLOSED</b></span>");
                //console.log("Connected to Server, Market CLOSED!");    
            }
            else if(wsconn === 1 && mktstt === 1 && lnkstt === 1){
                $(".connstat").css('background', function(){
                    return '#13c90d';
                });
                $(".connstat").html("<span style=\"margin-left: 40px; color: #ffffff;\">MARKET: <b>OPEN</b></span>");
                //console.log("Connected to Server, Market OPEN!");
            }
            else if(wsconn === 1 && mktstt === 0 && lnkstt === 0){
                $(".connstat").css('background', function(){
                    return '#ee3b3b';
                });
                $(".connstat").html("<span style=\"margin-left: 10px; color: #ffffff;\">SERVER: <b>NOT CONNECTED</b></span>");
                console.log("PORTAL LINK - Error in Connection!");
            }
            else if(wsconn === 1 && mktstt === 1 && lnkstt === 0){
                $(".connstat").css('background', function(){
                    return '#ee3b3b';
                });
                $(".connstat").html("<span style=\"margin-left: 10px; color: #ffffff;\">SERVER: <b>NOT CONNECTED</b></span>");
                console.log("PORTAL LINK - Error in Connection!");
            }
        }
    }
    
    function marketStatus(){
        if(sestmot === 1){
            mktct++;
            apex.server.process(
                "GET_MKT_STATUS",
                {},
                {
                    dataType: "text",
                    success: function(xml){
                        setMktStt(xml);
                        //console.log("Market Status: "+xml.substr(0,20));
                        setTimeout(function(){
                            //console.log("MKTCT: "+mktct+" | MKTOPN: "+mktopn);
                            if(mktct > 1 && mktopn === 1){
                                refreshGrid();
                                //mktopn = 0;
                            }
                        }, 5000);
                    }
                }
            );
        }
    }
    
    function refreshGrid(){
        var vl = document.getElementById("altovr");
        if(vl === null){
            var msg = '<div id="altovr"></div>\n\
                       <div id="pg-ref">\n\
                           <div id="cntnt">\n\
                               <div class="spnldr"><img src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=loading.GIF" alt="Loading..." style="float:left; width:30px; height:30px;"><h4 style="float:left;margin-left:10px; line-height:30px; font-family:\'Trebuchet MS\';">Please Wait...</h4></div>\n\
                           </div>\n\
                       </div>';
            
            $('body').append(msg);
            clearAll();
            popups = 0;
            $("#gbox_stocktable").remove();
            $("#sdets").empty();
            var nk = '<table id="stocktable"></table>';
            $("#allstocks").append(nk);
            //setTimeout(function(){
                getMarketData(); //Refresh NSE view
            //}, 3000);
            setTimeout(function(){
                $("#altovr, #pg-ref").remove();
            }, 3000);
        }
    }
    
    function setMktStt(data){
        var patt = new RegExp("MSGOPN"); //Check if xml contains stock list
        var res = patt.test(data);
        
        if(res === true){
            var de = $(data).find("bdy");
            var cntt = $(de).text();
            if(cntt !== ""){
                var rw = $(data).find("row");
                $(rw).find("fld").each(function(){
                    var id = $(this).attr("id");
                    if(id === "990"){
                        var vl = $(this).text();
                        switch(vl){
                            case "1":
                                mktstt = 1;
                                mktopn++;
                                console.log("Market Status: OPEN");
                                break;
                            case "2":
                                mktstt = 0;
                                console.log("Market Status: CLOSED");
                                break;
                            case "9":
                                lnkstt = 0;
                                break;
                        }
                    }
                });
            }
            else{
               console.log("Market Status data EMPTY!");
            }
        }
    }
    
    function versionNum(){
        var crTime = new Date();

        //var cday = crTime.getDate();
        //var month = crTime.getMonth();
        //var year = crTime.getFullYear();
        //var ny = String(year).substr(2);
        
        var version = "1.0.";
        //var dt = String(cday)+String(month+1)+ny;
        
        var currvsn = version+crdt;
        
        console.log("Version No.: "+currvsn);
        $("#vrsn").append("v. <b>"+currvsn+"</b>");
        $("h5.symcvr").append("Version: <b>"+currvsn+"</b>");
    }
    
    function displayMsg(msty, msg){
        $("#msgalert .icn, #msgalert p").empty();
        
        if(msty === "E"){
            $("#msgalert .icn").html('<img src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=error.png" alt="Error Icon">');
        }
        else if(msty === "W"){
            $("#msgalert .icn").html('<img src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=Warning.png" alt="Warning Icon">');
        }
        else if(msty === "I"){
            $("#msgalert .icn").html('<img src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=info.png" alt="Info Icon">');
        }
        else{
            $("#msgalert .icn").html('<img src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=Accept.png" alt="Success Icon">');
        }
        
        $("#msgalert p").html(msg);
        $("#msgalert").css("display", function(){
            return "block";
        });
    }
    
    function displayTimeoutMsg(){
        var vl = document.getElementById("tmoutmsg");
        if(vl === null){
            wsocket.close();
            sestmot = 0;
            var msg = '<div id="tmoutmsg"></div>\n\
                       <div id="msgoverlay">\n\
                           <div id="msgcontent">\n\
                               <p><h1 style="color: #ff9922; font-family: \'Trebuchet MS\';">INACTIVITY DETECTED</h1><br><h3 style="color: #444444; font-family: Verdana;">Your session has timed-out!</h3></p>\n\
                               <div onclick="redirectUrl();" title="GO BACK" class="btn"><img src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=back-icon.png" class="small" alt="Locked Screen"><span>&nbsp;&nbsp;GO BACK</span></div>\n\
                           </div>\n\
                       </div>';
            $('body').append(msg);
        }
        /**apex.server.process(
            "REM_SESSION"    
        );**/
    }
    
    function redirectUrl(){
        //var lnk = $("#P1_RTN_PG").val();
        var app = $("#P1_APID").val();
        
        var prt = location.protocol;
        var hst = location.hostname;
        var pt = location.port;
        var pth = location.pathname;
        var lnk;
        
        if(pt === ""){
            lnk = prt+"//"+hst+pth+"?p="+app+":99909000:&SESSION.::NO:::";
        }
        else{
            lnk = prt+"//"+hst+":"+pt+pth+"?p="+app+":99909000:&SESSION.::NO:::";
        }
        
        window.location.assign(lnk);
    }
    
    function onSend(evt){
        count++;
        var dat = evt.data;
        
        /**if(count === 1){
            var vl = dat.split("|");
            cses = vl[1]; //Set custom session id
            //alert("Custom Session ID: "+cses);
            dataDesc1(vl[0], vl[1]); //Determine the kind of XML data that is received
        }
        else{**/
            var vl = dat.split("|");
            dataDesc2(vl[0], vl[1]);
        //}
    }
    
    function arrEmpty(){
        console.log("DYPRCS Data: "+dyprcs+" | UPDPRC Data: "+updprc);
    }
    
    function dataDesc1(xml, sesid){
        var res2, res3;
        
        //var patt1 = new RegExp("MKAC."); //Check if xml contains customer account details
        //var patt2 = new RegExp("ORD."); //Check if xml contains customer orders
        var patt3 = new RegExp("SKLS"); //Check if xml contains stock list
        
        //res1 = patt1.test(xml);
        //res2 = patt2.test(xml);
        res3 = patt3.test(xml);
        
        /**if(res1 === true){
            var data = showCustomerDetails(xml);
            if(data[0][0] === "error"){
                displayMsg(data[0][0], data[0][1]); //Display error message
            }
            else{
                custDashBoard(data); //Show customer account details
            }
        }
        else if(res2 === true){
            var dte = $(xml).find("bdy");
            var cont = $(dte).text();
            
            if(cont === ""){
                $("#tgtt").html("<h3>NO ORDERS AVAILABLE!</h3>");
            }
            else{
                var dat = showOrders(xml);
                loadOrders(dat);
            }
        }
        else**/ if(res3 === true){
            updateGrid(xml);
        }
    }
    
    function dataDesc2(xml, sesid){
        var res1, res2, res3, res4, res5, res6, res7, res8, res9, res10, res11, res12;
        
        //var patt1 = new RegExp("SKUP:[A-Z]*\w"); //Check if xml contains updated stock price
        var patt1 = new RegExp("skup"); //Check if xml contains updated stock price
        var patt2 = new RegExp("MKAC."); //Check if xml contains customer account details
        var patt3 = new RegExp("ORD."); //Check if xml contains customer orders
        var patt4 = new RegExp("SKPR"); //Check if xml contains ADD stock prices
        var patt5 = new RegExp("ID=\"DPT."); //Check if xml contains stock market depth
        var patt6 = new RegExp("trup"); //Check if xml contains stock market trades updates
        var patt7 = new RegExp("HSPR"); //Check if xml contains historical
        var patt8 = new RegExp("DTRD"); //Check if xml contains stock market trade
        var patt9 = new RegExp("nwup"); //Check if xml contains stock market news update
        var patt10 = new RegExp("orup"); //Check if xml contains order update
        var patt11 = new RegExp("MSG"); //Check if xml contains MSG data
        var patt12 = new RegExp("\"ID\":\"DPT."); //Check if json contains market depth data
        
        //res1 = xml.match(/SKUP:[A-Z]*\w/);
        res1 = patt1.test(xml);
        res2 = patt2.test(xml);
        res3 = patt3.test(xml);
        res4 = patt4.test(xml);
        res5 = patt5.test(xml);
        res6 = patt6.test(xml);
        res7 = patt7.test(xml);
        res8 = patt8.test(xml);
        res9 = patt9.test(xml);
        res10 = patt10.test(xml);
        res11 = patt11.test(xml);
        res12 = patt12.test(xml);
        
        if(res1 === true){
            //$("#tgt").append(xml);
            eval(xml);
        }
        else if(res2 === true){
            var de = $(xml).find("bdy");
            var cntt = $(de).text();
            if(cntt !== ""){
                var dt = showCustomerDetails(xml);
                if(dt[0][0] === "E"){
                    displayMsg(dt[0][0], dt[0][1]); //Display error message
                }
                else{
                    updateAcct(dt); //Update customer account details
                }
            }
            else{
                console.log("User Acct. Details is EMPTY!");
            }
        }
        else if(res3 === true){
            var de = $(xml).find("bdy");
            var cntt = $(de).text();
            if(cntt !== ""){
                var dat = showOrders(xml);
                updateOrders(dat); //Update customer orders
            }
            else{
                console.log("User Order details is EMPTY!");
            }
        }
        else if(res4 === true){
            var id = $(xml).filter(":first").attr("ID");
            var ty = id.split("."); //Get the value of the ID attribute in the root tag in xml and split
            
            var de = $(xml).find("bdy");
            var cntt = $(de).text(); //Get the contents of <bdy> tag in xml
            //console.log("Content of "+ty[1]+"'s "+ty[2]+" <bdy> tag: "+cntt);
            
            if(ty[2] === "DAY"){
                intrady = (cntt !== "") ? 1 : 0 ; //Check if Intra-day DAY data is available
                if(intrady === 1){
                    console.log("Intra-Day DAY Update received: Available("+intrady+")");
                    stockActivity(xml);
                }
                else{
                    console.log("Intra-Day DAY Update received: Unavailable("+intrady+")");
                }
            }
            else if(ty[2] === "ADD"){
                intraad = (cntt !== "") ? 1 : 0 ; //Check if Intra-day ADD data is available
                if(intraad === 1){
                    console.log("Intra-Day ADD Update received: Available("+intraad+")");
                    updatedStockPrice(xml);
                }
                else{
                    console.log("Intra-Day ADD Update received: Unavailable("+intraad+")");
                }
            }
        }
        else if(res5 === true){
            var id = $(xml).filter(":first").attr("ID");
            var ty = id.split(".");
            
            var de = $(xml).find("bdy");
            var cntt = $(de).text();
            if(cntt !== ""){
                if(ty[2] === "P"){
                    formatResp(ty[1], xml); //Display stock market depth update
                }
            }
            else{
                console.log("Market Depth data for "+ty[1]+" is EMPTY!");
            }
        }
        else if(res6 === true){
            eval(xml); //Update trade log
        }
        else if(res7 === true){
            var id = $(xml).filter(":first").attr("ID");
            var ty = id.split(".");
            
            var de = $(xml).find("bdy");
            var cntt = $(de).text();
            if(cntt !== ""){
                //$("#"+id+"2tab").prepend('<script src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=highstock.js></script>');
                var data = $.merge([], stockHistorical(xml));
                showHChart(ty[1], data);
            }
            else{
                console.log("Hist. data for "+ty[1]+" is EMPTY!");
            }
        }
        else if(res8 === true){
            $(xml).find("bdy").each(function(){
                var cont = $(this).text();
                if(cont !== ""){
                    displayTrades(ty[1], xml);
                }
                else{
                    $("#tradlg"+ty[1]).html("<h1>NO TRADES ON <b>"+ty[1]+"</b></h1>");
                }
            });
        }
        else if(res9 === true){
            eval(xml); //Update trade log
        }
        else if(res10 === true){
            eval(xml); //Update trade log
        }
        else if(res11 === true){
            var vls = [];
            $(xml).find("row").each(function(){
                $(this).find("fld").each(function(){
                    vls.push($(this).text());
                });
            });
            displayMsg(vls[2], vls[1]);
        }
        else if(res12 === true){
            console.log("MKT DTH UPD: "+xml.substr(0, 40));
            
            var dt = xml.split("\"");
            var vls = dt[3];
            //console.log("3rd Value in mkt dth: "+vls);
            
            var ty = vls.split(".");
            formatResp(ty[1], $.parseJSON(xml)); //Display stock market depth update
        }
    }
    
    function getCustAcctDetails(){
        if(sestmot === 1 || mktstt === 0){
            //console.log("RQ Time: "+crtm);
            cusdtlcnt++;
            apex.server.process(
                "CUSTOMER_ACCT_DET",
                { 
                    x01: accusr,
                    x02: user
                },
                {
                    dataType: "text",
                    success: function(pData){
                        var prfx = pData.substr(0,3);
                        if(prfx === "ORA"){
                            //console.log("RS Time: "+crtm);
                            displayMsg("E", pData); //Show notification message
                        }
                        else{
                            if(pData !== ""){
                                var de = $(pData).find("bdy");
                                var cntt = $(de).text();
                                if(cntt !== ""){
                                    var data = showCustomerDetails(pData);
                                    if(data[0][0] === "E"){
                                        //console.log("RS Time: "+crtm);
                                        displayMsg(data[0][0], data[0][1]); //Display error message
                                    }
                                    else{
                                        //console.log("RS Time: "+crtm);
                                        console.log("Getting Acct. details for Acct.ID: "+accusr);
                                        custDashBoard(data); //Show customer account details
                                    }
                                }
                                else{
                                    //console.log("RS Time: "+crtm);
                                    console.log("Acct. details for "+accusr+" is EMPTY!");
                                }
                            }
                            else{
                                if(cusdtlcnt === 1)
                                    dblink++;
                            }
                        }
                    }
                }
            );
        }
    }
    
    function showCustomerDetails(xml){
        var data = [];
        var msg = "";
        $(xml).find("row").each(function(){
            $(this).find("fld").each(function(){
                var id = $(this).attr("id");
                if(id === "991"){
                    var cd = $(this).text();
                    if(cd !== ""){
                        msg = $(this).text();
                    }
                }
            });
        });
        //console.log("Customer msg: "+msg);
        if(msg !== ""){
            data.push(["E", msg]);
        }
        else{
            $(xml).find("row").each(function(){
                var tem = "";
                $(this).find("fld").each(function(){
                    var vl = $(this).text();
                    tem += vl+"|";
                });
                var ndt = tem.split("|");
                data.push([ndt[0], ndt[1], ndt[2], ndt[3], ndt[4], ndt[5], ndt[6], ndt[7], ndt[8]]);
            });
        }
        return data;
    }
    
    function custDashBoard(data){
        var stt;
        accdt = data[0][2]+':'+data[0][3];
        acctbal = data[0][5];
        if(mktstt === 1){
            stt = "OPEN";
        }
        else{
            stt = "CLOSED";
        }
        //var stt = data[0][7].toUpperCase();
        
        var htdt = '<table>\n\
                        <tbody>\n\
                            <tr><td><b>Market:</b></td><td>'+data[0][0]+' : '+data[0][1]+'</td><td><b>Cash Account ID:</b></td><td>'+data[0][4]+'</td></tr>\n\
                            <tr><td><b>Account:</b></td><td><b>'+data[0][2]+' : '+data[0][3]+'</b></td><td><b>Available Balance (=N=):</b></td><td><b id="cash1">'+data[0][5]+'</b></td></tr>\n\
                            <tr><td><b>Market Status:</b></td><td><b id="status">'+stt+'</b>&nbsp;&nbsp;'+data[0][8]+'</td><td><b>Amount in Lien (=N=):</b></td><td><b id="cash2">'+data[0][6]+'</b></td></tr>\n\
                        </tbody>\n\
                    </table>';
        $("#custmr table").remove();
        $("#custmr").append(htdt);
        
        if(stt === "OPEN"){
            $("#status").css('color',function(){
                return 'Green';
            });
        }
        else{
            $("#status").css('color',function(){
                return 'Red';
            });
        }
    }
    
    function updateAcct(dt){
        var acbl = dt[0][5]; //Account balance
        var amln = dt[0][6]; //Amount in lien
        var mkst; //Market status OPEN / CLOSE
        if(mktstt === 1){
            mkst = "OPEN";
        }
        else{
            mkst = "CLOSED";
        }
        
        if(mkst === "OPEN"){
            $("#status").css('color',function(){
                return 'Green';
            });
        }
        else{
            $("#status").css('color',function(){
                return 'Red';
            });
        }
        
        //Replace the existing values of Market Status, Account Balance and Amount in Lien with updated data
        //Update Account Balance
        $("#cash1").empty();
        $("#cash1").html(acbl);
        
        //Update Amount in lien
        $("#cash2").empty();
        $("#cash2").html(amln);
        
        //Update Market Status
        $("#status").empty();
        $("#status").html(mkst);
    }
    
    
    function getCustomerOrders(){
        if(sestmot === 1 || mktstt === 0){
            cusordcnt++;
            var cscs = $('#P1_ACCT_ID').val();
            accusr = cscs;
            apex.server.process(
                "CUSTOMER_ORDERS",
                {
                    x01: cscs
                },
                {
                    dataType: "text",
                    success: function(xml){
                        var prfx = xml.substr(0,3);
                        if(prfx === "ORA"){
                            displayMsg("E", xml); //Show notification message
                        }
                        else{
                            if(xml !== ""){
                                //console.log("ORDERS CANCELLED: "+JSON.stringify(ordcncl));
                                var de = $(xml).find("bdy");
                                var cntt = $(de).text();
                                if(cntt !== ""){
                                    if(odrf === 1){
                                        console.log("RQ: Order refresh for "+accusr+": "+xml.substr(0, 20));
                                    }
                                    else{
                                        console.log("Getting Orders of Acct.ID: "+accusr+" - "+xml.substr(0, 20));
                                    }
                                    var dat = showOrders(xml);
                                    loadOrders(dat);
                                }
                                else{
                                    $("#tgtt h3, .refbut, #mktordrs").remove();
                                    $("#tgtt").append("<h3>NO ORDERS AVAILABLE!</h3>");
                                    console.log("Order details for "+accusr+" is EMPTY!");
                                }
                            }
                            else{
                                if(cusordcnt === 1)
                                    dblink++;
                            }
                        }
                    },
                    error: function(msg){
                        console.log("ERROR - CUSTM ORD RQ: "+msg);
                    }
                }
            );
        }
    }
    
    function showOrders(xml){
        var data = [];
        
        $(xml).find("row").each(function(){
            var tem = "";
            $(this).find("fld").each(function(){
                var fid = $(this).attr("id");
                var val;
                if(fid === "02" || fid === "04" || fid === "07" || fid === "08" || fid === "09" || fid === "10" || fid === "11" ||fid === "97" || fid === "98" || fid === "99"){
                    val = $(this).text();
                    if(val === ""){
                        val = "-";
                        tem += val+"|";
                    }
                    else{
                        tem += val+"|";
                    }
                }
            });
            
            var stdt = tem.split("|");
            data.push([stdt[0], stdt[1], stdt[2], stdt[3], stdt[4], stdt[5], stdt[6], stdt[7], stdt[8], stdt[9]]);
        });
        //alert("Orders: "+data);
        return data;
    }
    
    function loadOrders(data){
        //var acc = accdt.split(" : ");
        //console.log("Order refresh starts - "+orrf);
        var tbdt = "";
        
        tbdt += '<div class="refbut"><a id="ordref" title="REFRESH ORDERS" onclick="refreshOrders()">Refresh Orders</a>&nbsp;&nbsp;<img src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=loading.GIF" class="ordld" alt="Loading..." style="float:left; display:none; width:20px; height:20px;"></div>';
        tbdt += '<div id="mktordrs"><table>\n\
                    <thead>\n\
                        <tr><th>ORDER NO.</th><th>STOCK ID</th><th>BUY/SELL</th><th>TYPE</th><th>QTY.</th><th>LMT.PRC.</th><th>FIL.QTY.</th><th>STATUS</th><th>FILL STATUS</th><th>MESSAGE</th><th></th></tr>\n\
                    </thead>\n\
                    <tbody>';
                        for(var i = 0; i < data.length; i++){
                            /*var tst = 0;
                            if(ordcncl.length > 0){
                                var ordid = data[i][0];
                                for(var j = 0; j < ordcncl.length; i++){
                                    if(ordcncl[j] === ordid){
                                        tst = 1;
                                    }
                                }
                            }*/
        
                            if(data[i][2] === "Buy"){
                                tbdt += '<tr id="'+data[i][0]+'" style="background: #f5fafb;">';
                            }
                            else{
                                tbdt += '<tr id="'+data[i][0]+'" style="background: #f9f4f1;">';
                            }
                            
                            for(var k = 0; k <= 9; k++){
                                tbdt += '<td>'+data[i][k]+'</td>';
                            } 
                            
                            if((data[i][8].toLowerCase() !== "rejected") && (data[i][8].toLowerCase() !== "filled") && (data[i][8].toLowerCase() !== "cancelled") && (data[i][8].toLowerCase() !== "expired")){
                                var actn = user+","+accusr+","+data[i][0];
                                tbdt += '<td><a id="ordcan" title="CANCEL ORDER" onclick="execAction(\'canord\',\''+actn+'\')">CANCEL</a></td>';
                            }
                            else{
                                tbdt += '<td></td>';
                            }
                            tbdt += '</tr>';          
                        }
        tbdt += '</tbody></table></div>'; 
            
        $("#tgtt h3, .refbut, #mktordrs").remove();
        $("#tgtt").append(tbdt);
        //console.log("Order Refresh ends - "+orrf);
        odrf = 0;
    }
    
    function refreshOrders(){
        //console.log("ORDERS CANCELLED: "+JSON.stringify(ordcncl));
        //orrf = 1;
        $(".ordld").css("display", "block");
        $("#mktordrs").remove();
        odrf = 1;
        setTimeout(function(){
            $(".ordld").css("display", "none");
            getCustomerOrders();
        }, 1000);
        //orrf = 0;
    }
    
    function orup(accid, ordno, sid, fil, ordstt, flstt, msg){
        var dat = [];
        dat.push([fil, ordstt, flstt, msg]);
        for(var j = 0; j < dat.length; j++){
            for(var i = 7; i <= 10; i++){
                $("#mktordrs table tbody tr#"+ordno+" td:nth-child("+i+")").html(dat[0][j]);
            }
        }
    }
    
    function cancelOrder(ses, accid, ordNum){
        exitDialog();
        ordcncl.push(ordNum);
        apex.server.process(
            "CANCEL_ORDER",
            {
                x01: ses,
                x02: accid,
                x03: ordNum
            },
            {
                dataType: "text",
                success: function(resp){
                    var prfx = resp.substr(0,3);
                    if(prfx === "ORA"){
                        displayMsg("E", resp); //Show notification message
                    }
                    else{
                        //displayMsg("success", resp); //Show notification message
                        //alert(resp);
                        var msg = "Order cancellation request has been sent!";
                        displayMsg("S", msg);
                        refreshOrders();
                    }
                }
            }       
        );
    }
    
    
    function updateOrders(data){
        //var acc = accdt.split(" : ");
        var tbdt = "";
        
        //tbdt += '<tbody>';
        for(var i = 0; i < data.length; i++){
            if(data[i][2] === "Buy"){
                tbdt += '<tr id="'+data[i][0]+'" style="background: #f5fafb;">';
            }
            else{
                tbdt += '<tr id="'+data[i][0]+'" style="background: #f9f4f1;">';
            }
            
            for(var j = 0; j <= 9; j++){
                tbdt += '<td>'+data[i][j]+'</td>';
            }
            if(data[i][8] !== "Cancelled"){
                var actn = user+","+accusr+","+data[i][0];
                tbdt += '<td><a id="ordcan" title="CANCEL ORDER" onclick="execAction(\'canord\',\''+actn+'\')">CANCEL</a></td>';
            }
            else{
                tbdt += '<td></td>';
            }
            tbdt += '</tr>';          
        }
        //tbdt += '</tbody>';
        $("div#tgtt table tbody").empty();
        $("div#tgtt table tbody").fadeIn(1000, function(){
            $(this).html(tbdt);
        });
    }
    
    function getNumPopUps(){
        apex.server.process(
            "POPUP_COUNT"
        );
    }
    
    //APEX process function for getting stock list
    function getMarketData(){
        mktdtcnt++;
        apex.server.process(
            "MARKET_DATA",
            {},
            {
                dataType: "text",
                success: function(pData){
                    var prfx = pData.substr(0,3);
                    if(prfx === "ORA"){
                        displayMsg("E", pData); //Show notification message
                    }
                    else{
                        //console.log("SKLS JSON: "+pData);
                        if(pData !== ""){
                            console.log("SKLS JSON: "+pData.substr(0, 10));
                            updateGrid($.parseJSON(pData));
                        }
                        else{
                            if(mktdtcnt === 1)
                                dblink++;
                        }
                        /**var de = $(pData).find("bdy");
                        var cntt = $(de).text();
                        if(cntt !== ""){
                            console.log("SKLS JSON: "+pData);
                            updateGrid(pData);
                        }
                        else{
                            console.log("Market data is EMPTY!");
                        }**/
                    }
                }/**,
                error: function(pData){
                    displayMsg("error", pData); //Show notification message
                }**/
            }
        );
    }
    function gridData(data){
        $("#stocktable").jqGrid({
              //datatype: 'xmlstring',
              datatype: 'jsonstring',
              datastr: data,
              ignoreCase: true,
              colNames:['Mkt.ID.','Sect.ID','Stock ID.','Name','Buy/Sell','Ref.','Open','High','Low','Last','+/-','% Diff.','Time','Best Bid','Bid Qty.','Best Ask','Ask Qty.','Min.','Max.'],
              colModel:[
		{name:'mkt_name', index:'mkt_name', width:50, sortable: false},
		{name:'sect_id', index:'sect_id', width:70, align:'center', sortable: false }, 
                {name:'stock_id', index:'stock_id', width:80, sortable: false, formatter:addLink, search:true, searchoptions:{sopt:['cn']}}, 
                {name:'stock_name', index:'stock_name', width:100, sortable: false}, 
                {name:'buttons', index:'buttons', width: 65, align:'center', formatter:addButtons, sortable: false},
                {name:'ref_price', index:'ref_price', width:45, align:'right', formatter:'number', formatoptions:{thousandsSeparator:',', decimalPlaces:2, defaultValue:'-'}, sortable: false }, 
                {name:'open_price', index:'open_price', width:45, align:'right', formatter:'number', formatoptions:{thousandsSeparator:',', decimalPlaces:2, defaultValue:'-'}, sortable: false }, 
                {name:'high_price', index:'high_price', width:45, align:'right', formatter:'number', formatoptions:{thousandsSeparator:',', decimalPlaces:2, defaultValue:'-'}, sortable: false },
                {name:'low_price', index:'low_price', width:45, align:'right', formatter:'number', formatoptions:{thousandsSeparator:',', decimalPlaces:2, defaultValue:'-'}, sortable: false },
                {name:'last_price', index:'last_price', width:45, align:'right', formatter:'number', formatoptions:{thousandsSeparator:',', decimalPlaces:2, defaultValue:'-'}, sortable: false },
		{name:'dif_price', index:'dif_price', width:45, align:'right', formatter:'number', formatoptions:{thousandsSeparator:',', decimalPlaces:2, defaultValue:'-'}, sortable: false },
                {name:'dif_prc', index:'dif_prc', width:45, align:'right', formatter:'number', formatoptions:{thousandsSeparator:',', decimalPlaces:2, defaultValue:'-'}, sortable: false },
                {name:'last_time', index:'last_time', width:35, align:'center', sortable: false}, 
                {name:'bid_price', index:'bid_price', width:45, align:'right', formatter:'number', formatoptions:{thousandsSeparator:',', decimalPlaces:2, defaultValue:'-'}, sortable: false },
                {name:'bid_quantity', index:'bid_quantity', width:70, align:'right', sortable: false }, 
                {name:'ask_price', index:'ask_price', width:45, align:'right', formatter:'number', formatoptions:{thousandsSeparator:',', decimalPlaces:2, defaultValue:'-'}, sortable: false },         
                {name:'ask_quantity', index:'ask_quantity', width:70, align:'right', sortable: false},  
                {name:'min', index:'min', width:45, align:'right', formatter:'number', formatoptions:{thousandsSeparator:',', decimalPlaces:2, defaultValue:'-'}, sortable: false }, 
                {name:'max', index:'max', width:45, align:'right', formatter:'number', formatoptions:{thousandsSeparator:',', decimalPlaces:2, defaultValue:'-'}, sortable: false }
              ],
              /**xmlReader:{
                  root: "bdy",
                  row: "row",
                  repeatitems: true,
                  cell:"fld",
                  id: "stock_id"
              },**/
              jsonReader:{
                  root:"bdy",
                  repeatitems: true,
                  cell: "row"
                  //id: "ID" 
              },
              rowNum: 250,
              scroll: false,
              //sortname: 'stock_id',
              id: 'stock_id',
              //sortorder: 'asc',
              caption: 'NSE View',
              altRows: false,
              height: '460',
              toolbar: [true, "top"]
            }); 
            //$("#stocktable").jqGrid('navGrid','#pager', {edit:false, add:false, del:false}, {}, {}, {}, {multipleSearch:true, ignoreCase:true, sopt:['cn']});
            setPrcDifColor(); //Set the text color for Diff. Price and % Diff columns
            $("#t_stocktable").append("&nbsp;&nbsp;<div title='SEARCH STOCKS' id='search'><img src='wwv_flow_file_mgr.get_file?p_security_group_id="+wrkspcid+"&amp;p_fname=search50.svg' alt='Search Stocks'></div>&nbsp;&nbsp;&nbsp;<div title='REFRESH' id='refresh'><img src='wwv_flow_file_mgr.get_file?p_security_group_id="+wrkspcid+"&amp;p_fname=refresh51.svg' alt='Refresh Stocklist'></div>"); //Toolbar at the top of the grid
            
            //Function for search records
            $("#search").click(function(){
                $("#stocktable").jqGrid('searchGrid',
                    {multipleSearch:true, ignoreCase:true, sopt:['cn']}
                );
            });
            
            //Function for refreshing the grid
            $("#refresh").click(function(){
                $("#stocktable").jqGrid('setGridParam',{datastr: data, datatype:'jsonstring'}).trigger('reloadGrid');
                setPrcDifColor(); //Set the text color for Diff. Price and % Diff columns
                $("#sdets").empty();
                stockWindow(data); //Populate the pop-up windows of each stock
            });
            
            //Get all the stock ids from the grid
            var mydata = $("#stocktable").jqGrid("getGridParam", "data");
            stks = $.map(mydata, function (item) { return  item.stock_id+"|"+item.stock_name;  });
            sprc = $.map(mydata, function (item) { return  item.stock_id+"|"+item.last_price;  });
            //updates = $.map(mydata, function (item) { return  [item.stock_id, item.high_price+"|"+item.low_price+"|"+item.last_price+
                            //"|"+item.dif_price+"|"+item.dif_prc+"|"+item.last_time+"|"+item.bid_price+"|"+item.bid_quantity+"|"+item.ask_price+"|"+item.ask_quantity];  });
            //alert("Stock count: "+stks.length);
            hideColumns(); //Hide the unused columns in the grid
            stockWindow(data); //Populate the pop-up windows of each stock
    }
    
    function updateGrid(data){
        $("#load").show();
        //Show grid after 1 second
        setTimeout(function(){
            $("#load").hide(); //Hide the loading cue button
        }, 2000);
        gridData(data); //Show the grid of data
    }
    
    function hideColumns(){
        $("#stocktable").hideCol(["mkt_name", "sect_id", "stock_name"]);
    }
    
    //Grid custom functions
    function fmtPrc(colval){
        var col;
        
        var sg = colval.substr(0, 1); //Get the first character in the string which is either + or -
        if(sg === "+"){
            col = "Green";
        }
        else if(sg === "-"){
            col = "Red";
        }
        else if(sg !== "+" && sg !== "-"){
            col = "Green";
        }
        return col;
    }
    
    function setPrcDifColor(){
        var ids = $("#stocktable").jqGrid('getDataIDs');
        for(var i = 0; i < ids.length; i++){
            var rowid = ids[i];
            var rowdt = $("#stocktable").jqGrid('getRowData', rowid);
            var val1 = rowdt.dif_price;
            var val2 = rowdt.dif_prc;
            
            $("#stocktable").setCell(rowid, 'dif_price', '', { color: fmtPrc(val1) });
            $("#stocktable").setCell(rowid, 'dif_prc', '', { color: fmtPrc(val2) });
        } 
    }
    
    function addLink(cellvalue, options, rowObject){
        stckid = cellvalue;
        var data = '<a onclick="getDetails(this.id)" id="'+cellvalue+'" title="View '+cellvalue+' stock details" style="cursor: pointer; text-decoration: none; color: #0099ff;">'+cellvalue+'</a>';       
        return data;
    }
    
    function setColor(id){
        document.getElementById(id).style.color = "#00ccff";
    }
    
    function addButtons(cellvalue, options, rowObject){
        var rwid = stckid;
        return '<a onclick="doTransaction(\''+rwid+'\', \'sell\', \'BUY\')" title="BUY" class="buy'+rwid+'" style="color: #ffffff;">BUY</a> <a onclick="doTransaction(\''+rwid+'\', \'buy\', \'SELL\')" title="SELL" class="sell'+rwid+'" style="color: #ffffff;">SELL</a>';
    }
   
   //===========================================================================================================
    
    //Functions for APEX processes for Market Depth, Historical chart and Stock list
   
    //Get market depth and historical for a specific stock
    function getDetails(id){
        var cnt = $("#P1_POP_CNT").val();
        if(popups < cnt){
            var st = isPopup(id);
            if(st === 1){
                unfocusPopups();
                $("#stkdet"+id).css('z-index', infoc);
                wndopn.push([id, "stkdet"]);   
                //cprcs.push([id, 0]); //Update array for intra day chart prices
                $("#stkdet"+id).show();
                popups++;

                getMarketDepth(id); //Get market depth for stock
                getCharts(id); //Get intra-day and historical charts
            }
        }
        else{
            var msty = "E";
            var msg = "Only "+cnt+" stock windows allowed!";
            displayMsg(msty, msg); //Show notification message
        }
    }
    
    function isPopup(id){
        var i, ct = 0, st;
        
        for(i = 0; i < wndopn.length; i++){
            if(wndopn[i][0] !== id)
                ct++;
        }
        if(ct === wndopn.length){
            st = 1;
        }
        else{
            st = 0;
        }
        return st;
    }
    
    function getCharts(id){
        wsocket.send(accusr+"-"+id+"-ADD"); //Send websocket request for Market update for stock
        
        getHistoricalData(id); //Get historical data for stock
        getStockPrices(id, 'DAY');
        getStockPrices(id, 'ADD');
        
        var val = $(".crprc"+id).text();
        $(".crprc"+id).css('color', fmtPrcChg(val));

        var val2 = $(".prcdif"+id).text();
        $(".prcdif"+id).css('color', fmtPrcChg(val2));

        var val3 = $(".prcdif2"+id).text();
        $(".prcdif2"+id).css('color', fmtPrcChg(val3));

        var val4 = $("#dp"+id).text();
        $("#dp"+id).css('color', fmtPrcChg(val4));

        var val5 = $("#dpc"+id).text();
        $("#dpc"+id).css('color', fmtPrcChg(val5));
        
        //setTimeout(function(){
        setTimeout(function(){
            //For JSON data, comment out all lines except 'showChart(id)'
            //console.log("Intra-day DAY: "+intrady+" | ADD: "+intraad);
            if(intrady === 1 && intraad === 1){
                //$("#"+id+"1tab").prepend('<script src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=highcharts.js></script>');
                showChart(id);
            }
            else{
                $("#stcht"+id).html('<img src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=chartnt.png" alt="No Intra-Day Chart">');
            }
        }, 30000);
    }
    
    //APEX process function for market depth for a stock
    function getMarketDepth(stockId){
        apex.server.process(
            "MARKET_DEPTH",
            { x01: stockId },
            {
                dataType: "text",
                success: function(pData){
                    var prfx = pData.substr(0,3);
                    if(prfx === "ORA"){
                        displayMsg("E", pData); //Show notification message
                    }
                    else{
                        console.log(stockId+" MKT DTH: "+pData.substr(0,20));
                        formatResp(stockId, $.parseJSON(pData));
                        /**var de = $(pData).find("bdy");
                        var cntt = $(de).text();
                        if(cntt !== ""){
                            console.log(stockId+" Market depth: "+pData.substr(0,13));
                            formatResp(stockId, pData);
                        }
                        else{
                            console.log("Market depth for "+stockId+" is EMPTY!");
                        }**/
                    }
                }
            }
        );
    }
    
    //DOM for market depth data for the pop-up
    function formatResp(sid, pData){
        var bdata = "";
        var sdata = "";
       
        $.each(pData, function(key, value){       
            if(key === "bdy"){
                var vl = value;
                $.each(vl, function(k, v){
                    var ty = v.ID;
                    var ov = v.row;
                    var ctns = [];
                    for(var i = 0; i < ov.length; i++){
                        ctns.push(ov[i]);
                    }
                    
                    if(ty === "B"){
                        bdata += '<tr><td>'+ctns[2]+'</td><td>'+ctns[3]+'</td><td class="bl">'+ctns[4]+'</td></tr>';
                    }
                    else if(ty === "S"){
                        sdata += '<tr><td class="rd">'+ctns[4]+'</td><td>'+ctns[3]+'</td><td>'+ctns[2]+'</td></tr>';
                    }   
                });
            }
        });
        
        setTimeout(function(){
            if(sdata !== "" && bdata !== ""){
                $("#tab1"+sid+" tbody").empty();
                $("#tab1"+sid+" tbody").html(bdata);

                $("#tab2"+sid+" tbody").empty();
                $("#tab2"+sid+" tbody").html(sdata);
                
                $("div.ldng"+sid).css("display", "none");
                $("table#tab1"+sid+", table#tab2"+sid).show();
            }
        }, 1500);
        console.log(sid+" MKT DTH UPD!");
        /**
        $(pData).find("row").each(function(){
            var vs = "";
            
            $(this).find("fld").each(function(){
                vs += $(this).text()+"|";
            });
            var tgs = vs.split("|");
            if(tgs[0] === "B"){
                bdata += '<tr><td>'+tgs[3]+'</td><td>'+tgs[4]+'</td><td class="bl">'+tgs[5]+'</td></tr>';
            }
            else if(tgs[0] === "S"){
                sdata += '<tr><td class="rd">'+tgs[5]+'</td><td>'+tgs[4]+'</td><td>'+tgs[3]+'</td></tr>';
            }
        });**/
        //alert("Stock ID: "+sid+" | Buy Data: "+bdata+" | Sell Data: "+sdata);
        
    }
 
    //APEX process function for getting historical data and displaying historical chart
    function getHistoricalData(stockId){
        apex.server.process(
            "STOCK_HPRICES",
            { x02: stockId },
            {
                dataType: "text",
                success: function(pData){
                    var prfx = pData.substr(0,3);
                    if(prfx === "ORA"){
                        displayMsg("E", pData); //Show notification message
                    }
                    else{
                        console.log(stockId+"'s Hist. Data (JSON): "+pData.substr(0,10));
                        if(pData !== ""){
                            showHChart(stockId, $.parseJSON(pData));
                        }
                        else{
                            $('#sthist'+stockId).html("<h2>HISTORICAL DATA FOR <b>"+stockId+"</b> IS NOT AVAILABLE!</h2>");
                        }
                        /**setTimeout(function(){
                            $('div[id^="sthist"] div.highcharts-container').removeAttr("style");
                            var atr = "position: relative; overflow: hidden; width: 650px; height: 260px; text-align: left; line-height: normal; z-index: 600; -webkit-tap-highlight-color: rgba(0, 0, 0, 0);";
                            $('div[id^="sthist"] div.highcharts-container').attr('style', atr);
                        }, 2000);**/
                        /**var de = $(pData).find("bdy");
                        var cntt = $(de).text();
                        if(cntt !== ""){
                            //console.log("Hist. Data Sections for "+stockId+": "+pData);
                            var data = $.merge([], stockHistorical(pData));
                            showHChart(stockId, data);
                        }
                        else{
                            console.log("Hist. data for "+stockId+" is EMPTY!");
                        }**/
                    }
                }
            }
        );
    }
    //Getting historical data for chart
    function stockHistorical(xml){
        var data = [];
        $(xml).find("row").each(function(){
            var tm, time;
            var rw = "";
            $(this).find("fld").each(function(){
                var id = $(this).attr("id");
                if(id === "01"){
                    tm  = $(this).text();
                    time = Date.parse(formatDate(tm)); // Convert the date and time to millisecond equivalent
                    rw += time+"|";
                }
                else{
                    rw += $(this).text()+"|";
                }
            });
            var vals = rw.split("|");
            
            data.push([Number(vals[1]), Number(vals[2]), Number(vals[3]), Number(vals[4]), Number(vals[5]), toNum(vals[6])]); //Pass the row values into the JSON array
        });
        return data;
    }
    
    function formatDate(date){
        var ndt;
        var dtcnt = date.split("-");
        
        var day = dtcnt[0];
        var month = dtcnt[1];
        var year = dtcnt[2];
        
        var mth;
        switch (month) {
            case 'JAN':
                mth = "Jan";
                //mth = "01";
                break;
            case 'FEB':
                mth = "Feb";
                //mth = "02";
                break;
            case 'MAR':
                mth = "Mar";
                //mth = "03";
                break;
            case 'APR':
                mth = "Apr";
                //mth = "04";
                break;
            case 'MAY':
                mth = "May";
                //mth = "05";
                break;
            case 'JUN':
                mth = "Jun";
                //mth = "06";
                break;
            case 'JUL':
                mth = "Jul";
                //mth = "07";
                break;
            case 'AUG':
                mth = "Aug";
                //mth = "08";
                break;
            case 'SEP':
                mth = "Sep";
                //mth = "09";
                break;
            case 'OCT':
                mth = "Oct";
                //mth = "10";
                break;
            case 'NOV':
                mth = "Nov";
                //mth = "11";
                break;
            case 'DEC':
                mth = "Dec";
                //mth = "12";
                break;
        }
        ndt = mth+" "+day+", "+year;
        return ndt;
    }
    
    function toNum(val){
        var vls = val.split(",");
        var fnm = "";
        for(var i = 0; i < vls.length; i++){
            fnm += vls[i];
        }
        return Number(fnm);
    }
    
    function stockUpdate(){
        apex.server.process(
            "STOCK_UPDATE"
        );
    }
    
    function updateScreen(){
        var siz = updates.length;
        var i;
        if(siz > 0){
            for(i = 0; i < updates.length; i++){
                flashUpdate(updates[i][1]);
                //updates.splice(i,1);
            } 
        }
    }
    
    //Stock realtime updates
    
    function getRowId(sid){
        var rid;
        for(var i = 0; i < stks.length; i++){
            var sk = stks[i].split("|");
            if(sk[0] === sid){
                rid = i + 1;  
            }
        }
        return rid;
    }
    
    function getValues(hi, lo, la, dpr, dpc, tm, bp, bq, ap, aq){
        var vals = [];
        vals.push(hi);
        vals.push(lo);
        vals.push(la);
        vals.push(dpr);
        vals.push(dpc);
        vals.push(tm);
        vals.push(bp);
        vals.push(bq);
        vals.push(ap);
        vals.push(aq);
        //alert("Data count: "+vals.length);
        return vals;
    }
    
    //skup('7UP','157.00','150.70','162.00','+1.00','+.66','12:25','151.71','1,000','154.99','1,230');
    
    function skup(sid, hi, lo, la, dpr, dpc, tm, bp, bq, ap, aq){
        var col;
        var upd = $.merge([], getValues(hi, lo, la, dpr, dpc, tm, bp, bq, ap, aq));
        var len = upd.length;
        var rwid = getRowId(sid);
        
        $("#stocktable").jqGrid(
            'setRowData',
            rwid,
            {'high_price':hi, 'low_price':lo, 'last_price': la, 'dif_price': dpr, 'dif_prc':dpc,
             'last_time':tm, 'bid_price':bp, 'bid_quantity':bq, 'ask_price':ap, 'ask_quantity':aq}
        );

        var sg = dpr.substr(0, 1); //Get the first character in the string which is either + or -
        if(sg === "+"){
            col = "#c5f4ba";
        }
        else if(sg === "-"){
            col = "#f6bfad";
        }
        
        $("#stocktable").setCell(rwid, 'high_price', '', { background: col});
        $("#stocktable").setCell(rwid, 'low_price', '', { background: col});
        $("#stocktable").setCell(rwid, 'last_price', '', { background: col});
        $("#stocktable").setCell(rwid, 'bid_price', '', { background: col});
        $("#stocktable").setCell(rwid, 'bid_quantity', '', { background: col});
        $("#stocktable").setCell(rwid, 'ask_price', '', { background: col});
        $("#stocktable").setCell(rwid, 'ask_quantity', '', { background: col});
        
    
        setTimeout(function(){
            $("#stocktable").setCell(rwid, 'high_price', '', { background: 'transparent'});
            $("#stocktable").setCell(rwid, 'low_price', '', { background: 'transparent'});
            $("#stocktable").setCell(rwid, 'last_price', '', { background: 'transparent'});
            $("#stocktable").setCell(rwid, 'bid_price', '', { background: 'transparent'});
            $("#stocktable").setCell(rwid, 'bid_quantity', '', { background: 'transparent'});
            $("#stocktable").setCell(rwid, 'ask_price', '', { background: 'transparent'});
            $("#stocktable").setCell(rwid, 'ask_quantity', '', { background: 'transparent'});
        }, 1000);
         
        for(var j = 0; j < upd.length; j++){
            changeSmtb(sid, j + 3, upd[j], dpr); //Update the small table in the pop-up window
            if(j === 2){
                $(".crprc"+sid).html(upd[j]); //Update the last price at the top of the pop-up
            }
            else if(j === 3){
                $(".prcdif"+sid).css('color', function(){
                    return fmtPrcChg(upd[j]);
                });
                $(".prcdif"+sid).html(upd[j]); //Update the price difference at the top of the pop-up
            }
            else if(j === 4){
                $(".prcdif2"+sid).css('color', function(){
                    return fmtPrcChg(upd[j]);
                });
                $(".prcdif2"+sid).html(upd[j]+"%"); //Update the % price difference at the top of the pop-up
            } 
        }
        
        for(var i = 0; i < sprc.length; i++){
            var sk = sprc[i].split("|");
            if(sk[0] === sid){
                sprc[i] = sid+"|"+la;
            }
        }
    }
    
    function changeSmtb(stk, cn, val, dpr){
        if(cn === 6 || cn === 7 || cn === 8){
            $("table#stktb"+stk+" tbody tr td:nth-child("+cn+")").css('color', function(){
                return fmtPrcChg(val);
            });
            $("table#stktb"+stk+" tbody tr td:nth-child("+cn+")").html(val); //Update the value of the cell in the mini table in the popup
            /**$("table#stktb"+stk+" tbody tr td:nth-child("+cn+")").css('background',function(){
                return 'transparent';
            });**/
        }
        else{
            $("table#stktb"+stk+" tbody tr td:nth-child("+cn+")").css('background',function(){
                return fmtBkg(dpr);
            });
            $("table#stktb"+stk+" tbody tr td:nth-child("+cn+")").html(val); //Update the value of the cell in the mini table in the popup
            //Set the background color to transparent after a second
            setTimeout(function(){
                $("table#stktb"+stk+" tbody tr td:nth-child("+cn+")").css('background',function(){
                    return 'transparent';
                });
            }, 1000); 
        }
    }
    
    function fmtPrcChg(val){
        var color;
        var sg = val.substr(0, 1); //Get the first character in the string which is either + or -
        if(sg === "+"){
            color = "Green";
        }
        else if(sg === "-"){
            color = "Red";
        }
        
        return color;
    }
    
    function fmtBkg(val){
        var color;
        var sg = val.substr(0, 1); //Get the first character in the string which is either + or -
        if(sg === "+"){
            color = "#c5f4ba";
        }
        else if(sg === "-"){
            color = "#f6bfad";
        }
        
        return color;
    }
    
    function closeMsg(){
        $("#msgalert").slideUp();
        setTimeout(function(){
            $("#msgalert .icn, #msgalert p").empty();
        }, 2000);
    }
    
    function milliDate(time){
        var crTime = new Date();
        var mth;

        var cday = crTime.getDate();
        var month = crTime.getMonth();
        var year = crTime.getFullYear();
        

        switch (month) {
            case 0:
                mth = "January";
                break;
            case 1:
                mth = "February";
                break;
            case 2:
                mth = "March";
                break;
            case 3:
                mth = "April";
                break;
            case 4:
                mth = "May";
                break;
            case 5:
                mth = "June";
                break;
            case 6:
                mth = "July";
                break;
            case 7:
                mth = "August";
                break;
            case 8:
                mth = "September";
                break;
            case 9:
                mth = "October";
                break;
            case 10:
                mth = "November";
                break;
            case 11:
                mth = "December";
                break;
        }

        var dt = new Date(mth+" "+cday.toString()+", "+year.toString()+" "+time);
        var fmtdt = Date.parse(dt);
        return fmtdt;
    }
    
    //APEX process function for getting stock prices for a stock
    function getStockPrices(stockId, fty){
        apex.server.process(
            "STOCK_PRICES",
            { 
                x03: fty,
                x04: stockId
            },
            {
                dataType: 'text',
                success: function(pData){
                    var prfx = pData.substr(0,3);
                    if(prfx === "ORA"){
                        displayMsg("E", pData); //Show notification message
                    }
                    else{
                        /**console.log(stockId+"'s IntraDay "+fty+" prices(JSON): "+pData.substr(0,30));
                        if(fty === "DAY"){
                            stockActivity(stockId, $.parseJSON(pData));
                        }
                        else if(fty === "ADD"){
                            updatedStockPrice(stockId, $.parseJSON(pData));
                        }**/
                        var id = $(pData).filter(":first").attr("ID");
                        var ty = id.split("."); //Get the value of the ID attribute in the root tag in xml and split

                        var de = $(pData).find("bdy");
                        var cntt = $(de).text(); //Get the contents of <bdy> tag in xml
                        //console.log("Content of "+ty[1]+"'s "+ty[2]+" <bdy> tag: "+cntt);

                        if(ty[2] === "DAY"){
                            intrady = (cntt !== "") ? 1 : 0 ; //Check if Intra-day DAY data is available
                            if(intrady === 1){
                                console.log("Intra-Day DAY - Status: Available("+intrady+")");
                                stockActivity(stockId, pData);
                            }
                            else{
                                console.log("Intra-Day DAY - Status: Unavailable("+intrady+")");
                            }
                        }
                        else if(ty[2] === "ADD"){
                            intraad = (cntt !== "") ? 1 : 0 ; //Check if Intra-day ADD data is available
                            if(intraad === 1){
                                console.log("Intra-Day ADD Status: Available("+intraad+")");
                                updatedStockPrice(stockId, pData);
                            }
                            else{
                                console.log("Intra-Day ADD Status: Unavailable("+intraad+")");
                            }
                        }
                    }
                }/**,
                error: function(msg){
                    displayMsg("error", msg); //Show notification message
                }**/
            }
        );
    }
        
    //On pop-up window load
    function addStock(sid){
        getStockPrices(sid, 'DAY');
        //setTimeout(function(){
        getStockPrices(sid, 'ADD');
        //},1000);
        
    }
    
    //Functions for getting stock updates for chart on window pop-up
    //Stock's DAY prices
    
    function getDayPrices(){  
    }
    
    function getDyPrices(sd){
        var i;
        var dat = [];
        for(i = 0; i < dyprcs.length; i++){
            if(dyprcs[i][0] === sd && dyprcs[i][1] !== 0){
                var fprcs = dyprcs[i][1].split("|");
                for(var i = 0; i < fprcs.length; i++){
                    if(fprcs[i] !== ""){
                        var itm = fprcs[i].split("/");
                        var tim = itm[0]; 
                        var prc = itm[1]; 

                        dat.push({ x:Number(tim), y:Number(prc)});
                    }
                }
            }
        }
        //console.log("Chart DAY prices for "+sd+": "+dat.substr(0,30));
        return dat;
        /**var i;
        var dat = [];
        for(var i = 0; i < dyprcs.length; i++){
            if(dyprcs[i][0] === sd){
                var fprcs = dyprcs[i][1].split("/");
                console.log("Added Values for "+sd+": "+fprcs);
                for(var j = 0; j < fprcs.length; j++){
                    var itm = fprcs[j].split("|");
                    var tim = itm[0]; 
                    var prc = itm[1];
                    
                    dat.push({ x:Number(tim), y:Number(prc)});
                }
            }
        }
        return dat;**/
    }
    //Stock's ADD price
    function getAddPrice(sid){
        var i;
        var dta;
        var ct = 0;
        for(i = 0; i < cprcs.length; i++){
            if(cprcs[i][0] === sid){
                dta = cprcs[i][1];
            }
            else{
                ct++;
            }
        } 
        if(ct === cprcs.length){
            dta = "Non";
        }
        //console.log("Chart ADD prices: "+dta);
        return dta;
    }
    
    function getAddPrice2(sid){
        var k;
        var dt;
        for(k = 0; k < updprc.length; k++){
            if(updprc[k][0] === sid){
                dt = updprc[k][1];
            }
        } 
        //console.log("Chart ADD prices: "+dta);
        return dt;
    }
    
    
    //On pop-up window close, remove stock instance from arrays
    function removeStock(sid){
        if(updprc.length > 1 && dyprcs.length > 1){
            var i, j;
            for(i = 0; i < updprc.length; i++){
                if(updprc[i][0] === sid){
                    console.log("ADD Stock to be removed: "+updprc[i][0]);
                    updprc.splice(i, 1); //Remove the stock from the stock updates array
                }
            }
            for(j = 0; j < dyprcs.length; j++){
                if(dyprcs[j][0] === sid){
                    console.log("DAY Stock to be removed: "+dyprcs[j][0]);
                    dyprcs.splice(j, 1); //Remove the stock from the stock DAY array
                }
            }
        }
        else{
            if(updprc[0][0] === sid && dyprcs[0][0] === sid){
                dyprcs.splice(0, 1); //Remove the stock from the stock DAY array
                updprc.splice(0, 1); //Remove the stock from the stock updates array
            }
        }
        
        //arrEmpty();
    }
    
    
    //setInterval( function(){ checkArrays(); }, 2000);
    function checkArrays(){
        //var dylen = dyprcs.length;
        var adlen = updprc.length;
        if(adlen > 0){
            var i;
            var act = "ADD";
            for(i = 0; i < updprc.length; i++){
                var sid = updprc[i][0];
                getStockPrices(sid, act);
            }
        }
    }
    
    //Update for DAY Intra-Day prices
    function stockActivity(sid, xml){
        /**var data = "";
        //console.log(sid+"'s DY price count: "+xml.length);
        for(var i = 0; i < xml.length; i++){
            if(i === xml.length - 1){
                data += xml[i][0]+"|"+xml[i][1];
            }
            else{
                data += xml[i][0]+"|"+xml[i][1]+"/";
            }
        }
        //console.log("DY prcs: "+data);
        dyprcs.push([sid, data]);**/
        var data = "";
        var id = $(xml).filter(":first").attr("ID");
        var ty = id.split("."); //Get the value of the ID attribute in the root tag in xml and split
        
        $(xml).find("row").each(function(){
            var time, price;
            var str;
            $(this).find("fld").each(function(){
                var id = $(this).attr("id"); //Get the value of the ID attribute for the TIME which must be '01' and PRICE which is '02'
                var tm;
                if(id === "01"){
                    tm  = $(this).text();
                    time = milliDate(tm); // Convert the date and time to millisecond equivalent
                }
                else if(id === "02"){
                    price = $(this).text();
                }
                str = time+"/"+price;
            });
            data += str+"|";
        });
        //alert("DYPRCS - Stock ID: "+sid+" | Data: "+data);
        dyprcs.push([ty[1], data]);
            
        console.log("DYPRCS contents: "+dyprcs.length);
    }
    
    function sdpr(sid, tim, prc, qty){
        if(tim !== "" || prc !== "" || qty !== ""){
            var cnt = 0;
            for(var i = 0; i < dyprcs.length; i += 1){
                if(dyprcs[i][0] === sid){
                    var tm = milliDate(tim);
                    var str = tm+"/"+prc;
                    dyprcs[i][1] += str+"|";
                }
                else{
                    cnt++;
                }
            }
            if(cnt === dyprcs.length){
                var tm = milliDate(tim);
                var str = tm+"/"+prc;

                dyprcs.push([sid, str]);
            }
        }
        /**
        else{
            dtstt.push([sid, 0]); //Intra-Day data is not available
        }**/
        arrEmpty();
    }
    
    function sapr(sid, tim, prc, qty){
        var tm = milliDate(tim);
        var str = tm+"/"+prc;

        var count = 0;
        var ind;
        for(var i = 0; i < updprc.length; i++){
            if(updprc[i][0] === sid){
                ind = i;
                count++;
            }
        }
        if(count === 1){
            updprc[ind][1] = str;
        }
        else{
            updprc.push([sid, str]);
        }
        alert("UPDPRC Content: "+updprc);
    }
    
    //Update for ADD Intra-Day prices
    function updatedStockPrice(sid, xml){
        /**var dt = xml[0][0]+"|"+xml[0][1];
        console.log("Stringified: "+dt);
        updprc.push([sid, dt]);**/
        var data = "";
        var id = $(xml).filter(":first").attr("ID");
        var ty = id.split("."); //Get the value of the ID attribute in the root tag in xml and split
        
        $(xml).find("row").each(function(){
            var time, price;
            $(this).find("fld").each(function(){
                var id = $(this).attr("id"); //Get the value of the ID attribute for the TIME which must be '01' and PRICE which is '02'
                var tm;
                if(id === "01"){
                    tm = $(this).text();
                    time = milliDate(tm); // Convert the date and time to millisecond equivalent
                }
                else if(id === "02"){
                    price = $(this).text();
                }
            });
            data = time+"|"+price;
        });
        //alert("UPDPRC - Stock ID: "+sid+" | Data: "+data);

        var count = 0;
        var ind;
        for(var i = 0; i < updprc.length; i++){
            if(updprc[i][0] === ty[1]){
                ind = i;
                count++;
            }
        }
        if(count === 1){
            updprc[ind][1] = data;
        }
        else{
            updprc.push([ty[1], data]);
        }
        console.log("UPDPRC contents: "+updprc);
    }
    
    //All functions for the pop-ups
    
    //Show pop-up for each stock
    function stockWindow(dta){
            var data = "";
            //var cnt = 0;
            /**$(dta).find("row").each(function(){
                var vals = [];
                //cnt++;
                var id = $(this).attr("id"); //Get Row ID
                //var id = cnt;
                //Get all the fld data into an array
                $(this).find("fld").each(function(){
                   var fdt = $(this).text();
                   vals.push(fdt);
                });
                //alert("ID: "+id+" | Values: "+ vals);
                //Loop through array and create all the popup windows for each stock
                var count = 2;
                    data += '<div id="stkdet'+id+'" class="drgg" onclick="setWindowFocus(\''+id+'\', \'stkdet\')">\n\
                                <div id="cover">\n\
                                    <div id="tophd'+id+'">\n\
                                        <table>\n\
                                            <tr>\n\
                                                <td><p class="stnm'+id+'">'+id+'</p></td>\n\
                                                <td><p>CURR.PRICE: <span class="crprc'+id+'">'+vals[count+7]+'</span>&nbsp;&nbsp;&nbsp;&nbsp;PRICE CHANGE: <span class="prcdif'+id+'">'+vals[count+8]+'</span> / <span class="prcdif2'+id+'">'+vals[count+9]+'%</span></p></td>\n\
                                                <td><div class="bysl'+id+'"><a onclick="doTransaction(\''+id+'\', \'ssell\', \'BUY\')" title="BUY" class="bbuy'+id+'" style="color: #ffffff;">BUY</a>   <a onclick="doTransaction(\''+id+'\', \'bbuy\', \'SELL\')" title="SELL" class="ssell'+id+'" style="color: #ffffff;">SELL</a></div></td>\n\
                                                <td><div class="clwn"><a onclick="closeDisplay(\'stkdet'+id+'\', \''+id+'\', \'stkdet\')" title="CLOSE" class="clbut">X</a></div></td>\n\
                                            </tr>\n\
                                        </table>\n\
                                    </div>\n\
                                    <table id="stktb'+id+'">\n\
                                        <thead>\n\
                                            <tr>\n\
                                                <th>Ref.</th>\n\
                                                <th>Open</th>\n\
                                                <th>High</th>\n\
                                                <th>Low</th>\n\
                                                <th>Last</th>\n\
                                                <th>+/-</th>\n\
                                                <th>% Diff.</th>\n\
                                                <th>Time</th>\n\
                                                <th>Best Bid</th>\n\
                                                <th>Bid Qty.</th>\n\
                                                <th>Best Ask</th>\n\
                                                <th>Ask Qty.</th>\n\
                                                <th>Min.</th>\n\
                                                <th>Max.</th>\n\
                                            </tr>\n\
                                        </thead>\n\
                                        <tbody>\n\
                                            <tr>\n\
                                                <td id="rf'+id+'">'+vals[count+3]+'</td>\n\
                                                <td id="op'+id+'">'+vals[count+4]+'</td>\n\
                                                <td id="hp'+id+'">'+vals[count+5]+'</td>\n\
                                                <td id="lp'+id+'">'+vals[count+6]+'</td>\n\
                                                <td id="lap'+id+'">'+vals[count+7]+'</td>\n\
                                                <td id="dp'+id+'">'+vals[count+8]+'</td>\n\
                                                <td id="dpc'+id+'">'+vals[count+9]+'</td>\n\
                                                <td id="lt'+id+'">'+vals[count+10]+'</td>\n\
                                                <td id="bp'+id+'">'+vals[count+11]+'</td>\n\
                                                <td id="bq'+id+'">'+vals[count+12]+'</td>\n\
                                                <td id="ap'+id+'">'+vals[count+13]+'</td>\n\
                                                <td id="aq'+id+'">'+vals[count+14]+'</td>\n\
                                                <td id="mip'+id+'">'+vals[count+15]+'</td>\n\
                                                <td id="map'+id+'">'+vals[count+16]+'</td>\n\
                                            </tr>\n\
                                        </tbody>\n\
                                    </table>\n\
                                    <div id="stkcht'+id+'">\n\
                                        <ul>\n\
                                            <li class="active"><a onclick="changeTab(this.id)" id="'+id+'1" title="VIEW '+id+'\'S INTRA-DAY CHART & MARKET DEPTH">Intra-Day Chart & Market Depth</a></li>\n\
                                            <li><a onclick="changeTab(this.id)" id="'+id+'2" title="VIEW '+id+'\'S HISTORICAL DATA">Historical Data</a></li>\n\
                                        </ul>\n\
                                        <div id="tabs">\n\
                                            <div id="'+id+'1tab" class="tab active">\n\
                                                <div id="mktdth'+id+'" class="scrllbl">\n\
                                                    <table id="tab1'+id+'">\n\
                                                        <thead>\n\
                                                            <tr colspan="3"><th class="trty">BUY</th></tr>\n\
                                                            <tr class="subtr"><th>Count</th><th>Volume</th><th>Price</th></tr>\n\
                                                        </thead>\n\
                                                        <tbody>\n\
                                                        </tbody>\n\
                                                    </table>\n\
                                                    <table id="tab2'+id+'">\n\
                                                        <thead>\n\
                                                            <tr colspan="3"><th class="trty">SELL</th></tr>\n\
                                                            <tr class="subtr"><th>Price</th><th>Volume</th><th>Count</th></tr>\n\
                                                        </thead>\n\
                                                        <tbody>\n\
                                                        </tbody>\n\
                                                    </table>\n\
                                                </div>\n\
                                                <!--<script src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=highcharts.js"></script>-->\n\
                                                <div id="stcht'+id+'"></div>\n\
                                            </div>\n\
                                            <div id="'+id+'2tab" class="tab">\n\
                                                <!--<script src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=highstock.js"></script>-->\n\
                                                <div id="sthist'+id+'"></div>\n\
                                            </div>\n\
                                        </div>\n\
                                    </div>\n\
                                </div>\n\
                             </div>';
            });**/
        /**
         * {"ID":"SKLS",
            "cid":"1093446856203",
            "bdy" : [
               {"ID" :"7UP", "row" :["XNSA-EQTY", "00", "7UP", "7-UP BOTTLING PLC"]},
               {"ID" :"ABBEYBDS", "row" :["XNSA-EQTY", "00", "ABBEYBDS", "ABBEY BUILDING SOCIETY PLC"]},
                 ...
             ]
           }	
         */
        $.each(dta, function(ky, val){
            if(ky === "bdy"){
                var cnt = val;
                $.each(cnt, function(k, v){
                    var vals = [];
                    var id = v.ID;
                    var cntt = v.row;
                    
                    for(var i = 0; i < cntt.length; i++){
                        vals.push(cntt[i]);
                    }
                    
                    //Loop through array and create all the popup windows for each stock
                    var count = 2;
                    data += '<div id="stkdet'+id+'" class="drgg" onclick="setWindowFocus(\''+id+'\', \'stkdet\')">\n\
                                <div id="hndlr" draggable="true" style="height: 20px;"></div>\n\
                                <div id="cover">\n\
                                    <div id="tophd'+id+'">\n\
                                        <table>\n\
                                            <tr>\n\
                                                <td><p class="stnm'+id+'">'+id+'</p></td>\n\
                                                <td><p>CURR.PRICE: <span class="crprc'+id+'">'+vals[count+7]+'</span>&nbsp;&nbsp;&nbsp;&nbsp;PRICE CHANGE: <span class="prcdif'+id+'">'+vals[count+8]+'</span> / <span class="prcdif2'+id+'">'+vals[count+9]+'%</span></p></td>\n\
                                                <td><div class="bysl'+id+'"><a onclick="doTransaction(\''+id+'\', \'ssell\', \'BUY\')" title="BUY" class="bbuy'+id+'" style="color: #ffffff;">BUY</a>   <a onclick="doTransaction(\''+id+'\', \'bbuy\', \'SELL\')" title="SELL" class="ssell'+id+'" style="color: #ffffff;">SELL</a></div></td>\n\
                                                <td><div class="clwn"><a onclick="closeDisplay(\'stkdet'+id+'\', \''+id+'\', \'stkdet\')" title="CLOSE" class="clbut">X</a></div></td>\n\
                                            </tr>\n\
                                        </table>\n\
                                    </div>\n\
                                    <table id="stktb'+id+'">\n\
                                        <thead>\n\
                                            <tr>\n\
                                                <th>Ref.</th>\n\
                                                <th>Open</th>\n\
                                                <th>High</th>\n\
                                                <th>Low</th>\n\
                                                <th>Last</th>\n\
                                                <th>+/-</th>\n\
                                                <th>% Diff.</th>\n\
                                                <th>Time</th>\n\
                                                <th>Best Bid</th>\n\
                                                <th>Bid Qty.</th>\n\
                                                <th>Best Ask</th>\n\
                                                <th>Ask Qty.</th>\n\
                                                <th>Min.</th>\n\
                                                <th>Max.</th>\n\
                                            </tr>\n\
                                        </thead>\n\
                                        <tbody>\n\
                                            <tr>\n\
                                                <td id="rf'+id+'">'+vals[count+3]+'</td>\n\
                                                <td id="op'+id+'">'+vals[count+4]+'</td>\n\
                                                <td id="hp'+id+'">'+vals[count+5]+'</td>\n\
                                                <td id="lp'+id+'">'+vals[count+6]+'</td>\n\
                                                <td id="lap'+id+'">'+vals[count+7]+'</td>\n\
                                                <td id="dp'+id+'">'+vals[count+8]+'</td>\n\
                                                <td id="dpc'+id+'">'+vals[count+9]+'</td>\n\
                                                <td id="lt'+id+'">'+vals[count+10]+'</td>\n\
                                                <td id="bp'+id+'">'+vals[count+11]+'</td>\n\
                                                <td id="bq'+id+'">'+vals[count+12]+'</td>\n\
                                                <td id="ap'+id+'">'+vals[count+13]+'</td>\n\
                                                <td id="aq'+id+'">'+vals[count+14]+'</td>\n\
                                                <td id="mip'+id+'">'+vals[count+15]+'</td>\n\
                                                <td id="map'+id+'">'+vals[count+16]+'</td>\n\
                                            </tr>\n\
                                        </tbody>\n\
                                    </table>\n\
                                    <div id="stkcht'+id+'">\n\
                                        <ul>\n\
                                            <li class="active"><a onclick="changeTab(this.id)" id="'+id+'1" title="VIEW '+id+'\'S INTRA-DAY CHART & MARKET DEPTH">Intra-Day Chart & Market Depth</a></li>\n\
                                            <li><a onclick="changeTab(this.id)" id="'+id+'2" title="VIEW '+id+'\'S HISTORICAL DATA">Historical Data</a></li>\n\
                                        </ul>\n\
                                        <div id="tabs">\n\
                                            <div id="'+id+'1tab" class="tab active">\n\
                                                <div id="mktdth'+id+'" class="scrllbl">\n\
                                                    <div class="ldng'+id+'">\n\
                                                        <img src=\"wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=loading.GIF\" width=\"30\" height=\"30\" alt=\"Loading...\">\n\
                                                    </div>\n\
                                                    <table id="tab1'+id+'">\n\
                                                        <thead>\n\
                                                            <tr colspan="3"><th class="trty">BUY</th></tr>\n\
                                                            <tr class="subtr"><th>Count</th><th>Volume</th><th>Price</th></tr>\n\
                                                        </thead>\n\
                                                        <tbody>\n\
                                                        </tbody>\n\
                                                    </table>\n\
                                                    <table id="tab2'+id+'">\n\
                                                        <thead>\n\
                                                            <tr colspan="3"><th class="trty">SELL</th></tr>\n\
                                                            <tr class="subtr"><th>Price</th><th>Volume</th><th>Count</th></tr>\n\
                                                        </thead>\n\
                                                        <tbody>\n\
                                                        </tbody>\n\
                                                    </table>\n\
                                                </div>\n\
                                                <!--<script src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=highcharts.js"></script>-->\n\
                                                <div id="stcht'+id+'"></div>\n\
                                            </div>\n\
                                            <div id="'+id+'2tab" class="tab">\n\
                                                <!--<script src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=highstock.js"></script>-->\n\
                                                <div id="sthist'+id+'"></div>\n\
                                            </div>\n\
                                        </div>\n\
                                    </div>\n\
                                </div>\n\
                             </div>';
                });
            }
        });
        $("#sdets").append(data);
    } 
    
    function setWindowFocus(id, wnty){
        var i;
        for(i = 0; i < wndopn.length; i++){
            if(wndopn[i][0] === id){
                //wndopn[i][1] = infoc;
                //$("#"+wndopn[i][1]+id).css('z-index', infoc);
                switch(wnty){
                    case "stkdet":
                        $("#stkdet"+id).css('z-index', infoc);
                        break;
                    case "transb":
                        $("#transb"+id).css('z-index', infoc);
                        break;
                    case "transs":
                        $("#transs"+id).css('z-index', infoc);
                        break;
                    case "nws":
                        $("#nws"+id).css('z-index', infoc);
                        break;
                }
            }
            else{
                //wndopn[i][1] = outfoc;
                $("#"+wndopn[i][1]+wndopn[i][0]).css('z-index', outfoc);
            }
        }
        console.log("Popup Windows: "+wndopn.length);
    }
    
    function unfocusPopups(){
        var cnt = wndopn.length;
        if(cnt > 0){
            var i;
            for(i = 0; i < wndopn.length; i++){
                $("#"+wndopn[i][1]+wndopn[i][0]).css('z-index', outfoc);
            }
        }
    }
    
    function remFocus(id, ty){
        var i;
        for(i = 0; i < wndopn.length; i++){
            if(wndopn[i][0] === id && wndopn[i][1] === ty){
                wndopn.splice(i, 1);
            }
        }
        console.log("Popup Windows: "+wndopn.length);
    }
    
    function getMarketNews(){
        mktnwcnt++;
        console.log("Requesting Market News...");
        apex.server.process(
            "MARKET_NEWS",
            {},
            {
                dataType: "text",
                success: function(pData){
                    var prfx = pData.substr(0,3);
                    if(prfx === "ORA"){
                        displayMsg("E", pData); //Show notification message
                    }
                    else{
                        if(pData !== ""){
                            $(pData).find("bdy").each(function(){
                                var cont = $(this).text();
                                if(cont !== ""){
                                    //console.log("Market News: "+pData);
                                    displayNews(pData);
                                }
                                else{
                                    $("#dta").append("<h2>NO MARKET NEWS AVAILABLE!</h2>");
                                    console.log("Market news is EMPTY!");
                                }
                            });
                        }
                        else{
                            if(mktnwcnt === 1)
                                dblink++;
                        }
                    }
                }/**,
                error: function(msg){
                    displayMsg("error", msg); //Show notification message
                }**/
            }
        );
    }
    
    function displayNews(xml){
        var data = "<div id=\"mktnews\">";
        data += "<ul>";
        $(xml).find("row").each(function(){
            var det = [];
            $(this).find("fld").each(function(){
                var vl = $(this).text();
                det.push(vl);
            });
            var hdl = (det[2].length < 60) ? det[2] : det[2].substr(0,60)+" ...";
            data += '<li id="'+det[0]+'">\n\
                         <div class="hdlin" onclick="showNews(\''+det[0]+'\')" title="'+det[2]+'"><p>'+hdl+'</p></div>\n\
                         <span class="tme">'+det[1]+'</span>\n\
                         <div id="nws'+det[0]+'" onclick="setWindowFocus(\''+det[0]+'\', \'nws\')"><div class="divhdr2"><img src=\"wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=newspaper1.svg\" alt="Icon"><p>&nbsp;&nbsp;'+det[2]+'</p></div><div class="clwn3"><a onclick="closeNews(\''+det[0]+'\', \'nws\')" title="CLOSE">X</a></div><div class="cntnt">'+det[3]+'</div></div>\n\
                     </li>';
        });
        data += "</ul></div>";
        $("#dta").append(data); //Add the trades to the table
    }
    
    function showNews(nwid){
        unfocusPopups();
        $("#nws"+nwid).css('z-index', infoc);
        wndopn.push([nwid, "nws"]);
        $("#nws"+nwid).show();
    }
    
    function closeNews(nwid, ty){
        remFocus(nwid, ty);
        $("#nws"+nwid).hide();
    }
    
    function nwup(nwid, time, title, body){
        var dt = '<li id="'+nwid+'">\n\
                      <div class="hdlin" onclick="showNews(\''+nwid+'\')" title="'+title+'"><p>'+title+'</p></div>\n\
                      <span class="tme">'+time+'</span>\n\
                      <div id="nws'+nwid+'"  onclick="setWindowFocus(\''+nwid+'\', \'nws\')"><div class="divhdr2"><img src=\"wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=newspaper1.svg\" alt="Icon"><p>&nbsp;&nbsp;'+title+'</p></div><div class="clwn3"><a onclick="closeNews(\''+nwid+'\', \'nws\')" title="CLOSE">X</a></div><div class="cntnt">'+body+'</div></div>\n\
                  </li>';
        
        var nm = $("#mktnews").length;
        if(nm === 0){
            $("#dta h2").remove();
            var data = "<div id=\"mktnews\"><ul>"+dt+"</ul></div>";
            $("#dta").append(data); //Add the update at the top of the table
        }
        else{
            var num = $("#mktnews ul li").length;
            if(num < 25){
                $("#mktnews ul").prepend(dt); //Add the update at the top of the table
            }
            else{
                $("#mktnews ul").prepend(data); //Add the update at the top of the table
                $("#mktnews ul li:last-child").remove(); //Remove the last row
            }
        }
    }
    
    function getTradeLog(){
        mkttrcnt++;
        apex.server.process(
            "TRADE_LOG",
            {},
            {
                dataType: "text",
                success: function(pData){
                    var prfx = pData.substr(0,3);
                    if(prfx === "ORA"){
                        displayMsg("E", pData); //Show notification message
                    }
                    else{
                        //console.log("Trade data for "+id+": "+pData);
                        if(pData !== ""){
                            $(pData).find("bdy").each(function(){
                                var cont = $(this).text();
                                if(cont !== ""){
                                    console.log("Trade data: "+pData.substr(0,14));
                                    var cnt = $("#tradlg").length;
                                    if(cnt === 0){
                                        displayTrades(pData);
                                    }
                                }
                                else{
                                    $("#markettrades").append("<h2>NO TRADES AVAILABLE ON <b>XNSA-EQTY</b> MARKET!</h2>");
                                    console.log("Trade Data is EMPTY!");
                                }
                            });
                        }
                        else{
                            if(mkttrcnt === 1)
                                dblink++;
                        }
                    }
                }/**,
                error: function(msg){
                    displayMsg("error", msg); //Show notification message
                }**/
            }
        );
    }
    
    function displayTrades(xml){
        var data = "<div id=\"tradlg\">";
        data += "<table><thead><tr><th>EQUITY</th><th>PRICE</th><th>VOLUME</th><th>TRADE TIME</th></tr></thead><tbody>";
        $(xml).find("row").each(function(){
            data += "<tr>";
            $(this).find("fld").each(function(){
                var id = $(this).attr("id");
                if(id !== "00" && id !== "04"){
                    data += "<td>"+$(this).text()+"</td>";
                }
            });
            data += "</tr>";
        });
        data += "</tbody></table></div>";
        $("#markettrades").append(data); //Add the trades to the table
    }
    
    function trup(mkid, stid, stid2, prc, qty, val, time){
        var dt = "<tr><td>"+stid+"</td><td>"+prc+"</td><td>"+qty+"</td><td>"+time+"</td></tr>";
        var nm = document.getElementById("tradlg");
        if(nm === null){
            $("#markettrades h2").remove();
            var data = "<div id=\"tradlg\"><table><thead><tr><th>EQUITY</th><th>PRICE</th><th>VOLUME</th><th>TRADE TIME</th></tr></thead><tbody>"+dt+"</tbody></table></div>";
            $("#markettrades").append(data);
        }
        else{
            var num = $("#tradlg table tr").length;
            if(num < 50){
                $("#tradlg table tbody").prepend(dt); //Add the update at the top of the table
            }
            else{
                $("#tradlg table tbody").prepend(dt); //Add the update at the top of the table
                $("#tradlg table tbody tr:last-child").remove(); //Remove the last row
            }
        }
        
        var tm = milliDate(time);
        var vl = tm+"|"+prc;
        var ctn = 0;
        for(var i = 0; i < cprcs.length; i++){
            if(cprcs[i][0] === stid){
                cprcs[i][1] = vl;
                //console.log(stid+"'s intra-day price updated!");
            }
            else{
                ctn++;
            }
        } 
        if(ctn === cprcs.length){
            cprcs.push([stid, vl]);
            //console.log("New trade price added for "+stid);
        }
    }
    
    //Function for the BUY and SELL buttons
    function doTransaction(sid, cls, trntype){
        if(byslcount === 0){
            var data = "";
            var actn;
            var stknm;
            for(var i = 0; i < stks.length; i++){
                var sk = stks[i].split("|");
                if(sk[0] === sid){
                    stknm = sk[1];
                }
            }

            if(trntype === "SELL"){
                $("."+cls+sid).attr('onclick','');
                actn = "transs"+sid+","+sid+",S";
                data += '<div id="transs'+sid+'" style="background: #f9f4f1;" onclick="setWindowFocus(\''+sid+'\', \'transs\')">\n\
                            <div id="ins">\n\
                                <div class="icnhdr"><img src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=business75.svg" alt="SELL STOCK" width="33" height="33"><p style="color: #f9f4f1;">SELL <b>'+sid+'</b></p></div>\n\
                                <div class="clwn2"><a onclick="closeWindow(\'transs'+sid+'\', \''+sid+'\', \''+cls+'\', \'transs\')" title="CLOSE">X</a></div>\n\
                                <table>\n\
                                    <tr><td id="'+sid+'smsg" style="color: #ff0000;"></td></tr>\n\
                                    <tr><td>ACCOUNT ID - <b>'+accusr+'</b></td></tr>\n\
                                    <tr><td>STOCK - <b>'+sid+' : '+stknm+'</b></td></tr>\n\
                                    <tr><td><input type="text" id="'+sid+'sqty" onkeyup="isValid(\''+sid+'\', this.id, \'S\')" onblur="isValid(\''+sid+'\', this.id, \'S\')" placeholder="Quantity" size="15">&nbsp;<select id="'+sid+'stype" onchange="checkType(\''+sid+'\', \''+sid+'sprice\',\'S\', this.id )"><option  value="L" select="selected">LIMIT</option><option value="M">MARKET</option></select>&nbsp;<input type="text" id="'+sid+'sprice" onkeyup="isValid(\''+sid+'\', this.id, \'S\')" placeholder="Limit Price" size="15"></td></tr>\n\
                                    <tr><td id="'+sid+'smsgg" style="color: #339933;"></td></tr>\n\
                                    <tr><td><a onclick="execAction(\'sell\',\''+actn+'\')" title="Sell '+sid+' stocks" class="ssell" style="color: #ffffff;">SELL</a></td></tr>\n\
                                </table>\n\
                            </div>\n\
                        </div>';
                
                unfocusPopups();
                wndopn.push([sid, "transs"]);
                $("body").append(data);
                $("#transs"+sid).css('z-index', infoc);
                $("#transs"+sid).show();
            }
            else{
                $("."+cls+sid).attr('onclick','');
                actn = "transb"+sid+","+sid+",P";
                data += '<div id="transb'+sid+'" style="background: #f5fafb;" onclick="setWindowFocus(\''+sid+'\', \'transb\')">\n\
                             <div id="ins">\n\
                                <div class="icnhdr"><img src="wwv_flow_file_mgr.get_file?p_security_group_id='+wrkspcid+'&amp;p_fname=business75.svg" alt="BUY STOCK" width="33" height="33"><p style="color: #f5fafb;">BUY <b>'+sid+'</b></p></div>\n\
                                <div class="clwn2"><a onclick="closeWindow(\'transb'+sid+'\', \''+sid+'\', \''+cls+'\', \'transb\')" title="CLOSE">X</a></div>\n\
                                <table>\n\
                                   <tr><td id="'+sid+'bmsg" style="color: #ff0000;"></td></tr>\n\
                                   <tr><td>ACCOUNT ID - <b>'+accusr+'</b></td></tr>\n\
                                   <tr><td>STOCK - <b>'+sid+' : '+stknm+'</b></td></tr>\n\
                                   <tr><td><input type="text" id="'+sid+'bqty" onkeyup="isValid(\''+sid+'\', this.id, \'P\')" onblur="isValid(\''+sid+'\', this.id, \'P\')" placeholder="Quantity" size="15">&nbsp;<select id="'+sid+'btype" onchange="checkType(\''+sid+'\', \''+sid+'bprice\', \'B\', this.id)"><option value="L" select="selected">LIMIT</option><option value="M">MARKET</option></select>&nbsp;<input type="text" id="'+sid+'bprice" onkeyup="isValid(\''+sid+'\', this.id, \'P\')" placeholder="Limit Price" size="15"></td></tr>\n\
                                   <tr><td id="'+sid+'bmsgg" style="color: #339933;"></td></tr>\n\
                                   <tr><td><a onclick="execAction(\'buy\',\''+actn+'\')" title="Buy '+sid+' stocks" class="bbuy" style="color: #ffffff;">BUY</a></td></tr>\n\
                                </table>\n\
                             </div>\n\
                         </div>';
                
                unfocusPopups();
                wndopn.push([sid, "transb"]);
                $("body").append(data);
                $("#transb"+sid).css('z-index', infoc);
                $("#transb"+sid).show();
            }
            byslcount++;
            //alert("BUY/Sell count: "+byslcount);
        }
        else{
            var msty = "E";
            var msg = "You can only open 1 BUY/SELL Stocks window at a time!";
            displayMsg(msty, msg);
        }
    }
    
    function exitDialog(){
        $("#yndialog").remove();
    }
    
    function numberWithCommas(val) {
        var parts = val.toString().split(".");
        return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
    }
    
    //Validate order input 
    function isValid(sid, id, tty){
        var qty, ordtyp, lmprc;
        var val = $("#"+id).val();
        if(tty === "P"){
            qty = $("#"+sid+"bqty").val();
            ordtyp = $("#"+sid+"btype").val();
            lmprc = $("#"+sid+"bprice").val();
            
            if(val === ""){
                $("#"+sid+"bmsg").html("<p>Please fill the field</p>");
                $("#"+id).css("border", function(){
                    return "1px solid red";
                });
                setTimeout(function(){ $("#"+sid+"bmsg p").remove(); }, 2000);
            }
            else if(val !== "" && !$.isNumeric(val)){
                $("#"+sid+"bmsg").html("<p>Please enter a numeric value</p>");
                $("#"+id).css("border", function(){
                    return "1px solid red";
                });
                setTimeout(function(){ $("#"+sid+"bmsg p").remove(); }, 2000);
            }
            else{
                $("#"+id).css("border", function(){
                    return "1px solid #999999";
                });
                if(ordtyp === "L"){
                    var cons = Number(qty) * Number(lmprc);
                    var vt = cons.toString().split(".");
                    if(vt.length === 0){
                        nstr = Number(cons.toString()+".00");
                    }
                    else{
                        nstr = cons.toFixed(2);
                    }
                    
                    $("#"+sid+"bmsgg").html("<p>ESTD. CONSDN: <b>=N= "+numberWithCommas(nstr)+"</b></p>");
                }
                else{
                    var prc;
                    for(var i = 0; i < sprc.length; i++){
                        var sk = sprc[i].split("|");
                        if(sk[0] === sid){
                            prc = sk[1];
                        }
                    }
                    var nstr;
                    var cons = Number(qty) * Number(prc);
                    var vt = cons.toString().split(".");
                    if(vt.length === 0){
                        nstr = Number(cons.toString()+".00");
                    }
                    else{
                        nstr = cons.toFixed(2);
                    }
                    
                    $("#"+sid+"bmsgg").html("<p>ESTD. CONSDN: <b>=N= "+numberWithCommas(nstr)+"</b></p>");
                }
            }
        }
        else if(tty === "S"){
            qty = $("#"+sid+"sqty").val();
            ordtyp = $("#"+sid+"stype").val();
            lmprc = $("#"+sid+"sprice").val();
            
            if(isNaN(val)){
                $("#"+sid+"smsg").html("<p>Please enter a numeric value</p>");
                $("#"+id).css("border", function(){
                    return "1px solid red";
                });
                setTimeout(function(){ $("#"+sid+"smsg p").remove(); }, 2000);
            }
            else if(val === ""){
                $("#"+sid+"smsg").html("<p>Please fill the field</p>");
                $("#"+id).css("border", function(){
                    return "1px solid red";
                });
                setTimeout(function(){ $("#"+sid+"smsg p").remove(); }, 2000);
            }
            else{
                $("#"+id).css("border", function(){
                    return "1px solid #999999";
                });
                if(ordtyp === "L"){
                    var cons = Number(qty) * Number(lmprc);
                    var vt = cons.toString().split(".");
                    if(vt.length === 0){
                        nstr = Number(cons.toString()+".00");
                    }
                    else{
                        nstr = cons.toFixed(2);
                    }
                    
                    $("#"+sid+"smsgg").html("<p>ESTD. CONSDN: <b>=N= "+numberWithCommas(nstr)+"</b></p>");
                }
                else{
                    var prc;
                    for(var i = 0; i < sprc.length; i++){
                        var sk = sprc[i].split("|");
                        if(sk[0] === sid){
                            prc = sk[1];
                        }
                    }
                    var nstr;
                    var cons = Number(qty) * Number(prc);
                    var vt = cons.toString().split(".");
                    if(vt.length === 0){
                        nstr = Number(cons.toString()+".00");
                    }
                    else{
                        nstr = cons.toFixed(2);
                    }
                    
                    $("#"+sid+"smsgg").html("<p>ESTD. CONSDN: <b>=N= "+numberWithCommas(nstr)+"</b></p>");
                }
            }
        }
    }
    
    function formatAmount(amt){
        var vl = "";
        var namt = amt.split(",");
        for(var i = 0; i < namt.length; i++){
            vl = vl.concat(namt[i]);
        }
        return vl;
    }
    
    function computePrc(qty, sid, lp){
        var prc, nstr;
        if(lp === ""){
            for(var i = 0; i < sprc.length; i++){
                var sk = sprc[i].split("|");
                if(sk[0] === sid){
                    prc = sk[1];
                }
            }
        }
        else{
            prc = lp;
        }
        
        var cons = Number(qty) * Number(prc);
        var vt = cons.toString().split(".");
        if(vt.length === 0){
            nstr = Number(cons.toString()+".00");
        }
        else{
            nstr = cons.toFixed(2);
        }
        
        return String(prc)+"|"+String(nstr);
    }
    
    function execAction(typ, action){
        var qty, ordtyp, lmprc, pc, nps, ost, orp;
        
        var vl = action.split(",");
        var data = '<div id="yndialog">';
        if(typ === "buy"){
            qty = $("#"+vl[1]+"bqty").val();
            ordtyp = $("#"+vl[1]+"btype").val();
            lmprc = $("#"+vl[1]+"bprice").val();
            
            if(!isNaN(qty) && ordtyp === "M"){
                pc = computePrc(qty, vl[1], '');
                nps = pc.split("|");
                ost = Number(formatAmount(acctbal)) - Number(nps[1]);
                console.log("ACCTBAL: "+formatAmount(acctbal)+" | TRANS. VAL.: "+nps[1]+" | DIF: "+ost);
                if(ost < 0.00){
                    orp = String(ost).substr(1);
                    $("#"+vl[1]+"bmsg").empty();
                    $("#"+vl[1]+"bmsg").html("<p><b>Insufficient Balance: </b>You need additional <b>=N= "+numberWithCommas(orp)+"</b> to post this order</p>");
                }
                else{
                    $("#"+vl[1]+"bmsg").empty();
                    data += '<p>Do you want to proceed with the ffg. transaction? <br><br/><b>BUY '+qty+' units of '+vl[1]+' @ MARKET Price of =N= '+nps[0]+'</b><br>VALUE: <b>=N= '+numberWithCommas(nps[1])+'</b></p>';
                    data += '<div class="ysno"><a onclick="setOrder(\''+vl[0]+'\', \''+vl[1]+'\', \''+vl[2]+'\')" title="YES">YES</a>&nbsp;&nbsp;<a onclick="exitDialog()" title="NO">NO</a></div></div>';
                    $("body").append(data); //Add to the html <body>
                    $("#yndialog").show(); //Show the YES/NO dialog
                }
            }
            else if(!isNaN(qty) && ordtyp === "L" && lmprc !== ""){
                pc = computePrc(qty, vl[1], lmprc);
                nps = pc.split("|");
                ost = Number(formatAmount(acctbal)) - Number(nps[1]);
                console.log("ACCTBAL: "+formatAmount(acctbal)+" | TRANS. VAL.: "+nps[1]+" | DIF: "+ost);
                if(ost < 0.00){
                    orp = String(ost).substr(1);
                    $("#"+vl[1]+"bmsg").empty();
                    $("#"+vl[1]+"bmsg").html("<p><b>Insufficient Balance: </b>You need additional <b>=N= "+numberWithCommas(orp)+"</b> to post this order</p>");
                }
                else{
                    $("#"+vl[1]+"bmsg").empty();
                    data += '<p>Do you want to proceed with the ffg. transaction? <br><br/><b>BUY '+qty+' units of '+vl[1]+' @ LIMIT Price of =N= '+nps[0]+'</b><br>VALUE: <b>=N= '+numberWithCommas(nps[1])+'</b></p>';
                    data += '<div class="ysno"><a onclick="setOrder(\''+vl[0]+'\', \''+vl[1]+'\', \''+vl[2]+'\')" title="YES">YES</a>&nbsp;&nbsp;<a onclick="exitDialog()" title="NO">NO</a></div></div>';
                    $("body").append(data); //Add to the html <body>
                    $("#yndialog").show(); //Show the YES/NO dialog
                }
            }
            else{
                $("#"+vl[1]+"bmsg").empty();
                $("#"+vl[1]+"bmsg").html("<p>Please fill the field(s)</p>");
                setTimeout(function(){ $("#"+vl[1]+"bmsg p").remove(); }, 2000);
            }
        }
        else if(typ === "sell"){
            qty = $("#"+vl[1]+"sqty").val();
            ordtyp = $("#"+vl[1]+"stype").val();
            lmprc = $("#"+vl[1]+"sprice").val();
            
            //Review this sell section towards verifying the availability of units of the stock to be sold 
            if(!isNaN(qty) && ordtyp === "M"){
                pc = computePrc(qty, vl[1], '');
                nps = pc.split("|");
                /**ost = Number(formatAmount(acctbal)) - Number(nps[1]);
                console.log("ACCTBAL: "+formatAmount(acctbal)+" | TRANS. VAL.: "+nps[1]+" | DIF: "+ost);
                if(ost < 0.00){
                    orp = String(ost).substr(1);
                    $("#"+vl[1]+"smsg").empty();
                    $("#"+vl[1]+"smsg").html("<p><b>Insufficient Balance: </b>You need additional <b>=N= "+numberWithCommas(orp)+"</b> to post this order</p>");
                }
                else{**/
                    data += '<p>Do you want to proceed with the ffg. transaction? <br><br/><b>SELL '+qty+' units of '+vl[1]+' @ MARKET Price of =N= '+nps[0]+'</b><br>VALUE: <b>=N= '+numberWithCommas(nps[1])+'</b></p>';
                    data += '<div class="ysno"><a onclick="setOrder(\''+vl[0]+'\', \''+vl[1]+'\', \''+vl[2]+'\')" title="YES">YES</a>&nbsp;&nbsp;<a onclick="exitDialog()" title="NO">NO</a></div></div>';
                    $("body").append(data); //Add to the html <body>
                    $("#yndialog").show(); //Show the YES/NO dialog
                //}
            }
            else if(!isNaN(qty) && ordtyp === "L" && lmprc !== ""){
                pc = computePrc(qty, vl[1], lmprc);
                nps = pc.split("|");
                /**ost = Number(formatAmount(acctbal)) - Number(nps[1]);
                console.log("ACCTBAL: "+formatAmount(acctbal)+" | TRANS. VAL.: "+nps[1]+" | DIF: "+ost);
                if(ost < 0.00){
                    orp = String(ost).substr(1);
                    $("#"+vl[1]+"smsg").empty();
                    $("#"+vl[1]+"smsg").html("<p><b>Insufficient Balance: </b>You need additional <b>=N= "+numberWithCommas(orp)+"</b> to post this order</p>");
                }
                else{**/
                    data += '<p>Do you want to proceed with the ffg. transaction? <br><br/><b>SELL '+qty+' units of '+vl[1]+' @ LIMIT Price of =N= '+nps[0]+'</b><br>VALUE: <b>=N= '+numberWithCommas(nps[1])+'</b></p>';
                    data += '<div class="ysno"><a onclick="setOrder(\''+vl[0]+'\', \''+vl[1]+'\', \''+vl[2]+'\')" title="YES">YES</a>&nbsp;&nbsp;<a onclick="exitDialog()" title="NO">NO</a></div></div>';
                    $("body").append(data); //Add to the html <body>
                    $("#yndialog").show(); //Show the YES/NO dialog
                //}
            }
            else{
                $("#"+vl[1]+"smsg").empty();
                $("#"+vl[1]+"smsg").html("<p>Please fill the field(s)</p>");
                setTimeout(function(){ $("#"+vl[1]+"smsg p").remove(); }, 2000);
            }
        }
        else{
            data += '<p>Are you sure you want to cancel the selected Order?</p>';
            data += '<div class="ysno"><a onclick="cancelOrder(\''+vl[0]+'\', \''+vl[1]+'\', \''+vl[2]+'\')" title="YES">YES</a>&nbsp;&nbsp;<a onclick="exitDialog()" title="NO">NO</a></div></div>';
            $("body").append(data); //Add to the html <body>
            $("#yndialog").show(); //Show the YES/NO dialog
        }
    }
    
    //Post order
    function setOrder(wid, sid, tty){
        exitDialog();
        var qty, ordtyp, lmprc, mkprc;
        
        if(tty === "P"){
            qty = $("#"+sid+"bqty").val();
            ordtyp = $("#"+sid+"btype").val();
            lmprc = $("#"+sid+"bprice").val();
            
            if(!isNaN(qty) && ordtyp === "M"){
                //Perform order posting
                var ses = $("#usrses").val();
                var mkid = "XNSA-EQTY";
                var acct = accdt.split(":");
                var accid = acct[0];

                mkprc = 0.00;
                orderPosting(ses, mkid, accid, sid, tty, Number(qty), ordtyp, "DAY", Number(mkprc));
                byslcount--;
                remFocus(sid, "transs");
                $("#"+wid).remove();
            }
            else if(!isNaN(qty) && ordtyp === "L" && lmprc !== ""){
                //Perform order posting
                var ses = $("#usrses").val();
                var mkid = "XNSA-EQTY";
                var acct = accdt.split(":");
                var accid = acct[0];

                orderPosting(ses, mkid, accid, sid, tty, Number(qty), ordtyp, "DAY", Number(lmprc));
                byslcount--;
                remFocus(sid, "transs");
                $("#"+wid).remove();
            }
            else{
                $("#"+sid+"bmsg").empty();
                $("#"+sid+"bmsg").html("<p>Please fill the field(s)</p>");
                setTimeout(function(){ $("#"+sid+"bmsg p").remove(); }, 2000);
            }
        }
        else if(tty === "S"){
            qty = $("#"+sid+"sqty").val();
            ordtyp = $("#"+sid+"stype").val();
            lmprc = $("#"+sid+"sprice").val();
            
            
            if(!isNaN(qty) && ordtyp === "M"){
                //Perform order posting
                var ses = $("#usrses").val();
                var mkid = "XNSA-EQTY";
                var acct = accdt.split(":");
                var accid = acct[0];

                mkprc = 0.00;
                orderPosting(ses, mkid, accid, sid, tty, Number(qty), ordtyp, "DAY", Number(mkprc));
                byslcount--;
                remFocus(sid, "transs");
                $("#"+wid).remove();
            }
            else if(!isNaN(qty) && ordtyp === "L" && lmprc !== ""){
                //Perform order posting
                var ses = $("#usrses").val();
                var mkid = "XNSA-EQTY";
                var acct = accdt.split(":");
                var accid = acct[0];

                orderPosting(ses, mkid, accid, sid, tty, Number(qty), ordtyp, "DAY", Number(lmprc));
                byslcount--;
                remFocus(sid, "transs");
                $("#"+wid).remove();
            }
            else{
                $("#"+sid+"smsg").empty();
                $("#"+sid+"smsg").html("<p>Please fill the field(s)</p>");
                setTimeout(function(){ $("#"+sid+"smsg p").remove(); }, 2000);
            }
        }
    }
    
    function orderPosting(ses, mkid, accid, skid, tty, qty, ordty, dy, lmprc){
        apex.server.process(
            "ORDER_POSTING",
            {
                x01: ses,
                x02: mkid,
                x03: accid,
                x04: skid,
                x05: tty,
                x06: qty,
                x07: ordty,
                x08: dy,
                x09: lmprc
            },
            {
                dataType: "text",
                success: function(resp){
                    var prfx = resp.substr(0,3);
                    if(prfx === "ORA"){
                        displayMsg("E", resp); //Show notification message
                    }
                    else{
                        var msty = "S";
                        var msg = "Order posted successfully!";
                        displayMsg(msty, msg); //Show notification message
                        //alert(resp);
                        getCustomerOrders();
                    }
                }/**,
                error: function(resp){
                    var msty = "error";
                    var msg = resp;
                    displayMsg(msty, msg); //Show notification message
                    //alert("Error msg: "+resp);
                }**/
            }
        );
    }
    
    function checkType(sid, tg, trt, id){
        var val = $("#"+id).val();
        var prc;
        for(var i = 0; i < sprc.length; i++){
            var sk = sprc[i].split("|");
            if(sk[0] === sid){
                prc = sk[1];
            }
        }
            
        if(trt === "B"){
            if(val === "L"){
                if($("#transb"+sid+" table tr:nth-child(4) td input:nth-child(3)").attr('id') === ''){
                    $("#transb"+sid+" table tr:nth-child(4) td input:nth-child(3)").val(function(){
                        return '';
                    });
                    $("#transb"+sid+" table tr:nth-child(4) td input:nth-child(3)").attr('id', sid+'bprice');
                    $("#transb"+sid+" table tr:nth-child(4) td input:nth-child(3)").show();
                }
                var qtty = $("#"+sid+"bqty").val();
                var lmprc = $("#"+sid+"bprice").val();
                
                var nstr;
                var cons = Number(qtty) * Number(lmprc);
                var vt = cons.toString().split(".");
                if(vt.length === 0){
                    nstr = Number(cons.toString()+".000");
                }
                else{
                    nstr = cons.toFixed(3);
                }
                    
                $("#"+sid+"bmsgg").html("<p>ESTD. CONSDN: <b>=N= "+numberWithCommas(nstr)+"</b></p>");
            }
            else{
                $("#"+tg).val(function(){
                   return ''; 
                });
                $("#"+tg).hide();
                $("#"+tg).attr('id', '');
               
                var qty = $("#"+sid+"bqty").val();
                var nstr;
                var cons = Number(qty) * Number(prc);
                var vt = cons.toString().split(".");
                if(vt.length === 0){
                    nstr = Number(cons.toString()+".000");
                }
                else{
                    nstr = cons.toFixed(3);
                }
                    
                $("#"+sid+"bmsgg").html("<p>ESTD. CONSDN: <b>=N= "+numberWithCommas(nstr)+"</b></p>");
            }
        }
        else{   
            if(val === "L"){
                if($("#transs"+sid+" table tr:nth-child(4) td input:nth-child(3)").attr('id') === ''){
                    $("#transs"+sid+" table tr:nth-child(4) td input:nth-child(3)").val(function(){
                        return '';
                    });
                    $("#transs"+sid+" table tr:nth-child(4) td input:nth-child(3)").attr('id', sid+'sprice');
                    $("#transs"+sid+" table tr:nth-child(4) td  input:nth-child(3)").show();
                }
                var qty = $("#"+sid+"sqty").val();
                var lmprc = $("#"+sid+"sprice").val();
                var nstr;
                var cons = Number(qty) * Number(lmprc);
                var vt = cons.toString().split(".");
                if(vt.length === 0){
                    nstr = Number(cons.toString()+".000");
                }
                else{
                    nstr = cons.toFixed(3);
                }
                    
                $("#"+sid+"smsgg").html("<p>ESTD. CONSDN: <b>=N= "+numberWithCommas(nstr)+"</b></p>");
            }
            else{
                $("#"+tg).val(function(){
                   return ''; 
                });
                $("#"+tg).hide();
                $("#"+tg).attr('id', '');
                
                var qty = $("#"+sid+"sqty").val();
                var nstr;
                var cons = Number(qty) * Number(prc);
                var vt = cons.toString().split(".");
                if(vt.length === 0){
                    nstr = Number(cons.toString()+".000");
                }
                else{
                    nstr = cons.toFixed(3);
                }
                    
                $("#"+sid+"smsgg").html("<p>ESTD. CONSDN: <b>=N= "+numberWithCommas(nstr)+"</b></p>");
            }
        }
    }
    
    //Function for closing the BUY/SELL pop-up
    function closeWindow(id, nm, ns, ty){
        remFocus(nm, ty);
        $("#"+id).remove();
       
        if(ns === 'ssell'){
            $("."+ns+nm).attr('onclick', 'doTransaction(\''+nm+'\', \'bbuy\' , \'SELL\')');
        }
        else if(ns === 'sell'){
            $("."+ns+nm).attr('onclick', 'doTransaction(\''+nm+'\', \'buy\' , \'SELL\')');
        }
        else if(ns === 'bbuy'){
            $("."+ns+nm).attr('onclick', 'doTransaction(\''+nm+'\', \'ssell\' , \'BUY\')');
        }
        else if(ns === 'buy'){
            $("."+ns+nm).attr('onclick', 'doTransaction(\''+nm+'\', \'sell\' , \'BUY\')');
        }
        byslcount--;
        //alert("BUY/Sell count: "+byslcount);
    }
    
    //Function for changing tabs in pop-up
    function changeTab(id){
        //alert("Attribute ID: "+id);
        var curid = "#"+id+"tab";
        // Show/Hide Tabs
        $(curid).fadeIn(1000).siblings().hide();
        
        // Change/remove current tab to active
        $("#"+id).parent('li').addClass('active').siblings().removeClass('active');

        //e.preventDefault();
    }
    
    //Function for closing the pop-up window
    function closeDisplay(id, sid, ty){
        popups--;
        $('#'+id).hide();
        var msg = user+"-"+sid+"-REM";
        wsocket.send(msg);
        
        clearPopup(sid);
        remFocus(sid, ty); //Remove the stock from popup focus array
        removeStock(sid); //Remove stock from the DAY and ADD update stock arrays
        for(var j = 0; j < cprcs.length; j++){
            if(cprcs[j][0] === sid){
                cprcs.splice(j, 1);
            }
        }
        console.log("REM STK - UPDPRC: "+updprc.length+" | DYPRCS: "+dyprcs.length+" | CPRCS: "+cprcs.length);
        //reqMktDepth(sid, "DEA"); //Deactivate receipt of market depth data update for stock
        //arrEmpty();
    }
    
    function clearAll(){
        for(var n = 0; n < stks.length; n++){
            stks.splice(n, 1);
        }
        for(var m = 0; m < sprc.length; m++){
            sprc.splice(m, 1);
        }
        for(var j = 0; j < updprc.length; j++){
            var sid = updprc[j][0];
            wsocket.send(user+"-"+sid+"-REM");
            updprc.splice(j, 1);
        }
        for(var i = 0; i < cprcs.length; i++){
            cprcs.splice(i, 1);
        }
        for(var k = 0; k < dyprcs.length; k++){
            dyprcs.splice(k, 1);
        }
        for(var l = 0; l < wndopn.length; l++){
            wndopn.splice(l, 1);
        }
        
        console.log("DYPRCS: "+dyprcs.length+" | UPDPRC: "+updprc.length+" | CPRCS: "+cprcs.length+" | WNDOPN: "+wndopn.length+" | SPRC: "+sprc.length+" | STKS: "+stks.length);
    }
    
    function clearPopup(sid){
        $("#tab1"+sid+" tbody").empty();
        $("#tab2"+sid+" tbody").empty();
        
        $("#stcht"+sid).empty();
        $("#stcht"+sid).removeAttr("data-highcharts-chart");
        
        $("#sthist"+sid).empty();
        $("#sthist"+sid).removeAttr("data-highcharts-chart");
    }
    
    window.addEventListener("load", connect, false);
    
    
    function isMarketClosed(){
        var clTime = "14:30:00";
        var crTime = new Date();
        var mth;

        var cday = crTime.getDate();
        var month = crTime.getMonth();
        var year = crTime.getFullYear();

        switch (month) {
            case 0:
                mth = "January";
                break;
            case 1:
                mth = "February";
                break;
            case 2:
                mth = "March";
                break;
            case 3:
                mth = "April";
                break;
            case 4:
                mth = "May";
                break;
            case 5:
                mth = "June";
                break;
            case 6:
                mth = "July";
                break;
            case 7:
                mth = "August";
                break;
            case 8:
                mth = "September";
                break;
            case 9:
                mth = "October";
                break;
            case 10:
                mth = "November";
                break;
            case 11:
                mth = "December";
                break;
        }

        var mktCloseTime = new Date(mth+" "+cday.toString()+", "+year.toString()+" "+clTime);

        if(crTime >= mktCloseTime){
            document.getElementById("status").style.color = "Red";
            document.getElementById("status").innerHTML = "CLOSED";
        }
        else{
            document.getElementById("status").style.color = "Green";
            document.getElementById("status").innerHTML = "OPEN";
        }
    } 
    
    function updateClock(){
        var currentTime = new Date ( );
        var currentHours = currentTime.getHours ( );
        var currentMinutes = currentTime.getMinutes ( );
        //var currentSeconds = currentTime.getSeconds ( );

        // Pad the minutes and seconds with leading zeros, if required
        currentMinutes = ( currentMinutes < 10 ? "0" : "" ) + currentMinutes;
        //currentSeconds = ( currentSeconds < 10 ? "0" : "" ) + currentSeconds;

        // Choose either "AM" or "PM" as appropriate
        var timeOfDay = ( currentHours < 12 ) ? "AM" : "PM";

        // Convert the hours component to 12-hour format if needed
        currentHours = ( currentHours > 12 ) ? currentHours - 12 : currentHours;

        // Convert an hours component of "0" to "12"
        currentHours = ( currentHours === 0 ) ? 12 : currentHours;

        // Compose the string for display
        var currentTimeString = currentHours + ":" + currentMinutes + " " + timeOfDay;

        crtm = currentTimeString;

        $(".crclock").html(currentTimeString);
     }
    
    //Function for showing intra-day movement of a specific stock
    //$(function () {
    function showChart(id) {
        //var crt = 0;  
        //$(function () {
        Highcharts.setOptions({
                global: {
                    useUTC: false
                }
            });

            $("#stcht"+id).highcharts({
                chart: {
                    type: 'spline',
                    animation: Highcharts.svg, // don't animate in old IE
                    marginRight: 10,
                    events: {
                        load: function () {
                            //console.log("Getting ADD prices for "+id);
                            var series = this.series[0];
                            setInterval(function(){
                                var val = getAddPrice(id);
                                var val2 = getAddPrice2(id);
                                //var vl = val;
                                //console.log("Intrady Rcvd for "+id+" : 1(CPRC) - "+String(val)+" | 2(UPDPRC) - "+String(val2));
                                if(val === "Non" && val2 !== undefined){
                                    console.log("Chart Value for "+id+" :"+String(val2));
                                    var itm = val2.split("|");
                                    var tm = itm[0];
                                    var prc = itm[1];
                                    
                                    var x = Number(tm), // current time
                                        y = Number(prc); // Updated price
                                    series.addPoint([x, y], true, true);
                                    
                                    cprcs.push([id, val2]);
                                }
                                else if(val !== "Non" && val !== val2){
                                    console.log("Chart Value "+id+" :"+String(val));
                                    var itm = val.split("|");
                                    var tm = itm[0];
                                    var prc = itm[1];
                                    
                                    var x = Number(tm), // current time
                                        y = Number(prc); // Updated price
                                    series.addPoint([x, y], true, true);
                                    
                                    for(var i = 0; i < updprc.length; i++){
                                        if(updprc[i][0] === id){
                                            updprc[i][1] = val;
                                        }
                                    }
                                }
                            }, 1000); 
                        }
                    }
                },
                plotOptions: {
                    series: {
                        turboThreshold: 8000
                    }
                },
                credits: {
                    enabled: false // Whether to show the credits text.
                },
                title: {
                    text: ''
                },
                xAxis: {
                    type: 'datetime',
                    tickPixelInterval: 150
                },
                yAxis: {
                    title: {
                        text: ''
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                tooltip: {
                    formatter: function () {
                        return Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x)+'<br/><b style="color: #00ccff;">'+id+': </b><b>'+
                            Highcharts.numberFormat(this.y, 2)+'</b>';
                    }
                },
                legend: {
                    enabled: false
                },
                exporting: {
                    enabled: false
                },
                series: [{
                    name: 'Stock Price',
                    data: (function () {
                        var data = getDyPrices(id).slice(0);
                        console.log("Showing DAY prices for "+id);
                        //console.log(id+" DAYYYY Prices: "+data);
                        
                        return data;
                    }())
                }]
            });
        
    //});
    }

    //Function for showing the historical chart
    function showHChart(sid, data){
        var dta = JSON.stringify(data);
        $(function(dta){ 
            // split the data set into ohlc and volume
            var ohlc = [],
                volume = [],
                dataLength = data.length,
                // set the allowed units for data grouping
                groupingUnits = [[
                    'week',                         // unit name
                    [1]                             // allowed multiples
                ], [
                    'month',
                    [1, 2, 3, 4, 6]
                ]],

                i = 0;

            for (i; i < dataLength; i += 1) {
                ohlc.push([
                    data[i][0], // the date
                    data[i][1], // open
                    data[i][2], // high
                    data[i][3], // low
                    data[i][4] // close
                ]);

                volume.push([
                    data[i][0], // the date
                    data[i][5] // the volume
                ]);
            }
            console.log("HChart data sent!");

            // create the chart
            $('#sthist'+sid).highcharts('StockChart', {

                /**navigator: {
                    enabled: false  
                },**/
                rangeSelector: {
                    selected: 1,
                    inputEnabled: false
                },
                plotOptions: {
                    series: {
                        turboThreshold: 8000
                    }
                },
                credits: {
                    enabled: false,                      // Whether to show the credits text.
                },
                /**
                title: {
                    text: sid+' Historical'
                },**/

                yAxis: [{
                    labels: {
                        align: 'right',
                        x: -3
                    },
                    title: {
                        text: 'OHLC'
                    },
                    height: '60%',
                    lineWidth: 2
                }, {
                    labels: {
                        align: 'right',
                        x: -3
                    },
                    title: {
                        text: 'Volume'
                    },
                    top: '65%',
                    height: '35%',
                    offset: 0,
                    lineWidth: 2
                }],

                series: [{
                    type: 'candlestick',
                    name: sid,
                    data: ohlc,
                    dataGrouping: {
                        units: groupingUnits
                    }
                }, {
                    type: 'column',
                    name: 'Volume',
                    data: volume,
                    yAxis: 1,
                    dataGrouping: {
                        units: groupingUnits
                    }
                }]
            });
    });
}





    
    
    