var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');
var Log = require('../models/Log');
var requestIp = require('request-ip');

// serialize & deserialize User
passport.serializeUser(function(req, user, done) {
  User.findOne({
       '_id': req.user.id
    })
    .select('last_IP')
    .exec(function(err, user) {
      if (err) return res.json(err);

      user.last_IP = requestIp.getClientIp(req);

      user.save(function(err, user) {
        if (err) {
          return res.redirect('/login');
        }
      });
    });


  Log.create({
    username: req.body.username,
    action: "로그인 성공!",
    user_IP: requestIp.getClientIp(req)
  }, function(err, user) {
    if (err) {
      return res.redirect('/');
    }
  });
  done(null, user.id);
});



passport.deserializeUser(function(req, id, done) {
  User.findOne({
    _id: id
  }, function(err, user) {
    done(err, user);
  });
});

// local strategy
passport.use('local-login',
  new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, username, password, done) {
      User.findOne({
          username: username
        })
        .select({
          password: 1
        })
        .exec(function(err, user) {
          if (err) {
            Log.create({
              username: req.body.username,
              action: "로그인 실패!-에러",
              user_IP: requestIp.getClientIp(req)
            }, function(err, user) {
              if (err) {
                return res.redirect('/');
              }
            });
            return done(err);
          }

          if (user && user.authenticate(password)) {



            return done(null, user);
          } else {

            Log.create({
              username: req.body.username,
              action: "로그인 실패!-아이디/비밀번호 오류",
              user_IP: requestIp.getClientIp(req)
            }, function(err, user) {
              if (err) {
                return res.redirect('/');
              }
            });

            req.flash('username', username);
            req.flash('errors', {
              login: '아이디나 비밀번호가 일치하지 않습니다.'
            });
            return done(null, false);
          }
        });
    }
  )
);

module.exports = passport;
