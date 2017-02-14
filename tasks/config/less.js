/**
 * Compiles LESS files into CSS.
 *
 * ---------------------------------------------------------------
 *
 * Only the `assets/styles/importer.less` is compiled.
 * This allows you to control the ordering yourself, i.e. import your
 * dependencies, mixins, variables, resets, etc. before other stylesheets)
 *
 * For usage docs see:
 * 		https://github.com/gruntjs/grunt-contrib-less
 */
module.exports = function(grunt) {

	grunt.config.set('less', {
		dev: {
      files : [
        { '.tmp/public/styles/importer.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/adjust/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/adjusting/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/cancel/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/cancelMeal/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/cancelling/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/confirm/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/guestlist/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/new/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/ready/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/reject/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/review/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/start/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/reminder/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/summary/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/licenseUpdated/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/welcome/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/congrat/style.css' : 'assets/styles/importer.less' },
        { 'views/emailTemplates/chefSelect/style.css' : 'assets/styles/importer.less' }
      ]
		}
	});

	grunt.loadNpmTasks('grunt-contrib-less');
};
