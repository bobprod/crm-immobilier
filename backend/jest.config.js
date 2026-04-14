module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: './',
    modulePaths: ['<rootDir>'],
    testMatch: ['**/*.spec.ts'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    collectCoverageFrom: [
        'src/**/*.{ts,js}',
        '!src/**/*.spec.ts',
        '!src/**/*.module.ts',
        '!src/**/*.dto.ts',
        '!src/**/*.interface.ts',
        '!src/**/*.d.ts',
        '!src/main.ts',
    ],
    coverageDirectory: 'coverage',
    testTimeout: 30000,
};
