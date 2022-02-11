var mongoose = require('mongoose');

var eraseSchema = mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  hashed_password: {
    type: String,
    required: true,
    'default': ' '
  },
  salt: {
    type: String,
    required: true
  },
});


eraseSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
    console.log('virtual password 호출됨 : ' + this.hashed_password);
  })
  .get(function() {
    return this._password
  });

// 비밀번호 암호화 메소드
eraseSchema.method('encryptPassword', function(plainText, inSalt) {
  if (inSalt) {
    return crypto.createHmac('sha1', inSalt).update(plainText).digest('hex');
  } else {
    return crypto.createHmac('sha1', this.salt).update(plainText).digest('hex');
  }
});

// salt 값 만들기 메소드
eraseSchema.method('makeSalt', function() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
});

// 인증 메소드 - 입력된 비밀번호와 비교 (true/false 리턴)
eraseSchema.method('authenticate', function(plainText, inSalt, hashed_password) {
  if (inSalt) {
    console.log('authenticate 호출됨 : %s -> %s : %s', plainText,
      this.encryptPassword(plainText, inSalt), hashed_password);
    return this.encryptPassword(plainText, inSalt) === hashed_password;
  } else {
    console.log('authenticate 호출됨 : %s -> %s : %s', plainText,
      this.encryptPassword(plainText), hashed_password);
    return this.encryptPassword(plainText) == hashed_password;
  }
});


// model & export
var Erase = mongoose.model('erase', eraseSchema);
module.exports = Erase;
