import { Button, Footer } from "@excalidraw/excalidraw/index";
import React, { useCallback } from "react";
import { useI18n } from "@excalidraw/excalidraw/i18n";
import { useExcalidrawActionManager } from "@excalidraw/excalidraw/components/App";
import { actionPresent } from "@excalidraw/excalidraw/actions";

import { isExcalidrawPlusSignedUser } from "../app_constants";

import { DebugFooter, isVisualDebuggerEnabled } from "./DebugCanvas";
import { EncryptedIcon } from "./EncryptedIcon";
import { ExcalidrawPlusAppLink } from "./ExcalidrawPlusAppLink";

export const AppFooter = React.memo(
  ({ onChange }: { onChange: () => void }) => {
    const { t } = useI18n();
    const actionManager = useExcalidrawActionManager();
    const onPresent = useCallback(
      () => actionManager.executeAction(actionPresent),
      [actionManager],
    );

    return (
      <Footer>
        <div
          style={{
            display: "flex",
            gap: ".5rem",
            alignItems: "center",
          }}
        >
          {isVisualDebuggerEnabled() && <DebugFooter onChange={onChange} />}
          {isExcalidrawPlusSignedUser ? (
            <ExcalidrawPlusAppLink />
          ) : (
            <EncryptedIcon />
          )}
          <Button onSelect={onPresent} style={{ width: "fit-content" }}>
            {t("labels.present")}
          </Button>
        </div>
      </Footer>
    );
  },
);
