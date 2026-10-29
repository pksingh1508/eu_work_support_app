import { useId, useState } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

type GradientFillProps = {
  colors: readonly string[];
  /** Stop opacities, one per color. Defaults to fully opaque. */
  opacities?: readonly number[];
  /** Direction as unit-box coordinates. Defaults to a 135° diagonal. */
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
};

/** Absolute-fill SVG linear gradient (no extra native module needed). */
export function GradientFill({
  colors,
  opacities,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
}: GradientFillProps) {
  const id = `gradient-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const lastIndex = Math.max(colors.length - 1, 1);
  // Percent sizing clips on Android when the parent resizes, so size from layout.
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  };

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, style]}
    >
      {size.width > 0 && size.height > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient
              id={id}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
            >
              {colors.map((color, index) => (
                <Stop
                  key={`${color}-${index}`}
                  offset={index / lastIndex}
                  stopColor={color}
                  stopOpacity={opacities?.[index] ?? 1}
                />
              ))}
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill={`url(#${id})`}
          />
        </Svg>
      ) : null}
    </View>
  );
}
