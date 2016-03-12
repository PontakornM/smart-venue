
var dbSocket = require('socket.io-client').connect("http://localhost:9000");

var express = require('express');
var moment = require('moment');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var _ = require('underscore');
var log4js = require('log4js');
var logger = log4js.getLogger('Smart Venue');

var user;
var watchList = [];

dbSocket.on('DataService', function(data){
  // logger.debug(data);
  totalData = data;
});

dbSocket.on('checkNew',function(data){
      logger.debug(data);
      totalData.push(data);
      logger.debug("New: "+ data);
      io.emit('DataServiceClient',{array:totalData});
})

function checkLock(socket){
  socket.on('ClearWatchListServiceClient',function(wdata){
      watchList = _.reject(watchList,wdata.data);
      socket.emit('WatchListServiceClient',watchList);
  });

  socket.on('ClearAllWatchListServiceClient',function(wdata){
      watchList = [];
      socket.emit('WatchListServiceClient',watchList);
  })
}

function checkUpdate(socket){
  dbSocket.on('checkUpdate',function (udata) {
    var checkUser;
    if(user)
      checkUser = udata.uuid == user.uuid ? true : false;

    if(checkUser){
        user = udata;
        logger.debug('User : ',user.uuid.substring(0,4),'Zone : ',user.zone);
        socket.emit('UserServiceClient',user);
    }
    else{
      var indexOfItem = _.findIndex(totalData, function(item){
                              return item.uuid == udata.uuid;
                          });
      var tmp = totalData[indexOfItem];
      if(tmp.zone != udata.zone && udata.lock){
          watchList.push(udata);
          socket.emit('WatchListServiceClient',watchList);
      }
      totalData[indexOfItem] = udata;
      socket.emit('DataServiceClient',{array:totalData});
    }
  })
}

function updateData(socket){
  socket.on("UpdateDataServiceClient",function(_data){
    logger.debug("Update: "+_data);
    dbSocket.emit('UpdateDataService',_data);
  })
}

function newData(socket){
  socket.on('InsertDataServiceClient',function(_data){
    _data.zone  = null;
    _data.type  = '1';
    _data.proximity  = -2;
    logger.debug(_data);
    dbSocket.emit('InsertDataService',_data);
  });
}

function setID(socket) {


  socket.on("setID",function(uuidData){
    uuidData = uuidData.replace(/-/gi,"");
    logger.debug("uuid_user: "+uuidData);
    user = _.findWhere(totalData,{uuid: uuidData});
    if(user){
      socket.emit("UserServiceClient",user);
      logger.debug(user.uuid.substring(0,4));
    }
    else{
      var _data = {uuid:uuidData,zone:undefined,type:'0',proximity:-2};
      logger.debug("New user"+ _data);
      dbSocket.emit('InsertDataService',_data);
      setTimeout(function(){
        user = _.findWhere(totalData,{uuid: uuidData});
        socket.emit("UserServiceClient",user);
      },3000);
    }

  })
}

io.on('connection',function(socket){
  logger.info("io connected");
  socket.emit('DataServiceClient',{array:totalData});

  checkUpdate(socket);
  updateData(socket);
  newData(socket);
  checkLock(socket);

  setID(socket);
})

app.use(express.static('public'));

server.listen(8000, function(){
  logger.info("server on");
})
