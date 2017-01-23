var gulp = require('gulp');
var ts = require('gulp-typescript');
var babel = require('gulp-babel');
//var rename = require('gulp-rename');
var webpack = require('gulp-webpack');
var fs = require('fs');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var cssnano = require('gulp-cssnano');

gulp.task('js', js);
gulp.task('webpack', webpack);
gulp.task('css', css);

function js() {
    // Using my existing tsconfig.json file
    var tsProject = ts.createProject(__dirname + "/tsconfig.json");

    // The `base` part is needed so
    //  that `dest()` doesnt map folders correctly after rename
    return tsProject.src()
        .pipe(tsProject())
        //.pipe(babel())
        // .pipe(rename(function (path) {
        //     path.extname = ".js";
        // }))
        .pipe(gulp.dest("dist/"));
}

function webpack(){
    var conf = {
        output:{
            filename: "bundle.js"
        },
        module:{
            loaders: [
            { 
                test: /\.js$/, 
                loader: 'babel-loader',
                query: {
                    presets:['react','es2015'],
                    plugins: ['./babelRelayPlugin'].map(require.resolve)
                }
            }
            ]
        }

    };

    return gulp.src('dist/frontend/app.js')
        .pipe(webpack(conf, null, function(err, stats){
            //upload the generated file to http://webpack.github.io/analyse/
            fs.writeFile('dist/webpack-stats.json', stats, function(err){
                if(err) console.log('Error writing webpack stats',err);
            })
        }))
        .pipe(gulp.dest('dist/public/'));
}

var dist = {
    css: {
        folder: './dist/frontend/css/',
        mobileFile: 'style-mobile.css',
        tabletFile: 'style-tablet.css',
        pcFile: 'style-pc.css',
    }
};

function css() {
    var folder = dist.css.folder,
        file = dist.css.mobileFile;
    console.log("dist: " + folder + file);
    gulp.src(["./src/frontend/scss/**/*.scss"])
        .pipe(concat(file))
        .pipe(sass().on("error", sass.logError))
        .pipe(cssnano())
        .pipe(gulp.dest(folder));
}
