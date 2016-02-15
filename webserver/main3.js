
var dbSocket = require('socket.io-client').connect("http://172.30.89.223:9000");

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
var logger = log4js.getLogger('SmartVenue');

var securityTimeout;
var securityInterval;
var navItem = [];


dbSocket.on('DataService', function(data){
  // logger.debug(data);
  totalData = data;
  // if(user){
  //   itemData = _.filter(totalData,function(item){ return item.type == 1;} );
  //   socket.emit('SearchData',{searchData: totalData});
  // }

});
var disableSecurity  = true;
var setID = function(socket){

    socket.on('setID', function(data){

      socket.emit("initialDisable",{check : disableSecurity});

      user = _.find(totalData,function(item){ return item.uuid == data.uuid;});
      logger.debug("user",user);
      if(user){
        dbSocket.emit('UpdateDataService',{uuid: data.uuid, socketID: socket.id});
        socket.on('ClearWatchList',function(data){
          if(!data.check){
            watchList = [];
            io.emit('alarm', {alarm: false, items: []});
          }
          disableSecurity = data.check;
          logger.debug("ClearWatchList: ", disableSecurity);
        });

        socket.emit('User',{user: user});
        itemData = _.filter(totalData,function(item){ return item.type == 1;} );
        // logger.debug("itemData",itemData);
        socket.emit('SearchData',{searchData: itemData});

        socket.on('collectNavItem',function(data){
          logger.debug(_.findIndex(navItem,{uuid:data.uuid}),data.uuid);

          navItem.push(data);
          logger.debug(navItem,data);
        });

        socket.on('cancleNavigate', function(data){
          navItem = _.reject(navItem,{uuid: data.uuid});
        })

      }
    });

    socket.on('updateItem', function(data){
      logger.debug(data);
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
        checkNavigate();
        io.emit('User',{user: user});
        // io.emit('SearchData',{searchData: totalData});

    }
    else{
        var indexOfItem = _.findIndex(totalData, function(item){
                                return item.uuid == data.uuid;
                            });
        // logger.debug(totalData+indexOfItem);
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

var diffSessionData = [];

dbSocket.on('SessionExpire',function(data){

  // logger.debug("SessionExpire",data);
  if(data.length > 0 && disableSecurity){

    // if(diffSessionData.length > 0){
    //   var diff = _.difference(data,diffSessionData);
    //   diff.forEach(function(element, index, array){
    //     if(_.findIndex(watchList,{uuid:element.uuid}) >= 0){
    //       watchList = _.reject(watchList,{uuid:element.uuid});
    //     }
    //   })
    //   diffSessionData = [];
    // }


    data.forEach(function(element, index, array){
      if(element.type != 0 && element.uuid != undefined){
        var id = _.findIndex(watchList,{uuid:element.uuid});
        if(id < 0 &&  element.security == 'Yes'){
          watchList.push(element);
          // diffSessionData.push(element);
          if(user){
            adminAble(user.admin);
          }
        }
        // logger.debug("current",watchList);
      }
    });



  }


});

var checkSecurity = function(watchItem, curItem){
  var indexOfWatch = _.findIndex(watchList, function(item){ return item.uuid == watchItem.uuid;});

  if(indexOfWatch < 0){
    if(watchItem.zone != curItem.zone && disableSecurity)
      watchList.push(watchItem);
  }
  else {
    logger.debug("checkSecurity",indexOfWatch , watchList[indexOfWatch].zone,curItem.zone);
    watchList = _.filter(watchList,function(item){return item.uuid != curItem.uuid; });
    logger.debug(watchList);
  }
}

var checkNavigate = function(){

    if(navItem.length > 0){
      var tmpNavItem = _.filter(navItem,function(item){return item.zone == user.zone;});

      if(tmpNavItem.length > 0){
        for(var index in tmpNavItem){
          logger.debug('arriveNavItem',navItem);
          io.emit('arriveNavItem',tmpNavItem[index]);
          navItem = _.reject(navItem,{uuid: tmpNavItem[index].uuid});
        }
      }
    }
}


var dynamicItem;

var adminAble = function(admin){
    // logger.debug(admin);

    if(admin){
      dynamicItem = _.filter(totalData,function(item){return item.type == 0;});
      logger.debug('dynamic',dynamicItem);
      io.emit('NumberPeople',{people: dynamicItem });
      if(!securityInterval)
       securityInterval = setInterval(function(){
          // logger.debug(watchList.length);
          if(watchList.length < 1){
            // io.emit('alarm', {alarm: false, items: []});
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
      // io.emit('alarm', {alarm: false, items: []});
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
