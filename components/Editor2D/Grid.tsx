'use client';

import { Line } from 'react-konva';

interface GridProps {
  width: number;
  height: number;
  step: number;
  offsetX?: number;
  offsetY?: number;
}

export default function Grid({ width, height, step, offsetX = 0, offsetY = 0 }: GridProps) {
  const lines = [];

  for (let x = 0; x <= width; x += step) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x + offsetX, offsetY, x + offsetX, height + offsetY]}
        stroke="#e5e7eb"
        strokeWidth={x % (step * 10) === 0 ? 0.5 : 0.25}
      />
    );
  }

  for (let y = 0; y <= height; y += step) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[offsetX, y + offsetY, width + offsetX, y + offsetY]}
        stroke="#e5e7eb"
        strokeWidth={y % (step * 10) === 0 ? 0.5 : 0.25}
      />
    );
  }

  return <>{lines}</>;
}
