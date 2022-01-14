var mongoose = require('mongoose');
var Counter = require('./Counter');
var Daily_Counter = require('./Dailycounter');

// schema
var postSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required!']
  },
  body: {
    type: String,
    required: [true, 'Body is required!']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  numId: {
    type: Number
  },
  numId_daily: {
    type: String
  },
  attachment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'file'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  nation: {
    type: String,
    required: [true, 'Nation is required!']
  },
  enterprise: {
    type: String,
    required: [true, 'Enterprise is required!']
  },
  section: {
    type: String,
    required: [true, 'Section is required!']
  },
  code: {
    type: String,
    unique:true
  },
  sender_dept: {
    type: String,
    required: [true, 'Sender department is required!']
  },
  sender: {
    type: String,
    required: [true, 'Sender is required!']
  },
  private_check: {
    type: Boolean,
    requried: [true, 'checker is requried!']
  }
  //mailist//
});





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

    today = yyyy + mm + dd;



    //daily_counter starts ------------------------->

    daily_counter = await Daily_Counter.findOne({
      name: 'posts'
    }).exec();

    if (!daily_counter) daily_counter = await Daily_Counter.create({
      name: 'posts'
    });

    daily_counter.today = today;



    if (daily_counter.today === daily_counter.temp) {
      daily_counter.count = daily_counter.count + 1;
      daily_counter.save();
      post.numId_daily = today + "-" + daily_counter.count;
    } else {
      daily_counter.count = 1;

      post.numId_daily = today + "-" + daily_counter.count;
      daily_counter.temp = today;
      daily_counter.save();

    }
  }


  return next();
});



// model & export
var Post = mongoose.model('post', postSchema);
module.exports = Post;
