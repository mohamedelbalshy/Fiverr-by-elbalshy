const User = require('../models/user');
const async = require('async');
const Message = require('../models/message');



module.exports = function (io) {

    io.on('connection', function (socket) {
        const user = socket.request.user;
        
        socket.on('join PM', (pm)=>{
            
            socket.join(pm.room1);
            socket.join(pm.room2);  
        });

        socket.on('private message', (message)=> {
            io.to(message.room).emit('new message', {
                message: message.body,
                senderId: message.sender,
                senderImage: user.photo
            })
        })



    });
}
