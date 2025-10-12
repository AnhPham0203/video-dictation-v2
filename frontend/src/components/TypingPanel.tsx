import React, { useState, useEffect, useRef } from 'react';

interface TypingPanelProps {
  textToType: string;
  onComplete: () => void;
}

export const TypingPanel: React.FC<TypingPanelProps> = ({ textToType, onComplete }) => {
  const [typed, setTyped] = useState<string>('');
  const [cursorIndex, setCursorIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset state when a new sentence is provided
    setTyped('');
    setCursorIndex(0);
    inputRef.current?.focus();
  }, [textToType]);

  useEffect(() => {
    // Focus the hidden input when the component mounts or the tab becomes active
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const { key } = e;

    if (key === 'Backspace') {
      setTyped((prev) => prev.slice(0, -1));
      setCursorIndex((prev) => Math.max(0, prev - 1));
    } else if (key.length === 1) { // Handle printable characters
      if (cursorIndex < textToType.length) {
        setTyped((prev) => prev + key);
        setCursorIndex((prev) => prev + 1);
      }
    }

    // Check for completion
    if (cursorIndex + 1 === textToType.length && key === textToType[cursorIndex]) {
      setTimeout(() => {
        onComplete();
      }, 300); // Delay before moving to the next sentence
    }
  };

  const characters = textToType.split('').map((char, index) => {
    let className = 'text-gray-500'; // Untyped characters
    if (index < typed.length) {
      className = typed[index] === char ? 'text-white' : 'text-red-500 bg-red-900/50 rounded'; // Correct vs Incorrect
    }

    // Caret styling
    const isCaret = index === cursorIndex;
    const caretClass = isCaret ? 'relative caret' : '';

    return (
      <span key={index} className={`${className} ${caretClass}`}>
        {isCaret && <span className="absolute left-0 top-0 h-full w-0.5 bg-yellow-400 animate-pulse" />}
        {char}
      </span>
    );
  });

  return (
    <div 
      className="p-6 bg-gray-800 rounded-lg font-mono text-2xl leading-loose relative focus:outline-none" 
      tabIndex={0}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        className="absolute inset-0 opacity-0 cursor-default"
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <div className="whitespace-pre-wrap select-none">
        {characters}
      </div>
    </div>
  );
};
