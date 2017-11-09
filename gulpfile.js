const gulp = require('gulp')
const sass = require('gulp-sass')
const sourcemaps = require('gulp-sourcemaps')
const standard = require('gulp-standard')

// const runSequence = require('run-sequence')
const runSequence = require('gulp-run-sequence')

const del = require('del')

const paths = {
  public: 'public/',
  govukModules: 'govuk_modules/'
}

gulp.task('clean', () => {
  return del([paths.public, paths.govukModules])
})


// Copy govuk files

gulp.task('copy-govuk-toolkit', function() {
  return gulp.src(['node_modules/govuk_frontend_toolkit/**/*.*'])
    .pipe(gulp.dest(paths.govukModules + 'govuk_frontend_toolkit/'))
})

gulp.task('copy-govuk-template', function() {
  return gulp.src(['node_modules/govuk_template_mustache/**/*.*'])
    .pipe(gulp.dest(paths.govukModules + 'govuk_template_mustache/'))
})

gulp.task('copy-govuk-elements-sass', function() {
  return gulp.src(['node_modules/govuk-elements-sass/public/sass/**'])
    .pipe(gulp.dest(paths.govukModules + '/govuk-elements-sass/'))
})

gulp.task('copy-govuk-files', [], () => {
  gulp.run(['copy-govuk-toolkit', 'copy-govuk-template', 'copy-govuk-elements-sass'])
})


// Install the govuk files into our application

gulp.task('copy-template-assets', () => {
  gulp
    .src(paths.govukModules + '/govuk_template_mustache/assets/{images/**/*.*,javascripts/**/*.*,stylesheets/**/*.*}')
    .pipe(gulp.dest(paths.public))
})

gulp.task('copy-frontend-toolkit-assets', () => {
  gulp
    .src(paths.govukModules + '/govuk_frontend_toolkit/{images/**/*.*,javascripts/**/*.*}')
    .pipe(gulp.dest(paths.public))
})

gulp.task('copy-template-view', function() {
  gulp
    .src('node_modules/govuk_template_mustache/views/**/*.*')
    .pipe(gulp.dest('views/govuk_template_mustache'))
})

gulp.task('install-govuk-files', [], () => {
  gulp.run(['copy-template-assets', 'copy-template-view','copy-frontend-toolkit-assets'])
})

gulp.task('copy-static-assets', () => {
  //copy images and javascript to public
  gulp
    .src('src/public/{images/**/*.*,javascripts/**/*.*,stylesheets/**/*.*,data/**/*.*}')
    .pipe(gulp.dest(paths.public))
})


// Build the sass-proto
gulp.task('sass', function() {
  return gulp.src('src/assets/' + 'sass/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded',
      includePaths: [
        'govuk_modules/govuk_frontend_toolkit/stylesheets',
        'govuk_modules/govuk_template_mustache/assets/stylesheets',
        'govuk_modules/govuk-elements-sass',
        'govuk_modules/govuk-elements-sass/public/sass',
        'govuk_modules'
      ]
    }).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.public + 'stylesheets/'))
})


// Run StardardJS checks
gulp.task('standard', function() {
  return gulp.src(['src/**/*.js'])
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true,
      quiet: true
    }))
})


// Build task
// Not currently working, need to run:
// gulp clean
// gulp copy-govuk-files
// gulp install-govuk-files
// gulp copy-static-assets
// gulp sass

gulp.task('build', ['clean'], (callback) => {
  runSequence('copy-govuk-files', 'install-govuk-files', 'sass', 'copy-static-assets',callback);
})



// Default task
gulp.task('default', [], () => {
  gulp.run('build')
})
