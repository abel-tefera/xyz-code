import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localforage from "localforage";
import Path from "path-browserify";

const packageCache = localforage.createInstance({
  name: "packcagecache",
});

export const fetchPlugin = (tree: Record<string, string>) => {
  const map = new Map(Object.entries(tree));
  return {
    name: "fetch-plugin",
    setup(build: esbuild.PluginBuild) {
      build.onLoad({ filter: /^\/index\.js$/ }, (args: esbuild.OnLoadArgs) => {
        console.log("FETCH INDEX", args);
        const ext = Path.extname(args.path);
        const contents = map.get(`${args.path}`);
        return {
          loader: "jsx",
          contents: contents,
        };
      });
      build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
        console.log("DOT SLASH checking if cache");
        const cachedResult = await packageCache.getItem<esbuild.OnLoadResult>(
          args.path
        );

        if (cachedResult) {
          return cachedResult;
        } else if (map.has(args.path)) {
          const ext = Path.extname(args.path);
          const contents = map.get(args.path)!;
          const loader = "jsx";
          return { contents, loader };
        }
      });

      build.onLoad({ filter: /.css$/ }, async (args: esbuild.OnLoadArgs) => {
        console.log("css importing unpkg");
        const { data, request } = await axios.get(args.path);

        const escaped = data
          .replace(/\n/g, "")
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");

        const contents = `
          const style = document.createElement('style');
          style.innerText = '${escaped}';
          document.head.appendChild(style);
        `;

        const res: esbuild.OnLoadResult = {
          loader: "jsx",
          contents,
          resolveDir: new URL("./", request.responseURL).pathname,
        };

        await packageCache.setItem(args.path, res);
        return res;
      });

      build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
        console.log("DOT SLASH importing unpkg");
        const { data, request } = await axios.get(args.path);

        const res: esbuild.OnLoadResult = {
          loader: "jsx",
          contents: data,
          resolveDir: new URL("./", request.responseURL).pathname,
        };

        await packageCache.setItem(args.path, res);
        return res;
      });
    },
  };
};
