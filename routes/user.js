//WARNING you must use JWT instead of math.rand()
const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const passportConfig = require('../config/passport');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const _ = require('lodash');

const config = require('../config/secret')
var  mailOptions, host, link, rand;
rand = Math.floor((Math.random() * 100) + 54);

/* SIGNUP ROUTE */
router.route('/signup')

  .get((req, res, next) => {
    res.render('accounts/signup', { message: req.flash('errors')});
  })

  .post((req, res, next) => {
    User.findOne({ email: req.body.email }, function(err, existingUser) {
      if (existingUser) {
        req.flash('errors',  'Account with that email address already exists.');
        return res.redirect('/signup');
      } else {
        var user = new User();
        user.name = req.body.username;
        user.email = req.body.email;
        user.photo = user.gravatar();
        user.password = req.body.password;
        user.active = false;
        
        //generate JWT
        generateJWT(req, res, user);

        
        
        user.save(function(err) {
          
          if (err) return next(err);
          //nodemailer
          

          req.flash('errors', 'please confirm email with your email address');
          //return res.redirect('/signup');
          
          if (user.active){
            req.logIn(user, function(err) {
            if (err) return next(err);
            
          })}
        });
      }
    });
  });

router.get('/verify', function (req, res, next) {
  console.log(req.protocol + "://" + req.get('host'));
  
  if ((req.protocol + "://" + req.get('host')) == ("http://localhost:3000")) {
    console.log("Domain is matched. Information is from Authentic email");
    var tokenData;
    /* jwt.verify(req.query.token, config.secret, (err, authData)=> {
      if(err) return next();

      User.findOneAndUpdate({ email: authData.userToken.email }, {$set:{ active: true }},{new: true}, function (err, user) {
        if (err) console.log('Cant update Active prop in User')
        console.log(user)
      })

      User.findOne({ email: authData.userToken.email }).then(user => {
        if(!user){
          console.log('no user found')
        }
        req.logIn(user, function (err) {
          if (err) return next(err);
          res.redirect('/');

        })
      })
      
    }) */

    JWTverify(req, res, next);
    
     /* if (req.query.token == rand) {
      console.log("email is verified"); */ 
      
      
      //res.end("<h1>Email is been Successfully verified");
      //res.redirect('/');
    }
    else {
      console.log("email is not verified");
      res.end("<h1>Bad Request</h1>");
      console.log(req.user)
    }
  }
  /* else {
    res.end("<h1>Request is from unknown source");
  } 
}*/);


/* FORGET PASSWORD */

router.post('/forgetPassword', (req, res, next)=>{
    const email = req.body.email;
    
    User.findOne({ email: email}, function(err, user){
      generateJWT(req, res, user);
    });
    
  
})

/* LOGIN ROUTE */
router.route('/login')

  .get((req, res, next) => {
    
    if (req.user) return res.redirect('/');
    res.render('accounts/login', { message: req.flash('loginMessage')});
  })

  .post(passport.authenticate('local-login', {
      successRedirect: '/', // redirect to the secure profile section
      failureRedirect: '/login', // redirect back to the signup page if there is an error
      failureFlash: true // allow flash messages
    })
  );

/* PROFILE ROUTE */
router.route('/profile')
  .get(passportConfig.isAuthenticated, (req, res, next) => {
    res.render('accounts/profile', {message: req.flash('success')});
  })
  .post((req, res, next)=>{
    User.findOne({_id: req.user._id}, function(err, user){
      if(user){
        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.about) user.about = req.body.about;
        user.save( function(err){
          req.flash('success', 'Your details have been updated.');
          res.redirect('/profile');
        });
      }
    });
  });


router.get('/profile/:id', (req, res, next)=>{
  var id = req.params.id;
  User.findOne({_id:id})
  .populate('gigs')
  .exec(function(err, user){
      
      
      res.render('accounts/profile_strange', {userStrange:user})
    
  })
});

var JWTverify = ((req, res, next)=>{
  jwt.verify(req.query.token, config.secret, (err, authData) => {
    if (err) return next();

    User.findOneAndUpdate({ email: authData.userToken.email }, { $set: { active: true } }, { new: true }, function (err, user) {
      if (err) console.log('Cant update Active prop in User')
      console.log(user)
    })

    User.findOne({ email: authData.userToken.email }).then(user => {
      if (!user) {
        console.log('no user found')
      }
      req.logIn(user, function (err) {
        if (err) return next(err);
        res.redirect('/');

      })
    })

  })
});

var generateJWT = (req, res, user)=>{
  var userToken = _.pick(user, ['id', 'email']);
  jwt.sign({ userToken }, config.secret, (err, token) => {
    user.token = token;
    var smtpTransport = nodemailer.createTransport({
      service: "Gmail",


      auth: {
        user: "mohamedbalshy2014@gmail.com",
        pass: config.gmailPass
      }

    });

    host = req.get('host');
    link = "http://localhost:3000" + "/verify?token=" + user.token;
    console.log('token is ', user.token)
    mailOptions = {

      to: user.email,
      subject: "Please confirm your Email account",
      html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
    }
    console.log(mailOptions);
    smtpTransport.sendMail(mailOptions, function (error, response) {
      if (error) {
        console.log(error);
        res.end("error");
      } else {
        console.log("Message sent: " + response.message);
        res.end("sent");
      }
    });

  });
}


router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
