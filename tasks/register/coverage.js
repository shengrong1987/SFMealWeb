module.exports = function (grunt) {
	grunt.registerTask('coverage', [
		'clean:coverage',
		'env:coverage',
		'instrument',
		'mochaTest:unit',
		'storeCoverage',
    'makeReport'
	]);
};
