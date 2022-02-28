//탈퇴유저용 스키마

var mongoose = require('mongoose'); //몽구스 사용
// schema
var deletedSchema = mongoose.Schema({
  origin: { //원래 유저 db-id
      type: mongoose.Schema.Types.ObjectId,
  },
  team: { //팀
    type: String,
    default: "탈퇴한 유저입니다."
  },
  username: { //아이디
    type: String,
    default: "탈퇴한 유저입니다."
  },
  password: { //비밀번호
    type: String,
    default: "탈퇴한 유저입니다."
  },
  name: { //이름
    type: String,

  },
  email: { //이메일
    type: String,
    default: "탈퇴한 유저입니다."
  },
});


// model & export
var Deleted = mongoose.model('deleted', deletedSchema);
module.exports = Deleted;
