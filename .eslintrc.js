module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    parserOptions: {
        project: './tsconfig.json'
    },
    extends: ['plugin:@typescript-eslint/recommended'],
    rules: {
        "@typescript-eslint/ban-ts-ignore": "warn"
    }
}