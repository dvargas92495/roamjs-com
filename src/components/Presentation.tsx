import { Button, Overlay } from "@blueprintjs/core";
import marked from "marked";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import Reveal from "reveal.js";
import { addStyle, getTextByBlockUid, isControl } from "../entry-helpers";

export const VALID_THEMES = [
  "black",
  "white",
  "league",
  "beige",
  "sky",
  "night",
  "serif",
  "simple",
  "solarized",
  "blood",
  "moon",
];

marked.use({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore should be optional
  renderer: {
    text: (text: string) => {
      let openingTag = false;
      const highlightRegex = new RegExp("\\^\\^", "g");
      const blockRefRegex = new RegExp("\\(\\((..........?)\\)\\)", "g");
      return text
        .replace(highlightRegex, (): string => {
          openingTag = !openingTag;
          return openingTag ? '<span class="rm-highlight">' : "</span>";
        })
        .replace(blockRefRegex, (_, blockUid) => {
          const reference = getTextByBlockUid(blockUid);
          return reference || blockUid;
        });
    },
  },
});

const revealStylesLoaded = Array.from(
  document.getElementsByClassName("roamjs-style-reveal")
);
const unload = () =>
  revealStylesLoaded
    .filter((s) => !!s.parentElement)
    .forEach((s) => s.parentElement.removeChild(s));
unload();

// I'll clean this up if anyone asks. My god it's horrendous
const renderBullet = ({ c, i }: { c: Slide; i: number }): string =>
  `${"".padStart(i * 4, " ")}${c.text.match("!\\[.*\\]\\(.*\\)") ? "" : "- "}${
    c.heading ? `${"".padStart(c.heading, "#")} ` : ""
  }${c.text.replace(new RegExp("__", "g"), "_")}${
    c.open
      ? c.children
          .map((nested) => `\n${renderBullet({ c: nested, i: i + 1 })}`)
          .join("")
      : ""
  }`;

const Notes = ({ note }: { note: Slide }) => (
  <>
    {note && (
      <aside
        className="notes"
        dangerouslySetInnerHTML={{
          __html: marked(renderBullet({ c: note, i: 0 })),
        }}
      />
    )}
  </>
);

const TitleSlide = ({ text, note }: { text: string; note: Slide }) => (
  <section>
    <h1>{text}</h1>
    <Notes note={note} />
  </section>
);

const ContentSlide = ({
  text,
  children,
  note,
}: {
  text: string;
  children: Slides;
  note: Slide;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("initial");
  useEffect(() => {
    const containerHeight = contentRef.current?.offsetHeight;
    if (containerHeight > 0) {
      const setScale = () => {
        const title = text;
        const contentHeight = (contentRef.current.children[0] as HTMLElement)
          .offsetHeight;
        if (contentHeight > containerHeight) {
          const scale = containerHeight / contentHeight;
          setTransform(`scale(${scale})`);
        } else {
          setTransform("initial");
        }
      };
      setScale();
      Array.from(contentRef.current.getElementsByTagName("img")).forEach(
        (i) => (i.onload = setScale)
      );
    }
  }, [contentRef.current, setTransform]);
  return (
    <section style={{ textAlign: "left" }}>
      <h1>{text}</h1>
      <div
        ref={contentRef}
        style={{ transform, transformOrigin: "left top" }}
        className="r-stretch"
        dangerouslySetInnerHTML={{
          __html: marked(
            children.map((c) => renderBullet({ c, i: 0 })).join("\n")
          ),
        }}
      />
      <Notes note={note} />
    </section>
  );
};

const PresentationContent: React.FunctionComponent<{
  slides: Slides;
  showNotes: boolean;
  onClose: () => void;
}> = ({ slides, onClose, showNotes }) => {
  const revealRef = useRef(null);
  const mappedSlides = showNotes
    ? slides.map((s) => ({
        ...s,
        children: s.children.slice(0, s.children.length - 1),
        note: s.children[s.children.length - 1],
      }))
    : slides;
  useEffect(() => {
    const deck = new Reveal({
      embedded: true,
      slideNumber: "c/t",
      width: window.innerWidth * 0.9,
      height: window.innerHeight * 0.9,
      showNotes,
    });
    deck.initialize();
    revealRef.current = deck;
  }, [revealRef]);
  const bodyEscapePrint = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (isControl(e) && e.key === "p" && !e.shiftKey && !e.altKey) {
        revealRef.current.isPrintingPdf = () => true;
        const injectedStyle = addStyle(`@media print {
  body * {
    visibility: hidden;
  }
  #roamjs-presentation-container #otherother * {
    visibility: visible;
  }
  #roamjs-presentation-container * {
    position: absolute;
    left: 0;
    top: 0;
  }
}`);
        const onAfterPrint = () => {
          injectedStyle.parentElement.removeChild(injectedStyle);
          window.removeEventListener("afterprint", onAfterPrint);
        };
        window.addEventListener("afterprint", onAfterPrint);
        window.print();
        e.preventDefault();
      }
    },
    [onClose]
  );
  useEffect(() => {
    document.body.addEventListener("keydown", bodyEscapePrint);
    return () => document.body.removeEventListener("keydown", bodyEscapePrint);
  }, [bodyEscapePrint]);
  return (
    <div className="reveal" id="otherother">
      <div className="slides">
        {mappedSlides.map((s: Slide & { note: Slide }, i) =>
          s.children.length ? (
            <ContentSlide {...s} key={i} />
          ) : (
            <TitleSlide text={s.text} key={i} note={s.note} />
          )
        )}
      </div>
    </div>
  );
};

const Presentation: React.FunctionComponent<{
  getSlides: () => Slides;
  theme?: string;
  notes?: string;
}> = ({ getSlides, theme, notes }) => {
  const normalizedTheme = useMemo(
    () => (VALID_THEMES.includes(theme) ? theme : "black"),
    []
  );
  const showNotes = notes === "true";
  const [showOverlay, setShowOverlay] = useState(false);
  const [slides, setSlides] = useState([]);
  const onClose = useCallback(() => {
    setShowOverlay(false);
    unload();
  }, [setShowOverlay]);

  const open = useCallback(async () => {
    setShowOverlay(true);
    setSlides(getSlides());
    revealStylesLoaded
      .filter(
        (s) =>
          s.id.endsWith(`${normalizedTheme}.css`) || s.id.endsWith("reveal.css")
      )
      .forEach((s) => document.head.appendChild(s));
  }, [setShowOverlay, normalizedTheme, getSlides, setSlides]);
  return (
    <>
      <Button onClick={open} data-roamjs-presentation text={"PRESENT"} />
      <Overlay canEscapeKeyClose onClose={onClose} isOpen={showOverlay}>
        <div
          style={{
            height: "100%",
            width: "100%",
            zIndex: 2000,
          }}
          id="roamjs-presentation-container"
        >
          <PresentationContent
            slides={slides}
            onClose={onClose}
            showNotes={showNotes}
          />
          <Button
            icon={"cross"}
            onClick={onClose}
            minimal
            style={{ position: "absolute", top: 8, right: 8 }}
          />
        </div>
      </Overlay>
    </>
  );
};

type Slide = {
  text: string;
  children: Slides;
  heading?: number;
  open: boolean;
};

type Slides = Slide[];

export const render = ({
  button,
  getSlides,
  options,
}: {
  button: HTMLButtonElement;
  getSlides: () => Slides;
  options: { [key: string]: string };
}): void =>
  ReactDOM.render(
    <Presentation getSlides={getSlides} {...options} />,
    button.parentElement
  );

export default Presentation;
