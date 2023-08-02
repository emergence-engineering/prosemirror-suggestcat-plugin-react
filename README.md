# prosemirror-suggestcat-plugin

![made by Emergence Engineering](https://emergence-engineering.com/ee-logo.svg)

[**Made by Emergence-Engineering**](https://emergence-engineering.com/)

Basic UI for [prosemirror-suggestcat-plugin](https://github.com/emergence-engineering/prosemirror-suggestcat-plugin) in React.

## Features

![feature-gif](https://suggestcat.com/suggestcatReact.gif)

- A slash menu to select and filter commands, implemented with[prosemirror-slash-menu-react](https://github.com/emergence-engineering/prosemirror-slash-menu-react)
- A button over selection to open the menu
- An overlay to show/cancel/reject suggestions

## How to use?

- Import `SlashMenuPlugin` from [`prosemirror-slash-menu`](https://github.com/emergence-engineering/prosemirror-slash-menu-react)
- Import `ProsemirrorSuggestcatPluginReact` and `promptCommands` from [`prosemirror-suggestcat-plugin-react`](https://github.com/emergence-engineering/prosemirror-suggestcat-plugin-react)
- Add `SlashMenuPlugin` to your editor with `promptCommands`
- Create dom reference
- Add component next to your editor div

```tsx
import { SlashMenuPlugin } from "prosemirror-slash-menu";
import {
  promptCommands,
  ProsemirrorSuggestcatPluginReact,
} from "prosemirror-suggestcat-plugin-react";

const Editor: FC = () => {
  // Needed for re-renders on every tr.
  const [editorState, setEditorState] = useState<EditorState>();
  const [editorView, setEditorView] = useState<EditorView>();
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const state = EditorState.create({
      doc: schema.nodeFromJSON(initialDoc),
      plugins: [SlashMenuPlugin(promptCommands, undefined, undefined, true)],
    });
    const view = new EditorView(document.querySelector("#editor"), {
      state,
      dispatchTransaction: (tr) => {
        try {
          const newState = view.state.apply(tr);
          view.updateState(newState);
          setEditorState(newState);
        } catch (e) {}
      },
    });
    setEditorView(view);
    setEditorState(view.state);
    return () => {
      view.destroy();
    };
  }, [editorRef]);

  const slashMenuPopperRef = useMemo(() => {
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
  }, [editorView?.state?.selection, window.scrollY]);

  return (
    <Root>
      <StyledEditor id="editor" ref={editorRef} />
      {editorView && editorView?.state && slashMenuPopperRef && (
        <ProsemirrorSuggestcatPluginReact
          editorView={editorView}
          editorState={editorView?.state}
          domReference={slashMenuPopperRef}
        />
      )}
    </Root>
  );
};
```

### Props

- `domReference` This is a [Popper `referenceObject` ](https://popper.js.org/docs/v1/#referenceobject) under which the menu and suggestion overlay will appear. In our example it's under the selected paragraph.
- `editorView` prosemirror EditorView
- `editorState` prosemirror EditorState  TODO Explain more in NOTE

NOTE: The editor state is passed in separately just so that the component re-renders on state change, in the component it is not used, you should always use `view.state` when you use `prosemirror` in your projects. 


### Styles

- Import the `styles` from the package

```typescript
import "prosemirror-suggestcat-plugin-react/dist/styles/styles.css";
```

### UI behaviour

Navigation is intuitive with keyboard using arrows, Tab, Enter,Esc etc. and also with clicks. The prompt menu is using [prosemirror-slash-menu-react](https://github.com/emergence-engineering/prosemirror-slash-menu-react), the exact behaviour is detailed in the Readme.

### Customization 

This package is not made with customization as a priority, it's intended to be a quick and easy way to use Suggestcat. 
With that in mind, with providing your own popper reference object and replacing our CSS classes,
it is fairly simple to modify it to blend more into your app. 
You could also pass your own commands into `SlashMenuPlugin` to replace or delete the icons, change the labels. 
However, keep in mind that the actual command function needs to be the same to properly work together with [prosemirror-suggestcat-plugin](https://github.com/emergence-engineering/prosemirror-suggestcat-plugin)