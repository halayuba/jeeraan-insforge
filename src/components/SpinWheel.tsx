import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing, 
  runOnJS 
} from 'react-native-reanimated';
import Svg, { Path, G, Text as SvgText, Circle } from 'react-native-svg';
import { RotateCw } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.8;
const RADIUS = WHEEL_SIZE / 2;

interface SpinWheelProps {
  onSpinResult: (points: number) => void;
  isSpinning: boolean;
  setIsSpinning: (val: boolean) => void;
  targetPoints: number | null;
}

const SECTIONS = [
  { points: 0, color: '#94a3b8', label: 'TRY AGAIN', probability: 0.30 },
  { points: 1, color: '#1193d4', label: '+1 POINT', probability: 0.40 },
  { points: 2, color: '#10b981', label: '+2 POINTS', probability: 0.20 },
  { points: 3, color: '#f59e0b', label: 'BIG WIN +3', probability: 0.10 },
];

// Pre-calculate cumulative angles
let currentAngle = 0;
const sectionsWithAngles = SECTIONS.map(section => {
  const startAngle = currentAngle;
  const sweepAngle = section.probability * 360;
  currentAngle += sweepAngle;
  return { ...section, startAngle, sweepAngle };
});

export const SpinWheel: React.FC<SpinWheelProps> = ({ onSpinResult, isSpinning, setIsSpinning, targetPoints }) => {
  const rotation = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  useEffect(() => {
    if (isSpinning && targetPoints !== null) {
      startSpin(targetPoints);
    }
  }, [isSpinning, targetPoints]);

  const startSpin = (points: number) => {
    // Find the section corresponding to the points
    const section = sectionsWithAngles.find(s => s.points === points);
    if (!section) return;

    // We want the pointer (at the top, 0 deg) to point to the middle of the section
    // The wheel rotates clockwise.
    // If the section is at angle [start, end], the center is (start + end) / 2
    // To make the pointer at 0 point to (center), we need to rotate by (360 - center)
    const sectionCenter = section.startAngle + (section.sweepAngle / 2);
    const targetRotation = 360 - sectionCenter;
    
    // Add multiple full rotations for effect
    const finalRotation = 360 * 5 + targetRotation;
    
    rotation.value = 0;
    rotation.value = withTiming(finalRotation, {
      duration: 4000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }, (finished) => {
      if (finished) {
        runOnJS(handleSpinEnd)(points);
      }
    });
  };

  const handleSpinEnd = (points: number) => {
    setIsSpinning(false);
    onSpinResult(points);
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', x, y,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'L', x, y,
      'Z'
    ].join(' ');
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.wheelWrapper}>
        <Animated.View style={[styles.wheelContainer, animatedStyles]}>
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
            <G>
              {sectionsWithAngles.map((section, index) => {
                const startAngle = section.startAngle;
                const endAngle = section.startAngle + section.sweepAngle;
                const midAngle = startAngle + (section.sweepAngle / 2);
                const textPos = polarToCartesian(RADIUS, RADIUS, RADIUS * 0.7, midAngle);
                
                return (
                  <G key={index}>
                    <Path
                      d={describeArc(RADIUS, RADIUS, RADIUS, startAngle, endAngle)}
                      fill={section.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <G transform={`rotate(${midAngle}, ${RADIUS}, ${RADIUS})`}>
                      <SvgText
                        x={RADIUS}
                        y={RADIUS - RADIUS * 0.6}
                        fill="#ffffff"
                        fontSize="14"
                        fontWeight="bold"
                        textAnchor="middle"
                        transform={`rotate(0, ${RADIUS}, ${RADIUS - RADIUS * 0.6})`}
                      >
                        {section.label}
                      </SvgText>
                    </G>
                  </G>
                );
              })}
              <Circle cx={RADIUS} cy={RADIUS} r={20} fill="#ffffff" />
              <Circle cx={RADIUS} cy={RADIUS} r={15} fill="#0f172a" />
            </G>
          </Svg>
        </Animated.View>
        
        {/* Pointer */}
        <View style={styles.pointerContainer}>
          <Svg width={40} height={40} viewBox="0 0 40 40">
            <Path d="M20 0 L35 25 L5 25 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  wheelWrapper: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    position: 'relative',
  },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  pointerContainer: {
    position: 'absolute',
    top: -15,
    left: WHEEL_SIZE / 2 - 20,
    zIndex: 10,
  },
});
