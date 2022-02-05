/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "./coverage/",

  // A list of paths to directories that Jest should use to search for files in
  roots: ["<rootDir>/tests"],

  // The test environment that will be used for testing
  testEnvironment: "node",

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
};
