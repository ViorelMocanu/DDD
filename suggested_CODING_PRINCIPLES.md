# Coding Principles for viorelmocanu.ro

This document outlines the fundamental principles that **MUST** be followed when generating or modifying code in this project. These principles should be consulted and applied before any code generation task.

## Table of Contents

1. [Code Validity](#1-code-validity)
2. [Semantic HTML, Accessibility, and Performance](#2-semantic-html-accessibility-and-performance)
3. [Security](#3-security)
4. [Design Principles](#4-design-principles)
5. [Coding Standards and Linting](#5-coding-standards-and-linting)
6. [Code Style Consistency](#6-code-style-consistency)
7. [Internationalization (i18n)](#7-internationalization-i18n)
8. [Documentation and Comments](#8-documentation-and-comments)
9. [Pull Requests and Commits](#9-pull-requests-and-commits)
10. [Validation and Quality Assurance](#10-validation-and-quality-assurance)

---

## 1. Code Validity

**Principle:** Always generate valid HTML, CSS, SCSS, JS, TS, or Astro code.

### Requirements

- **Validation Sources:** Code must be validated against official standards and documentation:
    - **HTML/CSS:** Consult [MDN Web Docs](https://developer.mozilla.org/) for HTML and CSS standards
    - **Astro:** Consult the [Astro Documentation](https://docs.astro.build/) for Astro-specific syntax and features
    - **TypeScript:** Follow TypeScript language specifications and best practices
    - **JavaScript:** Follow ECMAScript standards and MDN references

### Implementation Guidelines

- Before finalizing any code generation:
    1. Verify HTML structure against HTML5 specifications
    2. Validate CSS/SCSS against CSS specifications
    3. Check Astro component syntax against current Astro documentation
    4. Ensure TypeScript code follows strict typing rules
    5. Verify JavaScript code follows ES6+ standards

- Use validation tools when available:
    - HTML validators (W3C Markup Validation Service)
    - CSS validators
    - TypeScript compiler (`tsc`)
    - Astro's built-in type checking (`astro check`)

---

## 2. Semantic HTML, Accessibility, and Performance

**Principle:** Always make sure the generated code is semantic, follows all accessibility guidelines up to level AAA, and is optimized and performant.

### Semantic HTML

- Use appropriate HTML5 semantic elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, etc.)
- Choose HTML elements based on their meaning, not their appearance
- Use proper heading hierarchy (`<h1>` through `<h6>`)
- Use appropriate form elements with proper labels
- Ensure proper document structure and outline

### Accessibility (WCAG AAA Level)

- **Perceivable:**
    - Provide text alternatives for all non-text content
    - Ensure sufficient color contrast (minimum 7:1 for normal text, 4.5:1 for large text)
    - Use proper heading structure
    - Ensure all functionality is available from a keyboard

- **Operable:**
    - Make all functionality keyboard accessible
    - Provide users enough time to read and use content
    - Do not use content that causes seizures or physical reactions
    - Provide ways to help users navigate, find content, and determine where they are

- **Understandable:**
    - Make text readable and understandable
    - Make web pages appear and operate in predictable ways
    - Help users avoid and correct mistakes

- **Robust:**
    - Maximize compatibility with current and future user agents, including assistive technologies
    - Use proper ARIA attributes when semantic HTML is insufficient
    - Ensure proper form labels and error messages

### Performance Optimization

- **Constantly consider performance implications** when writing code
- **Constantly suggest removing performance bottlenecks** and optimizing resource usage
- Minimize HTTP requests
- Optimize images (use appropriate formats, lazy loading, responsive images)
- Minimize and optimize CSS and JavaScript
- Use efficient selectors and avoid unnecessary specificity
- Implement code splitting and lazy loading where appropriate
- Optimize critical rendering path
- Minimize render-blocking resources
- Use efficient algorithms and data structures
- Avoid unnecessary re-renders or DOM manipulations
- **Minimize unnecessary computations and memory usage**
- **Use caching** to store and reuse expensive computations
- **Implement lazy loading** for resources that are not immediately needed
- **Never exceed hosting or other 3rd party provider free resource budget**
- Keep a record of how much time unit tests, end-to-end tests and the entire CI/CD process takes and optimize where possible

### UI Guidelines (Project-Specific)

The UI for this project should follow these specific guidelines:

- **Responsive and Accessible**: Seamless experience across devices and for all users
- **Consistent Visual Language**: Colors, typography, and spacing should be consistent
- **Modern, Minimalistic, Clean**: Focus on usability and user experience
- **Language Toggle**: All pages should contain at least one language toggle between Romanian and English in the header navigation
- **Semantic HTML5**: Use semantic HTML5 elements to enhance accessibility and SEO
- **Design Aesthetic**:
    - Dark backgrounds with subtle background gradients emphasizing important sections
    - High contrast, accessible text (for readability)
    - Fibonacci-derived typographic scale for font sizes in headings, paragraphs, labels and utility texts
    - Bright colors for main calls to action to highlight them clearly and draw attention
    - At most one major call to action on each "screen" the user sees when scrolling, ideally
    - Microinteractions and small animations when interacting with important elements
    - Mark affordances more clearly and progressively enhance the user experience
    - Only for users that have no accessibility limitations (respects motion preferences)

---

## 3. Security

**Principle:** Take security into account and develop secure code whenever developing features or infrastructure that can be hacked or attacked.

### Security and Privacy Considerations

- **Input Validation:**
    - Always validate and sanitize user input
    - Use parameterized queries/prepared statements for database operations
    - Implement proper CSRF protection
    - Validate file uploads (type, size, content)

- **Output Encoding:**
    - Escape user-generated content to prevent XSS attacks
    - Use Content Security Policy (CSP) headers
    - Implement proper encoding for different contexts (HTML, JavaScript, CSS, URLs)

- **Authentication and Authorization:**
    - Implement secure authentication mechanisms
    - Use secure session management
    - Implement proper access controls
    - Never expose sensitive information in client-side code

- **Data Protection:**
    - Encrypt sensitive data in transit (HTTPS) and at rest
    - Implement proper password hashing (bcrypt, Argon2, etc.)
    - Follow principle of least privilege
    - Implement proper error handling that doesn't leak sensitive information

- **Dependencies:**
    - Keep dependencies up to date
    - Regularly audit dependencies for known vulnerabilities
    - Use only trusted and maintained packages

- **General Security Practices:**
    - Follow OWASP Top 10 guidelines
    - Implement secure headers (HSTS, X-Frame-Options, etc.)
    - Regular security audits and penetration testing
    - Implement proper logging and monitoring

- **Privacy & Compliance:**
    - Never commit secrets or unredacted logs
    - Follow data-protection requirements when applicable (e.g., GDPR/CCPA)
    - Remediate security/compliance issues promptly
    - Ensure data privacy and protection regulations are followed

---

## 4. Design Principles

**Principle:** Follow the core design philosophy that guides this project's development.

### Core Design Principles

These principles are fundamental to how this project is built:

- **SSG-First Architecture**: The site must be Static Site Generation (SSG)-first. Use server islands and SSR only when absolutely necessary and no other elegant static solution exists.
    - **Default to SSG**: All pages should be statically generated at build time unless there's a compelling reason for SSR
    - **Server Islands**: Use Astro server islands only when dynamic server-side functionality is absolutely necessary (e.g., contact forms, search with server-side processing, user-specific content that cannot be pre-rendered)
    - **SSR Only When Necessary**: Use SSR only when no elegant static solution exists. Before using SSR, consider:
        - Can this be pre-rendered at build time?
        - Can this be handled client-side with progressive enhancement?
        - Is this truly user-specific and cannot be static?
        - Would a server island be more appropriate than full SSR?
    - **Error Handling**: Use appropriate error tracking based on context:
        - **Build-time errors** (SSG): Use `safePostHogCaptureExceptionServer()` from `@lib/posthog`
        - **Client-side errors**: Use `safePostHogCaptureException()` from `@lib/analytics`
        - **SSR errors** (when SSR is necessary): Use `safePostHogCaptureExceptionServer()` from `@lib/posthog`

- **Simplicity**: _A designer knows he has achieved perfection not when there is nothing left to add, but when there is nothing left to take away._ – Antoine de Saint-Exupéry
    - Prefer simpler code and solutions, even if they are a bit more verbose
    - Remove unnecessary complexity
    - Focus on essential features and functionality

- **Progressive Enhancement**: The basis of accessibility and the modern web is rooted in the idea that you should build a site that works for everyone, regardless of their context.
    - Build a solid foundation that works for everyone
    - Enhance with additional features for users who can take advantage of them
    - Ensure core functionality works without JavaScript when possible

- **Mobile-First**: Design for the smallest screen first, for the most constraints first, then enhance for larger screens and greater capabilities.
    - Start with mobile constraints and build up
    - This makes you think about what is essential
    - Use responsive design patterns that scale up gracefully

- **Talk to Your Users**: Understand their needs, pain points, and how they interact with your product.
    - Use feedback to iterate and improve
    - Consider user context and constraints
    - Build features that solve real problems

- **Standards**: Code quality isn't just proof you have skills. It's a way to set expectations on yourself.
    - Nurture healthy principles around semantics, accessibility, performance, maintainability and predictability
    - Follow web standards and best practices
    - Write code that others can understand and maintain

- **Unfettered Responsiveness**: The web is a fluid medium, and so should be your designs.
    - Any user should be able to access and make use of your content and features
    - No handicap related to device, browser, or network conditions
    - Go above and beyond with offline support when appropriate
    - Spend extra effort on detail-oriented testing and debugging

### Key Web Development Principles (from `.github/copilot-instructions.md`)

These principles guide technical stack and process decisions:

1. **Mobile-first, fluid, using responsive design** - Optimal experiences on all devices and screens, with no functionality cutoff
2. **Using no or minimal JavaScript** - Enhanced performance, accessibility, backwards compatibility, SEO and simplicity
3. **SSG-first architecture** - The site must be Static Site Generation (SSG)-first. Use server islands and SSR only when absolutely necessary and no other elegant static solution exists. Prefer build-time generation over runtime rendering.
4. **Static-first, with as little server use as possible** - Improved reliability, security, performance, maintainability and cost-effectiveness
5. **Progressively enhanced, offline friendly** - Better performance and usability in low-connectivity situations
6. **Accessible, usable, friendly** - For all users, regardless of their abilities or disabilities, using thoughtful, engaging language
7. **Standards compliant, semantic and built with attention to detail** - Practice what we preach and prove it can be done with no hassle
8. **Fast, performant & optimized** - SEO benefits, good user experience and conversion rates
9. **Easy to maintain, write content for, and update** - Long-term sustainability and adaptability
10. **Easy to deploy, test, host and scale** - Efficient development workflows and infrastructure management
11. **Subtly delightful** - Via animations, microinteractions, thoughtful design, attention to detail and engaging copywriting

### Performance vs. Readability

- When choosing between performance and readability, **prioritize performance** (and document with comments)
- Add code comments to explain complex logic and key features
- Use efficient algorithms and data structures
- Optimize critical paths while maintaining code clarity

---

## 5. Coding Standards and Linting

**Principle:** Use all the coding standards, linting standards, and coding suggestions found in this repository when generating code.

### Repository Standards

- **TypeScript Configuration:**
    - Follow strict TypeScript settings as defined in `tsconfig.json`
    - **No use of `any` type** - use proper types or `unknown`
    - Prefer explicit return types for all functions
    - Make everything type-safe
    - Use TypeScript's strict mode

- **Linting (ESLint):**
    - Follow all ESLint rules as defined in `eslint.config.js`
    - **Indentation**: Use **tabs** (not spaces) for TS/JS/Astro files (`indent_style = tab`, `indent_size = 4` per `.editorconfig`)
    - **Line Endings**: Use Unix line endings (LF, `\n`)
    - **Brace Style**: 1tbs (one true brace style) with `allowSingleLine: true`
    - **Semicolons**: Always use semicolons (`;`)
    - **Semicolon Style**: Last (semicolons at end of line)
    - **Semicolon Spacing**: No space before, space after
    - **Spacing**: No spaces in parentheses, space before blocks, proper keyword spacing
    - **Imports**: Sort imports (warn level)
    - **Console**: Avoid `console.*` statements (warn level)
    - **No Duplicates**: No duplicate arguments, no duplicate imports
    - **No Mixed Tabs/Spaces**: Use smart-tabs (tabs for indentation)
    - **JSDoc**: Require descriptions for JSDoc comments (warn level)
    - **Astro-Specific Rules**: Follow all Astro ESLint plugin rules
    - **Accessibility Rules**: Follow all jsx-a11y rules for Astro components

- **Formatting (Prettier):**
    - Follow Prettier rules as defined in `.prettierrc`
    - **Indentation**: Use **tabs** for TS/JS/Astro files (`indent_style = tab`, `indent_size = 4` per `.editorconfig`), **4 spaces** for Markdown
    - **Tab Width**: Tabs display as 4 spaces wide (`indent_size = 4` per `.editorconfig`)
    - **Semicolons**: Always (`true`)
    - **Quotes**: Double quotes (`false` for `singleQuote`)
    - **Quote Props**: Consistent (only quote when needed)
    - **Trailing Commas**: All (`"all"`)
    - **Bracket Spacing**: Yes (`true`)
    - **Bracket Same Line**: No (`false`)
    - **Arrow Parens**: Always (`"always"`)
    - **Line Endings**: LF (`"lf"`)
    - **Print Width**: 3000 (Prettier won't auto-wrap; manual/editor-based wrapping)
    - **Prose Wrap**: Never (`"never"`)
    - **Markdown Override**: Use spaces (not tabs), 4-space indentation
    - **Astro Override**: `singleAttributePerLine: false`
    - **Important Note on Astro Files**: There is an intentional inconsistency in formatting scripts:
        - `format` (check): Excludes `.astro` files from Prettier's format check
        - `format:fix` (write): Includes `.astro` files in Prettier formatting
        - **Reason**: Prettier and ESLint have conflicting indentation algorithms for nested code in Astro files
        - **Solution**: ESLint is the source of truth for Astro indentation (enforced in `lint`/`lint:fix`). Prettier handles other formatting (quotes, spacing, semicolons) when running `format:fix`. The `verify:fix` command runs Prettier first, then ESLint, ensuring final indentation matches ESLint rules.

- **Markdown Linting:**
    - Follow Markdownlint rules as defined in `.markdownlint.json`
    - **Header Style**: ATX style (`# Header`)
    - **Indentation**: 4 spaces (`indent_size = 4` per `.editorconfig`)
    - **Line Length**: Disabled (no enforcement)
    - **Hard Tabs**: **Not allowed** (`no-hard-tabs: true`) - tabs must be converted to 4 spaces
    - **Whitespace**: Disabled (Prettier handles formatting)
    - **HTML in Markdown**: Allowed (`MD033: false`)
    - **Note**: Prettier automatically converts tabs to spaces for `.md` and `.mdx` files (`useTabs: false` in `.prettierrc` overrides)

- **CSS/SCSS Linting (Stylelint):**
    - Follow Stylelint rules as defined in `.stylelintrc.json`
    - Extends `stylelint-config-standard-scss` (standard SCSS rules)
    - **Indentation**: Use tabs (`indent_style = tab`, `indent_size = 4` per `.editorconfig` - tabs display as 4 spaces wide)
    - **Rule Formatting**: Single-line rules except `@media` or other at-rule queries (e.g., `@keyframes`, `@supports`, `@container`)
    - **Color Hex Length**: Use short hex colors (`#fff` instead of `#ffffff`)
    - **Vendor Prefixes**: Avoid vendor prefixes on properties (except `appearance` and `text-size-adjust`)
    - **Single-Line Declarations**: Up to 20 declarations allowed on a single line
    - **At-Rule Empty Lines**: Always add empty line before `@` rules (except first-nested, inside-block, after-comment)
    - **Declaration Empty Lines**: Never add empty lines before declarations
    - **Selector Class Pattern**: Any format allowed (no enforced naming convention)
    - **Redundant Longhand Properties**: Allowed (no enforcement)
    - **Descending Specificity**: Allowed (no enforcement)
    - **SCSS Extend**: No placeholder requirement for `@extend`
    - **SCSS Comments**: No empty line requirement before double-slash comments

- **Code Style Details:**
    - **TS/JS/Astro Files**: Tab indentation (`indent_style = tab`, `indent_size = 4` per `.editorconfig`), semicolons, trailing commas, LF line endings
    - **Markdown Files**: Space indentation (`indent_style = space`, `indent_size = 4` per `.editorconfig`), no tabs, no wrap (unlimited, Prettier doesn't enforce; editor soft limit: 320 chars)
    - **HTML**: Tab indentation (`indent_style = tab`, `indent_size = 4` per `.editorconfig`), self-close void elements (consistent style across the codebase), XHTML-style closing tags
    - **CSS/SCSS**: Tab indentation (`indent_style = tab`, `indent_size = 4` per `.editorconfig` - tabs display as 4 spaces wide)
    - **CSS/SCSS Rules**: Single-line rules except `@media` or other at-rule queries (e.g., `@keyframes`, `@supports`, `@container`)
    - **CSS At-Rule Queries**: Place inside the element they address for portability and clarity

- **Code Style Best Practices:**
    - Don't use `var` - use `const` or `let`
    - Don't use `console` statements (use proper logging/error reporting)
    - Don't use `debugger` statements
    - Use `Number.isNaN()` instead of global `isNaN()`
    - Use `Number.isFinite()` instead of global `isFinite()`
    - Always use the radix argument when using `parseInt()`
    - Don't use `target="_blank"` without `rel="noopener"`
    - Use `Array.isArray()` instead of `instanceof Array`
    - Use object spread instead of `Object.assign()`
    - Don't hardcode sensitive data like API keys and tokens
    - Don't use the TypeScript directive `@ts-ignore`
    - Prevent import cycles

- **EditorConfig (`.editorconfig`)**:
    - **All files (`[*]`)**:
        - Line endings: LF (`end_of_line = lf`)
        - Charset: UTF-8 (`charset = utf-8`)
        - Insert final newline: Yes (`insert_final_newline = true`)
        - Trim trailing whitespace: Yes (`trim_trailing_whitespace = true`)
        - Indentation: Tabs (`indent_style = tab`, `indent_size = 4`)
        - Max line length: 320 characters (`max_line_length = 320` - soft guideline for editor display, not enforced by Prettier)
        - Quote type: Auto (`quote_type = auto`)
        - Continuation indent size: 4 (`continuation_indent_size = 4`)
    - **Markdown files (`[*.{md,mdx}]`)**:
        - Indentation: Spaces (`indent_style = space`, `indent_size = 4`)
        - Trim trailing whitespace: No (`trim_trailing_whitespace = false`)
    - **Code files (`[*.{ts,js,mjs,astro,scss,css,json,md,svg}]`)**:
        - Charset: UTF-8 (`charset = utf-8`)
    - **TypeScript/JavaScript/Astro/JSON (`[*.{ts,js,mjs,astro,json}]`)**:
        - Curly bracket next line: No (`curly_bracket_next_line = false`)
        - Spaces around operators: Yes (`spaces_around_operators = true`)
        - Spaces around brackets: Inside (`spaces_around_brackets = inside`)
        - Indent brace style: K&R (`indent_brace_style = K&R`)
    - **Naming Conventions**:
        - PascalCase for CSS classes and TypeScript types
        - camelCase for JavaScript variables and functions
        - Use descriptive names to improve readability

- **Project-Specific Rules:**
    - Use `pnpm` for everything, as much as possible; prefer `pnpm` over `npx`
    - Follow commit message conventions (Conventional Commits)
    - Keep commits focused and atomic
    - Keep commit messages <72 chars but insightful
    - Document changes in changelog when applicable
    - Use branches for larger features
    - Ask for confirmation before doing ANY destructive action whatsoever

### Files to Consult

#### Configuration Files

- [`tsconfig.json`](tsconfig.json) - TypeScript configuration
- [`eslint.config.js`](eslint.config.js) - ESLint rules
- [`.prettierrc`](.prettierrc) - Prettier formatting rules
- [`.markdownlint.json`](.markdownlint.json) - Markdown linting rules
- [`.stylelintrc.json`](.stylelintrc.json) - Stylelint (CSS/SCSS) rules
- [`.editorconfig`](.editorconfig) - Editor configuration
- [`package.json`](package.json) - Scripts and project configuration

#### Documentation Files

- [`README.md`](README.md) - Project principles and overview
- **`.github/copilot-instructions.md`** - Comprehensive coding instructions, web development principles, UI guidelines, and detailed best practices (see below)
- **`.cursorrules`** - Cursor-specific optimized rules and guidelines
- [`docs/guides/bilingual-i18n-navigation.md`](docs/guides/bilingual-i18n-navigation.md) - i18n implementation guide
- [`.github/pull_request_template.md`](.github/pull_request_template.md) - PR template and checklist
- [`CONTRIBUTING.md`](CONTRIBUTING.md) - Contribution guidelines

**Note**: `.github/copilot-instructions.md` contains extensive additional guidelines including:

- Key web development principles (10 principles)
- General workflow instructions
- Performance and resource usage guidelines
- **Detailed accessibility rules** - Comprehensive WCAG compliance checklist (see `.github/copilot-instructions.md` section "Accessibility (a11y)")
- **Code complexity and quality standards** - Extensive rules for code quality, correctness, and safety
- **TypeScript best practices** - Detailed TypeScript-specific guidelines
- **React and JSX best practices** - Component patterns and best practices
- **Style and consistency rules** - Comprehensive style guidelines
- **Testing best practices** - Unit and end-to-end testing guidelines
- UI/UX design guidelines specific to this project
- Security, compliance, and privacy requirements

**Important**: For complete details on accessibility rules, code complexity standards, TypeScript/React best practices, and testing guidelines, refer to the comprehensive sections in [`.github/copilot-instructions.md`](.github/copilot-instructions.md). This document (`CODING_PRINCIPLES.md`) provides the essential principles, while `.github/copilot-instructions.md` contains the detailed implementation rules.

**Cross-References**:

- See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for GitHub Copilot-optimized instructions
- See [`.cursorrules`](.cursorrules) for Cursor-specific rules
- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution workflow

---

## 6. Code Style Consistency

**Principle:** When generating code, consult the existing way code is written in this repository and try to mimic it. When existing code violates any of the other tenets in this ruleset, notify the user so they can improve their coding skills.

### Workflow and General Instructions (from `.github/copilot-instructions.md`)

Before starting any coding task:

1. **Consider Multiple Approaches**: Don't immediately start coding. Instead:
    - Consider several ways of accomplishing the task
    - Highlight the approach you think is best (and why)
    - Ask the user to pick the approach before starting to code

2. **Communication Style**:
    - If told you're wrong, think about whether that's true and respond with facts
    - If you don't agree, explain why and provide evidence or examples
    - If the user insists, do it their way
    - Avoid apologizing or making conciliatory statements
    - Avoid statements like "You're right" or "Yes"
    - Avoid hyperbole and excitement, stick to the task pragmatically
    - Avoid repeating what the user asks - get to the point

3. **API and Dependency Verification**:
    - When suggesting code using APIs from `package.json` dependencies or external sources
    - Double-check you understand how they work at the latest version (or the version specified in `package.json`)
    - Notify the user if versions differ

4. **Code Quality**:
    - All generated code should be secure, DRY, and follow best practices, standards and guidelines
    - Validate code often using `pnpm verify:fix` and `pnpm test`

### Implementation Guidelines

1. **Before Writing Code:**
    - Analyze existing patterns in the codebase
    - Consider edge cases and error scenarios
    - Review similar files in the codebase
    - Identify patterns and conventions used
    - Note naming conventions, file structure, and organization patterns
    - Follow the rules in this document as strictly as possible

2. **While Writing Code:**
    - Match the existing code style
    - Use similar patterns and structures
    - Follow the same architectural decisions
    - Maintain consistency with existing codebase

3. **When Conflicts Arise:**
    - If existing code violates other principles (accessibility, security, validity), notify the user
    - Suggest improvements while acknowledging existing patterns
    - Provide examples of how to align existing code with best practices
    - Do not silently fix violations in existing code unless explicitly asked

4. **Code Review:**
    - Point out inconsistencies between new code and existing patterns
    - Suggest refactoring opportunities that align with best practices
    - Help maintain code quality while respecting existing conventions

---

## 7. Internationalization (i18n)

**Principle:** Follow the routes-first i18n strategy for all bilingual content and navigation.

### i18n Architecture

This project uses a **routes-first** i18n strategy:

- **`/src/i18n/ui.ts` → `routes`** is the single source of truth for URL paths
- **`/src/i18n/ui.ts` → `ui`** holds translated strings (labels, titles, meta)
- **`/src/i18n/utils.ts`** exposes functions that translate text and links at runtime
- **`/src/data/navigation.ts`** declares menu structure using semantic keys

The default locale is **RO** (`"ro"`). Source files in `src/pages/**` use **Romanian slugs**.

### URL and Text Translation

- **For URLs**: Always use `translateUrl(lang)(keyOrRoSlug)`
    - Accepts an **EN route id** (e.g., `"about"`, `"services/implementation"`) **or** a **RO slug** (e.g., `"despre"`, `"servicii/implementare"`)
    - Handles **composites** via `nav.{key}.template`
    - Always ends with a trailing slash
    - Adds locale prefix unless `showDefaultLang=false` and `current===defaultLang`

- **For Text**: Always use `useTranslations(lang)(key)`
    - Looks up `ui[lang][key]` with fallback to default
    - Use keys like `"nav.about.label"`, `"nav.about.title"`

### Routes Structure

- **RO locale `routes.ro`**: **EN id → RO slug**
    - Example: `"services/implementation": "servicii/implementare"`
- **EN locale `routes.en`**: **RO slug → EN slug**
    - Example: `"servicii/implementare": "services/implementation"`

**Design choice:** Files are in Romanian, so RO slugs are canonical on disk. `routes.en` maps those to English equivalents.

### Composite Keys

- For submenu items, use `nav.{key}.template` to compose URLs
- Example: `nav.implementation.template = "services"` allows `translateUrl(lang)("implementation")` to resolve as `"services/implementation"`

### Do's and Don'ts

- ✅ **Do** treat `routes` as the **only** URL source of truth
- ✅ **Do** ALWAYS check and use translated URLs defined in `src/i18n/ui.ts` before creating localized pages.
- ✅ **Do** prefer `translateUrl` for all internal links
- ✅ **Do** declare `nav.{key}.template` when a submenu child should compose with a parent
- ✅ **Do** keep **trailing slashes** — `translateUrl` ensures this
- ✅ **Do** use `buildMenu` for full menu rendering (header/footer)
- ✅ **Do** update `src/i18n/ui.ts` when creating new pages
- ❌ **Don't** invent or guess localized routing slugs (e.g. `privacy-policy.astro`) without cross-referencing `routes` inside `src/i18n/ui.ts` or dynamically within `en.md[x]/ro.md[x]`.
- ❌ **Don't** hardcode `"/en"` or locale prefixes
- ❌ **Don't** rely on `nav.*.url` except as a temporary legacy fallback
- ❌ **Don't** build URLs from `ui` text — always from `routes` via `translateUrl`

### Implementation Example

```typescript
import { getLangFromUrl, useTranslations, translateUrl } from "@lang";
import { buildMenu } from "@lang";
import { headerMenu } from "@data/navigation";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
const u = translateUrl(lang);
const items = buildMenu(headerMenu, Astro.url.pathname, lang);

// Use in templates:
<a href={u("about")} title={t("nav.about.title")}>
    {t("nav.about.label")}
</a>
```

For more details, see [`docs/guides/bilingual-i18n-navigation.md`](docs/guides/bilingual-i18n-navigation.md).

---

## 8. Documentation and Comments

**Principle:** Document code comprehensively to improve maintainability and understanding.

### Code Comments

- Add code comments to explain complex logic and key features
- Document all assumptions and decisions in code comments
- Keep comments up-to-date with code changes
- Use comments to explain "why" not just "what"

### JSDoc Documentation

- **Automatically write typesafe JSDocs for all functions everywhere**
- Include:
    - Function definition/description
    - `@param` for each parameter (with types)
    - `@returns` with return type
    - All types must be properly typed
- Example:

```typescript
/**
 * Translates a URL key to a localized path.
 *
 * @param {Locale} lang - The target locale for translation
 * @param {string} keyOrRoSlug - The route key or Romanian slug to translate
 * @returns {string} The localized URL path with trailing slash
 */
function translateUrl(lang: Locale, keyOrRoSlug: string): string {
    // Implementation
}
```

### Documentation Files

- Document all changes in the changelog when applicable
- Create a changelog if it doesn't exist
- Update relevant documentation when adding features
- Keep README and other docs up-to-date

---

## 9. Pull Requests and Commits

**Principle:** Follow established conventions for commits and pull requests.

### Commit Messages

- Follow [Conventional Commits](https://www.conventionalcommits.org/) standard
- Format: `<type>(<scope>): <subject>`
- Types: `feat`, `fix`, `docs`, `chore`, `style`, `refactor`, `ci`, `test`, `revert`, `perf`, `vercel`
- Keep commit messages **<72 chars** but insightful
- Keep commits focused and atomic
- Use branches for larger features

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows the style guidelines of this project
- [ ] Self-review of code has been performed
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] Corresponding changes to documentation have been made
- [ ] Changes generate no new warnings or errors
- [ ] Newly added functionality has been manually tested with no discernable errors
- [ ] Tests have been added that prove the fix is effective or that the feature works
- [ ] New and existing unit tests pass locally with changes
- [ ] Any dependent changes have been merged and published in downstream modules

### PR Description

- Include a summary of changes and related issue
- Include relevant motivation and context
- List any dependencies required for the change
- Link to related issues using `Fixes #123` format
- Specify the type of change (bug fix, feature, docs, etc.)
- Include a changelog section listing all major changes

---

## 10. Validation and Quality Assurance

**Principle:** When wrapping up an agentic task, always run `pnpm verify:fix` and if that doesn't fix the linting and validation errors, attempt to fix them by editing the code until the validation passes successfully.

### Validation Process

1. **Before Completing Any Task:**
    - Run `pnpm verify:fix` to automatically fix linting and formatting issues
    - This command runs:
        - `pnpm lint:fix` - Fixes ESLint issues
        - `pnpm typecheck` - Validates TypeScript types
        - `pnpm format:fix` - Fixes Prettier formatting
        - `astro check` - Validates Astro-specific code

2. **If Errors Persist:**
    - Review the error messages carefully
    - Manually fix any remaining issues:
        - TypeScript type errors
        - ESLint rule violations
        - Formatting inconsistencies
        - Astro validation errors

3. **Iterative Fixing:**
    - Fix errors one category at a time
    - Re-run validation after each fix
    - Continue until all validation passes

4. **Final Verification:**
    - Ensure `pnpm verify:fix` completes without errors
    - Verify the code still functions correctly
    - Confirm all tests pass (if applicable)

### Quality Checklist

Before marking a task as complete, verify:

- [ ] Code passes `pnpm verify:fix` without errors
- [ ] All TypeScript types are correct
- [ ] All linting rules are satisfied
- [ ] Code is properly formatted
- [ ] Astro validation passes
- [ ] Code follows semantic HTML principles
- [ ] Accessibility requirements are met (WCAG AAA)
- [ ] Security considerations are addressed
- [ ] Code style matches existing codebase
- [ ] Performance optimizations are in place

---

## Summary

These ten principles form the foundation of code generation for this project:

1. **Validity** - Always generate standards-compliant code
2. **Semantic, Accessible, Performant** - Create high-quality, inclusive, fast code
3. **Security & Privacy** - Build secure, attack-resistant features and comply with data protection regulations
4. **Design Principles** - Follow simplicity, progressive enhancement, mobile-first, and responsiveness
5. **Standards** - Follow all repository coding standards (ESLint, Prettier, Markdownlint)
6. **Consistency** - Match existing code style while maintaining quality
7. **Internationalization** - Use routes-first i18n strategy with `translateUrl` and `useTranslations`
8. **Documentation** - Write comprehensive JSDoc comments and keep docs up-to-date
9. **Pull Requests and Commits** - Follow Conventional Commits and PR checklist
10. **Validation** - Always verify code quality before completion

**Remember:** These principles are not optional. They must be applied to every code generation task in this project.

---

## Quick Reference

### Essential Commands

```bash
# Run full validation and auto-fix
pnpm verify:fix

# Individual validation steps
pnpm format        # Check code formatting
pnpm format:fix    # Check and fix code formatting
pnpm lint          # Check for linting issues
pnpm lint:fix      # Fix linting issues automatically
pnpm typecheck     # Check TypeScript types
pnpm verify        # Combine linting, type checking, Astro checking, and formatting checks (passive)
pnpm verify:fix    # Lint, typecheck, Astro check and actively reformat all files
pnpm test          # Run unit tests (Vitest) and any configured test suites
pnpm upd           # Self-update PNPM, then update dependencies to latest versions
astro check        # Validate Astro code
```

### Folder Structure

- `/src`: Contains the source code
- `/public`: Contains static assets like images, fonts, and other files that are served directly
- `/data`: Contains the actual text content, images, and other assets for the actual pages
- `/docs`: Contains documentation for the project, including API specifications, user guides and pull request templates

### Technologies

- **Astro** for static site generation and excellent performance
- **SCSS** for styling to keep the design simple and maintainable and to keep the DOM free of utility classes
- **TypeScript** for type safety and improved developer experience
- **Vitest** for unit testing and test-driven development
- **Playwright** for end-to-end testing and browser automation
- **ESLint** for static code analysis and enforcing coding standards
- **Prettier** for code formatting
- **Git & GitHub** for source control, collaboration, static code analysis, versioning and CI/CD pipelines

### Key Resources

- [MDN Web Docs](https://developer.mozilla.org/)
- [Astro Documentation](https://docs.astro.build/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)

### Error Handling Pattern

**Context-Aware Error Tracking:**

- **Build-time errors** (SSG): Use `safePostHogCaptureExceptionServer()` from `@lib/posthog` for errors during static generation
- **Client-side errors**: Use `safePostHogCaptureException()` from `@lib/analytics` for browser errors
- **SSR errors** (when SSR is necessary): Use `safePostHogCaptureExceptionServer()` from `@lib/posthog` for server-side rendering errors

```typescript
// ✅ Good: Comprehensive error handling (no console; use a logger or error-reporting utility)
try {
    const result = await fetchData();
    return { success: true, data: result };
} catch (error) {
    logger.error("API call failed", { error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
}

// ❌ Bad: Swallowing errors
try {
    return await fetchData();
} catch {
    // Ignored on purpose (this is an anti-pattern)
    return { success: false, error: "Request failed" };
}
```

**Example: Build-time error handling in SSG context:**

```typescript
// In an Astro page component during SSG
if (!lang) {
    const error = new Error("Language not specified in props");
    safePostHogCaptureExceptionServer(error, { component: "AboutPage", url: Astro.url.toString() });
    throw error;
}
```

---

_Last updated: 2025-01-27_ _This document should be consulted before every code generation task._
