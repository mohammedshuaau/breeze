import { NextResponse } from 'next/server';
import postcss from 'postcss';
import postcssJs from 'postcss-js';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../../../tailwind.config';

const fullConfig = resolveConfig(tailwindConfig);

export async function POST(request: Request) {
  try {
    const { classes, html } = await request.json();
    
    // Create a minimal CSS string with the provided classes
    const css = `.compiled { ${classes.join(' ')} }`;
    
    // Process the CSS with Tailwind's JIT compiler
    const root = postcss.parse(css);
    const processed = postcssJs.objectify(root);
    
    // Extract the compiled styles
    const compiledStyles = processed.compiled || {};
    
    // Generate a unique class name
    const uniqueClassName = `element-${Math.floor(Math.random() * 1000000)}`;
    
    // Format the response
    const result = {
      jsx: html.replace(/class="/g, 'className="').replace(/class=/g, 'className='),
      className: uniqueClassName,
      styles: {
        [`.${uniqueClassName}`]: compiledStyles
      }
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process classes' }, { status: 500 });
  }
} 