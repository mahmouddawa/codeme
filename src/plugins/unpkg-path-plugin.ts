import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localforage from 'localforage';

const fileCache = localforage.createInstance({
  name : 'fileCache'
});


export const unpkgPathPlugin = (inputCode:string) => {
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
 
      build.onLoad({ filter: /.*/ }, async (args: any) => { // overwrite the load logic to not take the content from the file systems
        console.log('onLoad', args);
 
        if (args.path === 'index.js') {
          return {
            loader: 'jsx',   
            contents: inputCode,
          };
        } 
        
        //check if we already fetched this file and if it is in the cache
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
        // if it is the return it immediately
        if(cachedResult){
          return cachedResult;
        }
        //if it is not in the cache
        const {data, request} = await axios.get(args.path);
        const result:esbuild.OnLoadResult =  {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./',request.responseURL).pathname
        }
        // store it in the cahe 
        await fileCache.setItem(args.path,result);
        return result;
      });
    },
  };
};