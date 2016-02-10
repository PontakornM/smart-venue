
var dbSocket = require('socket.io-client').connect("http://localhost:9000");

var express = require('express');
var moment = require('moment');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var _ = require('underscore');


var totalData;

var user;
var itemData;
var watchList = [];

var log4js = require('log4js');
var logger = log4js.getLogger();

var securityTimeout;
var securityInterval;

dbSocket.on('DataService', function(data){
  // logger.debug(data);
  totalData = data;
});

var setID = function(socket){

    socket.on('setID', function(data){
      user = _.find(totalData,function(item){ return item.uuid == data.uuid;});
      logger.debug("user",user);
      console.log(user);
      if(user){
        dbSocket.emit('UpdateDataService',{uuid: data.uuid, socketID: socket.id});

        socket.emit('User',{user: user});
        itemData = _.filter(totalData,function(item){ return item.type == 1;} );
        // logger.debug("itemData",itemData);
        socket.emit('SearchData',{searchData: itemData});


      }
    });

    socket.on('updateItem', function(data){
      dbSocket.emit('UpdateDataService',data);
    });


}

dbSocket.on('checkUpdate', function(data){
    logger.debug(data);
    var checkUser;
    if(user)
      checkUser = data.uuid == user.uuid ? true : false;

    if(checkUser){
        user = data;
        adminAble(user.admin);
        io.emit('User',{user: user});
    }
    else{
        var indexOfItem = _.findIndex(totalData, function(item){
                                return item.uuid == data.uuid;
                            });
        logger.debug(totalData+indexOfItem);
        var tmp = totalData[indexOfItem];
        totalData[indexOfItem] = data;
        itemData = _.filter(totalData,function(item){ return item.type == 1;} );
        io.emit('SearchData',{searchData: itemData});


        if(data.security == 'Yes')
          checkSecurity(tmp , data);
        else{

          var indexOfWatch = _.findIndex(watchList, function(item){ return item.uuid == data.uuid;});
          logger.debug(data.security,indexOfWatch);
          if(indexOfWatch >= 0){
            watchList = _.reject(watchList,function(item){return item.uuid == data.uuid;});
            clearInterval(securityInterval);
            securityInterval = null;
            io.emit('alarm', {alarm: false, items: []});
          }
        }
    }
});

dbSocket.on('checkNew',function(data){
      logger.debug(data);
      totalData.push(data);
      itemData = _.filter(totalData,function(item){ return item.type == 1;} );
      io.emit('SearchData',{searchData: itemData});
})



var checkSecurity = function(watchItem, curItem){
  var indexOfWatch = _.findIndex(watchList, function(item){ return item.uuid == watchItem.uuid;});

  if(indexOfWatch < 0){
    if(watchItem.zone != curItem.zone)
      watchList.push(watchItem);
  }
  else {
    logger.debug("checkSecurity",indexOfWatch , watchList[indexOfWatch].zone,curItem.zone);
    watchList = _.filter(watchList,function(item){return item.uuid != curItem.uuid; });
    logger.debug(watchList);
  }
}


var adminAble = function(admin){
    logger.debug(admin);

    if(admin){
      io.emit('NumberPeople',{people: _.filter(totalData,function(item){return item.type == 0;}).length });
      if(!securityInterval)
       securityInterval = setInterval(function(){
          // logger.debug(watchList.length);
          if(watchList.length < 1){

              io.emit('alarm', {alarm: false, items: []});
          }
          else{
            logger.debug("Start: securityTimeout");
            io.emit('alarm', {alarm: true, items: watchList});
          }
      },5000)

    }
    else{

      clearInterval(securityInterval);
      securityInterval = null;
      io.emit('alarm', {alarm: false, items: []});
    }
}

app.use(express.static('public'));


io.on('connection', function(socket){
  logger.info("io conneted");
  // logger.info(socket);
  setID(socket);
});


server.listen(8000, function(){
  logger.info("server on");
})
