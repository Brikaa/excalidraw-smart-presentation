import { Button, Footer } from "@excalidraw/excalidraw/index";
import React from "react";

import { useI18n } from "@excalidraw/excalidraw/i18n";

import { isExcalidrawPlusSignedUser } from "../app_constants";

import { DebugFooter, isVisualDebuggerEnabled } from "./DebugCanvas";
import { EncryptedIcon } from "./EncryptedIcon";
import { ExcalidrawPlusAppLink } from "./ExcalidrawPlusAppLink";

export const AppFooter = React.memo(
  ({
    onChange,
    onPresentation,
  }: {
    onChange: () => void;
    onPresentation: () => void;
  }) => {
    const { t } = useI18n();

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
          <Button onSelect={onPresentation} style={{ width: "fit-content" }}>
            {t("labels.present")}
          </Button>
        </div>
      </Footer>
    );
  },
);
