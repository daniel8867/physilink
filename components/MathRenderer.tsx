
import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathRendererProps {
  text: string;
  displayMode?: boolean;
  className?: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ text, displayMode = false, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    const renderContent = (str: string) => {
      // If displayMode is true, we treat the entire input as a LaTeX block
      if (displayMode) {
        const span = document.createElement('span');
        try {
          katex.render(str, span, { 
            displayMode: true, 
            throwOnError: false,
            trust: true,
            strict: false
          });
          containerRef.current?.appendChild(span);
        } catch (e) {
          containerRef.current!.textContent = str;
        }
        return;
      }

      // Inline rendering: Split by $ delimiters
      const parts = str.split(/(\$.*?\$)/g);
      parts.forEach(part => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          const span = document.createElement('span');
          try {
            katex.render(math, span, { 
              displayMode: false, 
              throwOnError: false,
              trust: true
            });
            containerRef.current?.appendChild(span);
          } catch (e) {
            containerRef.current?.appendChild(document.createTextNode(part));
          }
        } else {
          // If a part looks like math but isn't wrapped (e.g. contains \), 
          // we could attempt to render it, but standard text is safer.
          containerRef.current?.appendChild(document.createTextNode(part));
        }
      });
    };

    renderContent(text);
  }, [text, displayMode]);

  return <div ref={containerRef} className={`${className} math-container select-text`} />;
};

export default MathRenderer;
