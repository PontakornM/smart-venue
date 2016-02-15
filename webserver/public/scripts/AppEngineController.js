
var user;
var searchData;
var playAudio;
var presentData;

App
  .factory('socket', function(socketFactory){
    var myIoSocket = socketX;

     mySocket = socketFactory({
       ioSocket: myIoSocket
     });

     return mySocket;
  })

  .controller('AppEngineController', function($scope, socket,$timeout){

    var pinLogin = "xxx1";
    $scope.searchText = "";
    socket.on('User', function(data){
      $scope.user = data.user;
    })
    socket.on('NumberPeople', function (data) {
      $scope.numberPeople = data.people.length;
      console.log( data.people);

      for(var index in data.people){
        var zone = data.people[index].zone;
        var tmp = $scope.presentData[zone];
        if(tmp == undefined){
          $scope.presentData[zone] = {};
          tmp = $scope.presentData[zone];
        }
        if(!tmp.count){
          tmp.count = 0;
        }
        tmp.count++;
      }
    })
    socket.on('SearchData', function(data){
      $scope.pureData = data.searchData;
      $scope.searchData = _.map(data.searchData,function(item){
                             return _.pick(item,"zone","name");
                            });

      $scope.presentData = _.groupBy(data.searchData,'zone');
      // console.log($scope.presentData);
      // console.log($scope.searchData);
    })

    socket.on('alarm', function(data){
      $scope.watchList = data.items;

      if(data.alarm){
          audio.loop = true;
          audio.play();
      }
      else{
          audio.pause();
          audio.loop = false;
      }

    })
    $scope.adminLogin = false;

    $scope.arriveNavItem = [];
    $scope.navItem = [];

    $scope.navigate = function(navItem){
      console.log(navItem.uuid,$scope.navItem);
      if(!navItem.uuid){
        $scope.searchText = "";
        navItem = _.find($scope.pureData,function(item){ return item.name == navItem.name;});
        // console.log(navItem);
      }else{
        $scope.cancle({});
      }
      console.log(navItem);
      if(_.findIndex($scope.navItem,{uuid:navItem.uuid}) < 0 && navItem.zone != $scope.user.zone){
        $scope.navItem.push(navItem);
        socket.emit('collectNavItem',navItem);
      }
    }

    socket.on('arriveNavItem',function(data){
      $scope.navItem = _.reject($scope.navItem,{uuid : data.uuid});
      $scope.arriveNavItem.push(data);
      $timeout(function(){
        $scope.arriveNavItem = _.reject($scope.arriveNavItem,{uuid : data.uuid});
        console.log( data.uuid,   $scope.arriveNavItem);
      },3000)

    })

    $scope.cancleNavigate = function(cancleItem){
      $scope.navItem = _.reject($scope.navItem,{uuid : cancleItem.uuid});
      socket.emit("cancleNavigate",cancleItem);
    }


    $scope.adminLoginSubmit = function(pin){
      if(pin == pinLogin)
      {
        if($scope.user){
          socket.emit('updateItem',{uuid:$scope.user.uuid, admin:true});
          $scope.adminLogin = false;
          $scope.loginStatus = null;
        }
        else{
          socket.emit('setID', {uuid: '0X001'});
        }

      }
      else{
        $scope.loginStatus = "Login Fail";
      }
    }

    $scope.dialogLogin = function(){
      $scope.adminLogin = true;
    }

    $scope.dialogLogout = function(){
      console.log($scope.user.admin);
      socket.emit('updateItem',{uuid:$scope.user.uuid, admin:false});
    }
    $scope.editing = function(selectItem){
      $scope.showItem = {};
      $scope.editItem = selectItem;
    }
    $scope.showing = function(showItem){
      $scope.showItem = showItem;
    }

    $scope.cancle = function(param){
      // console.log((typeof param) == 'boolean')
      if((typeof param) == 'boolean'){
        $scope.adminLogin = false;
        $scope.loginStatus = null;
      }
      else{
        $scope.editItem = {};
        $scope.showItem = {};
      }
    }
    socket.on("initialDisable",function(data){
      $scope.disableSecurity = data.check;
    })
    $scope.clearWatchList = function(boolean){
      socket.emit("ClearWatchList",{check:boolean});
      $scope.disableSecurity = boolean;
    }

    $scope.updateItem = function(name,description,security){
      console.log(security);

      socket.emit('updateItem',{uuid:$scope.editItem.uuid, name:name, description:description, security:security});
      $scope.editItem = null;
    }



    $scope.msg = "Hello World!";
  })
