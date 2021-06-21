import * as esbuild from 'esbuild-wasm';


export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      // handle root entry file of index.js
      build.onResolve({filter:/(^index\.js$)/},()=>{
        return {path: 'index.js', namespace: 'a'}
      });
      // this will search for the ./ and the ../
      // handle relative paths in a module
      build.onResolve({filter:/^\.+\//}, (args:any)=>{
        return {
          path: new URL(args.path,
             'https://unpkg.com' + args.resolveDir + '/').href,
              namespace: 'a'
        }
      })
      // handle main file of a module
      build.onResolve({ filter: /.*/ }, async (args: any) => { // overwrite the path that esbuild use to read the file "normally the file system on my machine"

          return {
            path: `https://unpkg.com/${args.path}`,
            namespace: 'a'
          } 
      });
    },
  };
};