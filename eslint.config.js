// eslint.config.js
import { defineConfig, globalIgnores } from "eslint/config";
import a11y from "eslint-plugin-jsx-a11y";
import astro from "eslint-plugin-astro";
import astroParser from "astro-eslint-parser";
import jsdoc from "eslint-plugin-jsdoc";
// SPEC §8 ships the unified `typescript-eslint` meta-package (not the individual
// `@typescript-eslint/eslint-plugin` + `/parser`, which are transitive and not
// root-resolvable under pnpm). The meta-package re-exports `.plugin` and `.parser`
// identically. [SUBSTITUTION recorded by Group A scaffold — behaviour-preserving.]
import tseslint from "typescript-eslint";

const ts = tseslint.plugin;
const tsParser = tseslint.parser;

// `_static/**` is the original hand-coded HTML/CSS/JS prototype (built live from the
// Figma design on YouTube) kept as a historical reference snapshot — it is NOT authored
// Astro source, so linting it (e.g. its deliberate `console.info` boot log) is noise.
const ignoreArray = [".astro/**", "dist/**", "node_modules/**", "coverage/**", "parity/tools/**", "parity/baseline/**", "livesite/**", "tmp/**", "public/**", ".wrangler/**", "_static/**"];

export default defineConfig([
	globalIgnores(ignoreArray),
	// ── JavaScript files ────────────────────────────────────────────────────
	{
		files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaFeatures: { modules: true },
				ecmaVersion: "latest",
			},
		},
		plugins: { "@typescript-eslint": ts, ts, jsdoc },
		rules: {
			...ts.configs["eslint-recommended"].rules,
			...ts.configs["recommended"].rules,
			"indent": ["error", "tab", { SwitchCase: 1 }],
			"linebreak-style": ["error", "unix"],
			"brace-style": ["error", "1tbs", { allowSingleLine: true }],
			"sort-imports": "warn",
			"key-spacing": ["error", { beforeColon: false, afterColon: true }],
			"keyword-spacing": ["error", { before: true, after: true }],
			"no-console": "warn",
			"no-duplicate-imports": "error",
			"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
			"semi": ["warn", "always"],
			"space-before-blocks": "error",
			"jsdoc/require-description": "warn",
		},
	},
	// ── TypeScript files ─────────────────────────────────────────────────────
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaFeatures: { modules: true },
				ecmaVersion: "latest",
			},
		},
		plugins: { "@typescript-eslint": ts, ts, jsdoc },
		rules: {
			...ts.configs["eslint-recommended"].rules,
			...ts.configs["recommended"].rules,
			// TypeScript flavour of the jsdoc preset: TS owns the types, so the redundant
			// `{type}` JSDoc rules (require-param-type / require-returns-type / no-undefined-types)
			// are OFF and `jsdoc/no-types` is ON. This makes ESLint agree with the TS compiler —
			// plain `flat/recommended` demanded `{type}` in JSDoc, which then tripped TS's own
			// `ts(80004) "JSDoc types may be moved to TypeScript types"` hint. The description
			// rules (require-param-description / require-returns / require-description) stay ON,
			// so JSDoc still has to be descriptive prose.
			...jsdoc.configs["flat/recommended-typescript"].rules,
			"indent": ["error", "tab", { SwitchCase: 1 }],
			"linebreak-style": ["error", "unix"],
			"brace-style": ["error", "1tbs", { allowSingleLine: true }],
			"no-console": "warn",
			"semi": ["warn", "always"],
			"jsdoc/require-description": "warn",
			"@typescript-eslint/ban-ts-comment": "warn",
		},
	},
	// ── Astro files ───────────────────────────────────────────────────────────
	{
		files: ["**/*.astro"],
		languageOptions: {
			parser: astroParser,
			parserOptions: {
				parser: tsParser,
				ecmaFeatures: { modules: true },
				ecmaVersion: "latest",
				extraFileExtensions: [".astro"],
			},
		},
		plugins: { astro, a11y, jsdoc },
		rules: {
			// Indentation inside `.astro` files is owned by Prettier (prettier-plugin-astro).
			// The core `indent` rule and Prettier disagree on multiline-tag attribute
			// continuation lines (e.g. an `<a …>` whose `>` and children wrap), producing an
			// unfixable ping-pong: `eslint --fix` wants N tabs, `prettier --write` wants N+1.
			// Prettier is the formatter of record here (the `format` gate runs `--check`), so
			// the stylistic `indent` rule is disabled for `.astro` to avoid the conflict —
			// exactly as eslint-config-prettier would. (.js/.ts still enforce `indent`.)
			"indent": "off",
			"astro/no-conflict-set-directives": "error",
			"astro/no-unused-define-vars-in-style": "error",
			"astro/no-set-html-directive": "warn",
			"astro/jsx-a11y/alt-text": "warn",
			"astro/jsx-a11y/anchor-has-content": "warn",
			"astro/jsx-a11y/anchor-is-valid": "warn",
			"astro/jsx-a11y/heading-has-content": "warn",
			"astro/jsx-a11y/html-has-lang": "warn",
			"astro/jsx-a11y/label-has-associated-control": "warn",
			"astro/jsx-a11y/no-redundant-roles": "warn",
			"astro/jsx-a11y/role-has-required-aria-props": "warn",
			"semi": ["warn", "always"],
		},
	},
	// ── Build / dev CLI scripts ─────────────────────────────────────────────────
	// Everything under scripts/ is Node tooling (the verify orchestrator, the OG-image
	// generator, the Lighthouse comparison runner). For these, stdout/stderr IS the
	// product, so `no-console` is intentionally disabled — it still fires on app code.
	{
		files: ["scripts/**/*.{js,mjs,cjs}"],
		rules: { "no-console": "off" },
	},
]);
