var express = require('express'); // express 서버
var router = express.Router(); // express 라우터

var User = require('../models/User'); //유저 모델
var Log = require('../models/Log'); //로그 모델
var Erase = require('../models/Erase'); //삭제 비밀번호 모델
var Deleted = require('../models/Deleted'); //삭제 비밀번호 모델

var util = require('../util'); //유틸리티

var passport = require('../config/passport'); //패스포트 - 로그인


//회원정보 페이지
router.get('/', util.isLoggedin, checkADPermission, async function(req, res) {
  var page = Math.max(1, parseInt(req.query.page));
  var limit = Math.max(1, parseInt(req.query.limit));

  page = !isNaN(page) ? page : 1;
  limit = !isNaN(limit) ? limit : 10;

  var skip = (page - 1) * limit;
  var maxPage = 0;
  var searchQuery = await createSearchQuery(req.query);

  var users = [];


  if (searchQuery) {
    var count = await User.countDocuments(searchQuery);
    maxPage = Math.ceil(count / limit);

    users = await User.find(searchQuery)
      .populate('_id')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .exec();
  }


  res.render('admin/main', {
    users: users,
    currentPage: page,
    maxPage: maxPage,
    limit: limit,
    searchType: req.query.searchType,
    searchText: req.query.searchText

  });
});


//검색 함수
async function createSearchQuery(queries) {
  var searchQuery = {};
  if (queries.searchType && queries.searchText && queries.searchText.length >= 0) {
    var searchTypes = queries.searchType.toLowerCase().split(',');
    var userQueries = [];

//부서로 검색
    if (searchTypes.indexOf('team') >= 0) {
      userQueries.push({
        team: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

//아이디로 검색
    if (searchTypes.indexOf('username') >= 0) {
      userQueries.push({
        username: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

//이름으로 검색
    if (searchTypes.indexOf('name') >= 0) {
      userQueries.push({
        name: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

//이메일로 검색
    if (searchTypes.indexOf('email') >= 0) {
      userQueries.push({
        email: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

//보안등급으로 검색
    if (searchTypes.indexOf('auth') >= 0) {
      userQueries.push({
        auth: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

    if (userQueries.length > 0) searchQuery = {
      $or: userQueries
    };
    else searchQuery = null;

  }
  return searchQuery;
}


//history(로그)
router.get('/history', util.isLoggedin, checkADPermission, async function(req, res) {
  var page = Math.max(1, parseInt(req.query.page));
  var limit = Math.max(1, parseInt(req.query.limit));

  page = !isNaN(page) ? page : 1;
  limit = !isNaN(limit) ? limit : 10;

  var skip = (page - 1) * limit;
  var maxPage = 0;
  var searchQuery = await createSearchQuery(req.query);

  var logs = [];


  if (searchQuery) {
    var count = await Log.countDocuments(searchQuery);
    maxPage = Math.ceil(count / limit);

    logs = await Log.find(searchQuery)
      .populate('_id')
      .sort('-log_At')
      .skip(skip)
      .limit(limit)
      .exec();
  }


  res.render('admin/history', {
    logs: logs,
    currentPage: page,
    maxPage: maxPage,
    limit: limit,
    searchType: req.query.searchType,
    searchText: req.query.searchText

  });
});



// async function createSearchQuery(queries) {
//   var searchQuery = {};
//   if (queries.searchType && queries.searchText && queries.searchText.length >= 0) {
//     var searchTypes = queries.searchType.toLowerCase().split(',');
//     var logQueries = [];
//
//
//     if (searchTypes.indexOf('username') >= 0) {
//       logQueries.push({
//         team: {
//           $regex: new RegExp(queries.searchText, 'i')
//         }
//       });
//     }
//
//     if (searchTypes.indexOf('action') >= 0) {
//       logQueries.push({
//         logname: {
//           $regex: new RegExp(queries.searchText, 'i')
//         }
//       });
//     }
//
//     if (searchTypes.indexOf('log_IP') >= 0) {
//       logQueries.push({
//         name: {
//           $regex: new RegExp(queries.searchText, 'i')
//         }
//       });
//     }
//
//     if (searchTypes.indexOf('log_At') >= 0) {
//       logQueries.push({
//         email: {
//           $regex: new RegExp(queries.searchText, 'i')
//         }
//       });
//     }
//
//
//     if (logQueries.length > 0) searchQuery = {
//       $or: logQueries
//     };
//     else searchQuery = null;
//
//   }
//   return searchQuery;
// }




//edit
router.get('/:username', util.isLoggedin, checkADPermission, function(req, res) {
  var user = req.flash('user')[0];
  var errors = req.flash('errors')[0] || {};
  if (!user) {
    User.findOne({
      username: req.params.username
    }, function(err, user) {
      if (err) {
        console.log("===Error: edit-error admin.js===");
        console.log(err);
        return res.render('error/404');
      }
      if (!user) {
        console.log("===Error: edit-error admin.js===");
        console.log(err);
        return res.render('error/404');
      }
      res.render('admin/edit', {
        username: req.params.username,
        user: user,
        errors: errors
      });
    });
  } else {
    res.render('admin/edit', {
      username: req.params.username,
      user: user,
      errors: errors
    });
  }
});

// update - 회원정보 수정
router.put('/:username', util.isLoggedin, checkADPermission, function(req, res, next) {
//유저 찾아서 변경
  User.findOne({
      username: req.params.username //아이디로 유저 검색
    })
    .select('password') //비밀번호 선택
    .exec(function(err, user) { //에러
      if (err) {
        console.log("===Error: update-error admin.js===");
        console.log(err);
        return res.render('error/404');
      }

      if (req.body.currentPassword_post && req.body.newPassword_post) {
        Erase.findOne({
            id: 'delete'
          })
          .select('password')
          .exec(function(err, erase) {
            if (err) {
              console.log("===Error: update-error admin.js===");
              console.log(err);
              return res.render('error/404');
            }

            if (!erase) {
              Erase.create({
                id: 'delete'
              })
            } else {

              erase.originalPassword = erase.password != null ? erase.password : bcrypt.hashSync('0000');
              erase.password = req.body.newPassword_post ? req.body.newPassword_post : erase.password;
              erase.currentPassword = req.body.currentPassword_post ? req.body.currentPassword_post : erase.currentPassword;

              erase.save(function(err, erase) {
                if (err) {
                  req.flash('erase', req.body);
                  req.flash('errors', util.parseError(err));
                  console.log(err)
                }
              })
            }
          });
      }
      // update user object
      user.originalPassword = user.password;
      user.password = req.body.newPassword ? req.body.newPassword : user.password;
      for (var p in req.body) {
        user[p] = req.body[p];
      }

      // save updated user
      user.save(function(err, user) {
        if (err) {
          req.flash('user', req.body);
          req.flash('errors', util.parseError(err));
          console.log(err)
          return res.redirect('error/404');
        }
        res.redirect('/administrator_page/' + user.username);
      });
    });
});



//유저 삭제
router.put('/delete/:username', util.isLoggedin, checkADPermission, function(req, res, next) {
//유저 검색
  User.findOne({
    username: req.params.username
  }).exec(function(err, user) {
    if (err) {
      console.log("===Error: update-error admin.js===");
      console.log(err);
    }

//삭제된 유저 항목에 저장
    Deleted.create({
      origin: user._id,
      name: user.name
    });
  });


//원래 있던 유저 정보 모두 삭제
  User.deleteOne({
    username: req.params.username
  }).exec(function(err, user) {
    if (err) {
      console.log("===Error: update-error admin.js===");
      console.log(err);
      return res.render('error/404');
    }

  });

  res.redirect('/administrator_page/');

});


// router.put('/:username', util.isLoggedin, checkADPermission, function(req, res, next){
//   User.findOne({username:req.params.username})
//     .select('username')
//     .exec(function(err, user){
//       if(err) return res.json(err);
//
//       // update user object
//       user.originalPassword = user.password;
//       user.password = req.body.newPassword? req.body.newPassword : user.password;
//       for(var p in req.body){
//         user[p] = req.body[p];
//       }
//
//       // save updated user
//       user.save(function(err, user){
//         if(err){
//           req.flash('user', req.body);
//           req.flash('errors', util.parseError(err));
//           return res.redirect('/administrator_page/'+req.params.username);
//         }
//         res.redirect('/administrator_page/'+user.username);
//       });
//   });
// });


// 권한 확인
// private functions
//req. ~~ is current user.
function checkADPermission(req, res, next) {
  User.findOne({
    username: req.params.username
  }, function(err, user) {
    if (err) {
      console.log("===Error: permission error admin.js===");
      console.log(err);
      return res.render('error/404');
    }

    if (req.user.auth != '3') return util.noPermission(req, res);

    next();
  });
}





module.exports = router;
