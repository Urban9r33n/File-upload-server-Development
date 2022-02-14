var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// schema
var userSchema = mongoose.Schema({
  team: {
    type: String,
    required: [true, '부서 선택이 필요합니다!'],
    trim: true
  },
  username: {
    type: String,
    required: [true, '아이디를 입력하세요.'],
    match: [/^.{4,12}$/, '아이디는 4-12자여야 합니다.'],
    trim: true,
    unique: true
  },
  password: {
    type: String,
    required: [true, '비밀번호를 입력하세요.'],
    select: false
  },
  name: {
    type: String,
    required: [true, '이름을 입력하세요.'],
    match: [/^.{2,10}$/, '이름은 2-10자여야 합니다'],
    trim: true
  },
  email: {
    type: String,
    required: [true, '이메일을 입력하세요.'],
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, '잘못된 형식의 이메일 입니다.'],
    trim: true
  },
  auth: {
    type: String,
    trim: true,
    default: 0
  },
  last_IP: {
    type: String,
    default: "Invalid"

  }
}, {
  toObject: {
    virtuals: true
  }
});

// virtuals
userSchema.virtual('passwordConfirmation')
  .get(function() {
    return this._passwordConfirmation;
  })
  .set(function(value) {
    this._passwordConfirmation = value;
  });

userSchema.virtual('originalPassword')
  .get(function() {
    return this._originalPassword;
  })
  .set(function(value) {
    this._originalPassword = value;
  });

userSchema.virtual('currentPassword')
  .get(function() {
    return this._currentPassword;
  })
  .set(function(value) {
    this._currentPassword = value;
  });

userSchema.virtual('newPassword')
  .get(function() {
    return this._newPassword;
  })
  .set(function(value) {
    this._newPassword = value;
  });

// password validation
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
var passwordRegexErrorMessage = 'Should be minimum 8 characters of alphabet and number combination!';
userSchema.path('password').validate(function(v) {
  var user = this;

  // create user
  if (user.isNew) {
    if (!user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation is required.');
    }

    if (!passwordRegex.test(user.password)) {
      user.invalidate('password', passwordRegexErrorMessage);
    } else if (user.password !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
    }
  }





  // update user
  if (!user.isNew) {
    if (!user.currentPassword) {
      user.invalidate('currentPassword', 'Current Password is required!');
    } else if (!bcrypt.compareSync(user.currentPassword, user.originalPassword)) { //compare password here if needed
      user.invalidate('currentPassword', 'Current Password is invalid!');
    }

    if (user.newPassword && !passwordRegex.test(user.newPassword)) {
      user.invalidate("newPassword", passwordRegexErrorMessage);
    } else if (user.newPassword !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
    }
  }
});

// hash password
userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) {
    return next();
  } else {
    user.password = bcrypt.hashSync(user.password);
    return next();
  }
});

// model methods
userSchema.methods.authenticate = function(password) {
  var user = this;
  return bcrypt.compareSync(password, user.password);
};

// model & export
var User = mongoose.model('user', userSchema);
module.exports = User;
