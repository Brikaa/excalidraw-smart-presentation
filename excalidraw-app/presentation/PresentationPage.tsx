import { useEffect, useMemo } from "react";
import { importFromLocalStorage } from "../data/localStorage";
import { Excalidraw } from "../../packages/excalidraw";
import { CODES } from "../../packages/excalidraw/keys";

export function PresentationPage(props: {
  setPresentation: (enabled: boolean) => unknown;
}) {
  const { setPresentation } = props;
  const { elements } = importFromLocalStorage();

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.code === CODES.Z) {
        setPresentation(false);
      }
    });
  }, [setPresentation]);

  // Get first frame
  const frame = useMemo(
    () => elements.find((e) => e.type === "frame"),
    [elements],
  );
  const frameElements = useMemo(
    () => elements.filter((e) => e.frameId === frame?.id),
    [elements, frame?.id],
  );
  if (!frame) {
    return null;
  }
  return (
    <Excalidraw initialData={{ elements: frameElements }} viewModeEnabled />
  );
}
