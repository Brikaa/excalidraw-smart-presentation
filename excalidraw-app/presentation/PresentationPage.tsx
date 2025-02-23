import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { importFromLocalStorage } from "../data/localStorage";
import { Excalidraw } from "../../packages/excalidraw";
import type {
  ExcalidrawElement,
  ExcalidrawFrameElement,
  FileId,
} from "../../packages/excalidraw/element/types";
import type {
  ExcalidrawImperativeAPI,
  NormalizedZoomValue,
} from "../../packages/excalidraw/types";
import { supportsResizeObserver } from "../../packages/excalidraw/constants";
import { isInitializedImageElement } from "../../packages/excalidraw/element/typeChecks";
import { LocalData } from "../data/LocalData";
import { updateStaleImageStatuses } from "../data/FileManager";

export function PresentationScene(props: {
  elements: ExcalidrawElement[];
  frame: ExcalidrawFrameElement;
}) {
  const { elements, frame } = props;
  const frameElements = useMemo(
    () => elements.filter((e) => e.frameId === frame?.id),
    [elements, frame?.id],
  );

  const [presentationWidth, setPresentationWidth] = useState(1);
  const [presentationHeight, setPresentationHeight] = useState(1);

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const loadExcalidrawAPI = useCallback(
    (api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api),
    [],
  );

  const fileIds = useMemo(() => {
    if (!excalidrawAPI) {
      return [];
    }
    return (
      excalidrawAPI.getSceneElements().reduce((acc, element) => {
        if (isInitializedImageElement(element)) {
          return acc.concat(element.fileId);
        }
        return acc;
      }, [] as FileId[]) || []
    );
  }, [excalidrawAPI]);

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
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
  }, [excalidrawAPI, fileIds]);

  const presentationSceneDiv = useRef<HTMLDivElement>(null);

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

  const scale = Math.min(
    presentationWidth / frame.width,
    presentationHeight / frame.height,
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

  const [divWidthPercentage, setDivWidthPercentage] = useState(1);
  const [divHeightPercentage, setDivHeightPercentage] = useState(1);

  useEffect(() => {
    setDivWidthPercentage(((frame.width * scale) / presentationWidth) * 100);
  }, [presentationWidth, frame.width, scale]);

  useEffect(() => {
    setDivHeightPercentage(((frame.height * scale) / presentationHeight) * 100);
  }, [presentationHeight, frame.height, scale]);

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
          width: `${divWidthPercentage}%`,
          height: `${divHeightPercentage}%`,
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
