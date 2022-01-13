var mongoose = require('mongoose');
var Counter = require('./Counter');

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
    type: String
  },
  sender_dept: {
    type: String,
    required: [true, 'Sender department is required!']
  },
  sender: {
    type: String,
    required: [true, 'Sender is required!']
  }
});

postSchema.pre('save', async function(next) {
  var post = this;
  if (post.isNew) {
    counter = await Counter.findOne({
      name: 'posts'
    }).exec();
    if (!counter) counter = await Counter.create({
      name: 'posts'
    });
    counter.count++;
    counter.save();
    post.numId = counter.count;
  }
  return next();
});

// model & export
var Post = mongoose.model('post', postSchema);
module.exports = Post;
