'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('<div class="text-xl bg-blue-500 p-4">Hello World</div>');
  const [result, setResult] = useState<{
    jsx: string;
    className: string;
    styles: Record<string, any>;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Extract classes from the input HTML
    const classMatch = input.match(/class="([^"]+)"/);
    const classes = classMatch ? classMatch[1].split(' ') : [];

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classes,
          html: input,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Tailwind Class Compiler</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="input" className="block text-sm font-medium mb-2">
              Enter HTML/JSX with Tailwind classes:
            </label>
            <textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-32 p-2 border rounded-md"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Compile
          </button>
        </form>

        {result && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Compiled Result:</h2>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {result.jsx}
                {'\n\n'}
                {`.${result.className} {`}
                {'\n'}
                {Object.entries(result.styles[`.${result.className}`])
                  .map(([key, value]) => `  ${key}: ${value};`)
                  .join('\n')}
                {'\n}'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
