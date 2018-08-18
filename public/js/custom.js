$(function(){
    $('#forget-password').on('click', function(){
        if(!$('#email').val() ) {
            $('#checkEmail').html('Please Enter your Email');
            return false;

        }

        var data = $('#email').val();
        console.log(data)
        $.ajax({
            type: 'POST',
            url: '/forgetPassword',
            data: {
                email: data
            },
            success: function (data) {
                
                $('#checkEmail').html('Please check your Gmail');
            },
            error: function(err){
                console.log(err)
            }
        })

    });

    $('#delete_gig').on('click', function(){
        var gigId = $('#gigId').val();
        var gig_title = $('#edit_gig_title').val();
        var gig_price = $('#edit_gig_price').val();
        var gig_about = $('#edit_gig_about').val();
        var gig_category = $('#edit_gig_category').val();
        
        $.ajax({
            url: "/delete/"+gigId,
            type: 'post',
            contentType: 'application/json',
            
            data: {
                
            },
            dataType: 'json',
            success : function (data) {
                location.href = '/'
                
            },
            error: function(err){
                location.href = '/my-gigs'
            }

        })
    });


    $('#delete_order').on('click', function () {
        var orderId = $('#orderId').val();
        

        $.ajax({
            url: "/delete/" + orderId+"/order",
            type: 'post',
            contentType: 'application/json',

            data: {

            },
            dataType: 'json',
            success: function (data) {
                console.log('success')

            },
            error: function (err) {
                console.log('error')
                
            }

        })
    });



    $('#promocodeButton').on('click', function(){

        var input = $('#code').val();
        if(input === ''){
            return false;
        }else{
            $.ajax({
                type:'POST',
                url:'/promocode',
                data:{
                    promocode:input
                },
                success: function(data){
                    if(data === 0){
                        $('#promocodeResponse').html("Code does not exist");
                    }else{
                        $('#promocodeButton').html('Applied');
                        $('#promocodeButton').prop('disabled', true);
                        $('#promocodeResponse').html('Successfully Applied the code.');
                        $('#totalPrice').html(data.newPrice);
                        $('#subtract').html(data.totalPrice - data.newPrice)
                    }
                }
            })
        }


    });
    



})