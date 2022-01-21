var express = require('express');
var router = express.Router();
var passport = require('../config/passport');
var util = require('../util');
var Log = require('../models/Log');
var requestIp = require('request-ip');

router.get('/main', util.isLoggedin, function(req, res) {
  var post = req.flash('post')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('home/main', {
    post: post,
    errors: errors
  });
});

// Home
router.get('/', function(req, res) {
  res.render('home/welcome');
});
router.get('/about', function(req, res) {
  res.render('home/about');
});

// Login
router.get('/login', function(req, res) {
  var username = req.flash('username')[0];
  var errors = req.flash('errors')[0] || {};
  res.render('home/login', {
    username: username,
    errors: errors
  });
});

// Post Login
router.post('/login',
  function(req, res, next) {
    var errors = {};
    var isValid = true;


    if (!req.body.username) {
      Log.create({

        // wrong ID log
        username: req.body.username,
        action: "로그인 실패 - 아이디 공란",
        user_IP: requestIp.getClientIp(req)
      }, function(err, user) {
        if (err) {
          return res.redirect('/');
        }
      });

      isValid = false;
      errors.username = 'Username is required!';
    }
    if (!req.body.password) {

      // wrong password log
      Log.create({
        username: req.body.username,
        action: "로그인 실패 - 비밀번호 공란",
        user_IP: requestIp.getClientIp(req)
      }, function(err, user) {
        if (err) {
          return res.redirect('/');
        }
      });

      isValid = false;
      errors.password = 'Password is required!';
    }

    if (isValid) {
      Log.create({
        username: req.body.username,
        action: "로그인 시도",
        user_IP: requestIp.getClientIp(req)
      }, function(err, user) {
        if (err) {
          return res.redirect('/');
        }
      });
      next();
    } else {
      req.flash('errors', errors);
      res.redirect('/login');
    }
  },
  passport.authenticate('local-login', {
    successRedirect: '/main' ,
    failureRedirect: '/login'
  })
);

// Logout
router.get('/logout', function(req, res) {

  Log.create({
    username: req.body.username,
    action: "로그아웃",
    user_IP: requestIp.getClientIp(req)
  }, function(err, user) {
    if (err) {
      return res.redirect('/');
    }
  });
  req.logout();
  res.redirect('/');
});





module.exports = router;
