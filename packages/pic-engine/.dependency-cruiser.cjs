module.exports = {
  forbidden: [
    {
      name: 'no-player-into-group',
      severity: 'error',
      from: { path: '^src/player-engine' },
      to: { path: '^src/group-engine' },
    },
    {
      name: 'no-group-into-player',
      severity: 'error',
      from: { path: '^src/group-engine' },
      to: { path: '^src/player-engine' },
    },
  ],
  options: {
    // Without this, dependency-cruiser only tracks *post-compilation* dependencies: an import whose
    // named bindings are never referenced (e.g. `import { x } from '../group-engine'` where `x` is
    // unused) gets stripped by the TypeScript compiler and is invisible to the tool by default. That
    // is exactly the shape of import a stub/placeholder file is likely to contain, so leaving this off
    // would let a real cross-engine import slip past this guardrail undetected.
    tsPreCompilationDeps: true,
  },
};
