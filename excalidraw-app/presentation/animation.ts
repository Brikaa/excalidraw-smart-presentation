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
  oldElement: ExcalidrawElement | null,
  newElement: ExcalidrawElement | null,
  progress: number,
): ExcalidrawElement | null => {
  // If no old element, fade in new element
  if (oldElement === null) {
    if (newElement === null) {
      return null;
    }
    oldElement = {
      ...newElement,
      opacity: 0,
    };
  }

  // if no new element, fade out or remove old element
  if (newElement === null) {
    if (oldElement === null || progress === 1) {
      return null;
    }
    newElement = {
      ...oldElement,
      opacity: 0,
    };
  }

  // animate animatable properties
  const intermediateElement: any = {};
  for (const key of Object.keys(newElement) as Array<keyof ExcalidrawElement>) {
    if (ANIMATABLE_PROPERTIES.has(key)) {
      intermediateElement[key] = ANIMATABLE_PROPERTIES.get(key)!(
        oldElement[key],
        newElement[key],
        progress,
      );
    } else {
      intermediateElement[key] = newElement[key];
    }
  }
  return intermediateElement;
};

let startTime: number | null = null;
const ANIMATION_DURATION_MS = 300;

export const animate = (
  timestamp: number,
  excalidrawAPI: ExcalidrawImperativeAPI,
  oldElements: Map<string, ExcalidrawElement>,
  newElements: ExcalidrawElement[],
) => {
  if (!startTime) {
    startTime = timestamp;
  }
  const elapsed = timestamp - startTime;
  const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
  const intermediateElements = newElements.map((element) => {
    if (
      element.customData?.name !== undefined &&
      oldElements.has(element.customData.name)
    ) {
      const oldElement = oldElements.get(element.customData.name)!;
      return progressAnimation(oldElement, element, progress);
    }
    return progressAnimation(null, element, progress);
  });
  excalidrawAPI.updateScene({ elements: intermediateElements });

  if (progress < 1) {
    requestAnimationFrame((timestamp) =>
      animate(timestamp, excalidrawAPI, oldElements, newElements),
    );
  } else {
    startTime = null;
  }
};
