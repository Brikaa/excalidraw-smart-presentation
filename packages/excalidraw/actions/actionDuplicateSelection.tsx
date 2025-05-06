import {
  DEFAULT_GRID_SIZE,
  KEYS,
  arrayToMap,
  getShortcutKey,
  matchKey,
} from "@excalidraw/common";

import { getNonDeletedElements } from "@excalidraw/element";

import { LinearElementEditor } from "@excalidraw/element/linearElementEditor";

import {
  getSelectedElements,
  getSelectionStateForElements,
} from "@excalidraw/element/selection";

import { syncMovedIndices } from "@excalidraw/element/fractionalIndex";

import { duplicateElements } from "@excalidraw/element/duplicate";

import type { ActionFn } from "@excalidraw/excalidraw/actions/types";

import { ToolButton } from "../components/ToolButton";
import { DuplicateIcon } from "../components/icons";

import { t } from "../i18n";
import { isSomeElementSelected } from "../scene";
import { CaptureUpdateAction } from "../store";

import { register } from "./register";

const performDuplication: (intoNextFrame?: boolean) => ActionFn =
  (intoNextFrame?: boolean) => (elements, appState, formData, app) => {
    if (appState.selectedElementsAreBeingDragged) {
      return false;
    }

    // duplicate selected point(s) if editing a line
    if (appState.editingLinearElement) {
      // TODO: Invariants should be checked here instead of duplicateSelectedPoints()
      try {
        const newAppState = LinearElementEditor.duplicateSelectedPoints(
          appState,
          app.scene,
        );

        return {
          elements,
          appState: newAppState,
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        };
      } catch {
        return false;
      }
    }

    let { duplicatedElements, elementsWithDuplicates } = duplicateElements({
      type: "in-place",
      elements,
      idsOfElementsToDuplicate: arrayToMap(
        getSelectedElements(elements, appState, {
          includeBoundTextElement: true,
          includeElementsInFrames: true,
        }),
      ),
      appState,
      randomizeSeed: true,
      overrides: ({ origElement, origIdToDuplicateId }) => {
        if (origElement.frameId && intoNextFrame) {
          const frames = elements.filter(
            (e) => !e.isDeleted && e.type === "frame",
          );
          const origFrame = frames.find((f) => f.id === origElement.frameId);

          let newFrame = null;
          for (const frame of frames) {
            if (
              origFrame &&
              frame.y > origFrame.y &&
              (newFrame === null || frame.y < newFrame.y)
            ) {
              newFrame = frame;
            }
          }

          // Only if frame is not last — otherwise it's going to be a normal duplication
          if (newFrame && origFrame) {
            return {
              x: newFrame.x + (origElement.x - origFrame.x),
              y: newFrame.y + (origElement.y - origFrame.y),
              frameId: newFrame.id,
            };
          }
        }

        const duplicateFrameId =
          origElement.frameId && origIdToDuplicateId.get(origElement.frameId);
        return {
          x: origElement.x + DEFAULT_GRID_SIZE / 2,
          y: origElement.y + DEFAULT_GRID_SIZE / 2,
          frameId: duplicateFrameId ?? origElement.frameId,
        };
      },
    });

    if (app.props.onDuplicate && elementsWithDuplicates) {
      const mappedElements = app.props.onDuplicate(
        elementsWithDuplicates,
        elements,
      );
      if (mappedElements) {
        elementsWithDuplicates = mappedElements;
      }
    }

    return {
      elements: syncMovedIndices(
        elementsWithDuplicates,
        arrayToMap(duplicatedElements),
      ),
      appState: {
        ...appState,
        ...getSelectionStateForElements(
          duplicatedElements,
          getNonDeletedElements(elementsWithDuplicates),
          appState,
        ),
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  };

export const actionDuplicateSelection = register({
  name: "duplicateSelection",
  label: "labels.duplicateSelection",
  icon: DuplicateIcon,
  trackEvent: { category: "element" },
  perform: performDuplication(),
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.D,
  PanelComponent: ({ elements, appState, updateData }) => (
    <ToolButton
      type="button"
      icon={DuplicateIcon}
      title={`${t("labels.duplicateSelection")} — ${getShortcutKey(
        "CtrlOrCmd+D",
      )}`}
      aria-label={t("labels.duplicateSelection")}
      onClick={() => updateData(null)}
      visible={isSomeElementSelected(getNonDeletedElements(elements), appState)}
    />
  ),
});

export const actionDuplicateSelectionIntoNextFrame = register({
  name: "duplicateSelectionIntoNextFrame",
  label: "labels.duplicateSelectionIntoNextFrame",
  icon: DuplicateIcon,
  trackEvent: { category: "element" },
  perform: performDuplication(true),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && matchKey(event, KEYS.D),
  PanelComponent: ({ elements, appState, updateData }) => (
    <ToolButton
      type="button"
      icon={DuplicateIcon}
      title={`${t("labels.duplicateSelectionIntoNextFrame")} — ${getShortcutKey(
        "CtrlOrCmd+Shift+D",
      )}`}
      aria-label={t("labels.duplicateSelectionIntoNextFrame")}
      onClick={() => updateData(null)}
      visible={isSomeElementSelected(getNonDeletedElements(elements), appState)}
    />
  ),
});
