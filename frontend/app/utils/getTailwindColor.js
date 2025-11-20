import React from 'react';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config';
const fullConfig = resolveConfig(tailwindConfig);

export const getTailwindColor = (path) => {
    return path.split('.').reduce((acc, key) => acc?.[key], fullConfig.theme.colors);
};

export default getTailwindColor;