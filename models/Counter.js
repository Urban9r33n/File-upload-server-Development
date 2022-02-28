//글번호 스키마
var mongoose = require('mongoose');  //몽구스 사용

// schema
var counterSchema = mongoose.Schema({
  name: { //어떤 종류용 글번호 카운터인지 ex)post(게시글)
    type: String,
    required: true
  },
  count: { //몇번째 글인지
    type: Number,
    default: 0
  },
});


// model & export
var Counter = mongoose.model('counter', counterSchema);
module.exports = Counter;
