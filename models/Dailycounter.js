var mongoose = require('mongoose');

var daily_counterSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  today: {
    type: String,
  },
  temp: {
    type: String,
    default:"20220114"
  },
});


var Daily_Counter = mongoose.model('daily_counter', daily_counterSchema);
module.exports = Daily_Counter;
