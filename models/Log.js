//로그인 이력 관리 스키마
var mongoose = require('mongoose'); //몽구스 사용

var logSchema = mongoose.Schema({
  username: { // 아이디
    type: String,
  },
  action: { //행위 - 어떤 행위 했는지. Ex) 로그인 시도!
    type: String
  },
  log_At: { // 시간
    type: Date,
    default: Date.now
  },
  user_IP: { // 접속자 아이피
    type: String
  }
});

// model & export
var Log = mongoose.model('log', logSchema);
module.exports = Log;
