module.exports = {
  env: {
    es6: true,
    node: true,
    mocha: true,
  },
  extends: ["standard", "plugin:prettier/recommended"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "no-async-promise-executor": "off",
    camelcase: "off",
  },
  overrides: [
    {
      files: ["*.test.ts"],
      rules: {
        "no-unused-expressions": "off",
      },
    },
  ],
};
