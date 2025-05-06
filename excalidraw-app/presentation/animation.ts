import { isTransparent } from "@excalidraw/common";
import { isLinearElement } from "@excalidraw/excalidraw";

import type {
  ExcalidrawElement,
  ExcalidrawTextElement,
} from "@excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const hexToRgba = (hex: string) => {
  const match = hex.match(
    /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i,
  );
  if (!match) {
    return null;
  }
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
    a: match[4] !== undefined ? parseInt(match[4], 16) : 255,
  };
};

const rgbaToHex = ({
  r,
  g,
  b,
  a,
}: {
  r: number;
  g: number;
  b: number;
  a: number;
}) => {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return a === 255
    ? `#${toHex(r)}${toHex(g)}${toHex(b)}`
    : `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
};

const colorProgress = (
  oldColor: string,
  newColor: string,
  progress: number,
) => {
  if (isTransparent(oldColor) && isTransparent(newColor)) {
    return "#00000000";
  }
  if (isTransparent(oldColor)) {
    // Assume oldColor is the same as newColor, but fully transparent.
    const newRgba = hexToRgba(newColor);
    if (newRgba) {
      oldColor = rgbaToHex({ ...newRgba, a: 0 });
    } else {
      return newColor;
    }
  }
  if (isTransparent(newColor)) {
    // Assume newColor is the same as oldColor, but fully transparent.
    const oldRgba = hexToRgba(oldColor);
    if (oldRgba) {
      newColor = rgbaToHex({ ...oldRgba, a: 0 });
    } else {
      return oldColor;
    }
  }

  const oldRgba = hexToRgba(oldColor);
  const newRgba = hexToRgba(newColor);
  if (!oldRgba || !newRgba) {
    return newColor;
  }

  const r = Math.round(numericalProgress(oldRgba.r, newRgba.r, progress));
  const g = Math.round(numericalProgress(oldRgba.g, newRgba.g, progress));
  const b = Math.round(numericalProgress(oldRgba.b, newRgba.b, progress));
  const a = Math.round(numericalProgress(oldRgba.a, newRgba.a, progress));

  return rgbaToHex({ r, g, b, a });
};

const angleProgress = (
  oldAngle: number,
  newAngle: number,
  progress: number,
): number => {
  let diff = newAngle - oldAngle;
  if (diff > Math.PI) {
    diff -= 2 * Math.PI;
  } else if (diff < -Math.PI) {
    diff += 2 * Math.PI;
  }
  return oldAngle + diff * progress;
};

const numericalProgress = (oldNum: number, newNum: number, progress: number) =>
  oldNum + (newNum - oldNum) * progress;

const ANIMATABLE_PROPERTIES = new Map<
  keyof ExcalidrawElement | keyof ExcalidrawTextElement,
  (oldVal: any, newVal: any, progress: number) => any
>([
  ["opacity", numericalProgress],
  ["x", numericalProgress],
  ["y", numericalProgress],
  ["height", numericalProgress],
  ["width", numericalProgress],
  ["strokeWidth", numericalProgress],
  ["angle", angleProgress],
  ["roughness", numericalProgress],
  ["backgroundColor", colorProgress],
  ["strokeColor", colorProgress],
  ["fontSize", numericalProgress],
]);

const progressAnimation = (
  oldElement: ExcalidrawElement | undefined,
  newElement: ExcalidrawElement | undefined,
  progress: number,
): ExcalidrawElement | undefined => {
  // If no old element, fade in new element
  if (oldElement === undefined) {
    if (newElement === undefined) {
      return undefined;
    }
    oldElement = {
      ...newElement,
      opacity: 0,
    };
  }

  // if no new element, fade out or remove old element
  if (newElement === undefined) {
    if (oldElement === undefined || progress === 1) {
      return undefined;
    }
    newElement = {
      ...oldElement,
      opacity: 0,
    };
  }

  // animate animatable properties
  const intermediate: any = {};
  for (const key of Object.keys(newElement) as Array<keyof ExcalidrawElement>) {
    // Line points special case
    if (isLinearElement(oldElement) && isLinearElement(newElement)) {
      const oldPoints = oldElement.points;
      const newPoints = newElement.points;
      const oldPointsFilled =
        oldPoints.length >= newPoints.length
          ? oldPoints
          : oldPoints.concat(
              Array(newPoints.length - oldPoints.length).fill(
                oldPoints[oldPoints.length - 1],
              ),
            );
      const newPointsFilled =
        newPoints.length >= oldPoints.length
          ? newPoints
          : newPoints.concat(
              Array(oldPoints.length - newPoints.length).fill(
                newPoints[newPoints.length - 1],
              ),
            );
      intermediate.points = oldPointsFilled.map((p, i) => [
        numericalProgress(p[0], newPointsFilled[i][0], progress),
        numericalProgress(p[1], newPointsFilled[i][1], progress),
      ]);
    }
    if (ANIMATABLE_PROPERTIES.has(key)) {
      intermediate[key] = ANIMATABLE_PROPERTIES.get(key)!(
        oldElement[key],
        newElement[key],
        progress,
      );
    } else {
      intermediate[key] = newElement[key];
    }
  }
  return intermediate;
};

export let animationStartTime: number | null = null;
const ANIMATION_DURATION_MS = 300;

export const animate = (
  timestamp: number,
  excalidrawAPI: ExcalidrawImperativeAPI,
  oldElements: Map<string, ExcalidrawElement>,
  newElements: Map<string, ExcalidrawElement>,
) => {
  if (!animationStartTime) {
    animationStartTime = timestamp;
  }
  const elapsed = timestamp - animationStartTime;
  const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);

  const names = new Set([...oldElements.keys(), ...newElements.keys()]);
  const intermediateElements: ExcalidrawElement[] = [];

  for (const name of names) {
    const oldEl = oldElements.get(name);
    const newEl = newElements.get(name);
    const intermediate = progressAnimation(oldEl, newEl, progress);
    if (intermediate) {
      intermediateElements.push(intermediate);
    }
  }

  excalidrawAPI.updateScene({ elements: intermediateElements });

  if (progress < 1) {
    requestAnimationFrame((ts) =>
      animate(ts, excalidrawAPI, oldElements, newElements),
    );
  } else {
    // Reset for the next animation
    animationStartTime = null;
  }
};
