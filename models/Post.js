//게시글 스키마
var mongoose = require('mongoose');
var Counter = require('./Counter');
var Daily_Counter = require('./Dailycounter');

// schema
var postSchema = mongoose.Schema({
  title: { //제목
    type: String,
    required: [true, '제목을 입력하세요!']
  },
  body: { //내용
    type: String,
    required: [true, '내용을 입력하세요!']
  },
  author: { //작성자
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  views: { //조회수
    type: Number,
    default: 0
  },
  numId: { //글번호
    type: Number
  },
  numId_daily: { //접수번호
    type: String
  },
  attachment: [{ //첨부파일
    type: mongoose.Schema.Types.ObjectId,
    ref: 'file'
  }],
  createdAt: { //작성날짜
    type: Date,
    default: Date.now
  },
  updatedAt: { //수정 날짜
    type: Date
  },
  nation: { //국가
    type: String,
    required: [true, 'Nation is required!']
  },
  enterprise: { //업체
    type: String,
    required: [true, 'Enterprise is required!']
  },
  section: { //부서
    type: String,
    required: [true, 'Section is required!']
  },
  code: { //코드
    type: String,
    unique:true
  },
  sender_dept: { //보낸이 부서
    type: String,
    required: [true, 'Sender department is required!']
  },
  sender: { //보낸이
    type: String,
    required: [true, 'Sender is required!']
  },
  private_check: { //대외비 여부
    type: Boolean,
    requried: [true, 'checker is requried!']
  },
  reply: [{ //답글 db-id
        type: mongoose.Schema.Types.ObjectId,
    ref: 'replies'
  }],
  is_reply: { //답글 유무 - 사용 x
    type: Boolean,
    default: false
  }
});




//글쓸때마다 글번호(counter) + 1
postSchema.pre('save', async function(next) {
  var post = this;

  if (post.isNew) {
    // article counter
    counter = await Counter.findOne({
      name: 'posts'
    }).exec();

    if (!counter) counter = await Counter.create({
      name: 'posts'
    });

    counter.count++;
    counter.save();
    post.numId = counter.count;


    // comparing today and temp => new article number

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = String(yyyy + mm + dd);



    //daily_counter starts ------------------------->

    daily_counter = await Daily_Counter.findOne({
      name: 'posts'
    }).exec();

    if (!daily_counter) daily_counter = await Daily_Counter.create({
      name: 'posts'
    });

    daily_counter.today = today;

    //오늘날짜와 임시날짜가 같으면 + 1 하고 저장
    if (daily_counter.today === daily_counter.temp) {
      daily_counter.count = daily_counter.count + 1;
      daily_counter.save();
      post.numId_daily = String(today + "-" + daily_counter.count);
    } else {
      daily_counter.count = 1;

      post.numId_daily = String(today + "-" + daily_counter.count);
      daily_counter.temp = today;
      daily_counter.save();

    }
  }


  return next();
});



// model & export
var Post = mongoose.model('post', postSchema);
module.exports = Post;
