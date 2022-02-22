var mongoose = require('mongoose');
// schema
var deletedSchema = mongoose.Schema({
  origin: {
      type: mongoose.Schema.Types.ObjectId,
  },
  team: {
    type: String,
    default: "탈퇴한 유저입니다."
  },
  username: {
    type: String,
    default: "탈퇴한 유저입니다."
  },
  password: {
    type: String,
    default: "탈퇴한 유저입니다."
  },
  name: {
    type: String,

  },
  email: {
    type: String,
    default: "탈퇴한 유저입니다."
  },
});


// model & export
var Deleted = mongoose.model('deleted', deletedSchema);
module.exports = Deleted;
