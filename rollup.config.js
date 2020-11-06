import typescript from "rollup-plugin-typescript";
import pkg from "./package.json";

export default [
  {
    input: "src/index.ts",
    external: ["ms"],
    plugins: [
      typescript(), // so Rollup can convert TypeScript to JavaScript
    ],
    output: [
      { file: pkg.main, format: "cjs" },
      { file: pkg.module, format: "es" },
    ],
  },
];
