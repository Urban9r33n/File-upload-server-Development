//파일 업로드 스키마

var mongoose = require('mongoose'); //몽구스 사용
var fs = require('fs'); //파일 관리도구 사용
var path = require('path'); //경로 도구 사용

// schema
var fileSchema = mongoose.Schema({
  originalFileName: { //파일 원래 이름
    type: String
  },
  serverFileName: { //서버에 저장될 파일 이름(암호화 이후)
    type: String
  },
  size: { //파일 크기
    type: Number
  },
  uploadedBy: { //업로드 한 사람 (db-id)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  postId: { //업로드 된 게시물 (db-id)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  },
  isDeleted: { //삭제 여부 - 현재 사용 안함. 이후에 이력관리 필요시 활성화 필요.
    type: Boolean,
    default: false
  },
});

// instance methods
fileSchema.methods.processDelete = function() {
  this.isDeleted = true;
  this.save();
};
fileSchema.methods.getFileStream = function() {
  var stream;
  var filePath = path.join(__dirname, '..', 'uploadedFiles', this.serverFileName); //파일저장경로
  var fileExists = fs.existsSync(filePath);
  if (fileExists) {
    stream = fs.createReadStream(filePath);
  } else {
    this.processDelete();
  }
  return stream;
};

// model & export
var File = mongoose.model('file', fileSchema);

// model methods
File.createNewInstance = async function(file, uploadedBy, postId) {
  return await File.create({
    originalFileName: file.originalname,
    serverFileName: file.filename,
    size: file.size,
    uploadedBy: uploadedBy,
    postId: postId,
  });
};

module.exports = File;
