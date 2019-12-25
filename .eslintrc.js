module.exports = {
    root: true,
    extends: [
        '@deepvision',
        '@deepvision/eslint-config/plugins/typescript',
    ],
    parserOptions: {
        project: './tsconfig.json',
    },
};
