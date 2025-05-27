/// <reference types="vite/client" />

// Declare modules for CSS imports
declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Declare modules for image imports
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg' {
  import React from 'react';
  const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

// Declare Vite modules
declare module 'vite' {
  const vite: any;
  export default vite;
}

declare module '@vitejs/plugin-react' {
  const plugin: any;
  export default plugin;
}

// Declare Node.js globals
declare const __dirname: string;
declare const __filename: string;
