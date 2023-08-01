import React, {
  FC,
  FocusEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePopper } from "react-popper";
import { completePluginKey, Status } from "prosemirror-suggestcat-plugin";
import { EditorView } from "prosemirror-view";
import { promptIcons } from "./promptIcons";
import {
  dispatchWithMeta,
  SlashMenuKey,
  SlashMetaTypes,
} from "prosemirror-slash-menu";

export const SuggestionOverlay: FC<{
  editorView: EditorView;
  status: Status | undefined;
  domReference: HTMLElement;
  content: string | undefined;
}> = ({ status, domReference, content, editorView }) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const [toolTipPopperElement, setToolTipPopperElement] =
    useState<HTMLDivElement | null>(null);
  const tooltipVirtualRef = useMemo(() => {
    if (!editorView || !editorView?.state) {
      return;
    }

    const currentNode = editorView.domAtPos(
      editorView.state.selection.to,
    )?.node;

    if (!currentNode) {
      return;
    }

    if (currentNode instanceof Text) {
      return currentNode.parentElement;
    }
    return currentNode instanceof HTMLElement ? currentNode : undefined;
  }, [editorView?.state, window.scrollY]);

  const [selectedButton, setSelectedButton] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(domReference, popperElement, {
    placement: "bottom-start",
    modifiers: [
      { name: "flip", enabled: true },
      {
        name: "preventOverflow",
        options: {
          mainAxis: false,
        },
      },
      {
        name: "offset",
        options: {
          offset: [0, 0],
        },
      },
    ],
  });
  const { styles: tooltipStyles, attributes: tooltipAttrs } = usePopper(
    tooltipVirtualRef,
    toolTipPopperElement,
    {
      placement: "left",
      modifiers: [
        { name: "flip", enabled: true },
        {
          name: "preventOverflow",
          options: {
            mainAxis: false,
          },
        },
        {
          name: "offset",
          options: {
            offset: [0, 20],
          },
        },
      ],
    },
  );

  const accept = useCallback(() => {
    if (!editorView) {
      return;
    }
    const state = completePluginKey.getState(editorView.state);
    if (state?.status === Status.finished)
      editorView.dispatch(
        editorView.state.tr.setMeta(completePluginKey, {
          type: state.type,
          status: Status.accepted,
        }),
      );
    editorView.focus();
  }, [editorView]);

  const reject = useCallback(() => {
    if (!editorView) {
      return;
    }
    const state = completePluginKey.getState(editorView.state);
    if (state?.status === "finished")
      editorView.dispatch(
        editorView.state.tr.setMeta(completePluginKey, {
          type: state.type,
          status: Status.rejected,
        }),
      );
    editorView.focus();
  }, [editorView]);

  const keydownHandler = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "ArrowDown" && selectedButton === 0) {
        setSelectedButton(1);
      } else if (e.key === "ArrowUp" && selectedButton === 1) {
        setSelectedButton(0);
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (selectedButton === 0) {
          accept();
          return true;
        } else {
          reject();
          return true;
        }
      } else if (e.key === "Escape") {
        reject();
        return true;
      }
    },
    [selectedButton, accept, reject],
  );

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    if (status === Status.finished) {
      rootRef.current?.focus();
    }
  }, [rootRef, status]);

  const rootOnBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (
        rootRef.current &&
        (!event.relatedTarget ||
          !(event.relatedTarget instanceof Node) ||
          !rootRef.current?.contains(event?.relatedTarget || null))
      ) {
        reject();
      }
    },
    [rootRef, reject],
  );
  console.log("inhere");
  useEffect(() => {
    const element = document.querySelector("#suggestion-overlay");
    if (
      typeof element?.scrollTop !== "number" ||
      typeof element?.scrollHeight !== "number"
    ) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [content]);
  const suggestionState = useMemo(() => {
    if (!editorView?.state) return;
    return completePluginKey.getState(editorView?.state);
  }, [editorView?.state]);
  const shouldDisplay = useMemo(() => {
    if (!editorView?.state) return false;
    const slashMenuOpen = SlashMenuKey.getState(editorView?.state)?.open;

    return (
      editorView?.state?.selection.from !== editorView?.state?.selection.to &&
      !slashMenuOpen &&
      suggestionState?.status === Status.idle
    );
  }, [editorView?.state, suggestionState]);
  const handleTooltipClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!editorView) return;
      dispatchWithMeta(editorView, SlashMenuKey, {
        type: SlashMetaTypes.open,
      });
      return true;
    },
    [editorView],
  );
  useEffect(() => console.log({ shouldDisplay }), [shouldDisplay]);
  return (
    <>
      {shouldDisplay && (
        <div
          id={"popper"}
          ref={setToolTipPopperElement}
          className={"ai-tooltip"}
          style={{
            ...tooltipStyles.popper,
          }}
          {...tooltipAttrs.popper}
          onClick={handleTooltipClick}
        >
          {promptIcons.StarIcon()}
          <div className={"ai-tooltip"}>Ask AI</div>
        </div>
      )}
      <div
        id={"popper"}
        ref={setPopperElement}
        className={"overlay-popper-element"}
        style={styles.popper}
        {...attributes.popper}
      >
        {(status === Status.streaming || status === Status.finished) && (
          <div
            className={"overLayContainer"}
            ref={rootRef}
            onKeyDown={keydownHandler}
            tabIndex={0}
            onBlur={rootOnBlur}
          >
            <div className={"overlay"} id={"suggestion-overlay"}>
              {content}
            </div>
            {status === Status.finished && (
              <div className="buttons">
                <div className="actionLabel">Actions</div>
                <div
                  className={
                    selectedButton === 0
                      ? "actionButton-selected"
                      : "actionButton"
                  }
                  onClick={accept}
                >
                  <div className={"iconWrapper"}>
                    {promptIcons.AcceptIcon()}
                  </div>
                  Accept
                </div>
                <div
                  className={
                    selectedButton === 1
                      ? "actionButton-selected"
                      : "actionButton"
                  }
                  onClick={reject}
                >
                  <div className={"iconWrapper"}>
                    {promptIcons.RejectIcon()}
                  </div>
                  Reject
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
