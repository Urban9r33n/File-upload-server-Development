var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({
  dest: 'uploadedFiles/'
});
var fs = require('fs');
var path = require('path');

const bcrypt = require("bcryptjs")



var Post = require('../models/Post');
var Reply = require('../models/Reply');
var User = require('../models/User');
var Comment = require('../models/Comment');
var File = require('../models/File');
var Erase = require('../models/Erase');
var Deleted = require('../models/Deleted');
var util = require('../util');


var passport = require('../config/passport');


// ---------------------------------------------------------
//auto mailer
const nodemailer = require('nodemailer');

// //test find password
// var variable = "0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z".split(",");
// var randomPassword = createRandomPassword(variable, 8); //비밀번호 랜덤 함수
// function createRandomPassword(variable, passwordLength) {
//   var randomString = "";
//   for (var j = 0; j < passwordLength; j++) randomString += variable[Math.floor(Math.random() * variable.length)];
//   return randomString
// }
//

// 본인 다음 계정
const EMAIL = "upload_team@daum.net";
const EMAIL_PW = "brownie112";


// transport 생성
let transport = nodemailer.createTransport({
  service: "Daum",
  host: "smtp.daum.net",
  port: 465,
  auth: {
    user: EMAIL,
    pass: EMAIL_PW,
  },
  tls: {
    rejectUnauthorized:false
  }
});


// ---------------------------------------------------------





// Index
router.get('/', util.isLoggedin, async function(req, res) {
  var page = Math.max(1, parseInt(req.query.page));
  var limit = Math.max(1, parseInt(req.query.limit));
  page = !isNaN(page) ? page : 1;
  limit = !isNaN(limit) ? limit : 10;

  var skip = (page - 1) * limit;
  var maxPage = 0;
  var searchQuery = await createSearchQuery(req.query);
  var posts = [];

  if (searchQuery) {
    var count = await Post.countDocuments(searchQuery);
    maxPage = Math.ceil(count / limit);
    posts = await Post.aggregate([{
        $match: searchQuery
      },

      {
        $lookup: {
          from: 'deleteds',
          localField: 'author',
          foreignField: 'origin',
          as: 'alterauthor'
        }
      },
      {
        $set: {
          'alterauthor': {
            '$first': '$alterauthor'
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $set: {
          'author': {
            '$first': '$author'
          }
        }
      },
      {
        $lookup: {
          from: 'replies',
          localField: 'reply',
          foreignField: '_id',
          as: 'reply'
        }
      },

      {
        $lookup: {
          from: 'users',
          localField: 'reply.author',
          foreignField: '_id',
          as: 'replyAuthors'
        }
      },
      {
        $lookup: {
          from: 'deleteds',
          localField: 'reply.author',
          foreignField: 'origin',
          as: 'alterreplyAuthors'
        }
      },

      // {$unwind:{path: "$reply",preserveNullAndEmptyArrays: true}},
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $lookup: {
          from: 'files',
          localField: 'attachment',
          foreignField: '_id',
          as: 'attachment'
        }
      },
      // {
      //   $unwind: {
      //     path: '$attachment',
      //     preserveNullAndEmptyArrays: true
      //   }
      // },
      {
        $project: {
          title: 1,
          author: {
            username: 1,
            name: 1,
            _id: 1
          },
          alterauthor: 1,
          author: {
            $ifNull: ['$author', '$alterauthor']
          },
          numId_daily: 1,
          numId: 1,
          nation: 1,
          enterprise: 1,
          code: 1,
          sender: 1,
          private_check: 1,
          attachment: 1,
          createdAt: 1,
          attachment: 1,
          commentCount: {
            $size: '$comments'
          },
          reply: {
            "$map": {
              "input": "$reply",
              "as": "repObj",
              "in": {
                "$mergeObjects": [
                  "$$repObj",
                  {
                    "author": {
                      "$first": {
                        "$filter": {
                          "input": "$replyAuthors",
                          "as": "repA",
                          "cond": {
                            "$eq": [
                              "$$repA._id",
                              "$$repObj.author"
                            ]
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          },

        }
      },
    ]).exec();
  }




  //author query builder

  // var i = 0;
  //
  // if(posts.author){
  //   for(i = 0; i < posts.author.length; i++) {
  //     re_username = await User.findById(objID).exec();
  //
  //     console.log(re_username);
  //     var obj = {"id": post.author[i], "username": re_username}
  //   }
  // }






  res.render('posts/index', {
    posts: posts,
    currentPage: page,
    maxPage: maxPage,
    limit: limit,
    searchType: req.query.searchType,
    searchText: req.query.searchText,
    findAuthor: findAuthor,


  });
});




function findAuthor(objID) {

  let promise;
  var re;

  promise = User.findById(objID).exec();

  promise.then((result) => {
    re = result.username;


    return re;
  });
  console.log(re);
  return re;
}





// New
router.get('/new', util.isLoggedin, function(req, res) {
  var post = req.flash('post')[0] || {};
  var errors = req.flash('errors')[0] || {};

  res.render('posts/new', {
    post: post,
    errors: errors,

  });
});


// create
router.post('/', util.isLoggedin, upload.array('attachment'), async function(req, res) {

  var attachment = new Array();

  for (var i = 0; i < req.files.length; i++) {
    attachment[i] = req.files[i] ? await File.createNewInstance(req.files[i], req.user._id) : undefined;
  }



  // 이메일 수신자
  let receiverEmail = "";

  // //전송내용
  // let mailOptions = {
  //   from: EMAIL,
  //   to: receiverEmail,
  //   subject: "[VDX-Server] 새 글 알림",
  //   html: "<h1>Binding에서 새로운 비밀번호를 알려드립니다.</h1> <h2> 비밀번호 : " + randomPassword + "</h2>",
  // };

  req.body.attachment = attachment;
  req.body.author = req.user._id;


  email_list = req.body.email_list;
  var contents = req.body;

  Post.create(req.body, function(err, post) {
    if (err) {
      req.flash('post', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/posts/new' + res.locals.getPostQueryString());
    }


    if (attachment[0] != null) {
      attachment.postId = post._id;
      attachment[0].save();
    }



    if (!email_list) {} else if (email_list.length == 1 || !Array.isArray(email_list)) {
      if (email_list[0] == '1') {
        User.find({
            'auth': {
              $in: ['2', '3']
            },
          })
          .sort({
            'team': -1
          })
          .select('email')
          .exec(function(err, users) {
            for (var j = 0; j < users.length; j++) {
              send_mail(users[j].email, contents, post.id);
            }
          });
      } else {
        User.find({
            'team': email_list,
          })
          .sort({
            'team': -1
          })
          .select('email')
          .exec(function(err, users) {

            for (var j = 0; j < users.length; j++) {
              send_mail(users[j].email, contents, post.id);
            }
          });
      }
    } else {
      if (email_list[0] == '1') {
        User.find({
            'auth': {
              $in: ['2', '3']
            },
          })
          .sort({
            'team': -1
          })
          .select('email')
          .exec(function(err, users) {
            for (var j = 0; j < users.length; j++) {
              send_mail(users[j].email, contents, post.id);
            }
          });

        for (var i = 1; i < email_list.length; i++) {
          User.find({
            'team': email_list[i],
            'auth': '1',
          }).sort({
            'team': -1
          }).select('email').exec(function(err, users) {
            for (var j = 0; j < users.length; j++) {
              send_mail(users[j].email, contents, post.id);
            }
          });
        }

      } else {
        for (var i = 0; i < email_list.length; i++) {
          User.find({
              'team': email_list[i],
              'auth': {
                $in: ['1', '2', '3']
              },
            })
            .sort({
              'team': -1
            })
            .select('email')
            .exec(function(err, users) {
              for (var j = 0; j < users.length; j++) {
                send_mail(users[j].email, contents, post.id);
              }
            });
        }
      }
    }


  });


  res.redirect('/posts' + res.locals.getPostQueryString(false, {
    page: 1,
    searchText: ''
  }));
});



var send_mail = function(receiver, contents, id) {
  receiverEmail = receiver;
  href = "192.0.2.125/posts/"+id
  let mailOptions = {
    from: 'VDX_SERVER <upload_team@daum.net>',
    to: receiverEmail,
    subject: "[VDX-Server] 새 글 알림",
    html: "<h1>새 글이 등록되었습니다</h1>" +
      "<hr>" +
      "<div>" +
      "<div><span>국가</span> : <span>" + contents.nation + "</span></div>" +
      "<div><span>고객사</span> : <span>" + contents.enterprise + "</span></div>" +
      "<div><span><a href='"+ href +"'>CODE</a></span> : <span>" + contents.code + "</span></div>" +
      "<div><span>내용구분</span> : <span>" + contents.section + "</span></div>" +
      "<div><span>보낸이</span> : <span>" + contents.sender + "</span></div>" +
      "<div><span>부서</span> : <span>" + contents.sender_dept + "</span></div>" +
      "</div>" +
      "<hr>" +
      "본문 <br>" +
      contents.body +
      "<hr>"
  }; //email

  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return "Fail";
    }
    console.log(info);
    console.log("send mail success!");
    return "Success"
  });
}



// show
router.get('/:id', util.isLoggedin, checkreadPermission, function(req, res) {
  var commentForm = req.flash('commentForm')[0] || {
    _id: null,
    form: {}
  };
  var commentError = req.flash('commentError')[0] || {
    _id: null,
    parentComment: null,
    errors: {}
  };

  Promise.all([
      Post.findOne({
        _id: req.params.id
      }).populate({
        path: 'author',
        select: ['username', 'email']
      }).populate({
        path: 'attachment',
        match: {
          isDeleted: false
        }
      }),



      Comment.find({
        post: req.params.id
      }).sort('createdAt').populate({
        path: 'author',
        select: 'username'
      })
    ])
    .then(([post, comments]) => {
      post.views++;
      post.save();
      var commentTrees = util.convertToTrees(comments, '_id', 'parentComment', 'childComments');

      res.render('posts/show', {
        post: post,
        commentTrees: commentTrees,
        commentForm: commentForm,
        commentError: commentError
      });
    })
    .catch((err) => {
      console.log("Error: - posts.js")
      console.log(err)
      return res.render('error/404');
    });
});

// edit
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res) {
  var post = req.flash('post')[0];
  var errors = req.flash('errors')[0] || {};
  if (!post) {
    Post.findOne({
        _id: req.params.id
      })
      .populate({
        path: 'attachment',
        match: {
          isDeleted: false
        }
      })
      .exec(function(err, post) {
        if (err) {
          console.log("Error: Edit Failed - posts.js");
          console.log(err);
          return res.render('error/404');
        }
        res.render('posts/edit', {
          post: post,
          errors: errors
        });
      });
  } else {
    post._id = req.params.id;
    res.render('posts/edit', {
      post: post,
      errors: errors
    });
  }
});

// update
router.put('/:id', util.isLoggedin, checkPermission, upload.array('newAttachment'), async function(req, res) {
  var post = await Post.findOne({
    _id: req.params.id
  }).populate({
    path: 'attachment',
    match: {
      isDeleted: false
    }
  });

  var attachment = new Array();



  for (var i = 0; i < req.files.length; i++) {
    if (req.files[i]) {
      attachment[i] = await File.createNewInstance(req.files[i], req.user._id, req.params.id)
    }
  }

  if (req.files.length == 0) {
    attachment = post.attachment;

  }


  req.body.attachment = attachment;


  req.body.updatedAt = Date.now();


  if (post.enterprise == '1') {
    post.enterprise = post.enterprise2;
  }
  Post.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    runValidators: true
  }, function(err, post) {
    if (err) {
      req.flash('post', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/posts/' + req.params.id + '/edit' + res.locals.getPostQueryString());
    }
    res.redirect('/posts/' + req.params.id + res.locals.getPostQueryString());
  });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, function(req, res) {
  var id = req.body.id;
  var password = req.body.password;

  Erase.findOne({
    username: "delete"
  }, function(err, usr) {
    if (!usr) {
      return res.send('<script>alert("아직 글 삭제 비밀번호가 지정되지 않았습니다."); window.location.href = "/"; </script>');
      if (err) {
        console.log("-----------------------------------------------")
        console.log(err)
        console.log("-----------------------------------------------")
        return res.render('error/404');
      }
    }
    if (usr && bcrypt.compareSync(req.body.password, usr.password)) {

      Post.findOne({
        _id: req.params.id
      }, function(err, post) {

        for (var i = 0; i < post.attachment.length; i++) {
          File.findOneAndDelete({
            _id: post.attachment[i]
          }, function(err, file) {
            if (err) {
              console.log("Error: Delete Failed - posts.js");
              console.log(err);
              res.rendirect('error/404');
            }

            var file_name = file.serverFileName
            var filePath = path.join(__dirname, '..', 'uploadedFiles', file_name);


            console.log(file_name);
            if (fs.existsSync(filePath)) {
              // 파일이 존재한다면 true 그렇지 않은 경우 false 반환
              try {
                fs.unlinkSync(filePath);
                console.log("delete");
              } catch (error) {
                console.log(error);
              }
            }
            //
            console.log("no file");
            //
          })
        }
      })






      Post.deleteOne({
        _id: req.params.id
      }, function(err) {
        if (err) {
          console.log("Error: Delete Failed - posts.js");
          console.log(err);
          return res.render('error/404');
        }
        res.redirect('/posts' + res.locals.getPostQueryString());
      });

    } else if (!bcrypt.compareSync(req.body.password, usr.password)) {
      return res.send('<script>alert("비밀번호를 확인해주세요"); window.location.href = "/"; </script>');
    }
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next) {
  Post.findOne({
    _id: req.params.id
  }, function(err, post) {
    if (!post) {
      console.log("-----------------------------------------------")
      console.log("Error: checkreadPermission - no posts - posts.js")
      console.log("-----------------------------------------------")
      return res.render('error/404');
    }
    if (err) {
      console.log("-----------------------------------------------")
      console.log(err)
      console.log("-----------------------------------------------")
      return res.render('error/404');
    }
    if ((post.author != req.user.id) && (req.user.auth != 3)) return util.noPermission(req, res);

    next();
  });
}

function checkreadPermission(req, res, next) {
  Post.findOne({
    _id: req.params.id
  }, function(err, post) {
    if (!post) {
      console.log("-----------------------------------------------")
      console.log("Error: checkreadPermission - no posts - posts.js")
      console.log("-----------------------------------------------")
      return res.render('error/404');
    }
    if (err) {
      console.log("-----------------------------------------------")
      console.log(err)
      console.log("-----------------------------------------------")
      return res.render('error/404');
    }
    if (post.private_check) {
      if (req.user.auth != 3 && req.user.auth != 2) {
        return util.noPermission(req, res);
      }
    }


    next();
  });
}



//-------------------------------------REPLY---------------------------------------

// reply
router.get('/:id/reply_new', util.isLoggedin, function(req, res) {

  var post = req.flash('post')[0];
  var reply = req.flash('reply')[0];
  var errors = req.flash('errors')[0] || {};

  if (!post) {
    Post.findOne({
        _id: req.params.id
      })
      .populate({
        path: 'attachment',
        match: {
          isDeleted: false
        }
      })
      .exec(function(err, post) {
        if (err) {
          console.log("Error: No such type of reply - posts.js");
          console.log(err);
          return res.render('error/404');
        }
        res.render('posts/reply_new', {
          post: post,
          reply: reply,
          errors: errors
        });
      });
  } else {
    post._id = req.params.id;
    res.render('posts/reply_new', {
      post: post,
      reply: reply,
      errors: errors
    });
  }
});


// re new
router.post('/:id/reply_new', util.isLoggedin, upload.array('attachment'), async function(req, res) {

  var attachment = new Array();

  for (var i = 0; i < req.files.length; i++) {
    attachment[i] = req.files[i] ? await File.createNewInstance(req.files[i], req.user._id) : undefined;
  }


  req.body.attachment = attachment;
  req.body.author = req.user._id;


  Reply.create(req.body, function(err, reply) {

    if (err) {
      req.flash('reply', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/posts/reply_show' + res.locals.getPostQueryString());
    }
    if (attachment[0] != null) {
      attachment.replyId = reply._id;
      attachment[0].save();
    }


    const title = reply;
    const titleId = title._id;



    Post.findOneAndUpdate({
        _id: req.body.post
      }, {
        $push: {
          "reply": titleId
        }
      }, {
        runValidators: true
      },
      function(err, post) {
        if (err) {
          req.flash('post', req.body);
          req.flash('errors', util.parseError(err));
          res.render('posts/reply_edit' + res.locals.getPostQueryString(), {
            post: post,
            reply: reply,
            errors: err
          });
        }

        res.render('posts/reply_show' + res.locals.getPostQueryString(), {
          post: post,
          reply: reply,
          errors: err
        });
      });

  });
});


//reply edit

router.get('/:id/reply_edit', util.isLoggedin, async function(req, res) {
  var post = req.flash('post')[0];
  var reply = req.flash('reply')[0];
  var err = req.flash('errors')[0] || {};

  reply = await Reply.findOne({
    _id: req.params.id
  }).populate({
    path: 'attachment',
    match: {
      isDeleted: false
    }
  }).exec()

  var searchQuery = {
    _id: reply.motherpost
  };


  if (!post) {
    post = await Post.aggregate([{
        $match: searchQuery
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $lookup: {
          from: 'replies',
          localField: 'reply',
          foreignField: '_id',
          as: 'reply'
        }
      },
      {
        $unwind: '$author',
      },
      // {$unwind:{path: "$reply",preserveNullAndEmptyArrays: true}},
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $lookup: {
          from: 'files',
          localField: 'attachment',
          foreignField: '_id',
          as: 'attachment'
        }
      },
      // {
      //   $unwind: {
      //     path: '$attachment',
      //     preserveNullAndEmptyArrays: true
      //   }
      // },
    ]).exec();





    res.render('posts/reply_edit', {
      post: post,
      reply: reply,
      errors: err
    });

  } else {
    post._id = reply.motherpost;
    res.render('posts/reply_edit', {
      post: post,
      reply: reply,
      errors: err
    });
  }
});



//edit
router.put('/:id/reply_edit', util.isLoggedin, upload.array('newAttachment'), async function(req, res) {
  const reply = await Reply.findOne({
    _id: req.params.id
  }).populate({
    path: 'attachment',
    match: {
      isDeleted: false
    }
  });



  req.body.author = req.user._id;
  var attachment = new Array();



  for (var i = 0; i < req.files.length; i++) {
    if (req.files[i]) {
      attachment[i] = await File.createNewInstance(req.files[i], req.user._id, req.params.id)
    }
  }

  if (req.files.length == 0) {
    attachment = reply.attachment;

  }


  req.body.attachment = attachment;


  req.body.lasteditted = Date.now();


  Reply.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    runValidators: true
  }, function(err, reply) {
    if (err) {
      req.flash('reply', req.body);
      req.flash('errors', util.parseError(err));
      res.render('posts/reply_edit' + res.locals.getPostQueryString(), {
        reply: reply,
        errors: err
      });
    }
    res.redirect('/posts/' + req.params.id + '/reply_show' + res.locals.getPostQueryString());

  });
});






// show
router.get('/:id/reply_show', util.isLoggedin, function(req, res) {


  Reply.findOne({
    _id: req.params.id
  }, function(err, reply) {
    if (err) {
      console.log("Error: No reply - posts.js");
      console.log(err);
      return res.render('error/404');
    }
    if (reply.private_check) {
      if (req.user.auth != 3 && req.user.auth != 2) {
        return util.noPermission(req, res);
      }
    }
  });

  Promise.all([
      Reply.findOne({
        _id: req.params.id
      }).populate({
        path: 'attachment',
        match: {
          isDeleted: false
        }
      }).populate({
        path: 'title',
        match: {
          isDeleted: false
        }
      })
    ])
    .then(([reply]) => {

      res.render('posts/reply_show', {
        reply: reply,
      });
    })
    .catch((err) => {

      console.log("Error: Edit Failed - posts.js");
      console.log(err);
      return res.render('error/404');

    });
});


//답글 삭제

router.post('/:id/reply_delete', util.isLoggedin, function(req, res) {

  var attachment = new Array();

  var replyid = req.params.id;
  var postid = req.body.post;



  Erase.findOne({
    username: "delete"
  }, function(err, usr) {
    if (!usr) {
      return res.send('<script>alert("아직 글 삭제 비밀번호가 지정되지 않았습니다."); window.location.href = "/"; </script>');
      if (err) {
        console.log("-----------------------------------------------")
        console.log(err)
        console.log("-----------------------------------------------")
        return res.render('error/404');
      }
    }
    if (usr && bcrypt.compareSync(req.body.password, usr.password)) {
      Reply.findById(req.params.id, function(err, reply) {
        if (err) {
          console.log("Error: reply - deelete error - posts.js");
          console.log(err);
          return res.render('error/404');
        }

        if (reply!= null) {
          for (var i = 0; i < reply.attachment.length; i++) {
            console.log(reply.attachment[i]);
            File.findByIdAndDelete(reply.attachment[i], (err, data) => {}, function(err, reply) {
              if (err) {
                console.log("Error: reply - deelete error - posts.js");
                console.log(err);
                return res.render('error/404');
              }
            });
          }
        }
      });
      Reply.findByIdAndDelete(replyid, (err, data) => {

      }, function(err, reply) {
        if (err) {
          console.log("Error: reply - deelete error - posts.js");
          console.log(err);
          return res.render('error/404');
        }
        return res.redirect('/');
      });
      res.redirect('/');

    } else if (!bcrypt.compareSync(req.body.password, usr.password)) {
      return res.send('<script>alert("비밀번호를 확인해주세요"); window.location.href = "/"; </script>');
    }
  });

});



//---------------------------------------------------------------------------------


//for searching
async function createSearchQuery(queries) {
  var searchQuery = {};
  if (queries.searchType && queries.searchText && queries.searchText.length >= 0) {
    var searchTypes = queries.searchType.toLowerCase().split(',');
    var postQueries = [];




    if (searchTypes.indexOf('title') >= 0) {
      postQueries.push({
        title: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }



    if (searchTypes.indexOf('body') >= 0) {
      postQueries.push({
        body: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }



    if (searchTypes.indexOf('author!') >= 0) {
      var user = await User.findOne({
        name: queries.searchText
      }).exec();
      if (user) postQueries.push({
        author: user._id
      });
    } else if (searchTypes.indexOf('author') >= 0) {
      var users = await User.find({
        name: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      }).exec();
      var userIds = [];
      for (var user of users) {
        userIds.push(user._id);
      }
      if (userIds.length > 0) postQueries.push({
        author: {
          $in: userIds
        }
      });
    }

    if (searchTypes.indexOf('nation') >= 0) {
      postQueries.push({
        nation: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

    if (searchTypes.indexOf('nation') >= 0) {
      postQueries.push({
        nation: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }


    if (searchTypes.indexOf('enterprise') >= 0) {
      postQueries.push({
        enterprise: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

    if (searchTypes.indexOf('section') >= 0) {
      postQueries.push({
        section: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

    if (searchTypes.indexOf('code') >= 0) {
      postQueries.push({
        code: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

    if (searchTypes.indexOf('sender_dept') >= 0) {
      postQueries.push({
        sender_dept: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

    if (searchTypes.indexOf('sender') >= 0) {
      postQueries.push({
        sender: {
          $regex: new RegExp(queries.searchText, 'i')
        }
      });
    }

    // if (searchTypes.indexOf('numId_daily') >= 0) {
    //   postQueries.push({
    //     numId_daily: {
    //       $regex: new RegExp(queries.searchText, 'i')
    //     }
    //   });
    // }
    //
    //


    if (postQueries.length > 0) searchQuery = {
      $or: postQueries
    };
    else searchQuery = null;



  }
  return searchQuery;
}
