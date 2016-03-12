// MongoDB
var mongojs = require('mongojs');
var db = mongojs('svdb',['registrar']);
// var db2 = mongojs('svdb',['deviceZone']);
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

// socket io response
io.on('connection',function(socket){
    console.log('io connected!!!');
        db.registrar.find(function (err, docs) {
              if(err) console.log("Registrar Error Message : " + err);
              else {
                  console.log('Sending DataService....');
                  socket.emit('DataService',docs);
               }
        });

        socket.on('InsertDataService',function(data){
              console.log('InsertDataService on...');
              if(!check_err(data)){
                check_reg(data);
              }
        });

        socket.on('UpdateDataService',function(data){
                console.log('UpdateDataService on...');
                check_reg(data);
        });

});

// mqtt response
client.on('connect', function () {
    console.log('Client Connected');
    client.subscribe('data');
    client.subscribe('outTopic');
});

client.on('message', function (topic, message, packet) {
    console.log("=====================================>");
    console.log("Topic => " + topic);
    console.log("Message => " + message.toString());
    if(topic == "data"){
        console.log('Incoming data from SV terminal......');
        var stringBuf = packet.payload.toString('utf-8');
        var data_obj = JSON.parse(stringBuf);
        proc_json(data_obj);
        check_expire_session();
    }
    console.log("=====================================>");
});


// =======================  Additional Function ===========================
// check that newcomer data
function check_reg (data){
    var user = {uuid : data.uuid};
    db.registrar.count(user,function(err,doc){
        if(err) console.log('Registrar Count Error : ' + err);
        else {
            console.log('Found Registrar Done!!!');
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
    // console.log("Req =====> ",req);
    //determine zone
    db.registrar.findOne({uuid:req.uuid},function(err,doc){
        console.log('Doc : '+doc.uuid+' ,Zone : ' + doc.zone + ' ,Prox : ' + doc.proximity);
        console.log('Reg : '+req.uuid+' ,Zone : ' + req.zone + ' ,Prox : ' + req.proximity);
        // determine zone
        if( req.admin != true && req.zone != doc.zone && ((req.proximity == 1 && doc.proximity == 1 )|| doc.proximity < 1)){
                console.log('Ignore Updating data....!!!');
                req.zone = doc.zone;
        }
        //  else if(req.zone == doc.zone || (req.zone != doc.zone && doc.proximity == 1  && req.proximity < 1) || req.admin == true){

            req.timestamp = moment().format();
            // determine expire session for user and admin
            if(!req.admin)
                req.expire = moment().add(10,'s').format();
            else  req.expire = moment().add(10,'m').format();

            db.registrar.findAndModify({
                query: { uuid: req.uuid },
                update: { $set: _.omit(req,"uuid") },
                new: true
                }, function (err, doc, lastErrorObject) {
                    if(err) console.log('Update Error : '+ err);
                    else {
                        console.log('Update Registrar Done!!');
                        io.emit('checkUpdate',doc);
                    }
                });
        // }
    });
}

// add new element
function add_newreg (data){
    var temp = {
        uuid : data.uuid,
        title: data.title,
        description: data.description,
        painter:data.painter,
        img:data.img,
        timestamp : moment().format(),
        expire : moment().add(5,'s').format(),
        zone : data.zone,
        proximity : parseInt(data.proximity),
        type : parseInt(data.type),   // o --> dynamic  & 1 --> static
        security : "No",
        admin : false
    };
    // if(data.type == '1') temp.security = "Yes";
    db.registrar.insert(temp,function(err,doc){
        if(err) console.log('Add New Reg Error : '+ err);
        else {
            console.log('Add New Registrar Done!!');
            io.emit('checkNew',doc);
        }
    });
}

// check data Integrity
function check_err(data){
    if(parseInt(data.uuid) == 0) return true;
    // || data.zone == undefined
    if(data.uuid == undefined || data.type == undefined || data.proximity == undefined || data.type == '9' || data.proximity == 9) {
         console.log('Err Format Data : ' , data);
        return true;
    }
    else{
        return false;
    }
}

// check condition for alarm
function alarm(data){
    if(data.type == '1'){
        db.registrar.find({uuid : data.uuid},function(err,doc){
           if(doc.zone != data.zone && doc.zone == "Yes"){
                console.log('Alarming......!!!');
                return true;
            }
        });
    }
    return false;
}




// process json obj
function proc_json(json){
    var len = json.uuid.length;
    var temp = {};
    while(len--){
        temp = {
            uuid : json.uuid[len],
            timestamp : moment().format(),
            expire : moment().add(5,'s').format(),
            zone : json.zone,
            proximity : parseInt(json.proximity[len]),
            type : parseInt(json.type[len])   // o --> dynamic  & 1 --> static
        };
        // console.log('len : ' + len );
        // console.log('temp => ',temp);
        // console.log('json _'+len+' ',temp);
         if(!check_err(temp)){
              check_reg(temp);
         }
    }
}

//check expire ble session
function check_expire_session(){

    db.registrar.find({expire: {$lt: moment().format()}},function (err, doc) {
            console.log('SessionExpire : ',doc);
            io.emit('SessionExpire',doc);
    });
}

// testing database
function test_db() {
    db.on('connect', function () {
        console.log('database connected....!!')
    });

    // db2.on('connect', function () {
    //     console.log('database2 connected')
    // });

    db.registrar.find(function (err, docs) {});
    // db2.deviceZone.find(function (err, docs) {});
}
