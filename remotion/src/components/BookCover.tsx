import React from "react";

// Exact MyPhonicsBooks level colours from the project
export const LEVEL_COLOURS = {
  1: "#E84B8A", // Pink
  2: "#F59E0B", // Amber  
  3: "#22C55E", // Green
  4: "#3B82F6", // Blue
  5: "#8B5CF6", // Purple
  6: "#14B8A6", // Teal
};

export const LEVEL_NAMES = {
  1: "Starting Stories",
  2: "Longer Sounds",
  3: "New Spellings",
  4: "Building Fluency",
  5: "Reading Together",
  6: "Reading Champion",
};

interface BookCoverProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  width?: number;
  height?: number;
  showSpine?: boolean;
}

/**
 * MyPhonicsBooks Cover Template
 * Matches the actual book design from templates/book.html
 */
export const BookCover: React.FC<BookCoverProps> = ({
  level,
  title,
  width = 200,
  height = 280,
  showSpine = false,
}) => {
  const levelColor = LEVEL_COLOURS[level];
  const levelName = LEVEL_NAMES[level];

  return (
    <div
      style={{
        width,
        height,
        background: levelColor,
        borderRadius: 8,
        border: "3px solid white",
        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Level colour band at top (matches actual book) */}
      <div
        style={{
          width: "100%",
          height: "20%",
          background: levelColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
        }}
      >
        {/* Brand mark */}
        <span
          style={{
            fontSize: width * 0.08,
            fontWeight: 700,
            color: "white",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          MyPhonicsBooks
        </span>
        
        {/* Level badge */}
        <div
          style={{
            background: "rgba(255,255,255,0.3)",
            padding: "4px 10px",
            borderRadius: 12,
            fontSize: width * 0.06,
            fontWeight: 600,
            color: "white",
          }}
        >
          L{level}
        </div>
      </div>

      {/* Main illustration area (white background) */}
      <div
        style={{
          flex: 1,
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        {/* Placeholder for book illustration */}
        <div
          style={{
            width: "80%",
            height: "80%",
            background: `linear-gradient(135deg, ${levelColor}15, ${levelColor}05)`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: width * 0.25, opacity: 0.5 }}>
            📚
          </span>
        </div>
      </div>

      {/* Title band at bottom */}
      <div
        style={{
          width: "100%",
          background: levelColor,
          padding: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: width * 0.07,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            fontFamily: "'Andika', sans-serif",
            lineHeight: 1.2,
          }}
        >
          {title}
        </span>
      </div>

      {/* Spine (if showing 3D effect) */}
      {showSpine && (
        <div
          style={{
            position: "absolute",
            right: -8,
            top: 0,
            width: 16,
            height: "100%",
            background: `linear-gradient(90deg, ${levelColor}DD, ${levelColor}88)`,
            transform: "perspective(400px) rotateY(-15deg)",
            transformOrigin: "left center",
          }}
        />
      )}
    </div>
  );
};

/**
 * Open Book Component (shows interior pages)
 */
interface OpenBookProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  leftPageText: string;
  rightPageContent?: React.ReactNode;
  childName?: string;
}

export const OpenBook: React.FC<OpenBookProps> = ({
  level,
  leftPageText,
  rightPageContent,
  childName = "Emma",
}) => {
  const levelColor = LEVEL_COLOURS[level];

  return (
    <div
      style={{
        display: "flex",
        perspective: "1200px",
      }}
    >
      {/* Left page */}
      <div
        style={{
          width: 280,
          height: 360,
          background: "white",
          borderRadius: "8px 0 0 8px",
          boxShadow: "-8px 8px 24px rgba(0,0,0,0.12)",
          padding: 30,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #e2e8f0",
        }}
      >
        {/* Story text (matches Andika font from templates) */}
        <p
          style={{
            fontSize: 28,
            color: "#1a1a1a",
            fontFamily: "'Andika', Georgia, serif",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {leftPageText.replace("[Name]", childName)}
        </p>
      </div>

      {/* Right page */}
      <div
        style={{
          width: 280,
          height: 360,
          background: "white",
          borderRadius: "0 8px 8px 0",
          boxShadow: "8px 8px 24px rgba(0,0,0,0.12)",
          padding: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {rightPageContent || (
          /* Default: Placeholder illustration area */
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, ${levelColor}20, ${levelColor}08)`,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 100, opacity: 0.5 }}>🌍</span>
          </div>
        )}
      </div>
    </div>
  );
};
