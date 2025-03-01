import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { importFromLocalStorage } from "../data/localStorage";
import { Excalidraw } from "@excalidraw/excalidraw";
import type {
  ExcalidrawElement,
  ExcalidrawFrameElement,
  FileId,
} from "@excalidraw/excalidraw/element/types";
import type {
  ExcalidrawImperativeAPI,
  NormalizedZoomValue,
} from "@excalidraw/excalidraw/types";
import { supportsResizeObserver } from "@excalidraw/excalidraw/constants";
import { isInitializedImageElement } from "@excalidraw/excalidraw/element/typeChecks";
import { KEYS } from "@excalidraw/excalidraw/keys";
import { LocalData } from "../data/LocalData";
import { updateStaleImageStatuses } from "../data/FileManager";

export function PresentationScene(props: {
  elements: ExcalidrawElement[];
  frames: ExcalidrawFrameElement[];
  initialFrameIndex?: number;
}) {
  const { elements, frames, initialFrameIndex = 0 } = props;

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const loadExcalidrawAPI = useCallback(
    (api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api),
    [],
  );

  // Load files (e.g, images)
  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    const fileIds =
      excalidrawAPI.getSceneElements().reduce((acc, element) => {
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
          elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
        });
      });
  }, [excalidrawAPI]);

  // Presentation div observer to know by how much we need to zoom in
  const presentationSceneDiv = useRef<HTMLDivElement>(null);
  const [presentationWidth, setPresentationWidth] = useState(1);
  const [presentationHeight, setPresentationHeight] = useState(1);

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
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
  }, [excalidrawAPI]);

  const [scale, setScale] = useState(1);
  const [frameIndex, setFrameIndex] = useState(initialFrameIndex);

  // Event listeners and animations
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

  const renderFrame = useCallback(
    (newFrameIndex: number) => {
      const newFrame = frames[newFrameIndex];
      const newFrameElements = elements.filter(
        (e) => e.frameId === newFrame.id,
      );
      const newPositionedElements = newFrameElements.map((e) => ({
        ...e,
        x: e.x - newFrame.x,
        y: e.y - newFrame.y,
      }));
      // We want the height, the width, or both to exactly fit the screen
      const newScale = Math.min(
        presentationWidth / newFrame.width,
        presentationHeight / newFrame.height,
      );
      setFrameIndex(newFrameIndex);
      setScale(newScale);
      setTimeout(
        () => excalidrawAPI?.updateScene({ elements: newPositionedElements }),
        0,
      );
    },
    [elements, excalidrawAPI, frames, presentationHeight, presentationWidth],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== KEYS.ARROW_RIGHT) {
        return;
      }
      if (frameIndex === frames.length + 1) {
        return;
      }
      const newFrameIndex = frameIndex + 1;
      renderFrame(newFrameIndex);
    },
    [frameIndex, frames.length, renderFrame],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Initial frame
  useEffect(() => {
    renderFrame(initialFrameIndex);
  }, [initialFrameIndex, renderFrame]);

  // Render
  return (
    <div
      ref={presentationSceneDiv}
      style={{
        width: "100%",
        height: "100%",
        background: "black",
        display: "grid",
        placeItems: "center",
      }}
    >
      {/* We want the canvas to be in a div that has the exact same size as the scaled (zoomed in) frame */}
      {/* The rest is going to be black */}
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

export function PresentationPage() {
  const { elements } = importFromLocalStorage();
  const nonDeleted = useMemo(
    () => elements.filter((e) => !e.isDeleted),
    [elements],
  );

  // Get first frame
  const frames = useMemo(() => {
    const res = nonDeleted.filter(
      (e): e is ExcalidrawFrameElement => e.type === "frame",
    );
    res.sort((e1, e2) => e1.y - e2.y);
    return res;
  }, [nonDeleted]);
  return <PresentationScene elements={nonDeleted} frames={frames} />;
}
