var gulp = require('gulp');
var clean = require('gulp-clean');
var util = require('gulp-util');
var through2 = require('through2');

var fs = require('fs');
var path = require('path');

function mkdir(dir) {
  if(!fs.existsSync(dir)) {
    var parent = path.dirname(dir);
    mkdir(parent);
    fs.mkdirSync(dir);
  }
}

gulp.task('clean-dist', function() {
  return gulp.src('./dist/*')
    .pipe(clean());
});

function cb(file, enc, cb) {
  var target = file.path.replace(path.sep + 'src' + path.sep,  path.sep + 'dist' + path.sep);
  mkdir(path.dirname(target));
  util.log(path.relative(file.cwd, file.path), '->', path.relative(file.cwd, target));
  var content = file._contents;
  content = content.toString('utf-8');
  content = "(function(factory) {\n  if(typeof define === 'function' && (define.amd || define.cmd)) {\n    define(factory);\n  }\n  else {\n    factory(require, exports, module);\n  }\n})(function(require, exports, module) {\n  " + content.replace(/\n/g, '\n  ') + '\n});';
  fs.writeFileSync(target, content, { encoding: 'utf-8' });
  cb(null, file);
}

gulp.task('default', ['clean-dist'], function() {
  gulp.src('./src/**/*.js')
    .pipe(function() {
      return through2.obj(cb);
    }());
});

gulp.task('watch', function() {
  gulp.watch('./src/**/*.js', function() {
    var args = Array.prototype.slice.call(arguments);
    args.forEach(function(arg) {
      gulp.src(arg.path)
        .pipe(function() {
          return through2.obj(cb);
        }());
    });
  });
});