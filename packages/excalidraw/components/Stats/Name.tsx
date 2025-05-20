import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { Scene } from "@excalidraw/element";

import "./Name.scss";

export interface NameProps {
  element: ExcalidrawElement;
  scene: Scene;
}

export const Name = ({ element, scene }: NameProps) => {
  return (
    <div className="drag-input-container">
      <input
        onChange={(e) => {
          scene.mutateElement(element, {
            customData: {
              ...element.customData,
              name: e.target.value,
            },
          });
        }}
        className="drag-input name-input"
        value={element.customData?.name ?? ""}
        autoComplete="off"
        spellCheck="false"
      />
    </div>
  );
};
