import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/components/providers/ThemeProvider';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    const { theme } = useTheme();
    const syntaxTheme = theme === 'dark' ? oneDark : oneLight;

    let markdownContent = content;

    const match = content.match(/Arguments:\s*({[\s\S]*})/);
    if (match) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed && typeof parsed === 'object' && 'code' in parsed) {
                const codeBlock = `\n\`\`\`python\n${parsed.code}\n\`\`\`\n`;
                const before = content.slice(0, match.index! + match[0].indexOf('{')).split('Arguments:')[0];
                markdownContent = before + codeBlock;
            }
        } catch (err) {
        }
    }

    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Headers
                    h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-foreground mb-2 pb-2 border-b border-border" >
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-foreground pb-1 mb-2 border-b border-border" >
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-foreground" >
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-base font-semibold text-foreground" >
                            {children}
                        </h4>
                    ),
                    h5: ({ children }) => (
                        <h5 className="text-sm font-semibold text-foreground" >
                            {children}
                        </h5>
                    ),
                    h6: ({ children }) => (
                        <h6 className="text-xs font-semibold text-foreground" >
                            {children}
                        </h6>
                    ),

                    // Paragraphs
                    p: ({ children }) => (
                        <p className="text-foreground leading-relaxed" style={{whiteSpace: "pre-wrap"}}>
                            {children}
                        </p>
                    ),

                    // Code blocks
                    code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const isInline = !match;
                        

                        if (!isInline && language) {
                            return (
                                <pre className="bg-muted border border-border rounded-lg p-4 my-4 overflow-x-auto">
                                    <SyntaxHighlighter
                                        style={syntaxTheme}
                                        language={language}
                                        PreTag="div"
                                        customStyle={{
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '0',
                                            margin: '0',
                                        }}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                </pre>
                            );
                        }

                        // Inline code
                        return (
                            <code
                                className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm border border-border"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },

                    // Lists
                    ul: ({ children }) => (
                        <ul className="list-disc list-outside space-y-1 text-foreground ml-6" >
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-outside space-y-1 text-foreground ml-6" >
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="text-foreground pl-1" >
                            {children}
                        </li>
                    ),

                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 underline decoration-primary/40 hover:decoration-primary/60 transition-colors duration-200"
                        >
                            {children}
                        </a>
                    ),

                    // Blockquotes
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted rounded-r-lg italic text-muted-foreground">
                            {children}
                        </blockquote>
                    ),

                    // Horizontal rule
                    hr: () => (
                        <hr className="my-6 border-border" />
                    ),

                    // Tables
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                            <table className="min-w-full border border-border rounded-lg overflow-hidden">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-muted border-b border-border">
                            {children}
                        </thead>
                    ),
                    tbody: ({ children }) => (
                        <tbody className="divide-y divide-border">
                            {children}
                        </tbody>
                    ),
                    tr: ({ children }) => (
                        <tr className="hover:bg-muted/50 transition-colors">
                            {children}
                        </tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-4 py-2 text-sm text-foreground">
                            {children}
                        </td>
                    ),

                    // Task lists
                    input: ({ type, checked, ...props }) => {
                        if (type === 'checkbox') {
                            return (
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled
                                    className="mr-2 accent-primary"
                                    {...props}
                                />
                            );
                        }
                        return <input type={type} {...props} />;
                    },

                    // Strikethrough
                    del: ({ children }) => (
                        <del className="text-muted-foreground line-through">
                            {children}
                        </del>
                    ),

                    // Strong/Bold
                    strong: ({ children }) => (
                        <strong className="font-bold text-foreground">
                            {children}
                        </strong>
                    ),

                    // Emphasis/Italic
                    em: ({ children }) => (
                        <em className="italic text-foreground">
                            {children}
                        </em>
                    ),
                }}
            >
                {markdownContent}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
