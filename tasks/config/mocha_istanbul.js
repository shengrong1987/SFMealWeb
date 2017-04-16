module.exports = function(grunt) {
  grunt.config.set('mocha_istanbul', {
    coverage: {
      src: [
        'test/bootstrap.test.js',
        'test/**/**/UserController.test.js',
        'test/**/**/JobController.test.js',
        'test/**/**/HostController.test.js',
        'test/**/**/MealController.test.js',
        'test/**/**/PaymentController.test.js',
        'test/**/**/OrderController.test.js',
        'test/**/**/ReviewController.test.js',
        'test/**/**/PocketController.test.js',
        'test/**/**/AdminController.test.js'
      ], // the folder, not the files
      options: {
        root : 'api',
        reporter : 'spec',
        coverageFolder : 'test/coverage'
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-istanbul');
};
