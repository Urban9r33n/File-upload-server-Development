//접수번호 - (날짜-01 ++)
var mongoose = require('mongoose');  //몽구스 사용

var daily_counterSchema = mongoose.Schema({
  name: { //어떤 종류의 카운터인지 ex)post(게시글)
    type: String,
    required: true
  },
  count: { //조회수 숫자
    type: Number,
    default: 0
  },
  today: { //오늘 날짜
    type: String,
  },
  temp: { //임시 저장
    type: String,
    default:"20220114"
  },
});


//model and export
var Daily_Counter = mongoose.model('daily_counter', daily_counterSchema);
module.exports = Daily_Counter;
