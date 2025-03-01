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
import { LocalData } from "../data/LocalData";
import { updateStaleImageStatuses } from "../data/FileManager";

export function PresentationScene(props: {
  elements: ExcalidrawElement[];
  frame: ExcalidrawFrameElement;
}) {
  const { elements, frame } = props;

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

  // Presentation div adjustments, and adjusting scale based on div size

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

  const frameElements = useMemo(
    () => elements.filter((e) => e.frameId === frame?.id),
    [elements, frame?.id],
  );

  const positionedElements = useMemo(
    () =>
      frameElements.map((e) => ({
        ...e,
        x: e.x - frame.x,
        y: e.y - frame.y,
      })),
    [frame.x, frame.y, frameElements],
  );

  const scale = Math.min(
    presentationWidth / frame.width,
    presentationHeight / frame.height,
  );

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
      <div
        style={{
          width: `${frame.width * scale}px`,
          height: `${frame.height * scale}px`,
        }}
      >
        <Excalidraw
          initialData={{ elements: positionedElements }}
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

  // Get first frame
  const frame = useMemo(
    () => elements.find((e): e is ExcalidrawFrameElement => e.type === "frame"),
    [elements],
  );
  if (!frame) {
    return null;
  }
  return <PresentationScene elements={elements} frame={frame} />;
}
