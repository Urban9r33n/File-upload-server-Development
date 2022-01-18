var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({
  dest: 'uploadedFiles/'
});
var Post = require('../models/Post');
var User = require('../models/User');
var Comment = require('../models/Comment');
var File = require('../models/File');
var util = require('../util');




var passport = require('../config/passport');



router.get('/', util.isLoggedin, async function(req, res) {
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



async function createSearchQuery(queries) {
  var searchQuery = {};
  if (queries.searchType && queries.searchText && queries.searchText.length >= 0) {
    var searchTypes = queries.searchType.toLowerCase().split(',');
    var userQueries = [];


    if (searchTypes.indexOf('team') >= 0) {
      userQueries.push({
        team: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

    if (searchTypes.indexOf('username') >= 0) {
      userQueries.push({
        username: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

    if (searchTypes.indexOf('name') >= 0) {
      userQueries.push({
        name: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

    if (searchTypes.indexOf('email') >= 0) {
      userQueries.push({
        email: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

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


//edit
router.get('/:username', util.isLoggedin, checkADPermission, function(req, res){
  var user = req.flash('user')[0];
  var errors = req.flash('errors')[0] || {};
  if(!user){
    User.findOne({username:req.params.username}, function(err, user){
      if(err) return res.json(err);
      res.render('admin/edit', { username:req.params.username, user:user, errors:errors });
    });
  }
  else {
    res.render('admin/edit', { username:req.params.username, user:user, errors:errors });
  }
});


// update

router.put('/:username', util.isLoggedin, checkADPermission, function(req, res, next){
  User.findOne({username:req.params.username})
    .select('password')
    .exec(function(err, user){
      if(err) return res.json(err);

      // update user object
      user.originalPassword = user.password;
      user.password = req.body.newPassword? req.body.newPassword : user.password;
      for(var p in req.body){
        user[p] = req.body[p];
      }

      // save updated user
      user.save(function(err, user){
        if(err){
          req.flash('user', req.body);
          req.flash('errors', util.parseError(err));
          return res.redirect('/administrator_page/'+req.params.username);
        }
        res.redirect('/administrator_page/'+user.username);
      });
  });
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


// private functions
//req. ~~ is current user.
function checkADPermission(req, res, next){
  User.findOne({username:req.params.username}, function(err, user){
    if(err) return res.json(err);
    if(req.user.auth != '3') return util.noPermission(req, res);

    next();
  });
}


module.exports = router;
