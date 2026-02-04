/**
 * Code Highlighting Utility using highlight.js
 * 
 * Provides syntax highlighting for code blocks with fallback to plain HTML escaping.
 * 
 * Supports: JavaScript, TypeScript, Python, Java, C++, SQL, JSON, HTML, CSS, Bash, and 100+ languages
 * 
 * Usage: highlightCode(code, 'javascript')
 */

export function highlightCode(code: string, language: string = 'javascript'): string {
  // Try to use highlight.js if available (loaded from CDN in layout.tsx)
  if (typeof window !== 'undefined' && (window as any).hljs) {
    try {
      const hljs = (window as any).hljs;
      const highlighted = hljs.highlight(code, { language, ignoreIllegals: true });
      return highlighted.value;
    } catch (e) {
      // If language not found, try auto-detection
      try {
        const hljs = (window as any).hljs;
        const highlighted = hljs.highlightAuto(code);
        return highlighted.value;
      } catch (err) {
        console.warn('highlight.js failed, falling back to plain text');
      }
    }
  }

  // Fallback: escape HTML and return as-is (no highlighting)
  // This ensures code is safe but not highlighted
  return escapeHtml(code);
}

/**
 * Escape HTML special characters to prevent XSS
 * 
 * Converts:
 * & -> &amp;
 * < -> &lt;
 * > -> &gt;
 * " -> &quot;
 * ' -> &#039;
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Detect language from code fence or patterns
 * 
 * Examples:
 * - "```javascript\ncode" -> "javascript"
 * - "```js\ncode" -> "js" -> normalized to "javascript"
 * - Auto-detect from code patterns
 */
export function detectLanguage(code: string): string {
  const firstLine = code.split('\n')[0];

  // Check if first line is a language marker (```lang)
  const match = firstLine.match(/^```([\w+-]*)/);
  if (match && match[1]) {
    return normalizeLanguage(match[1]);
  }

  // Try to detect from code patterns
  if (code.includes('function ') || code.includes('const ') || code.includes('import ')) {
    return 'javascript';
  }
  if (code.includes('def ') || code.includes('import ')) {
    return 'python';
  }
  if (code.includes('class ') && code.includes('public ')) {
    return 'java';
  }
  if (code.includes('SELECT ') || code.includes('INSERT ')) {
    return 'sql';
  }

  return 'javascript'; // default
}

/**
 * Normalize language aliases to standard names
 * 
 * Maps common short-hands:
 * js -> javascript, ts -> typescript, py -> python, etc.
 */
function normalizeLanguage(lang: string): string {
  const aliases: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    cs: 'csharp',
    php: 'php',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    bash: 'bash',
    sh: 'bash',
    zsh: 'bash',
    shell: 'bash',
    xml: 'xml',
    markdown: 'markdown',
    md: 'markdown',
    dockerfile: 'dockerfile',
    docker: 'dockerfile',
    'c': 'c',
    cpp: 'cpp',
    'c++': 'cpp',
    csharp: 'csharp',
  };

  const normalized = aliases[lang.toLowerCase()] || lang.toLowerCase();
  return normalized;
}
