import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import {
  animate,
  animationStartTime,
} from "excalidraw-app/presentation/animation";
import { KEYS, supportsResizeObserver } from "@excalidraw/common";
import { isInitializedImageElement } from "@excalidraw/element/typeChecks";

import type {
  AppState,
  ExcalidrawImperativeAPI,
  NormalizedZoomValue,
} from "@excalidraw/excalidraw/types";
import type {
  ExcalidrawElement,
  ExcalidrawFrameElement,
  FileId,
} from "@excalidraw/element/types";

import { LocalData } from "../data/LocalData";
import { updateStaleImageStatuses } from "../data/FileManager";

import "./Presentation.scss";

const RE_PRESENTATION_LINK = /^#presentation=(\d+)$/;

export const isPresentationLink = (link: string) => {
  const hash = new URL(link).hash;
  return RE_PRESENTATION_LINK.test(hash);
};

export const getFrameIndexFromLink = (link: string) => {
  const hash = new URL(link).hash;
  const match = hash.match(RE_PRESENTATION_LINK);
  if (!match) {
    throw new Error("Invalid match");
  }
  return parseInt(match[1]);
};

const getPositionedElementsForFrame = (
  frame: ExcalidrawFrameElement,
  allElements: ExcalidrawElement[],
) =>
  allElements
    .filter((e) => e.frameId === frame.id)
    .map((e) => ({
      ...e,
      x: e.x - frame.x,
      y: e.y - frame.y,
    }));

const getBaseKey = (e: ExcalidrawElement) =>
  `${e.type}-${e.customData?.name ?? e.id}`;

// Build map of element name to element, if element name is repeated within the same frame
// give it a _N suffix where N starts from 1
const buildElementMap = (
  frameElements: ExcalidrawElement[],
): Map<string, ExcalidrawElement> => {
  const map = new Map<string, ExcalidrawElement>();
  const counts = new Map<string, number>();
  for (const element of frameElements) {
    const baseKey = getBaseKey(element);
    let key = baseKey;
    // If this key is already used, append a suffix.
    if (map.has(key)) {
      const count = (counts.get(baseKey) ?? 0) + 1;
      counts.set(baseKey, count);
      key = `${baseKey}-${count}`;
    } else {
      counts.set(baseKey, 0);
    }
    map.set(key, element);
  }
  return map;
};

export function PresentationScene(props: {
  elements: ExcalidrawElement[];
  appState: Readonly<AppState>;
  frames: ExcalidrawFrameElement[];
  initialFrameIndex?: number;
}) {
  const { appState, elements, frames, initialFrameIndex = 0 } = props;
  const [loadedInitialFrame, setLoadedInitialFrame] = useState(false);
  const [frameIndex, setFrameIndex] = useState(initialFrameIndex);

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  const renderFrame = useCallback(
    (newFrameIndex: number) => {
      if (!excalidrawAPI) {
        return;
      }
      const newFrame = frames[newFrameIndex];
      const currentFrame = frames[frameIndex];

      const oldFrameElements = getPositionedElementsForFrame(
        currentFrame,
        elements,
      );
      const newFrameElements = getPositionedElementsForFrame(
        newFrame,
        elements,
      );

      const oldElementsMap = buildElementMap(oldFrameElements);
      const newElementsMap = buildElementMap(newFrameElements);

      setFrameIndex(newFrameIndex);
      requestAnimationFrame((timestamp) =>
        animate(timestamp, excalidrawAPI, oldElementsMap, newElementsMap),
      );
    },
    [elements, excalidrawAPI, frameIndex, frames],
  );

  // Render initial frame and initial state
  useEffect(() => {
    if (loadedInitialFrame || !excalidrawAPI) {
      return;
    }
    // Disable rAF throttle since we handle our own rAF
    window.EXCALIDRAW_THROTTLE_RENDER = false;
    renderFrame(initialFrameIndex);
    setTimeout(
      () =>
        excalidrawAPI.updateScene({
          appState: {
            theme: appState.theme,
            viewBackgroundColor: appState.viewBackgroundColor,
          },
        }),
      0,
    );
    setLoadedInitialFrame(true);
  }, [
    appState,
    excalidrawAPI,
    initialFrameIndex,
    loadedInitialFrame,
    renderFrame,
  ]);

  // Load files (e.g, images) on elements change
  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    const fileIds =
      elements.reduce((acc, element) => {
        if (isInitializedImageElement(element)) {
          return acc.concat(element.fileId);
        }
        return acc;
      }, [] as FileId[]) || [];
    LocalData.fileStorage
      .getFiles(fileIds)
      .then(({ loadedFiles, erroredFiles }) => {
        if (loadedFiles.length) {
          excalidrawAPI.addFiles(loadedFiles);
        }
        updateStaleImageStatuses({
          excalidrawAPI,
          erroredFiles,
          elements,
        });
      });
  }, [elements, excalidrawAPI]);

  // Presentation div observer to know by how much we need to zoom in
  const presentationSceneDiv = useRef<HTMLDivElement>(null);
  const [presentationWidth, setPresentationWidth] = useState(1);
  const [presentationHeight, setPresentationHeight] = useState(1);
  // We want the height, the width, or both to exactly fit the screen
  const scale = Math.min(
    presentationWidth / frames[frameIndex].width,
    presentationHeight / frames[frameIndex].height,
  );

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    if (supportsResizeObserver && presentationSceneDiv.current) {
      resizeObserver = new ResizeObserver(() => {
        if (presentationSceneDiv.current) {
          const { width, height } =
            presentationSceneDiv.current.getBoundingClientRect();
          setPresentationWidth(width);
          setPresentationHeight(height);
        }
      });
      resizeObserver.observe(presentationSceneDiv.current);
    }
    return () => {
      resizeObserver?.disconnect();
    };
  }, []);

  // Update zoom whenever scale changes
  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    setTimeout(
      () =>
        excalidrawAPI.updateScene({
          appState: { zoom: { value: scale as NormalizedZoomValue } },
        }),
      0,
    );
  }, [excalidrawAPI, scale]);

  const nextSlide = useCallback(() => {
    if (animationStartTime === null && frameIndex !== frames.length - 1) {
      renderFrame(frameIndex + 1);
    }
  }, [frameIndex, frames.length, renderFrame]);

  const prevSlide = useCallback(() => {
    if (animationStartTime === null && frameIndex !== 0) {
      renderFrame(frameIndex - 1);
    }
  }, [frameIndex, renderFrame]);

  // Event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === KEYS.ARROW_RIGHT) {
        nextSlide();
      }
      if (e.key === KEYS.ARROW_LEFT) {
        prevSlide();
      }
    };

    const handlePointerDownOrWheel = (e: MouseEvent | WheelEvent) => {
      e.stopPropagation();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("pointerdown", handlePointerDownOrWheel, true);
    document.addEventListener("wheel", handlePointerDownOrWheel, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener(
        "pointerdown",
        handlePointerDownOrWheel,
        true,
      );
      document.removeEventListener("wheel", handlePointerDownOrWheel, true);
    };
  }, [frameIndex, frames.length, nextSlide, prevSlide, renderFrame]);

  const loadExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
  }, []);

  // Render
  return (
    <div className="presentation-presentation" ref={presentationSceneDiv}>
      {/* Used for navigating slides using the mouse */}
      <div className="presentation-overlays">
        <div className="presentation-overlay" onClick={prevSlide}></div>
        <div className="presentation-overlay" onClick={nextSlide}></div>
      </div>

      {/* We want the canvas to be in a div that has the exact same size as the scaled (zoomed in) frame */}
      {/* The rest is going to be black through the outer div */}
      <div
        style={{
          width: `${frames[frameIndex].width * scale}px`,
          height: `${frames[frameIndex].height * scale}px`,
        }}
      >
        <Excalidraw
          excalidrawAPI={loadExcalidrawAPI}
          viewModeEnabled
          presentationModeEnabled
        />
      </div>
    </div>
  );
}

export const ELEMENTS_CHANNEL_NAME = "excalidraw-elements";
export const NEED_DATA_MESSAGE = "NEED_DATA";

export function Presentation() {
  const [elements, setElements] = useState<ExcalidrawElement[]>([]);
  const [appState, setAppState] = useState<Readonly<AppState | null>>();
  useEffect(() => {
    const channel = new BroadcastChannel(ELEMENTS_CHANNEL_NAME);
    const messageHandler = (
      event: MessageEvent<
        { elements: ExcalidrawElement[]; appState: Readonly<AppState> } | string
      >,
    ) => {
      if (typeof event.data !== "string") {
        setAppState(event.data.appState);
        setElements(event.data.elements);
      }
    };
    channel.addEventListener("message", messageHandler);
    channel.postMessage(NEED_DATA_MESSAGE);
    return () => {
      channel.removeEventListener("message", messageHandler);
    };
  }, []);

  const frames = useMemo(() => {
    const res = elements.filter(
      (e): e is ExcalidrawFrameElement => e.type === "frame",
    );
    res.sort((e1, e2) => e1.y - e2.y);
    return res;
  }, [elements]);
  if (frames.length === 0 || !appState) {
    return (
      <div>
        <h1>Blank presentation</h1>
        <p>
          Learn how to make a presentation{" "}
          <a href="https://github.com/excalidraw-smart-presentation/excalidraw-smart-presentation.github.io?tab=readme-ov-file#excalidraw-smart-presentation">
            here
          </a>
        </p>
      </div>
    );
  }
  const frameIndex = getFrameIndexFromLink(window.location.href);
  const initialFrameIndex =
    frameIndex < 0 || frameIndex >= frames.length ? 0 : frameIndex;
  return (
    <PresentationScene
      appState={appState}
      elements={elements}
      frames={frames}
      initialFrameIndex={initialFrameIndex}
    />
  );
}
