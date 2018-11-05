const router = require('express').Router();
const stripe = require('stripe')('sk_test_WiUNkFq07oJJe6mcbErvFats');
const paypal = require('paypal-rest-sdk');

const Gig = require('../models/gig');
const Order = require('../models/order');

const fee = 3.15;

paypal.configure({
    'mode':'sandbox', //sandbox or live
    'client_id':'AWah0RRHzv2RPTqH9odA2yMdjRpNB5b4utduUbAU4iEp8qD8yiGN0iKKjUgGyMNv9Gu-Qswy7OMykyHF',
    'client_secret':'EEl9f_4TPIHSYWr0koREbLm9T0VHSUwkuJkFn3qRtq8vBSqF-BFlfs6t9At5xJwI57R-abG3-mAap2iS'
});

router.get('/checkout/single_package/:id', (req, res, next) => {
    Gig.findOne({ _id: req.params.id }).then(gig => {
        var totalPrice = gig.price + fee;
        req.session.gig = gig;
        req.session.price = totalPrice;
        res.render('checkout/single_package', { gig, totalPrice })
    });
});

router.get('/payment', (req, res, next) => {
    res.render('checkout/payment');
});

router.post('/payment_stripe', (req, res, next) => {
    var gig = req.session.gig;
    var price = req.session.price;
    price *= 100;
    stripe.customers.create({
        email: req.user.email
    }).then(function (customer) {
        return stripe.customers.createSource(customer.id, {
            source: req.body.stripeToken
        });
    }).then(function (source) {
        return stripe.charges.create({
            amount: price,
            currency: 'usd',
            customer: source.customer
        });
    }).then(function (charge) {
            var order = new Order();
            order.buyer = req.user._id;
            order.seller = gig.owner;
            order.gig = gig._id;
            order.save().then(function (err) {
                console.log(req.session.price, req.user._id, order._id);
                req.session.gig = null;
                req.session.price = null;
                console.log(req.session.price);
                res.redirect('/users/' + req.user._id + '/orders/' + order._id);

            }).catch(err => {
                console.log(err)
            })

        }).catch(err=>console.log(err));
    });


router.post('/payment_paypal', (req, res, next)=>{
    var gig = req.session.gig;
    var price = req.session.price;
    console.log(gig)
     const create_payment_json = {
        intent: "sale",
        payer: {
            payment_method: "paypal"
        },
        redirect_urls: {
            return_url: "http://localhost:3000/success",
            cancel_url: "http://localhost:3000/cancel"
        },
        transactions: [{
            item_list: {
                items: [{
                    name: gig.title,
                    sku: "001",
                    price: price,
                    currency: "USD",
                    quantity: 1
                }]
            },
            amount: {
                currency: "USD",
                total: price
            },
            description: gig.about
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            console.log(error)
        } else {
            for(let i =0; i<payment.links.length; i++){
                if (payment.links[i].rel === 'approval_url'){
                    res.redirect(payment.links[i].href);
                }
            }
            
        }
    });

} );

router.get('/success', (req, res, next)=>{

    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    var gig = req.session.gig;
    var price = req.session.price;

    const execute_payment_json = {
        payer_id: payerId,
        transactions: [{
            amount: {
                currency: "USD",
                total: price
            }
        }]
    };

    

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        console.log(paymentId, execute_payment_json)
        if (error) {
            console.log(error);
            
        } else {
            console.log(JSON.stringify(payment));
            res.send('Success'); 
        }
    });

    

    

});

router.get('/cancel', (req, res, next)=>{
    res.send('Cancelled')
})



router.get('/users/:userId/orders/:orderId', (req, res, next) => {
    req.session.orderId = req.params.orderId;
    Order.findOne({ _id: req.params.orderId })
        .populate('buyer')
        .populate('seller')
        .populate('gig')
        .deepPopulate('messages.owner')
        .exec(function (err, order) {
            console.log(order)
            res.render('order/order-room', {
                layout: 'chat-layout', order: order, helpers: {
                    if_equals: function (a, b, opts) {
                        if (a === b) {
                            return opts.fn(this);
                        } else {
                            return opts.inverse(this)
                        }
                    }
                }
            });
        })
});

router.get('/users/:id/manage_orders', (req, res, next) => {
    Order.find({ seller: req.user._id })
        .populate('buyer')
        .populate('seller')
        .populate('gig')
        .exec(function (err, orders) {
            res.render('order/order-seller', {
                orders: orders, helpers: {
                    if_equals: function (a, b, opts) {
                        if (a === b) {
                            return opts.fn(this);
                        } else {
                            return opts.inverse(this)
                        }
                    }
                } });
        });
});

router.get('/users/:id/orders', (req, res, next) => {
    Order.find({ buyer: req.user._id })
        .populate('buyer')
        .populate('seller')
        .populate('gig')
        .exec(function (err, orders) {
            
            res.render('order/order-buyer', {
                orders: orders, helpers: {
                    if_equals: function (a, b, opts) {
                        if (a === b) {
                            return opts.fn(this);
                        } else {
                            return opts.inverse(this)
                        }
                    }
                } });
        });
});

router.post('/delete/:id/order', (req, res, next) => {
    Order.findOneAndRemove({ seller: req.user._id, _id: req.params.id })
        .then((order) => {
            order.save(function (err) {
                if(err){
                    console.log(err);
                }
                res.redirect('/');
            })
                
            
        }).catch(err => console.log(err))
});






module.exports = router;