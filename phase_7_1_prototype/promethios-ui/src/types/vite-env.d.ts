/// <reference types="node" />

// This file contains global type declarations for the project
declare module '@vitejs/plugin-react';

// Add Node.js global variables that might be used in Vite config
declare const __dirname: string;
declare const __filename: string;
declare const require: NodeRequire;
