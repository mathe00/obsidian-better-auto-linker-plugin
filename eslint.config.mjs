import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2022,
      },
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          vars: 'all',
          varsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': false,
          'ts-nocheck': false,
          'ts-check': false,
          minimumDescriptionLength: 10,
        },
      ],

      '@typescript-eslint/no-empty-function': [
        'error',
        {
          allow: ['arrowFunctions', 'functions', 'methods'],
        },
      ],

      '@typescript-eslint/no-explicit-any': 'error',

      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',

      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: true,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],

      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',

      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          allowBoolean: false,
          allowAny: false,
          allowNullish: false,
          allowNever: false,
        },
      ],

      '@typescript-eslint/restrict-plus-operands': [
        'error',
        {
          allowAny: false,
          allowBoolean: false,
          allowNullish: false,
          allowNumberAndString: false,
          allowRegExp: false,
          skipCompoundAssignments: false,
        },
      ],

      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/no-duplicate-type-constituents': 'error',

      '@typescript-eslint/no-redundant-type-constituents': 'error',

      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array-simple',
          readonly: 'array-simple',
        },
      ],

      '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

      '@typescript-eslint/class-literal-property-style': ['error', 'fields'],

      '@typescript-eslint/member-ordering': 'off',

      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        {
          ignoreArrowShorthand: false,
          ignoreVoidOperator: false,
        },
      ],

      '@typescript-eslint/prefer-enum-initializers': 'error',

      '@typescript-eslint/no-unsafe-declaration-merging': 'error',
      '@typescript-eslint/no-unsafe-unary-minus': 'error',

      '@typescript-eslint/parameter-properties': [
        'error',
        {
          prefer: 'parameter-property',
        },
      ],

      '@typescript-eslint/prefer-find': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'error',
      '@typescript-eslint/prefer-namespace-keyword': 'error',
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
      // '@typescript-eslint/prefer-readonly-indexed-mapped-types': 'error', // Not available in ESLint 10
      '@typescript-eslint/prefer-reduce-type-parameter': 'error',
      '@typescript-eslint/prefer-return-this-type': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',

      'no-prototype-builtins': 'error',
      'no-unused-vars': 'off',
      'prefer-const': 'error',
      'no-var': 'error',

      'no-console': [
        'warn',
        {
          allow: ['error', 'warn', 'info'],
        },
      ],

      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration[const=true]',
          message:
            'Const enums are not allowed. Use regular enums or const objects instead.',
        },
      ],

      eqeqeq: ['error', 'always', { null: 'ignore' }],

      'no-throw-literal': 'off',
      '@typescript-eslint/only-throw-error': 'error',

      curly: ['error', 'all'],
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'main.js',
      'styles.css',
      '*.config.js',
      '*.config.mjs',
    ],
  }
);
