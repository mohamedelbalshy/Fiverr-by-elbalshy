$(function(){
    var socket = io();
    var paramOne = $.deparam(window.location.pathname);
    var newParam = paramOne.split('.');
    swap(newParam, 0, 1);
    var paramTwo = newParam[0] + '.' + newParam[1];

    socket.on('connect', function(){
        var params ={
            room1: paramOne,
            room2 : paramTwo
        }
        socket.emit('join PM', params, function(){
            console.log('User Joined!')
        });

        $('#sendMessage').submit(function () {
            var input = $('#message').val();
            var senderId = $('#userId').val();
            if (input === '') {
                return false;
            } else {
                socket.emit('private message', { 
                    body: input,
                    sender: senderId,
                    room: paramOne
                 });

                 $.ajax({
                     url: '/inbox/'+paramOne,
                     type: 'POST',
                     data:{
                         message: input
                     },
                     success: function(){
                         $('#message').val('');
                     }
                 })
                 
                $('#message').val('');
                return false;
            }
        });
    });

    

    socket.on('new message', function (data) {
        var userId = $('#userId').val();
        var html = '';
        if (data.senderId === userId) {
            html += '<div class ="message right">';
            html += '<span class="pic"><img src ="' + data.senderImage + '"/> </span>';
            html += '<div class ="bubble right">';
            html += '<p>' + data.message + '</p>';
            html += '</div></div>'
        } else {
            html += '<div class ="message left">';
            html += '<span class="pic"><img src ="' + data.senderImage + '"/> </span>';
            html += '<div class ="bubble left">';
            html += '<p>' + data.message + '</p>';
            html += '</div></div>'

        }

        $('.chat-msgs').append(html);
        $('#chatMsgs').scrollTop($('#chatMsgs')[0].scrollHeight);
    });

})

function swap(input, val_1, val_2){
    var temp = input[val_1];
    input[val_1] = input[val_2];
    input[val_2] = temp;
}