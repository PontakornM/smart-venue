// MongoDB
var mongojs = require('mongojs');
var db = mongojs('svdb',['registrar']);
var db2 = mongojs('svdb',['deviceZone']);

test_db();
// Socket.io
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// MQTT -- Arduino to Server
var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://localhost');

// time lib
var moment = require('moment');
var _ = require('underscore');

server.listen(9000,function(){
    console.log('Server Listening on localhost:9000');
});

io.on('connection',function(socket){
    console.log('io connected!!!');
        db.registrar.find(function (err, docs) {
              if(err) console.log("Registrar Error Message : " + err);
              else {
                   socket.emit('DataService',docs);
               }
        });

        socket.on('InsertDataService',function(data){
              if(!check_empty(data)){
                check_reg(data);
            }
        });

        socket.on('UpdateDataService',function(data){
                console.log(data);
                update_reg(data);
        });
});

client.on('connect', function () {
 console.log('Client Connected');
 client.subscribe('data');
 client.subscribe('outTopic');
 client.subscribe('requestZone');
});

client.on('message', function (topic, message, packet) {
 console.log("=====================================>");
 console.log("Topic => " + topic);
 console.log("Message => " + message.toString());
 if(topic == "data"){
     var stringBuf = packet.payload.toString('utf-8');
     var data_obj = JSON.parse(stringBuf);
     console.log(data_obj);
     proc_json(data_obj);
 }
 if(topic == "requestZone"){
     client.publish('responseZone','B',function(){
         console.log('Sending zone request...');
      });
 }
//  console.log(packet);
 console.log("=====================================>\n\n");
});

// =======================  Additional Function ===========================
// check that newcomer data
function check_reg (data){
    var user = {uuid : data.uuid};
    db.registrar.count(user,function(err,doc){
        if(err) console.log('Registrar Count Error : ' + err);
        else {
            console.log('Registrar Count Done!!!');
            if(doc){
                update_reg(data);
            }else{
                add_newreg(data);
            }
        }
    });
}


// update existing element
function update_reg (req){
    req.timestamp = moment().format();
    console.log(req)
    db.registrar.findAndModify({
	   query: { uuid: req.uuid },
	   update: { $set: _.omit(req,'uuid') },
	   new: true
    }, function (err, doc, lastErrorObject) {
        if(err) console.log('Registrar Update Error : '+ err);
        else {
            console.log('Registrar Update Done!!');
            io.emit('checkUpdate',doc);
        }
    })
}

// add new element
function add_newreg (data){
    var temp = {
        uuid : data.uuid,
        timestamp : moment().format(),
        zone : data.zone,
        proximity : data.proximity,
        type : parseInt(data.type),   // o --> dynamic  & 1 --> static
        security : "No"
    };
    if(data.type == '1') temp.security = "Yes";
    db.registrar.insert(temp,function(err,doc){
        if(err) console.log('Registrar Insert Error : '+ err);
        else {
            console.log('Registrar Insert Done!!');
            io.emit('checkNew',doc);
        }
    });
}

// check data Integrity
function check_empty(data){
    if(data.uuid == null || data.zone == null || data.type == null) return true;
    else return false;
}

// check condition for alarm
function alarm(data){
    if(data.type == '1'){
        db.registrar.find({uuid : data.uuid},function(err,doc){
           if(doc.zone != data.zone)
            return true;
        });
    }
    return false;
}

// process json obj
function proc_json(json){
    var len = json.uuid.length;
    var temp = {
            uuid : null,
            timestamp : moment().format(),
            zone : json.zone,
            proximity : json.proximity,
            type : null,   // o --> dynamic  & 1 --> static
            security : "No"
    };
    while(len--){
        temp.uuid = json.uuid[len];
        temp.type = json.type[len];
        if(json.type[len] == '1') temp.security = 'Yes';
        console.log('len : ' + len );
        console.log('temp => ',temp);
        check_reg(temp);
    }
}

// testing database
function test_db() {
    db.on('connect', function () {
        console.log('database connected')
    });

    db2.on('connect', function () {
        console.log('database2 connected')
    });

    db.registrar.find(function (err, docs) {});
    db2.deviceZone.find(function (err, docs) {});
}
