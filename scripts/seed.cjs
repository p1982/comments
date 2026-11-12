const { join } = require('node:path');

const project = join(__dirname, '../apps/api/tsconfig.migration.json');

require('ts-node').register({
  project,
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'bundler',
    verbatimModuleSyntax: false,
    esModuleInterop: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  },
});

require('tsconfig-paths').register({
  baseUrl: join(__dirname, '../apps/api'),
  paths: { '@app/*': ['src/*'] },
});

require('../apps/api/src/database/seeds/comments.seed.ts');
