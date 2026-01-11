import React, { 
  memo, 
  useMemo, 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  useContext,
  FC
} from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize from 'rehype-sanitize';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import SearchAnime from '../../shared/animations/SearchAnime';
import { AppContext } from '../../../global/AppProvider';

import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import { useTranslation } from 'react-i18next';

interface Message {
  role?: 'user' | 'assistant';
  content?: string;
  token?: string;
  error?: boolean;
  message?: string;
}

interface ProcessedMessage {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
}

interface ResBoxProps {
  messages?: Message[];
  isGenerating?: boolean;
  className?: string;
  showTypingIndicator?: boolean;
  showWelcome?: boolean;
  adaptable?: boolean;
  newWindow?: boolean;
}

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
}

const LANGUAGES = {
  javascript, js: javascript, jsx, typescript, ts: typescript,
  python, py: python, css, json, bash, sh: bash,
} as const;

const ANIMATION_DELAYS = [0, 150, 300] as const;
const COPY_TIMEOUT_MS = 2000;

 
(() => { 
/*01001001011001100010000001111001011011110111010100100000011100110111010001101111011100000111000001100101011001000010000001110100011011110010000001110100011100100110000101101110011100110110110001100001011101000110010100101100001000000111100101101111011101010010011101110010011001010010000001100111011000010111100100101110*/
  if (typeof window !== 'undefined' && !(window as any).__syntaxHighlighterRegistered) {

    Object.entries(LANGUAGES).forEach(([name, lang]) => {
      SyntaxHighlighter.registerLanguage(name, lang);
    });
    
    (window as any).__syntaxHighlighterRegistered = true;
  }
})();

const SYNTAX_STYLE = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'rgba(0, 0, 0, 0.3)',
    margin: 0,
    padding: '1rem',
    overflow: 'auto',
    borderRadius: '0.5rem',
    border: '1px solid black',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    textShadow: 'none',
    padding: '10px',
  },
  'pre[class*="language-"] code': {
    background: 'transparent',
  },
};

const SYNTAX_CUSTOM_STYLE = {
  margin: 0,
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  lineHeight: '1.5',
  maxWidth: '100%',
  overflowWrap: 'anywhere' as const,
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const,
  backgroundColor: 'transparent',
  border: 'none',
  padding: 0,
};

const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), COPY_TIMEOUT_MS);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }, []);

  return { copied, copy };
};

const TypingIndicator: FC = () => (
  <div className="flex items-center mt-4 space-x-2 font-playfair">
    {ANIMATION_DELAYS.map((delay, idx) => (
      <span
        key={idx}
        className="w-2 h-2 bg-c-500 rounded-full animate-bounce"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </div>
);

const InlineCode: FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="bg-gray-800 text-amber-300 px-2 py-1 rounded text-sm font-mono break-all max-w-full font-playfair">
    {children}
  </code>
);

const CodeBlock: FC<CodeBlockProps> = ({ children, className, ...props }) => {
  const { copied, copy } = useCopyToClipboard();
  const match = /language-([\w+-]+)/.exec(className || '');
  const language = match?.[1]?.toLowerCase() || '';
  const code = String(children).replace(/\n$/, '');
  const isSupported = language in LANGUAGES;

  if (!match) return <InlineCode>{children}</InlineCode>;

  return (
    <div className="relative group w-full max-w-full overflow-hidden bg-[#0000004D] border border-black rounded-lg p-1">
      <button
        onClick={() => copy(code)}
        className="absolute top-2 right-2 p-2 bg-c-500 hover:bg-c-600 active:bg-c-700 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-sm"
        type="button"
        aria-label={copied ? 'Copied' : 'Copy code'}
      >
        {copied ? <Check className="h-4 w-4 text-green-700" /> : <Copy className="h-4 w-4 text-gray-700" />}
      </button>
      <div className="overflow-x-auto w-full max-w-full">
        {isSupported ? (
          <SyntaxHighlighter
            className="scrollbar-hide"
            style={SYNTAX_STYLE}
            language={language}
            PreTag="div"
            customStyle={SYNTAX_CUSTOM_STYLE}
            wrapLines
            wrapLongLines
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          <pre className="text-sm p-4 bg-gray-900 rounded-md overflow-x-auto">
            <code className="text-amber-300 font-mono break-all font-playfair">{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

const MARKDOWN_COMPONENTS: Components = {
  code: CodeBlock as any,
  h1: (props) => <h1 className="text-4xl font-bold text-white/90 mb-5 mt-7 font-playfair" {...props} />,
  h2: (props) => <h2 className="text-3xl font-semibold text-white/85 mb-4 mt-6 font-playfair" {...props} />,
  h3: (props) => <h3 className="text-2xl font-semibold text-white/80 mb-3 mt-5 font-playfair" {...props} />,
  p: (props) => <p className="text-white/75 mb-5 leading-relaxed break-words font-playfair text-[16.5px]" {...props} />,
  a: ({ href, ...props }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-amber-400 underline break-all font-playfair text-[16.5px]" {...props} />
  ),
  ul: (props) => <ul className="list-disc pl-5 mb-4 text-white/75" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 mb-4 text-white/75" {...props} />,
  li: (props) => <li className="mb-1 text-white/75" {...props} />,
};

const WELCOME_CONFIG = {
  adaptable: { text: 'olá, alguma dúvida?', size: 'text-lg' },
  newWindow: { text: 'bom dia, como posso ajudar?', size: 'text-2xl' },
  default: { text: 'Conte-me sobre o seu projeto!', size: 'text-4xl' },
};

const WelcomeMessage: FC<{ adaptable: boolean; newWindow: boolean }> = ({ adaptable, newWindow }) => {
  const config = adaptable && !newWindow ? WELCOME_CONFIG.adaptable : 
                newWindow ? WELCOME_CONFIG.newWindow : WELCOME_CONFIG.default;

  return (
    <div className={`${adaptable ? 'translate-y-44 pt-20 pl-10 pr-10' : 'fixed'} inset-0 flex items-center justify-center pointer-events-none`}>
      <h1 className={`font-playfair text-b-500 font-bold ${config.size}`}>{config.text}</h1>
    </div>
  );
};

const useProcessedMessages = (messages: Message[], isGenerating: boolean) => {
  return useMemo(() => {
    const result: ProcessedMessage[] = [];
    let response = '';

    messages.forEach((msg, index) => {
      if (msg.role === 'user') {
        result.push({ id: `user-${index}`, type: 'user', content: msg.content || '' });
      } else if (msg.token) {
        response += msg.token;
      } else if (msg.content) {
        result.push({ id: `assistant-${index}`, type: 'assistant', content: msg.content });
      } else if (msg.error) {
        result.push({ id: `error-${index}`, type: 'error', content: msg.message || 'An error occurred while processing your request.' });
      }
    });

    return { processedMessages: result, currentResponse: isGenerating ? response : '' };
  }, [messages, isGenerating]);
};

const ResBox: FC<ResBoxProps> = memo(({
  messages = [],
  isGenerating = false,
  className = '',
  showTypingIndicator = true,
  showWelcome = true,
  adaptable = false,
  newWindow = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { searchCode } = useContext(AppContext);
  const isSearching = searchCode === 200 || searchCode === 300;
  const { processedMessages, currentResponse } = useProcessedMessages(messages, isGenerating);
  const [errCnt, setErrCnt] = useState(0);
  const { t } = useTranslation('common');

  useEffect(() => {
    const lastMessage = processedMessages[processedMessages.length - 1];
    if (lastMessage?.type === 'assistant') {
      const isError = lastMessage.content.trim().startsWith('Error:');
      setErrCnt(isError ? prev => prev + 1 : 0);
    }
  }, [processedMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [processedMessages, currentResponse, isGenerating]);

  if (processedMessages.length === 0 && !isGenerating && showWelcome) {
    return <WelcomeMessage adaptable={adaptable} newWindow={newWindow} />;
  }

  return (
    <div className={`fixed inset-0 flex items-start justify-center pt-20 pl-10 pr-10 scrollbar-hide ${className}`} style={{ zIndex: 1, pointerEvents: 'none' }}>
      <div className="relative w-full max-w-4xl p-4 pointer-events-auto scrollbar-hide text-white/80" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
        {processedMessages.map((msg) => (
          <React.Fragment key={msg.id}>
            {msg.type === 'user' && (
              <div className="flex justify-end mb-6">
                <div className="max-w-[85%] p-4 rounded-3xl bg-[#0000004D] border-black border font-semibold text-white shadow-md break-words">
                  <p className="m-0 leading-relaxed font-playfair text-[0.95rem]">{msg.content}</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#0000004D] border-black border flex justify-end" />
                <div className="w-2 h-2 rounded-full bg-[#0000004D] border-black border flex justify-end" />
              </div>
            )}
            {msg.type === 'error' && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-red-300 font-medium">{msg.content}</p>
              </div>
            )}
            {msg.type === 'assistant' && (
              <div className="mb-6 font-playfair text-white/80 [&>p]:text-white/75 [&>ul]:text-white/75 [&>ol]:text-white/75 [&>li]:text-white/75 [&>h1]:text-white/90 [&>h2]:text-white/85 [&>h3]:text-white/80">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeSanitize]} components={MARKDOWN_COMPONENTS}>
                  {(() => {
                    const isError = msg.content.trim().startsWith('Error:');
                    return isError && errCnt < 5 ? t('awaitMount',{ returnObjects: false }): msg.content;
                  })()}
                </ReactMarkdown>
              </div>
            )}
          </React.Fragment>
        ))}

        {isGenerating && currentResponse && (
          <>
            <div className="mb-6 font-playfair text-white/80 [&>p]:text-white/75 [&>ul]:text-white/75 [&>ol]:text-white/75 [&>li]:text-white/75 [&>h1]:text-white/90 [&>h2]:text-white/85 [&>h3]:text-white/80">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeSanitize]} components={MARKDOWN_COMPONENTS}>
                {currentResponse}
              </ReactMarkdown>
            </div>
            {showTypingIndicator && <TypingIndicator />}
          </>
        )}

        {isGenerating && !currentResponse && showTypingIndicator && (
          isSearching ? <div className="w-full h-[200px]"><SearchAnime color="white" /></div> : <TypingIndicator />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});
ResBox.displayName = 'ResBox';

export default ResBox;
