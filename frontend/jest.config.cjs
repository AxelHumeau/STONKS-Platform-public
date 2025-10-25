module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['@swc/jest']
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
