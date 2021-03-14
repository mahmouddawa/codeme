import * as esbuild from 'esbuild-wasm';
import axios from 'axios';

export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onResolve({ filter: /.*/ }, async (args: any) => { // overwrite the path that esbuild use to read the file "normally the file system on my machine"
        console.log('onResolve', args);
        if(args.path === 'index.js'){
          return { path: args.path, namespace: 'a' };
        }
        else if (args.path.includes('./' || args.path.includes('../'))){
          return {
            path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/').href,
            namespace: 'a'
          }
        }
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
            contents: `
              import React, {useState} from 'react';
              import ReactDOM from 'react-dom';
              console.log(React, useState);
            `,
          };
        } 
        const {data, request} = await axios.get(args.path);

        return {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./',request.responseURL).pathname
        }
      });
    },
  };
};