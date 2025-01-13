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

// Cache for validated classes to avoid reprocessing
const validClassCache = new Map<string, boolean>();

async function validateClasses(classes: string[]): Promise<Map<string, boolean>> {
  // Filter out classes we've already validated
  const unvalidatedClasses = classes.filter(cls => !validClassCache.has(cls));
  
  if (unvalidatedClasses.length === 0) {
    // Return cached results if all classes have been validated before
    return new Map(classes.map(cls => [cls, validClassCache.get(cls)!]));
  }

  // Create a test CSS content with all unvalidated classes
  const cssContent = `
    @tailwind utilities;
    ${unvalidatedClasses.map((cls, i) => `
    .test-${i} {
      @apply ${cls};
    }`).join('\n')}
  `;

  try {
    await postcss([
      tailwindcss({
        ...minimalConfig,
        content: [{
          raw: unvalidatedClasses.map((cls, i) => `<div class="${cls}">test</div>`).join('\n'),
          extension: 'html'
        }]
      })
    ]).process(cssContent, { from: undefined });

    // If we get here, all classes are valid
    unvalidatedClasses.forEach(cls => validClassCache.set(cls, true));
  } catch (error) {
    // If there's an error, we need to validate classes individually
    // but we'll still cache the results
    await Promise.all(unvalidatedClasses.map(async (cls) => {
      try {
        const singleCssContent = `
          @tailwind utilities;
          .test {
            @apply ${cls};
          }
        `;
        await postcss([
          tailwindcss({
            ...minimalConfig,
            content: [{
              raw: `<div class="${cls}">test</div>`,
              extension: 'html'
            }]
          })
        ]).process(singleCssContent, { from: undefined });
        validClassCache.set(cls, true);
      } catch {
        validClassCache.set(cls, false);
      }
    }));
  }

  // Return results for all requested classes
  return new Map(classes.map(cls => [cls, validClassCache.get(cls)!]));
}

export async function POST(request: Request) {
  try {
    const { html, customClassName, skipCustomClasses } = await request.json();
    
    // Find all class and className attributes and their values, including object syntax
    const classRegex = /(?:class|className)=(?:"([^"]*)"|'([^']*)'|\{["']([^"']*)["']\})/g;
    let match;
    const elementClasses: { original: string; classes: string[]; nonTailwindClasses: string[]; isJsx: boolean }[] = [];
    
    // Collect all unique classes first
    const allUniqueClasses = new Set<string>();
    const matches: { isJsx: boolean; original: string; classes: string[] }[] = [];
    
    while ((match = classRegex.exec(html)) !== null) {
      const isJsx = match[0].startsWith('className');
      const classes = (match[1] || match[2] || match[3]).split(' ').filter(Boolean);
      classes.forEach(cls => allUniqueClasses.add(cls));
      matches.push({ isJsx, original: match[0], classes });
    }

    // Validate all unique classes in one go
    const validationResults = await validateClasses([...allUniqueClasses]);
    
    // Process matches using validation results
    for (const { isJsx, original, classes } of matches) {
      const tailwindClasses = classes.filter(cls => validationResults.get(cls));
      const nonTailwindClasses = classes.filter(cls => !validationResults.get(cls));
      
      elementClasses.push({
        original,
        classes: tailwindClasses,
        nonTailwindClasses,
        isJsx
      });
    }

    // Process each unique class combination
    const classMap = new Map<string, string>();
    const cssResults: string[] = [];
    
    for (let i = 0; i < elementClasses.length; i++) {
      const { classes } = elementClasses[i];
      if (classes.length === 0) continue;
      
      const classKey = classes.sort().join(' ');
      if (classMap.has(classKey)) continue;
      
      const uniqueClassName = customClassName 
        ? `${customClassName}-${i + 1}` 
        : `breeze-${Math.floor(Math.random() * 1000000)}`;
      
      classMap.set(classKey, uniqueClassName);
      
      const cssContent = `
        @tailwind utilities;
        .${uniqueClassName} {
          @apply ${classes.join(' ')};
        }
      `;

      try {
        const result = await postcss([
          tailwindcss({
            ...minimalConfig,
            content: [{
              raw: `<div class="${classes.join(' ')}">test</div>`,
              extension: 'html'
            }]
          })
        ]).process(cssContent, { from: undefined });

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
      } catch (error) {
        console.error('Error processing CSS for classes:', classes);
        continue;
      }
    }

    // Replace original classes with new unique class names, preserving non-Tailwind classes if not skipped
    let modifiedHtml = html;
    for (const { original, classes, nonTailwindClasses, isJsx } of elementClasses) {
      const classKey = classes.sort().join(' ');
      const uniqueClassName = classMap.get(classKey);
      if (uniqueClassName || (!skipCustomClasses && nonTailwindClasses.length > 0)) {
        const attributeName = isJsx ? 'className' : 'class';
        const finalClasses = [
          ...(uniqueClassName ? [uniqueClassName] : []),
          ...(!skipCustomClasses ? nonTailwindClasses : [])
        ].join(' ');
        
        const newValue = original.includes('{') ? 
          `${attributeName}={"${finalClasses}"}` : 
          `${attributeName}="${finalClasses}"`;
        modifiedHtml = modifiedHtml.replace(original, newValue);
      }
    }

    return NextResponse.json({
      originalHtml: html,
      modifiedHtml: modifiedHtml,
      styles: cssResults.join('\n\n')
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'Failed to process classes',
      details: String(error)
    }, { status: 500 });
  }
} 