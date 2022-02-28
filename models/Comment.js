//댓글 스키마
var mongoose = require('mongoose'); //몽구스 사용

// schema
var commentSchema = mongoose.Schema({
  post: { //댓글이 달린 게시글 id
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post',
    required: true
  },
  author: { //작성자
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  parentComment: { //상위댓글
    type: mongoose.Schema.Types.ObjectId,
    ref: 'comment'
  },
  text: { //내용
    type: String,
    required: [true, 'text is required!']
  },
  isDeleted: { // 삭제여부
    type: Boolean
  },
  createdAt: { //작성날짜
    type: Date,
    default: Date.now
  },
  updatedAt: { //수정날짜
    type: Date
  },
}, {
  toObject: {
    virtuals: true
  }
});

//대댓글 관련 기능
commentSchema.virtual('childComments')
  .get(function() {
    return this._childComments;
  })
  .set(function(value) {
    this._childComments = value;
  });


// model & export
var Comment = mongoose.model('comment', commentSchema);
module.exports = Comment;
