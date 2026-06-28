"use client";

import * as React from "react";

interface CalligraphyLineProps {
  text: string;
}

export function CalligraphyLine({ text }: CalligraphyLineProps) {
  if (!text) return null;

  const upperText = text.toUpperCase().trim();
  const len = upperText.length;

  // Dynamically compute sizing to make sure it fits the page nicely
  let fontSize = 28;
  let letterSpacing = 8;
  let repeats = 2;

  if (len > 12) {
    fontSize = 18;
    letterSpacing = 4;
    repeats = 1;
  } else if (len > 8) {
    fontSize = 22;
    letterSpacing = 6;
    repeats = 1;
  } else if (len > 5) {
    fontSize = 24;
    letterSpacing = 8;
    repeats = 1;
  }

  // Dimensions of SVG canvas
  const width = 800;
  const height = 90;

  // Calligraphy guideline coordinates
  const yTop = 15;        // Upper ascender limit
  const yMidTop = 32;     // Upper boundary for lowercase letters
  const yMidBottom = 58;  // Baseline (where uppercase and lowercase letters sit)
  const yBottom = 75;     // Lower descender limit

  return (
    <div className="w-full flex flex-col items-center my-6 page-break-inside-avoid print:my-4">
      <div className="w-full bg-white p-3 border border-slate-100 rounded-xl shadow-sm print:border-none print:shadow-none print:p-0">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shaded central track for lowercase letters */}
          <rect
            x="0"
            y={yMidTop}
            width={width}
            height={yMidBottom - yMidTop}
            fill="#f1f5f9"
            className="print:fill-slate-100/50"
          />

          {/* Horizontal Guidelines */}
          {/* Top Line (Dashed) */}
          <line
            x1="0"
            y1={yTop}
            x2={width}
            y2={yTop}
            stroke="#cbd5e1"
            strokeWidth="0.8"
            strokeDasharray="4,4"
          />

          {/* Middle Top Line (Solid) */}
          <line
            x1="0"
            y1={yMidTop}
            x2={width}
            y2={yMidTop}
            stroke="#94a3b8"
            strokeWidth="0.8"
          />

          {/* Middle Bottom/Baseline Line (Solid, slightly darker) */}
          <line
            x1="0"
            y1={yMidBottom}
            x2={width}
            y2={yMidBottom}
            stroke="#475569"
            strokeWidth="1.2"
          />

          {/* Bottom Line (Dashed) */}
          <line
            x1="0"
            y1={yBottom}
            x2={width}
            y2={yBottom}
            stroke="#cbd5e1"
            strokeWidth="0.8"
            strokeDasharray="4,4"
          />

          {/* 1st copy of dotted text for tracing */}
          <text
            x="30"
            y={yMidBottom - 2} // Small offset to sit neatly on the baseline
            fontFamily="Comic Sans MS, 'Comic Neue', 'Arial Rounded MT Bold', sans-serif"
            fontSize={fontSize}
            fontWeight="bold"
            fill="none"
            stroke="#64748b" // slate-500 for a visible outline
            strokeWidth="1.2"
            strokeDasharray="3,3"
            letterSpacing={letterSpacing}
          >
            {upperText}
          </text>

          {/* 2nd copy if repeats = 2 */}
          {repeats > 1 && (
            <>
              {/* Divider mark between first and second word */}
              <line
                x1={width / 2}
                y1={5}
                x2={width / 2}
                y2={height - 5}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="2,4"
              />
              
              <text
                x={width / 2 + 30}
                y={yMidBottom - 2}
                fontFamily="Comic Sans MS, 'Comic Neue', 'Arial Rounded MT Bold', sans-serif"
                fontSize={fontSize}
                fontWeight="bold"
                fill="none"
                stroke="#94a3b8" // slate-400 (fainter for second copy)
                strokeWidth="1.2"
                strokeDasharray="3,3"
                letterSpacing={letterSpacing}
              >
                {upperText}
              </text>
            </>
          )}
        </svg>
      </div>
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-1.5 print:text-[8px] print:mt-1">
        ✍️ Cubra o pontilhado e continue escrevendo na pauta
      </span>
    </div>
  );
}
