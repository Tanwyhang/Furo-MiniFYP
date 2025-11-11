'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLElement | HTMLDivElement | null>;
  fromRef: React.RefObject<HTMLElement | HTMLDivElement | null>;
  toRef: React.RefObject<HTMLElement | HTMLDivElement | null>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

export default function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = Math.random() * 3 + 4,
  delay = 0,
  pathColor = 'gray',
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = '#ffaa40',
  gradientStopColor = '#fcfcfdff',
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}: AnimatedBeamProps) {
  const [pathD, setPathD] = useState('');
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const progress = useMotionValue(0);
  const pathLength = useMotionValue(0);

  // Spring animation for smooth progress
  const smoothProgress = useSpring(progress, { stiffness: 100, damping: 20 });

  // Calculate gradient stops based on progress
  const x1 = useTransform(smoothProgress, (latest) => latest);
  const x2 = useTransform(smoothProgress, (latest) => latest + 0.005);

  useEffect(() => {
    const calculatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const fromRect = fromRef.current.getBoundingClientRect();
        const toRect = toRef.current.getBoundingClientRect();

        const from = {
          x: fromRect.left - containerRect.left + fromRect.width / 2 + startXOffset,
          y: fromRect.top - containerRect.top + fromRect.height / 2 + startYOffset,
        };

        const to = {
          x: toRect.left - containerRect.left + toRect.width / 2 + endXOffset,
          y: toRect.top - containerRect.top + toRect.height / 2 + endYOffset,
        };

        // Calculate control points for curved path
        const controlPoint1X = from.x + (to.x - from.x) / 3;
        const controlPoint1Y = from.y + curvature - 50;
        const controlPoint2X = from.x + (2 * (to.x - from.x)) / 3;
        const controlPoint2Y = to.y + curvature + 50;

        const path = `M ${from.x},${from.y} C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${to.x},${to.y}`;

        setPathD(path);
        setSvgDimensions({
          width: Math.max(from.x, to.x) + 50,
          height: Math.max(from.y, to.y) + 50,
        });
      }
    };

    // Initial calculation with delay to ensure all elements are rendered
    const timer = setTimeout(calculatePath, 100);

    // Also observe for resize changes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(calculatePath, 50); // Small delay for resize events
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also observe the from and to elements
    if (fromRef.current) {
      resizeObserver.observe(fromRef.current);
    }
    if (toRef.current) {
      resizeObserver.observe(toRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Animate progress from 0 to 1
      progress.set(0);
      setTimeout(() => {
        progress.set(1);
      }, 100);

      // Reset and repeat animation
      const interval = setInterval(() => {
        progress.set(0);
        setTimeout(() => {
          progress.set(1);
        }, 100);
      }, duration * 1000);

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [duration, delay, progress]);

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        overflow: 'visible',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      <defs>
        <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <motion.stop
            offset={x1}
            stopColor={gradientStartColor}
            stopOpacity={1}
          />
          <motion.stop
            offset={x2}
            stopColor={gradientStopColor}
            stopOpacity={1}
          />
        </linearGradient>
      </defs>

      {/* Static path background */}
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        fill="none"
      />

      {/* Animated gradient path */}
      <motion.path
        d={pathD}
        stroke="url(#beam-gradient)"
        strokeWidth={pathWidth * 2}
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0, pathOffset: 0 }}
        animate={{
          pathLength: [0, 1],
          pathOffset: reverse ? [1, -1] : [0, 0]
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          delay: delay,
          ease: 'easeInOut',
        }}
        style={{ filter: 'blur(0.5px)' }}
      />
    </svg>
  );
}