import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import external from 'rollup-plugin-peer-deps-external';
import sass from 'rollup-plugin-sass';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default {
  input: 'src/index.tsx',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: true,
    },
  ],
  plugins: [
    external(),
    resolve({
      browser: true,
    }),
    typescript({
      rollupCommonJSResolveHack: true,
      exclude: ['**/__tests__/**', /\*\*\/\*.stories.(js|ts|jsx|tsx)/],
      clean: true,
    }),
    commonjs({
      include: ['node_modules/**'],
      exclude: [/\*\*\/\*.stories.(js|ts|jsx|tsx)/],
      namedExports: {
        'node_modules/react/react.js': ['Children', 'Component', 'PropTypes', 'createElement'],
        'node_modules/react-dom/index.js': ['render'],
      },
    }),
    sass({
      insert: true,
    }),
  ],
};
