module.exports = {
	root: true,
	env: {
		node: true,
		commonjs: false,
		es2020: true,
	},
	plugins: ['prettier'],
	extends: ['eslint:recommended', 'plugin:prettier/recommended'],

	rules: {
		'prettier/prettier': 'error',
		semi: ['error', 'always'],
		allowIndentationTabs: true,
		'no-tabs': [false],
		"indent": ["error", 4],
		'no-var': ['error'],
		'no-console': ['off'],
		'no-unused-vars': ['warn'],
		'no-mixed-spaces-and-tabs': ['smart-tabs'],
		'node/no-unpublished-require': ['off'],
	},
};
