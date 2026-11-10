import astro from "eslint-plugin-astro";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{ ignores: ["dist/", ".astro/", "node_modules/", "_backup/", ".worktrees/", "public/", "playwright-report/", "test-results/", ".claude/", ".agents/"] },
	js.configs.recommended,
	...tseslint.configs.strict,
	...astro.configs.recommended,
	...astro.configs["jsx-a11y-recommended"],
	{
		rules: {
			"no-console": "warn",
			"no-var": "error",
			"prefer-const": "error",
			"no-duplicate-imports": "error",
			"sort-imports": ["warn", { ignoreDeclarationSort: true }],
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true, allowTypedFunctionExpressions: true }],
			"@typescript-eslint/consistent-type-imports": "error",
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
		},
	},
	// Node scripts and tests may print. `no-undef` is off because it does not know Node's globals; it only matters for the plain .mjs files.
	{ files: ["scripts/**", "tests/**", "*.config.*"], rules: { "no-console": "off", "no-undef": "off" } },
	{ files: ["**/*.{js,mjs,cjs}"], rules: { "@typescript-eslint/explicit-function-return-type": "off" } },
	// The page markup is kept identical to the legacy site, including these two known accessibility smells.
	{ files: ["src/pages/**", "src/components/**"], rules: { "astro/jsx-a11y/tabindex-no-positive": "off", "astro/jsx-a11y/no-redundant-roles": "off" } },
);
