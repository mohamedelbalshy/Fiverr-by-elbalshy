const router = require('express').Router();
const async = require('async');
const _ = require('lodash');

var Gig = require('../models/gig');
var User = require('../models/user');
var Promocode = require('../models/promocode');
var Message = require('../models/message');

/* const algoliasearch = require('algoliasearch');
var client = algoliasearch('62869YW5OH', '88ea6d5aa374f20956f859d0cbf6d586');
var index = client.initIndex('Gig'); */

router.get('/', (req, res, next) => {
    /* Gig.find({}).then((gigs) => {
        res.render('main/home', { gigs: gigs});
    }) */

    Gig.find({})
    .populate('owner')
    .exec(function(err, gigs){
        
        res.render('main/home', {
            gigs: gigs, loggedUser: req.user, helpers: {
                if_equals: function (a, b, opts) {
                    if (a.equals(b)) {
                        return opts.fn(this);
                    } else {
                        return opts.inverse(this)
                    }
                }
            }
        } )
    })

    

});

router.route('/search')
    .get((req, res, next)=>{
        /* if(req.query.q){
            index.search(req.query.q, function(err, content){
                res.render('main/search_results', {content:content, search_result:req.query.q});
            })
        } */ 

        /* if(req.query.q){
            
            const regex = new RegExp(req.query.q, 'i');
            Gig.find({ title:regex}, function (err, content) {
                if(err){
                    console.log(err)
                }
                console.log("GIGS")
                res.render('main/search_results', { content: content, search_result: req.query.q });
            });
        } */

        if(req.query.q){
            let query = {
                "$or": [{ "title": { "$regex": req.query.q, "$options": "i" } }, { "about": { "$regex": req.query.q, "$options": "i" } }]
            };
            let output = [];
            /* const regex = new RegExp(req.query.q, 'i');
            User.find({name:regex})
            .populate('gigs')
            .deepPopulate('gig.owner')
            .exec((err, users)=>{
                if(users && users.length && users.length > 0)
                {
                    console.log('USers', users)
                    users.forEach( user=>{
                        user.gigs.forEach(gig =>{
                            output.push(gig);
                            console.log(gig)
                            
                        })
                        
                        
                    });
                }
                
                else{
                    console.log('no users matched')
                }
                
            }) */
            
            

            Gig.find(query).then(gigs => {
               
                res.render('main/search_results', { content: gigs, search_result: req.query.q });
                
            }).catch(err => {
                console.log('error');
            });
        }
        
    })
    .post((req, res, next)=>{
        res.redirect('/search/?q='+req.body.search_input);
    }); 



router.get('/my-gigs', (req, res, next) => {
    Gig.find({ owner:req.user._id}).then((gigs) => {
        res.render('main/my-gigs', { gigs: gigs });
    })
});

router.route('/edit-gig/:id')
    .get((req, res, next) => {
        var id = req.params.id;
        Gig.findById(id).then((gig) => {
            console.log(gig)
            res.render('main/edit-gig', { gig: gig });
        })


    })
    .post((req, res, next)=>{
        
        Gig.findOne({_id:req.params.id})
        .then((gig)=>{
            if(gig){
                
                if (req.body.title) gig.title = req.body.title;
                if (req.body.price) gig.price = req.body.price;
                if (req.body.category) gig.category = req.body.category;
                if (req.body.about) gig.about = req.body.about;
                gig.save((function(err){
                    res.redirect('/my-gigs');
                }))
            }
        }).catch(err=>{
            console.log(err)
        });
    })

router.post('/delete/:id', (req, res, next)=>{
    Gig.findOneAndRemove({ owner: req.user._id, _id:req.params.id})
    .then((gig)=>{
        console.log(gig)
        gig.save(function(err){
            res.redirect('/');
        })
    }).catch(err=>console.log(err))
});    

router.route('/add-new-gig')
    .get((req, res, next) => {
        res.render('main/add-new-gig');
    })
    .post((req, res, next) => {
        async.waterfall([
            function (callback) {
                var gig = new Gig();
                gig.owner = req.user._id;
                gig.title = req.body.gig_title;
                gig.category = req.body.gig_category;
                gig.about = req.body.gig_about;
                gig.price = req.body.gig_price;
                gig.save(function (err) {
                    callback(err, gig)
                });
            },
            function (gig, callback) {
                User.update(
                    {
                        _id: req.user._id
                    },
                    {
                        $push: { gigs: gig }
                    },
                    function (err, count) {
                        res.redirect('/my-gigs')
                    }
                )
            }

        ])
    });

router.get('/service_detail/:id', (req, res, next) => {
    Gig.findOne({ _id: req.params.id })
        .populate('owner')
        .exec((err, gig) => {
            console.log(gig.title)
            res.render('main/service_detail', { gig: gig })
        })
});


router.get('/api/add-promocode', (req, res, next)=>{
    var promocode = new Promocode();
    promocode.name = "test";
    promocode.discount = 0.4;
    promocode.save(function(err){
        res.json("Successful");
    });
});

router.post('/promocode', (req, res, next)=>{
    var promocode = req.body.promocode;
    var totalPrice = req.session.price;
    Promocode.findOne({ name: promocode}, function(err, foundCode){
        if(foundCode){
            var newPrice = totalPrice * foundCode.discount;
            newPrice = totalPrice - newPrice;
            req.session.price = newPrice;
            res.json({newPrice: newPrice, totalPrice: totalPrice});
        }else{
            res.json(0);
        }
    });
});

router.get('/inbox', (req, res, next)=>{
    User.findOne({ email:req.user.email})
        .populate('messages')
        .populate('gigs')
        .exec(function(err, user){
            res.render('inbox/inbox', {messages:user.messages})
            console.log(user.messages)
        })
});

router.route('/inbox/:userId')
    .get((req, res, next)=>{
        req.session.userId = req.params.userId;
        User.findOne({_id:req.params.userId})
            .populate('messages')
            .populate('gigs')
            .exec(function(err, user){
                res.render('inbox/inbox-room', {
                    layout: 'inbox-layout', inboxUser: user, helpers: {
                        if_equals: function (a, b, opts) {
                            if (a.equals(b)) {
                                return opts.fn(this);
                            } else {
                                return opts.inverse(this)
                            }
                        }
                    }
                })
            })
    })



module.exports = router;
