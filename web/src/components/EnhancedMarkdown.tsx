import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkBreaks from 'remark-breaks'

interface EnhancedMarkdownProps {
  children: string
  className?: string
  isDark?: boolean
}

export function EnhancedMarkdown({ children, className = '', isDark = false }: EnhancedMarkdownProps) {
  // Normalize newlines - convert escaped \n to actual newlines
  // The remark-breaks plugin will handle converting single newlines to <br> tags
  const normalizedContent = children.replace(/\\n/g, '\n')

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert chat-message-prose ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
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
          
          // Handle line breaks
          br() {
            return <br className="leading-relaxed" />
          },
          
          // Handle text nodes with proper whitespace
          text({ children }) {
            return <span className="whitespace-pre-wrap">{children}</span>
          },
          
          // Enhanced header styling
          h1({ children }) {
            return <h1 className="text-xl font-bold border-b-2 border-border pb-2 mb-4 mt-6 first:mt-0 last:mb-0">{children}</h1>
          },
          
          h2({ children }) {
            return <h2 className="text-lg font-semibold border-b border-border/50 pb-1 mb-3 mt-5 first:mt-0 last:mb-0">{children}</h2>
          },
          
          h3({ children }) {
            return <h3 className="text-base font-medium mb-2 mt-4 first:mt-0 last:mb-0">{children}</h3>
          },
          
          h4({ children }) {
            return <h4 className="text-sm font-medium italic text-muted-foreground mb-1.5 mt-3.5 first:mt-0 last:mb-0">{children}</h4>
          },
          
          h5({ children }) {
            return <h5 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1 mt-3 first:mt-0 last:mb-0">{children}</h5>
          },
          
          h6({ children }) {
            return <h6 className="text-xs font-normal uppercase tracking-widest text-muted-foreground/80 mb-0.5 mt-2 first:mt-0 last:mb-0">{children}</h6>
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
