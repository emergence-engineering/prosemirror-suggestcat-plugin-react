import React, { FC, useCallback, useMemo, useState } from "react";
import { SlashMenuReact } from "prosemirror-slash-menu-react";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { promptIcons, PromptIcons } from "./promptIcons";
import { SuggestionOverlay } from "./SuggestionOverlay";
import { completePluginKey, Status } from "prosemirror-suggestcat-plugin";
import {
  dispatchWithMeta,
  SlashMenuKey,
  SlashMetaTypes,
} from "prosemirror-slash-menu";
import { usePopper } from "react-popper";

export const ProsemirrorSuggestcatPluginReact: FC<{
  editorView: EditorView;
  editorState: EditorState;
  domReference?: HTMLElement;
}> = ({ editorView, editorState, domReference }) => {
  const slashMenuPopperRef = useMemo(() => {
    if (!editorView || !editorView?.state) {
      return;
    }

    const currentNode = editorView.domAtPos(editorView.state.selection.to)
      ?.node;

    if (!currentNode) {
      return;
    }

    if (currentNode instanceof Text) {
      return currentNode.parentElement;
    }

    return currentNode instanceof HTMLElement ? currentNode : undefined;
  }, [editorView?.state?.selection, window.scrollY]);

  const [toolTipPopperElement, setToolTipPopperElement] =
    useState<HTMLDivElement | null>(null);
  const suggestionState = useMemo(() => {
    if (!editorView?.state) return;
    return completePluginKey.getState(editorView?.state);
  }, [editorView?.state]);

  const overlayElement = useMemo(() => {
    return document.getElementById("suggestion-overlay");
  }, [editorState]);
  const tooltipVirtualRef = useMemo(() => {
    if (!editorView || !editorView?.state) {
      return;
    }

    const currentNode = editorView.domAtPos(editorView.state.selection.to)
      ?.node;

    if (!currentNode) {
      return;
    }

    if (currentNode instanceof Text) {
      return currentNode.parentElement;
    }
    return currentNode instanceof HTMLElement ? currentNode : undefined;
  }, [editorView?.state, window.scrollY]);

  const slashMenuDomReference = useMemo(() => {
    return overlayElement || domReference;
  }, [domReference, overlayElement, suggestionState]);
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
  return (
    <>
      <div>
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
            <div className={"ai-tooltip-label"}>Ask AI</div>
          </div>
        )}

        {suggestionState?.status !== Status.idle &&
          suggestionState?.status !== Status.done && (
            <SuggestionOverlay
              editorView={editorView}
              status={suggestionState?.status}
              domReference={domReference || slashMenuPopperRef}
              content={suggestionState?.result}
            />
          )}
        <SlashMenuReact
          editorState={editorState}
          editorView={editorView}
          filterPlaceHolder="Start writing a prompt or choose from below..."
          mainMenuLabel="Actions"
          popperReference={slashMenuDomReference}
          icons={{
            [PromptIcons.FixGrammar]: promptIcons.FixGrammarIcon,
            [PromptIcons.MakeItShorter]: promptIcons.MakeItShorterIcon,
            [PromptIcons.MakeItLonger]: promptIcons.MakeItLongerIcon,
            [PromptIcons.Complete]: promptIcons.CompleteIcon,
            [PromptIcons.Explain]: promptIcons.ExplainIcon,
            [PromptIcons.Simplify]: promptIcons.SimplifyIcon,
            [PromptIcons.ChangeTone]: promptIcons.ChangeToneIcon,
            [PromptIcons.Translate]: promptIcons.TranslateIcon,
            [PromptIcons.ActionItems]: promptIcons.ActionItemsIcon,
          }}
          rightIcons={{
            [PromptIcons.ChangeTone]: promptIcons.SubMenuArrowIcon,
            [PromptIcons.Translate]: promptIcons.SubMenuArrowIcon,
          }}
          clickable={true}
        />
      </div>
    </>
  );
};
