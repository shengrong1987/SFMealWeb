module.exports = function(grunt) {

	grunt.config.set('mochaTest', {
    // test : {
		// 	options: {
		// 		reporter: 'spec'
		// 	},
		// 	src:[
		// 		'test/bootstrap.test.js',
		// 		'test/**/**/UserController.test.js',
		// 		'test/**/**/MealController.test.js',
		// 		'test/**/**/PaymentController.test.js',
		// 		'test/**/**/OrderController.test.js',
    //     'test/**/**/ReviewController.test.js',
    //     'test/**/**/EmailController.test.js'
		// 	]
		// }
    // build : {
    //  options: {
    //    reporter: 'spec'
    //  },
    //  src:['test/bootstrap.build.js','test/**/*.build.js']
    // }
    buildEmail : {
     options: {
       reporter: 'spec'
     },
     src:['test/bootstrap.build.js','test/**/EmailController.build.js']
    }
	});
	grunt.loadNpmTasks('grunt-mocha-test');
};
