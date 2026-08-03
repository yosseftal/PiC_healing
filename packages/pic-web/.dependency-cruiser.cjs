module.exports = {
  forbidden: [
    {
      // Ticket 14 DoD: "no component other than this composition root imports pic-adapter-local-guest or
      // pic-adapter-supabase directly" - every screen/component reaches the active RepositoryPort and
      // engine instances exclusively through session-engine-context.tsx's React Context.
      name: "no-adapter-import-outside-composition-root",
      severity: "error",
      // Test files are exempt - the DoD's concern is the *runtime* component tree never bypassing the
      // composition root, not test code verifying it (e.g. an `instanceof LocalGuestRepository` smoke
      // assertion) - a common, deliberate carve-out for this style of layering rule.
      from: { pathNot: ["^src/composition-root\\.ts$", "\\.test\\.tsx?$"] },
      // Workspace-linked packages resolve to a relative filesystem path (e.g.
      // "../pic-adapter-local-guest/src/index.ts"), not the bare specifier - match the package directory
      // name as a path segment, wherever it falls, rather than anchoring to the start of the string.
      to: { path: "(^|/)pic-adapter-(local-guest|supabase)/" },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
  },
};
