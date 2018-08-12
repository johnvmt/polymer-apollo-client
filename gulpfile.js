const gulp = require('gulp');
const webpack = require('webpack-stream');
const serve = require('webpack-serve');
const fs = require('fs');

const webpackOptions = {
	output: {
		filename: 'apollo-client.min.js'
	}
};

gulp.task('build', function() {
	return gulp.src('src/apollo-client.js')
		.pipe(webpack(webpackOptions))
		.pipe(gulp.dest('dist/'));
});

gulp.task('start', ['build'], function() {

	const argv = {};

	serve({
		port: 8080,
		open: true
	}, webpackOptions).then((result) => {

	});
});