module.exports = function(grunt) {

  grunt.config.set('instrument', {
    files: 'api/**/*.js',
    options: {
      lazy: true,
      basePath: 'test/coverage/instrument/'
    }
  });

  grunt.config.set('storeCoverage', {
    options: {
      dir: 'test/coverage/reports'
    }
  });

  grunt.config.set('makeReport', {
    src: 'test/coverage/reports/**/*.json',
    options: {
      type: 'lcov',
      dir: 'test/coverage/reports',
      print: 'detail'
    }
  });
  grunt.loadNpmTasks('grunt-istanbul');
};
