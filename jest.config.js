module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	moduleDirectories: ['node_modules', 'src'],
	verbose: true,
	reporters: [
		'default',
		[
			'<rootDir>/node_modules/kelonio/out/plugin/jestReporter',
			{
				keepStateAtStart: false,
				keepStateAtEnd: false,
				printReportAtEnd: true,
				extensions: [],
			},
		],
	],
	setupFilesAfterEnv: ['<rootDir>/node_modules/kelonio/out/plugin/jestReporterSetup.js'],
};
