const User = require('../models/user');
const async = require('async');
const Message = require('../models/message');
const Order = require('../models/order');

module.exports = function(io) {

  io.on('connection', function(socket) {
    
    const user = socket.request.user;
    
    const orderId = socket.request.session.orderId;
    socket.join(orderId);
    socket.on('chatTo', (data)=>{
      async.waterfall([
        function(callback){
          io.in(orderId).emit('incomingCaht',{ 
            message: data.message, sender:user.name, senderImage: user.photo, senderId: user._id
          });
          
          var message = new Message();
          message.owner = user._id;
          message.content = data.message;
          message.save(function(err){
            callback(err, message);
          })
        },
        function(message, callback){
          //SAVE ORDER OBJECT
          Order.update({
            _id:orderId
          },{
            $push:{ messages: message._id}
          }, function(err, count){
            console.log(count)
          });
        }
      ]);
    });




  });
}

/*

const User = require('../models/user');
const async = require('async');
const Message = require('../models/message');


module.exports = function (io) {

  io.on('connection', function (socket) {

    const user = socket.request.user;

    const inboxUserId = socket.request.session.inboxUser;
    socket.join(inboxUserId);
    socket.on('chatTo', (data) => {
      async.waterfall([
        function (callback) {
          io.in(user).emit('incomingCaht', {
            message: data.message, sender: user.name, senderImage: user.photo, senderId: user._id
          });

          var message = new Message();
          message.owner = user._id;
          message.content = data.message;
          message.save(function (err) {
            console.log(inboxUserId)
          })
        },
        function (message, callback) {
          //SAVE ORDER OBJECT
          User.update({
            _id: inboxUser._id
          }, {
              $push: { messages: message._id }
            }, function (err, count) {
              console.log('Userinbox updated')
              console.log(count)
              callback(err, message)
            });
        },
        function (message, callback) {
          User.update({
            _id: user._id
          }, {
              $push: { messages: message._id }
            }, function (err, count) {
              if(err){
                console.log(err)
              }
              console.log(count)
              console.log('user updated')
            })
        }
      ]);
    });




  });
}
*/
