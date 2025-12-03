import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  // Custom style rules
  {
    rules: {
      'comma-dangle': ['warn', 'always-multiline'],         // enforce for multiline objects/arrays
      'eol-last': ['warn', 'always'],                       // Enforce exactly one newline at EOF
      'jsx-quotes': ['warn', 'prefer-double'],              // Double quotes for JSX
      'object-curly-spacing': ['warn', 'always'],           // spacing / formatting consistency
      'quotes': ['warn', 'single', { avoidEscape: true }],  // Single quotes for JS/TS
      'semi': ['warn', 'never'],                            // No semicolons
    },
  },
])

export default eslintConfig
