import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LegalMarkdownProps {
  source: string;
}

export default function LegalMarkdown({ source }: LegalMarkdownProps) {
  return (
    <div className="legal-markdown text-sm leading-relaxed text-on-surface-variant space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface mt-6 first:mt-0">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="font-headline text-base font-bold tracking-tight text-on-surface mt-6 first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="font-headline text-sm font-bold tracking-tight text-on-surface mt-4">
              {children}
            </h4>
          ),
          h4: ({ children }) => (
            <h5 className="font-bold text-on-surface mt-3">{children}</h5>
          ),
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1.5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary underline underline-offset-2 hover:opacity-80"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-on-surface">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="px-1 py-0.5 rounded bg-surface-container-high text-[0.85em] text-on-surface">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 italic text-on-surface-variant/80">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-outline-variant/30" />,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-surface-container-high">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="text-left px-3 py-2 border border-outline-variant/30 font-bold text-on-surface">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border border-outline-variant/30 align-top">{children}</td>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
