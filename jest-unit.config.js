/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
  transform: {
    '.(ts|tsx)': '<rootDir>/node_modules/ts-jest/preprocessor.js',
  },
};
