'use client';

import { Line } from 'react-konva';

interface WallProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export default function Wall({ x1, y1, x2, y2 }: WallProps) {
  return (
    <Line
      points={[x1, y1, x2, y2]}
      stroke="#1f2937"
      strokeWidth={6}
      lineCap="round"
      lineJoin="round"
    />
  );
}
