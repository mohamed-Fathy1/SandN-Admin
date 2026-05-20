import { Generator, getConfig } from '@tanstack/router-generator';

const root = process.cwd();
const config = getConfig(
  {
    routesDirectory: './src/routes',
    generatedRouteTree: './src/routeTree.gen.ts',
    routeFileIgnorePrefix: '-',
    quoteStyle: 'single',
  },
  root
);

const generator = new Generator({ config, root });
await generator.run();
