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

router.get('/', util.isLoggedin, checkAdmin, function(req, res){
  res.render('admin/main');
});


function checkAdmin(req, res, next) {
  Post.findOne({
    _id: req.params.id
  }, function(err, post) {
    if (err) return res.json(err);
    if (3 != req.user.auth) return util.noPermission(req, res);

    next();
  });
}




module.exports = router;
