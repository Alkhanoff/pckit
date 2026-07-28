// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'coverage/*', 'docs/*'],
  },
  {
    // Jest mock-ları require() tələb edir (hoisting səbəbindən import işləmir).
    files: ['jest.setup.ts', 'jest.config.js', 'eslint.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    rules: {
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  {
    // docs/DECISIONS.md §14 + ARCHITECTURE.md §1:
    // domain qatı təmiz TypeScript olmalıdır — platform importu qadağandır.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-native',
                'react-native-*',
                '@shopify/react-native-skia',
                'expo',
                'expo-*',
                'zustand',
              ],
              message:
                'src/domain/** təmiz TypeScript olmalıdır — React/Skia/Reanimated/Expo importu qadağandır (docs/ARCHITECTURE.md §1).',
            },
          ],
        },
      ],
    },
  },
  {
    // docs/ARCHITECTURE.md §4: runOnJS yalnız intentBridge.ts faylında.
    files: ['src/**/*.ts', 'src/**/*.tsx', 'app/**/*.tsx'],
    ignores: ['src/gestures/intentBridge.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='runOnJS']",
          message:
            'runOnJS yalnız src/gestures/intentBridge.ts faylında istifadə edilir (docs/ARCHITECTURE.md §4).',
        },
      ],
    },
  },
  {
    /**
     * Reanimated shared value-ları dizayn etibarilə mutasiya edilir
     * (`value.value = x`) — bu, UI thread-də state saxlamağın yeganə yoludur.
     * React Compiler-in immutability qaydası bunu React state mutasiyası kimi
     * görür və səhvən qadağan edir.
     *
     * İstisna YALNIZ gesture və animasiya qatına verilir; komponentlərdə və
     * domain qatında qayda qüvvədə qalır.
     */
    files: ['src/gestures/**/*.ts', 'src/gestures/**/*.tsx'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
    },
  },
]);
