module.exports = function(grunt) {

	grunt.config.set('mochaTest', {
    unit : {
			options: {
				reporter: 'spec'
			},
			src:[
				'test/bootstrap.test.js',
				'test/**/**/UserController.test.js',
        'test/**/**/JobController.test.js',
        'test/**/**/HostController.test.js',
				'test/**/**/MealController.test.js',
				'test/**/**/PaymentController.test.js',
				'test/**/**/OrderController.test.js',
        'test/**/**/AdminController.test.js',
        'test/**/**/ReviewController.test.js',
        'test/**/**/PocketController.test.js'
			]
		},
    build : {
     options: {
       reporter: 'spec'
     },
     src:['test/bootstrap.build.js','test/**/MealController.build.js']
    },
    buildEmail : {
     options: {
       reporter: 'spec'
     },
     src:['test/bootstrap.build.js','test/**/EmailController.build.js']
    }
	});
	grunt.loadNpmTasks('grunt-mocha-test');
};
