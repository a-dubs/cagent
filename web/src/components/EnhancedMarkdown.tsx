import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface EnhancedMarkdownProps {
  children: string
  className?: string
  isDark?: boolean
}

export function EnhancedMarkdown({ children, className = '', isDark = false }: EnhancedMarkdownProps) {
  // Normalize newlines - convert \n to actual line breaks for better rendering
  const normalizedContent = children.replace(/\\n/g, '\n')

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert chat-message-prose ${className}`}>
      <ReactMarkdown
        components={{
          // Enhanced code block rendering with syntax highlighting
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            if (!inline && language) {
              return (
                <SyntaxHighlighter
                  style={isDark ? (oneDark as any) : (oneLight as any)}
                  language={language}
                  PreTag="div"
                  className="rounded-md"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              )
            }
            
            // Inline code
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          
          // Basic table rendering (without GFM plugin)
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-border">
                  {children}
                </table>
              </div>
            )
          },
          
          thead({ children }) {
            return (
              <thead className="bg-muted/50">
                {children}
              </thead>
            )
          },
          
          th({ children }) {
            return (
              <th className="border border-border px-3 py-2 text-left font-semibold">
                {children}
              </th>
            )
          },
          
          td({ children }) {
            return (
              <td className="border border-border px-3 py-2">
                {children}
              </td>
            )
          },
          
          // Better paragraph handling for newlines
          p({ children }) {
            return <p className="whitespace-pre-wrap">{children}</p>
          },
          
          // Enhanced blockquote styling
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground bg-muted/20 py-2 rounded-r">
                {children}
              </blockquote>
            )
          },
          
          // Enhanced list styling
          ul({ children }) {
            return <ul className="list-disc pl-6 space-y-1">{children}</ul>
          },
          
          ol({ children }) {
            return <ol className="list-decimal pl-6 space-y-1">{children}</ol>
          },
          
          // Enhanced link styling
          a({ href, children }) {
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline underline-offset-2"
              >
                {children}
              </a>
            )
          }
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  )
}
