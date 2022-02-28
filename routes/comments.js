var express = require('express'); //Express 서버
var router = express.Router(); //라우터
var Comment = require('../models/Comment'); //댓글 모델
var Post = require('../models/Post'); // 게시글 모델

var util = require('../util'); //유틸리티

// create (댓글 생성)
router.post('/', util.isLoggedin, checkPostId, function(req, res) {
  var post = res.locals.post;

  req.body.author = req.user._id;
  req.body.post = post._id;

  Comment.create(req.body, function(err, comment) {
    if (err) {
      req.flash('commentForm', {
        _id: null,
        form: req.body
      });
      req.flash('commentError', {
        _id: null,
        parentComment: req.body.parentComment,
        errors: util.parseError(err)
      });
    }
    return res.redirect('/posts/' + post._id + res.locals.getPostQueryString());
  });
});

// update (댓글 수정)
router.put('/:id', util.isLoggedin, checkPermission, checkPostId, function(req, res) {
  var post = res.locals.post;

  req.body.updatedAt = Date.now();
  Comment.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    runValidators: true
  }, function(err, comment) {
    if (err) {
      req.flash('commentForm', {
        _id: req.params.id,
        form: req.body
      });
      req.flash('commentError', {
        _id: req.params.id,
        parentComment: req.body.parentComment,
        errors: util.parseError(err)
      });
    }
    return res.redirect('/posts/' + post._id + res.locals.getPostQueryString());
  });
});

// destroy (댓글 삭제)
router.delete('/:id', util.isLoggedin, checkPermission, checkPostId, function(req, res) {
  var post = res.locals.post;

  Comment.findOne({
    _id: req.params.id
  }, function(err, comment) {
    if (err) return res.json(err);

    // save updated comment
    comment.isDeleted = true;
    comment.save(function(err, comment) {
      if (err) return res.json(err);

      return res.redirect('/posts/' + post._id + res.locals.getPostQueryString());
    });
  });
});

module.exports = router;

// private functions
//권한 확인용 함수
function checkPermission(req, res, next) {
  Comment.findOne({
    _id: req.params.id
  }, function(err, comment) {
    if (err) return res.json(err);
    if ((comment.author != req.user.id) && (req.user.auth != 3)) return util.noPermission(req, res);

    next();
  });
}
//게시글 번호 확인용 함수
function checkPostId(req, res, next) {
  Post.findOne({
    _id: req.query.postId
  }, function(err, post) {
    if (err) return res.json(err);

    res.locals.post = post;
    next();
  });
}
