import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import pkg from "./package.json" with { type: "json" };

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: "src/index.ts",
  // preserveModules: true,
  plugins: [
    commonjs(),
    typescript({
      noEmitOnError: true,
      tsconfig: "./tsconfig.build.json",
    }),
    copy({
      targets: [
        {
          src: ["src/webassembly/amalgam-st.data", "src/webassembly/amalgam-st.wasm", "src/webassembly/version.json"],
          dest: "lib",
        },
      ],
    }),
    terser(), // minifies generated bundles
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
  ],
  output: [
    {
      file: "lib/index.cjs.js",
      format: "cjs",
    },
    {
      file: "lib/index.esm.js",
      format: "es",
    },
  ],
};
