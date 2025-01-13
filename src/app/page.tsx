'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ClipboardIcon,
  CheckIcon,
  PencilIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface ClassMapping {
  oldName: string;
  newName: string;
  isEditing?: boolean;
}

// Function to validate and format class name
const formatClassName = (name: string): string => {
  // Remove spaces, dots, and other invalid characters
  // Only allow: letters, numbers, hyphens, and underscores
  return name.replace(/[^a-zA-Z0-9-_]/g, '');
};

export default function Home() {
  const [input, setInput] = useState('');
  const [customClassName, setCustomClassName] = useState('');
  const [result, setResult] = useState<{
    originalHtml: string;
    modifiedHtml: string;
    styles: string;
  } | null>(null);
  const [copied, setCopied] = useState<'html' | 'css' | null>(null);
  const [classMappings, setClassMappings] = useState<ClassMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [skipCustomClasses, setSkipCustomClasses] = useState(false);

  useEffect(() => {
    if (editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [classMappings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!input.trim()) {
      setError('Please enter some HTML/JSX with Tailwind classes');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: input,
          customClassName: customClassName.trim() || undefined,
          skipCustomClasses
        }),
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setResult(data);

      // Extract and set initial class mappings
      const classNames = new Set<string>();
      const classRegex = /(?:class|className)=(?:"([^"]*)"|'([^']*)'|\{["']([^"']*)["']\})/g;
      let match;
      while ((match = classRegex.exec(data.modifiedHtml)) !== null) {
        const className = match[1] || match[2] || match[3];
        if (className) {
          classNames.add(className);
        }
      }
      setClassMappings(Array.from(classNames).map(name => ({
        oldName: name,
        newName: name,
        isEditing: false
      })));
    } catch (error) {
      setError('Failed to process the request. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (type: 'html' | 'css', content: string) => {
    let finalContent = content;
    if (classMappings.length > 0) {
      classMappings.forEach(mapping => {
        finalContent = finalContent.replace(new RegExp(mapping.oldName, 'g'), mapping.newName);
      });
    }
    await navigator.clipboard.writeText(finalContent);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const startEditing = (oldName: string) => {
    setClassMappings(prev =>
      prev.map(mapping => ({
        ...mapping,
        isEditing: mapping.oldName === oldName
      }))
    );
  };

  const handleClassNameChange = (oldName: string, newValue: string) => {
    // Format the new value to be a valid class name
    const validClassName = formatClassName(newValue);

    setClassMappings(prev =>
      prev.map(mapping =>
        mapping.oldName === oldName ? {
          ...mapping,
          newName: validClassName,
          isEditing: true
        } : mapping
      )
    );
  };

  const handleClassNameUpdate = (oldName: string, newValue: string) => {
    // Format the final value and ensure it's not empty
    const validClassName = formatClassName(newValue);

    setClassMappings(prev =>
      prev.map(mapping =>
        mapping.oldName === oldName ? {
          ...mapping,
          newName: validClassName || mapping.oldName, // Fallback to oldName if empty
          isEditing: false
        } : mapping
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent, oldName: string, newValue: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleClassNameUpdate(oldName, newValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClassNameUpdate(oldName, oldName); // Reset to original name
    }
  };

  const formatCode = (code: string) => {
    let formattedCode = code.split('\n').map(line => line.trim()).join('\n');
    if (classMappings.length > 0) {
      classMappings.forEach(mapping => {
        formattedCode = formattedCode.replace(new RegExp(mapping.oldName, 'g'), mapping.newName);
      });
    }
    return formattedCode;
  };

  const clearAll = () => {
    setInput('');
    setCustomClassName('');
    setResult(null);
    setCopied(null);
    setClassMappings([]);
    setError(null);
    setSkipCustomClasses(false);
  };

  return (
    <main className="min-h-screen bg-[#0F172A] text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-cyan-500/20 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

      <div className="max-w-7xl mx-auto px-4 py-12 pb-24 relative">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <SparklesIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
              Breeze
            </h1>
          </div>
          <p className="text-xl text-blue-200/80">
            Transform your Tailwind classes into clean, optimized CSS
          </p>
          <div className="flex justify-center gap-4 text-sm text-blue-300/60">
            <span>Instant Compilation</span>
            <span>•</span>
            <span>Custom Class Names</span>
            <span>•</span>
            <span>Modern CSS Output</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <div className="bg-[#1E293B]/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-semibold text-blue-200">Input</h2>
              <button
                onClick={clearAll}
                className="px-3 py-1.5 text-xs text-blue-200/60 hover:text-blue-200 border border-blue-500/20 hover:border-blue-500/40 rounded-xl transition-all duration-200 flex items-center space-x-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear All</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="input" className="block text-sm font-medium text-blue-200 mb-2">
                  Enter HTML/JSX with Tailwind classes
                </label>
                <div className="relative group">
                  <textarea
                    id="input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full h-64 p-4 bg-[#0F172A]/60 border border-blue-500/20 rounded-2xl text-blue-100 font-mono text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 placeholder-blue-300/20"
                    placeholder="<div class='text-xl bg-blue-500 p-4'>Hello World</div>"
                  />
                  <CodeBracketIcon className="absolute top-4 right-4 w-5 h-5 text-cyan-400/30 group-hover:text-cyan-400/50 transition-colors duration-200" />
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>

              <div>
                <label htmlFor="className" className="block text-sm font-medium text-blue-200 mb-2">
                  Custom Class Name Prefix (optional)
                </label>
                <input
                  type="text"
                  id="className"
                  value={customClassName}
                  onChange={(e) => setCustomClassName(e.target.value)}
                  className="w-full p-4 bg-[#0F172A]/60 border border-blue-500/20 rounded-2xl text-blue-100 font-mono text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 placeholder-blue-300/20"
                  placeholder="my-component"
                />
                <p className="mt-2 text-sm text-blue-300/60">
                  Numbers will be appended for multiple elements (e.g., my-component-1, my-component-2)
                </p>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipCustomClasses}
                    onChange={(e) => setSkipCustomClasses(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ms-3 text-sm font-medium text-blue-200">Skip Custom Classes</span>
                </label>
                <div className="text-xs text-blue-300/60">
                  When enabled, non-Tailwind classes will be removed from the output
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl transition-all duration-200 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                {loading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    <span>Transform</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Output Section */}
          {result && (
            <div className="space-y-6">
              {/* Generated Classes */}
              <div className="bg-[#1E293B]/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-blue-200">
                    Generated Classes
                  </h2>
                  <p className="text-sm text-blue-300/60">Click to edit</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {classMappings.map(mapping => (
                    <div
                      key={mapping.oldName}
                      className={`
                        group relative px-3 py-1.5 bg-[#0F172A]/60 rounded-xl text-sm font-mono border border-blue-500/20
                        ${mapping.isEditing ? 'ring-2 ring-cyan-500/50' : 'hover:border-blue-500/40'}
                        transition-all duration-200
                      `}
                    >
                      {mapping.isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={mapping.newName}
                          onChange={(e) => handleClassNameChange(mapping.oldName, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, mapping.oldName, mapping.newName)}
                          onBlur={() => handleClassNameUpdate(mapping.oldName, mapping.newName)}
                          className="bg-transparent w-full focus:outline-none font-mono text-blue-100 min-w-[60px] placeholder-blue-300/20"
                          placeholder="class-name"
                        />
                      ) : (
                        <button
                          onClick={() => startEditing(mapping.oldName)}
                          className="flex items-center space-x-1 min-w-[60px] w-full"
                        >
                          <span className="text-blue-100">{mapping.newName}</span>
                          <PencilIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-cyan-400 ml-1" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* HTML Result */}
              <div className="bg-[#1E293B]/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-blue-200">Transformed HTML</h2>
                  <button
                    onClick={() => copyToClipboard('html', formatCode(result.modifiedHtml))}
                    className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                  >
                    {copied === 'html' ? (
                      <CheckIcon className="w-5 h-5 text-teal-400" />
                    ) : (
                      <ClipboardIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <pre className="bg-[#0F172A]/60 p-4 rounded-2xl overflow-x-auto font-mono text-sm text-blue-100 whitespace-pre-wrap border border-blue-500/20">
                  {formatCode(result.modifiedHtml)}
                </pre>
              </div>

              {/* CSS Result */}
              <div className="bg-[#1E293B]/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-blue-200">Generated CSS</h2>
                  <button
                    onClick={() => copyToClipboard('css', formatCode(result.styles))}
                    className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                  >
                    {copied === 'css' ? (
                      <CheckIcon className="w-5 h-5 text-teal-400" />
                    ) : (
                      <ClipboardIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <pre className="bg-[#0F172A]/60 p-4 rounded-2xl overflow-x-auto font-mono text-sm text-blue-100 whitespace-pre-wrap border border-blue-500/20">
                  {formatCode(result.styles)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-blue-200/60 hover:text-blue-200 transition-colors duration-200 text-xs">
          <span>Made with ❤️ by Mohamed Shuaau</span>
          <a
            href="https://github.com/mohammedshuaau"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:text-cyan-400 transition-colors duration-200"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 ml-1"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </footer>
    </main>
  );
}
