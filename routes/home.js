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

// Home - 메인 페이지
router.get('/', function(req, res) {
  res.render('home/welcome');
});


// Login - 일반 메인 페이지로 로그인
router.get('/login', function(req, res) {
  var username = req.flash('username')[0];
  var errors = req.flash('errors')[0] || {};
  res.render('home/login', {
    post: 0,
    username: username,
    errors: errors
  });
});

// Login - 이메일 링크 클릭 또는 바로 포스트로 이동시,
// 로그인 이후 해당 포스트로 이동.
router.get('/login/:id', function(req, res) {
  var username = req.flash('username')[0];
  var errors = req.flash('errors')[0] || {};

  var post = req.params.id;

  if(post = 'undefined'){
    return res.render('home/login', {
      post: 0,
      username: username,
      errors: errors
    });
  }
  res.render('home/login/', {
    post: post,
    username: username,
    errors: errors
  });
});


// Post Login - 로그인 정보 전송
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
      errors.username = '아이디 잘못됨!';
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
      errors.password = '비밀번호를 입력하세요';
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
  passport.authenticate('local-login',  {
    failureRedirect: '/login'
  }),
  function(req, res) {

        var nextPage = '/main'

        if (req.body.post != 0) {
          var nextPage = '/posts/' + req.body.post
        }


    res.redirect(nextPage);
  }
);

// Logout - 로그아웃 정보 전송
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
