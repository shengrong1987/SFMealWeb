module.exports = function(grunt) {

	grunt.config.set('env', {
    coverage: {
      APP_DIR_FOR_CODE_COVERAGE: '../test/coverage/instrument/api/**/'
    }
	});
  grunt.loadNpmTasks('grunt-env');
};
