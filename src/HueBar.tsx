import React from 'react';

interface HueBarProps {
  value: number; // Between 0 and 100
  height?: number;
  width?: number;
}

const HueBar: React.FC<HueBarProps> = ({ value, height = 8, width = 100 }) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  // Compute bar width
  const filledWidth = (clampedValue / 100) * width;

  // Compute hue: yellow (60) to green (120)
  const hue = 60 + (clampedValue / 100) * (120 - 60);
  const barColor = `hsl(${hue}, 100%, 50%)`;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#ccc',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${filledWidth}px`,
          height: '100%',
          backgroundColor: barColor,
          transition: 'width 0.3s ease, background-color 0.3s ease',
        }}
      />
    </div>
  );
};

export default HueBar;
