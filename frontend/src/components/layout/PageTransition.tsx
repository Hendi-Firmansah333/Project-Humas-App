'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter');
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      // 1. Trigger exit animation
      setTransitionStage('exit');

      const timeout = setTimeout(() => {
        // 2. Swap content & trigger enter animation
        setDisplayChildren(children);
        setTransitionStage('enter');
        prevPathnameRef.current = pathname;
        // Scroll content area back to top
        const main = document.querySelector('main');
        if (main) main.scrollTop = 0;
      }, 200); // must match CSS transition duration

      return () => clearTimeout(timeout);
    } else {
      setDisplayChildren(children);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, children]);

  return (
    <div
      className="page-transition-wrapper"
      data-stage={transitionStage}
    >
      {displayChildren}
    </div>
  );
}
