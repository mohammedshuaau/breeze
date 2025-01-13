declare module 'postcss' {
  import { Plugin, PluginCreator } from 'postcss';
  
  interface ProcessOptions {
    from?: string;
    to?: string;
    parser?: any;
    stringifier?: any;
    syntax?: any;
    map?: any;
  }

  interface Processor {
    process(css: string, options?: ProcessOptions): Promise<Result>;
  }

  interface Result {
    css: string;
    warnings(): any[];
    toString(): string;
  }

  interface PostCSS {
    (plugins?: any[]): Processor;
  }

  const postcss: PostCSS;
  export = postcss;
} 