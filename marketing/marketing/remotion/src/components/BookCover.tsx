import React from "react";

export const LEVEL_COLOURS = {
  1: "#E84B8A",
  2: "#F59E0B",
  3: "#22C55E",
  4: "#3B82F6",
  5: "#8B5CF6",
  6: "#14B8A6",
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
}

export const BookCover: React.FC<BookCoverProps> = ({
  level,
  title,
  width = 200,
  height = 280,
}) => {
  const levelColor = LEVEL_COLOURS[level];

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
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: width * 0.07,
            fontWeight: 700,
            color: "white",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          MyPhonicsBooks
        </span>
        <div
          style={{
            background: "rgba(255,255,255,0.3)",
            padding: "2px 8px",
            borderRadius: 10,
            fontSize: width * 0.055,
            fontWeight: 600,
            color: "white",
          }}
        >
          L{level}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          margin: "0 8px",
          borderRadius: "4px 4px 0 0",
        }}
      >
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
          <span style={{ fontSize: width * 0.25, opacity: 0.5 }}>📚</span>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          background: levelColor,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: width * 0.065,
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
    </div>
  );
};

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
    <div style={{ display: "flex", perspective: "1200px" }}>
      <div
        style={{
          width: 260,
          height: 340,
          background: "white",
          borderRadius: "8px 0 0 8px",
          boxShadow: "-8px 8px 24px rgba(0,0,0,0.12)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #e2e8f0",
        }}
      >
        <p
          style={{
            fontSize: 26,
            color: "#1a1a1a",
            fontFamily: "'Andika', Georgia, serif",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {leftPageText.replace("[Name]", childName)}
        </p>
      </div>

      <div
        style={{
          width: 260,
          height: 340,
          background: "white",
          borderRadius: "0 8px 8px 0",
          boxShadow: "8px 8px 24px rgba(0,0,0,0.12)",
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {rightPageContent || (
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
            <span style={{ fontSize: 90, opacity: 0.5 }}>🌍</span>
          </div>
        )}
      </div>
    </div>
  );
};
