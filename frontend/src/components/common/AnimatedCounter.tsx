'use client';

import React, { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  end: number | string;
  duration?: number;
  suffix?: string;
}

export default function AnimatedCounter({ end, duration = 1200, suffix = '' }: AnimatedCounterProps) {
  // Extract numeric part if string contains slash like "18 / 24"
  const numericEnd = typeof end === 'number' ? end : parseInt(String(end).replace(/\D/g, ''), 10);
  const isSlash = typeof end === 'string' && end.includes('/');
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isNaN(numericEnd)) return;
    let start = 0;
    const stepTime = Math.abs(Math.floor(duration / (numericEnd || 1)));
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= numericEnd) {
        setCount(numericEnd);
        clearInterval(timer);
      }
    }, Math.max(stepTime, 10));

    return () => clearInterval(timer);
  }, [numericEnd, duration]);

  if (typeof end === 'string' && isSlash) {
    return <span>{end}</span>;
  }

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}
