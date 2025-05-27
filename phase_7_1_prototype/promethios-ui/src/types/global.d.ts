// Global type declarations for the project

// Vite module declarations
declare module 'vite' {
  const vite: any;
  export default vite;
}

declare module '@vitejs/plugin-react' {
  const pluginReact: any;
  export default pluginReact;
}

// CSS module declarations
declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Image module declarations
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg' {
  import React from 'react';
  const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

// Node.js path module declaration
declare module 'path' {
  const path: {
    join: (...paths: string[]) => string;
    resolve: (...paths: string[]) => string;
    dirname: (path: string) => string;
    basename: (path: string, ext?: string) => string;
    extname: (path: string) => string;
  };
  export default path;
}

// Node.js globals
declare const __dirname: string;
declare const __filename: string;
