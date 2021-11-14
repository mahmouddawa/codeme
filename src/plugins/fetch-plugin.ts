import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localforage from 'localforage';

const fileCache = localforage.createInstance({
  name : 'fileCache'
});


export const fetchPlugin = (inputCode : string)=>{
  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild){
    build.onLoad({ filter: /.*/ }, async (args: any) => { // overwrite the load logic to not take the content from the file systems
      if (args.path === 'index.js') {
        return {
          loader: 'jsx',   
          contents: inputCode,
        };
      } 
      
      //check if we already fetched this file and if it is in the cache
      // const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
      // // if it is the return it immediately
      // if(cachedResult){
      //   return cachedResult;
      // }
      //if it is not in the cache
      const {data, request} = await axios.get(args.path);

      const fileType = args.path.match(/.css$/) ? 'css' : 'jsx';
      const contents = fileType === 'css' ? 
      `
      const style = document.createElement('style');
      style.innerText = 'body { background-color: "red" }';
      document.head.appendChild(style);
      ` : data;
      const result:esbuild.OnLoadResult =  {
        loader : 'jsx',
        contents: contents,
        resolveDir: new URL('./',request.responseURL).pathname
      }
      // store it in the cahe 
      await fileCache.setItem(args.path,result);
      return result;
    });
    }
  }
} 