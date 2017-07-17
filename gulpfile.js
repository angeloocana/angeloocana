const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const cssnano = require('gulp-cssnano');

gulp.task('css', css);

const dist = {
  css: {
    folder: './public/css/',
    mainFile: 'main.css',
    mobileFile: 'mobile.css',
    tabletFile: 'tablet.css',
    pcFile: 'pc.css',
  }
};

/**
 * Generate css for Mobile, Tablet and PC.
 * 
 * Gets all .scss files in ./src folder
 * 
 * @returns {undefined}
 */
function css() {
  const folder = dist.css.folder;
  const file = dist.css.mobileFile;

  gulp.src([
    './src/**/*.scss'
  ])
    .pipe(concat(file))
    .pipe(sass().on('error', sass.logError))
    .pipe(cssnano())
    .pipe(gulp.dest(folder));
};
