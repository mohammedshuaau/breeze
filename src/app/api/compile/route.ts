import { NextResponse } from 'next/server';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

// Create a minimal Tailwind config
const minimalConfig = {
  content: [],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false
  },
  plugins: [],
};

export async function POST(request: Request) {
  try {
    const { html, customClassName } = await request.json();
    
    // Find all class and className attributes and their values, including object syntax
    const classRegex = /(?:class|className)=(?:"([^"]*)"|'([^']*)'|\{["']([^"']*)["']\})/g;
    let match;
    const elementClasses: { original: string; classes: string[]; isJsx: boolean }[] = [];
    
    // Extract all class combinations
    while ((match = classRegex.exec(html)) !== null) {
      const isJsx = match[0].startsWith('className');
      const classes = (match[1] || match[2] || match[3]).split(' ').filter(Boolean);
      elementClasses.push({
        original: match[0],
        classes,
        isJsx
      });
    }

    // Process each unique class combination
    const classMap = new Map<string, string>();
    const cssResults: string[] = [];
    
    for (let i = 0; i < elementClasses.length; i++) {
      const { original, classes } = elementClasses[i];
      const classKey = classes.sort().join(' ');
      
      // Skip if we've already processed this combination
      if (classMap.has(classKey)) continue;
      
      // Generate a unique class name
      const uniqueClassName = customClassName 
        ? `${customClassName}-${i + 1}` 
        : `breeze-${Math.floor(Math.random() * 1000000)}`;
      
      classMap.set(classKey, uniqueClassName);
      
      // Create CSS content for this class combination
      const cssContent = `
        @tailwind utilities;
        
        .${uniqueClassName} {
          @apply ${classes.join(' ')};
        }
      `;

      // Process the CSS
      const result = await postcss([
        tailwindcss({
          ...minimalConfig,
          content: [{
            raw: `<div class="${classes.join(' ')}">test</div>`,
            extension: 'html'
          }]
        })
      ]).process(cssContent, {
        from: undefined
      });

      // Extract the complete CSS for the Breeze class
      const lines = result.css.split('\n');
      let compiledCss = '';
      let insideBreezeClass = false;
      let braceCount = 0;

      for (const line of lines) {
        if (line.includes(uniqueClassName)) {
          insideBreezeClass = true;
          braceCount = 0;
        }
        
        if (insideBreezeClass) {
          compiledCss += line + '\n';
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;
          
          if (braceCount === 0 && compiledCss.includes('}')) {
            insideBreezeClass = false;
          }
        }
      }

      cssResults.push(compiledCss.trim());
    }

    // Replace original classes with new unique class names, preserving syntax
    let modifiedHtml = html;
    for (const { original, classes, isJsx } of elementClasses) {
      const classKey = classes.sort().join(' ');
      const uniqueClassName = classMap.get(classKey);
      if (uniqueClassName) {
        const attributeName = isJsx ? 'className' : 'class';
        const newValue = original.includes('{') ? 
          `${attributeName}={"${uniqueClassName}"}` : 
          `${attributeName}="${uniqueClassName}"`;
        modifiedHtml = modifiedHtml.replace(original, newValue);
      }
    }

    // Format the response
    const response = {
      originalHtml: html,
      modifiedHtml: modifiedHtml,
      styles: cssResults.join('\n\n')
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'Failed to process classes',
      details: String(error)
    }, { status: 500 });
  }
} 