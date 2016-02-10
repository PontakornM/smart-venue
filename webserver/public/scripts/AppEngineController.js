
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

  .controller('AppEngineController', function($scope, socket){

    var pinLogin = "xxx1";

    socket.on('User', function(data){
      $scope.user = data.user;
    })
    socket.on('NumberPeople', function (data) {
      $scope.numberPeople = data.people;
    })
    socket.on('SearchData', function(data){
      $scope.searchData = _.map(data.searchData,function(item){
                             return _.pick(item,"zone","name");
                            });

      $scope.presentData = _.groupBy(data.searchData,'zone');
      console.log($scope.presentData);
      console.log($scope.searchData);
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

    $scope.updateItem = function(name,description,security){
      // console.log(security);

      socket.emit('updateItem',{uuid:$scope.editItem.uuid, name:name, description:description, security:security});
      $scope.editItem = null;
    }



    $scope.msg = "Hello World!";
  })
