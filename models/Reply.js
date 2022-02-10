var mongoose = require('mongoose');

// schema
var replySchema = mongoose.Schema({
  private_check: {
    type: Boolean,
    requried: [true, 'checker is requried!']
  },
  title: {
    type: String,
    default: "Re:"
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  body: {
    type: String,
    default: "답글입니다."
  },
  attachment: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'file',
  }],
  created: {
    type: Date,
    default: Date.now
  },
  motherpost:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  }

});


// model & export
var Reply = mongoose.model('reply', replySchema);
module.exports = Reply;
