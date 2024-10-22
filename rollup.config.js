import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";
import commonjs from "@rollup/plugin-commonjs";
import pkg from "./package.json" with { type: "json" };

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: "src/index.ts",
  // preserveModules: true,
  plugins: [
    commonjs({
      ignore: ["fs", "path"],
    }),
    typescript({
      noEmitOnError: true,
      tsconfig: "./tsconfig.build.json",
    }),
    copy({
      targets: [
        {
          src: ["src/webassembly/amalgam-st*"],
          dest: "lib",
        },
      ],
    }),
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
  ],
  output: [
    {
      file: "lib/index.cjs",
      format: "cjs",
    },
    {
      file: "lib/index.esm.js",
      format: "es",
    },
  ],
};
