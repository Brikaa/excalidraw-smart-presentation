import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const numericalProgress = (oldNum: number, newNum: number, progress: number) =>
  oldNum + (newNum - oldNum) * progress;

const ANIMATABLE_PROPERTIES = new Map<
  keyof ExcalidrawElement,
  (oldVal: any, newVal: any, progress: number) => any
>([
  ["opacity", numericalProgress],
  ["x", numericalProgress],
  ["y", numericalProgress],
  ["height", numericalProgress],
  ["width", numericalProgress],
  ["strokeWidth", numericalProgress],
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

let startTime: number | null = null;
const ANIMATION_DURATION_MS = 300;

export const animate = (
  timestamp: number,
  excalidrawAPI: ExcalidrawImperativeAPI,
  oldElements: Map<string, ExcalidrawElement>,
  newElements: Map<string, ExcalidrawElement>,
) => {
  if (!startTime) {
    startTime = timestamp;
  }
  const elapsed = timestamp - startTime;
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
    startTime = null;
  }
};
