module.exports = function (grunt) {
  grunt.registerTask('apiTest', [
    'mocha_istanbul:coverage'
  ]);
};
