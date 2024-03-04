/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
  transform: {
    "^.+\\.[tj]s$": [
      "ts-jest",
      {
        // Allow importing from /webassembly/
        tsconfig: {
          allowJs: true,
        },
      },
    ],
  },
};
