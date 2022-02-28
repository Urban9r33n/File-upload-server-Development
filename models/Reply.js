//답글 스키마
var mongoose = require('mongoose');

// schema
var replySchema = mongoose.Schema({
  private_check: { // 대외비인지 확인용
    type: Boolean,
    requried: [true, 'checker is requried!']
  },
  title: { // 답글 제목
    type: String,
    default: "Re:",
    required: [true, '제목을 입력하세요!']
  },
  author: { //작성자
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  body: { //내용
    type: String,
    default: "답글입니다.",
    required: [true, '내용을 입력하세요!']
  },
  attachment: [{ //첨부파일
    type: mongoose.Schema.Types.ObjectId,
    ref: 'file',
  }],
  created: { //글쓴 날짜
    type: Date,
    default: Date.now
  },
  motherpost:{ //원 게시글
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  }

});


// model & export
var Reply = mongoose.model('reply', replySchema);
module.exports = Reply;
