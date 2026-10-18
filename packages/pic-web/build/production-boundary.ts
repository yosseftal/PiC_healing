import type { Plugin } from "vite";

/** Test entries are source-only: no production import or emitted test page is permitted. */
function isDevelopmentArtifact(id: string): boolean {
  const path = id.replaceAll("\\", "/").split("?")[0];
  return /(^|\/)(tests?|__tests__|__mocks__|test-helpers|fixtures|dev|debug|mocks?)\//.test(path) ||
    /\.(test|spec|fixture|type-fixtures)\./.test(path) ||
    /\/terminology-test-fixture\./.test(path);
}

export function productionBoundary(mode: string): Plugin {
  return {
    name: "pic-production-boundary",
    enforce: "post",
    configureServer(server) {
      if (mode === "browser-test") return;
      server.middlewares.use((request, response, next) => {
        let path: string;
        try { path = decodeURIComponent(request.url ?? "/"); }
        catch { response.statusCode = 400; response.end(); return; }
        if (!isDevelopmentArtifact(path)) return next();
        response.statusCode = 404;
        response.end("Not Found");
      });
    },
    generateBundle(_options, bundle) {
      // Inspect the graph too, so even a tree-shaken test import fails the build.
      for (const id of this.getModuleIds()) {
        if (isDevelopmentArtifact(id)) this.error(`Development artifact in production graph: ${id}`);
      }
      for (const file of Object.keys(bundle)) {
        if (file !== "index.html" && !/^assets\/[^/]+\.(js|css|woff2?|png|svg|webp|ico)$/.test(file)) {
          this.error(`Unapproved production output: ${file}`);
        }
      }
    },
  };
}
