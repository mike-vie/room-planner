'use client';

import { Line, Text, Rect } from 'react-konva';

interface RulerProps {
  width: number;   // room width in cm
  height: number;  // room height in cm
  scale: number;   // pixels per cm (used to keep visual sizes constant)
}

function getSteps(size: number) {
  if (size <= 200)  return { minor: 10,  major: 50  };
  if (size <= 600)  return { minor: 25,  major: 100 };
  if (size <= 1500) return { minor: 50,  major: 100 };
  return             { minor: 100, major: 500 };
}

export default function Ruler({ width, height, scale }: RulerProps) {
  const rulerPx   = 28;            // ruler thickness in screen pixels (constant)
  const rulerH    = rulerPx / scale; // ruler thickness in cm-space

  const minorPx   = 6;
  const majorPx   = 14;
  const minorH    = minorPx / scale;
  const majorH    = majorPx / scale;
  const tickW     = 1   / scale;
  const fontSize  = 9.5 / scale;
  const strokeW   = 0.5 / scale;

  const bg        = '#f0f0f0';
  const border    = '#c0c0c0';
  const tickColor = '#888';
  const labelColor= '#444';

  const { minor: hMinor, major: hMajor } = getSteps(width);
  const { minor: vMinor, major: vMajor } = getSteps(height);

  // ---- Horizontal ruler (top) ----
  const hElements = [];
  for (let x = 0; x <= width; x += hMinor) {
    const isMajor = x % hMajor === 0;
    const tickH   = isMajor ? majorH : minorH;
    hElements.push(
      <Line
        key={`ht-${x}`}
        points={[x, -tickH, x, 0]}
        stroke={tickColor}
        strokeWidth={tickW}
        listening={false}
      />
    );
    if (isMajor) {
      hElements.push(
        <Text
          key={`hl-${x}`}
          x={x + 2 / scale}
          y={-rulerH + 3 / scale}
          text={x === 0 ? 'cm' : String(x)}
          fontSize={fontSize}
          fill={x === 0 ? '#999' : labelColor}
          listening={false}
        />
      );
    }
  }

  // ---- Vertical ruler (left) ----
  const vElements = [];
  for (let y = 0; y <= height; y += vMinor) {
    const isMajor = y % vMajor === 0;
    const tickH   = isMajor ? majorH : minorH;
    vElements.push(
      <Line
        key={`vt-${y}`}
        points={[-tickH, y, 0, y]}
        stroke={tickColor}
        strokeWidth={tickW}
        listening={false}
      />
    );
    if (isMajor && y > 0) {
      vElements.push(
        <Text
          key={`vl-${y}`}
          x={-rulerH + 2 / scale}
          y={y + 2 / scale}
          text={String(y)}
          fontSize={fontSize}
          fill={labelColor}
          listening={false}
        />
      );
    }
  }

  return (
    <>
      {/* Corner square */}
      <Rect
        x={-rulerH} y={-rulerH}
        width={rulerH} height={rulerH}
        fill={bg} stroke={border} strokeWidth={strokeW}
        listening={false}
      />

      {/* Horizontal ruler background */}
      <Rect
        x={0} y={-rulerH}
        width={width} height={rulerH}
        fill={bg} stroke={border} strokeWidth={strokeW}
        listening={false}
      />
      {hElements}

      {/* Vertical ruler background */}
      <Rect
        x={-rulerH} y={0}
        width={rulerH} height={height}
        fill={bg} stroke={border} strokeWidth={strokeW}
        listening={false}
      />
      {vElements}
    </>
  );
}
