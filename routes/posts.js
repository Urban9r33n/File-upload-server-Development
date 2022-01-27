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


// ---------------------------------------------------------
//auto mailer
const nodemailer = require('nodemailer');

//test find password
var variable = "0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z".split(",");
var randomPassword = createRandomPassword(variable, 8); //비밀번호 랜덤 함수
function createRandomPassword(variable, passwordLength) {
  var randomString = "";
  for (var j = 0; j < passwordLength; j++) randomString += variable[Math.floor(Math.random() * variable.length)];
  return randomString
}




// 본인 Gmail 계정
const EMAIL = "natield233@gmail.com";
const EMAIL_PW = "Tkei0999";


// transport 생성
let transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL,
    pass: EMAIL_PW,
  },
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
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $unwind: '$author'
      },
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
      {
        $unwind: {
          path: '$attachment',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          title: 1,
          author: {
            username: 1,
          },
          numId_daily: 1,
          numId: 1,
          nation: 1,
          enterprise: 1,
          code: 1,
          sender: 1,
          private_check: 1,
          attachment: {
            $cond: [{
              $and: ['$attachment', {
                $not: '$attachment.isDeleted'
              }]
            }, true, false]
          },
          createdAt: 1,
          commentCount: {
            $size: '$comments'
          }
        }
      },
    ]).exec();
  }

  res.render('posts/index', {
    posts: posts,
    currentPage: page,
    maxPage: maxPage,
    limit: limit,
    searchType: req.query.searchType,
    searchText: req.query.searchText
  });
});

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

  for (var i = 0; i < req.files.length; i++) {
    var attachment = req.files[i] ? await File.createNewInstance(req.files[i], req.user._id) : undefined;
  }



  // 이메일 수신자
  let receiverEmail = "";

  //전송내용
  let mailOptions = {
    from: EMAIL,
    to: receiverEmail,
    subject: "[VDX-Server] 새 글 알림",
    html: "<h1>Binding에서 새로운 비밀번호를 알려드립니다.</h1> <h2> 비밀번호 : " + randomPassword + "</h2>",
  };



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
    if (attachment) {
      attachment.postId = post._id;
      attachment.save();
    }

    if (!email_list) {
      res.write("<script>alert('Please select the email list!')</script>");
      res.write("<script>window.location='/posts/new" + res.locals.getPostQueryString() +"'</script>");
      return res.end();
    }

    console.log(email_list)
     if (email_list.length == 1 || !Array.isArray(email_list)) {
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
              send_mail(users[j].email, contents);
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
              send_mail(users[j].email, contents);
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
              send_mail(users[j].email, contents);
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
              send_mail(users[j].email, contents);
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
                send_mail(users[j].email, contents);
              }
            });
        }
      }
    }


    res.redirect('/posts' + res.locals.getPostQueryString(false, {
      page: 1,
      searchText: ''
    }));
  });
});



var send_mail = function(receiver, contents) {
  receiverEmail = receiver;
  mailOptions = {
    from: 'VDX_Team <inzi_VDX@inzi.co.kr>',
    to: receiverEmail,
    subject: "[VDX-Server] 새 글 알림",
    html: "<h1>새 글이 등록되었습니다</h1>" +
      "<hr>" +
      "<div>" +
      "<div><span>국가</span> : <span>" + contents.nation + "</span></div>" +
      "<div><span>고객사</span> : <span>" + contents.enterprise + "</span></div>" +
      "<div><span><a href='#'>CODE</a></span> : <span>" + contents.code + "</span></div>" +
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
      return res.json(err);
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
        if (err) return res.json(err);
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

  req.body.attachment = req.file ? await File.createNewInstance(req.file, req.user._id, req.params.id) : post.attachment;
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
  Post.deleteOne({
    _id: req.params.id
  }, function(err) {
    if (err) return res.json(err);
    res.redirect('/posts' + res.locals.getPostQueryString());
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next) {
  Post.findOne({
    _id: req.params.id
  }, function(err, post) {
    if (err) return res.json(err);
    if ((post.author != req.user.id) && (req.user.auth != 3)) return util.noPermission(req, res);

    next();
  });
}

function checkreadPermission(req, res, next) {
  Post.findOne({
    _id: req.params.id
  }, function(err, post) {
    if (err) return res.json(err);
    if (post.private_check) {
      if (req.user.auth != 3 && req.user.auth != 2) {
        return util.noPermission(req, res);
      }
    }


    next();
  });

}


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
        username: queries.searchText
      }).exec();
      if (user) postQueries.push({
        author: user._id
      });
    } else if (searchTypes.indexOf('author') >= 0) {
      var users = await User.find({
        username: {
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
