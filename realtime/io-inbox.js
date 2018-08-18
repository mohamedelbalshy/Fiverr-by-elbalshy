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
                    io.in(inboxUserId).emit('incomingCaht', {
                        message: data.message, sender: user.name, senderImage: user.photo, senderId: user._id
                    });

                    var message = new Message();
                    message.owner = user._id;
                    message.content = data.message;
                    message.save(function (err) {
                        callback(err, message);
                    })
                },
                function (message, callback) {
                    //SAVE ORDER OBJECT
                    User.update({
                        _id: inboxUserId
                    }, {
                            $push: { messages: message._id }
                        }, function (err, count) {
                            console.log(count)
                        });
                },
                function(message, callback){
                    User.update({
                        _id: user._id
                    },{
                            $push: { messages: message._id }
                    }, function(err, count){
                        console.log(count)
                    })
                }
            ]);
        });




    });
}
