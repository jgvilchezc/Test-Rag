import React, { useEffect, useMemo, useState, memo, useRef } from "react";
import markdownit from "markdown-it";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
// @ts-ignore
import DOMPurify from "dompurify";
import { FiCopy, FiDownload, FiEdit } from "react-icons/fi";

// Import common languages
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";

// Add custom CSS for syntax highlighting and footnote links
const syntaxHighlightStyles = `
  /* General token colors for all languages */
  .token.keyword { color: #c678dd !important; }
  .token.function { color: #61afef !important; }
  .token.function-name { color: #61afef !important; }
  .token.method { color: #61afef !important; }
  .token.property { color: #d19a66 !important; }
  .token.string { color: #98c379 !important; }
  .token.number { color: #d19a66 !important; }
  .token.comment { color: #5c6370 !important; font-style: italic !important; }
  .token.operator { color: #56b6c2 !important; }
  .token.punctuation { color: #abb2bf !important; }
  .token.variable { color: #e06c75 !important; }
  .token.constant { color: #d19a66 !important; }
  .token.class-name { color: #e5c07b !important; }
  .token.boolean { color: #d19a66 !important; }
  .token.builtin { color: #e5c07b !important; }
  .token.selector { color: #d19a66 !important; }
  .token.attr-name { color: #d19a66 !important; }
  .token.attr-value { color: #98c379 !important; }
  .token.tag { color: #e06c75 !important; }
  .token.namespace { color: #e5c07b !important; }
  
  /* Override default prism styles */
  pre[class*="language-"] { 
    background: transparent !important; 
    margin: 0 !important;
    padding: 0 !important;
  }
  code[class*="language-"] { 
    background: transparent !important; 
    color: #abb2bf !important;
    text-shadow: none !important;
  }
  
  /* Footnote links styling */
  .break-words a {
    color: #3b82f6 !important;
    text-decoration: underline !important;
  }
  .break-words a:hover {
    color: #1d4ed8 !important;
    text-decoration: underline !important;
  }
  
  /* Footnote title styling */
  .footnote-title {
    color: #374151 !important;
    font-weight: 500 !important;
  }
  
  /* Image cursor styling */
  img {
    cursor: pointer !important;
    max-width: 100%;
    border-radius: 8px;
  }
  
  /* Table responsive styling */
  .chat-content-wrapper {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }
  
  .chat-content-wrapper .prose table {
    display: block;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
    margin: 1rem 0;
  }
  
  .chat-content-wrapper .prose table th,
  .chat-content-wrapper .prose table td {
    padding: 0.5rem;
    border: 1px solid #374151;
  }
`;

const md = markdownit({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str, lang) {
    if (lang && Prism.languages[lang]) {
      try {
        return (
          '<pre class="language-' +
          lang +
          '"><code>' +
          Prism.highlight(str, Prism.languages[lang], lang) +
          "</code></pre>"
        );
      } catch (__) {}
    }
    return (
      '<pre class="language-none"><code>' +
      md.utils.escapeHtml(str) +
      "</code></pre>"
    );
  },
});

md.renderer.rules.image = function (tokens, idx) {
  const token = tokens[idx];
  const srcIndex = token.attrIndex("src");
  const src = srcIndex >= 0 ? token.attrs[srcIndex][1] : "";
  const alt = token.content || "";
  const title = token.attrGet("title") || "";

  return `<img src="${md.utils.escapeHtml(src)}" alt="${md.utils.escapeHtml(
    alt
  )}" ${
    title ? `title="${md.utils.escapeHtml(title)}"` : ""
  } />`;
};

const sanitizeHtml = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "a", "b", "blockquote", "br", "code", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr",
      "i", "img", "li", "ol", "p", "pre", "span", "strong", "table", "tbody", "td", "th", "thead",
      "tr", "ul", "sup", "del", "ins", "sub", "mark", "small", "abbr", "cite", "q", "s", "u",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "class", "id", "src", "alt", "title", "width", "height", "align",
    ],
    ADD_ATTR: ["target"],
  });
};

const createAssetHandlers = () => {
  const handleAssetCopy = (asset) => {
    navigator.clipboard.writeText(asset.content);
    // Simple alert replacement for toast
    // alert("Code copied to clipboard"); 
  };

  const handleAssetDownload = (asset) => {
    const mimeType =
      asset.type === "image"
        ? "image/png"
        : asset.type === "code"
        ? "text/plain"
        : "text/markdown";

    const blob = new Blob([asset.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = asset.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAssetEdit = (asset) => {
    console.log("Edit requested for", asset);
  };

  return {
    handleAssetCopy,
    handleAssetDownload,
    handleAssetEdit,
  };
};

const ToolbarButton = memo(({ icon: Icon, tooltip, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      title={tooltip}
      className="p-2 rounded text-gray-500 hover:text-gray-700"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "32px",
        minHeight: "32px",
        transition: "all 0.15s ease",
        backgroundColor: isHovered ? "#e5e7eb" : "transparent",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Icon size={16} />
    </button>
  );
});
ToolbarButton.displayName = "ToolbarButton";

const AssetActionToolbar = memo(({ asset, handlers }) => {
  return (
    <div
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      style={{
        position: "absolute",
        top: "8px",
        right: "8px",
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        padding: "4px",
        borderRadius: "6px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      }}
    >
      <ToolbarButton
        icon={FiCopy}
        tooltip="Copy"
        onClick={(e) => {
          e.stopPropagation();
          handlers.handleAssetCopy(asset);
        }}
      />
      <ToolbarButton
        icon={FiDownload}
        tooltip="Download"
        onClick={(e) => {
          e.stopPropagation();
          handlers.handleAssetDownload(asset);
        }}
      />
    </div>
  );
});
AssetActionToolbar.displayName = "AssetActionToolbar";

const CodeBlock = memo(({ asset, handlers }) => {
  const [isHovered, setIsHovered] = useState(false);

  const highlightedContent = useMemo(() => {
    if (asset.language && Prism.languages[asset.language]) {
      try {
        return Prism.highlight(
          asset.content,
          Prism.languages[asset.language],
          asset.language
        );
      } catch (e) {
        console.error("Prism highlighting error:", e);
      }
    }
    return md.utils.escapeHtml(asset.content);
  }, [asset.content, asset.language]);

  return (
    <div
      className="relative group bg-[#1d1f21] rounded-lg overflow-hidden border border-gray-700 my-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AssetActionToolbar asset={asset} handlers={handlers} />
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700 bg-[#282c34]">
        <span className="text-xs text-gray-400 font-mono lower">{asset.language}</span>
      </div>
      <div className="p-4 text-sm overflow-x-auto">
        <pre
          className={`language-${asset.language} !bg-transparent !p-0 !m-0`}
          style={{ backgroundColor: "transparent", margin: 0, padding: 0 }}
        >
          <code
            className={`language-${asset.language}`}
            dangerouslySetInnerHTML={{ __html: highlightedContent }}
          />
        </pre>
      </div>
    </div>
  );
});
CodeBlock.displayName = "CodeBlock";

export default function ChatViewFormatter({ content, status = "completed" }) {
  const [processedContent, setProcessedContent] = useState(content);
  const assetHandlers = useMemo(() => createAssetHandlers(), []);

  // Update content when prop changes
  useEffect(() => {
    setProcessedContent(content);
  }, [content]);

  // Inject styles
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = syntaxHighlightStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const { parts } = useMemo(() => {
    let mainContent = processedContent;
    const parts = [];
    
    // Improved regex to capture code blocks more reliably
    const fenceRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    let codeBlockIndex = 0;

    while ((match = fenceRegex.exec(mainContent)) !== null) {
      if (match.index > lastIndex) {
        const textContent = mainContent.substring(lastIndex, match.index);
        if (textContent.trim()) {
            parts.push(textContent);
        }
      }

      const language = match[1] || "text";
      const code = match[2];
      
      parts.push({
        id: `code-${codeBlockIndex++}`,
        type: "code",
        content: code, // trim? maybe not for code
        language,
        name: `snippet.${language}`
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < mainContent.length) {
      parts.push(mainContent.substring(lastIndex));
    }

    return { parts };
  }, [processedContent]);

  return (
    <div className="chat-content-wrapper text-white leading-relaxed">
      {parts.map((part, index) => {
        if (typeof part === "string") {
          const htmlContent = md.render(part);
          const sanitizedHtml = sanitizeHtml(htmlContent);
          
          return (
            <div
              key={index}
              className="prose prose-invert max-w-none prose-p:my-2 prose-headings:my-4 prose-ul:my-2 prose-ol:my-2"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          );
        } else {
          return (
            <CodeBlock
              key={part.id}
              asset={part}
              handlers={assetHandlers}
            />
          );
        }
      })}
      {status === "streaming" && (
        <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-1 align-middle"></span>
      )}
    </div>
  );
}
