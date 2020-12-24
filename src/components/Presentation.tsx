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

const VALID_THEMES = [
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

const revealStylesLoaded = Array.from(
  document.getElementsByClassName("roamjs-style-reveal")
);
const unload = () =>
  revealStylesLoaded
    .filter((s) => !!s.parentElement)
    .forEach((s) => s.parentElement.removeChild(s));
unload();

const renderBullet = ({ c, i }: { c: Slide; i: number }): string =>
  `${"".padStart(i * 4, " ")}${c.text.match("!\\[.*\\]\\(.*\\)") ? "" : "- "}${
    c.text
  }${c.children
    .map((nested) => `\n${renderBullet({ c: nested, i: i + 1 })}`)
    .join("")}`;

const TitleSlide = ({ text }: { text: string }) => (
  <section>
    <h1>{text}</h1>
  </section>
);

const ContentSlide = ({
  text,
  children,
}: {
  text: string;
  children: Slides;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("initial");
  useEffect(() => {
    const containerHeight = contentRef.current?.offsetHeight;
    if (containerHeight > 0) {
      const setScale = () => {
        const contentHeight = (contentRef.current.children[0] as HTMLElement)
          .offsetHeight;
        if (contentHeight > containerHeight) {
          const scale = containerHeight / contentHeight;
          setTransform(`scale(${scale})`);
        } else {
          setTransform('initial');
        }
      };
      setScale();
      Array.from(contentRef.current.getElementsByTagName('img')).forEach(i => i.onload = setScale);
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
    </section>
  );
};

const Presentation: React.FunctionComponent<{
  getSlides: () => Slides;
  theme?: string;
}> = ({ getSlides, theme }) => {
  const normalizedTheme = useMemo(
    () => (VALID_THEMES.includes(theme) ? theme : "black"),
    []
  );
  const [showOverlay, setShowOverlay] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [slides, setSlides] = useState([]);
  const onClose = useCallback(() => {
    setShowOverlay(false);
    setLoaded(false);
    unload();
  }, [setLoaded, setShowOverlay]);

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
  useEffect(() => {
    if (showOverlay) {
      setLoaded(true);
    }
  }, [showOverlay, setLoaded]);
  useEffect(() => {
    if (loaded) {
      const deck = new Reveal({
        embedded: true,
        slideNumber: "c/t",
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.9,
      });
      deck.initialize();
    }
  }, [loaded]);
  const bodyEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );
  useEffect(() => {
    document.body.addEventListener("keydown", bodyEscape);
    return () => document.body.removeEventListener("keydown", bodyEscape);
  }, [bodyEscape]);
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
        >
          <div className="reveal">
            <div className="slides">
              {slides.map((s, i) =>
                s.children.length ? (
                  <ContentSlide {...s} key={i} />
                ) : (
                  <TitleSlide text={s.text} key={i} />
                )
              )}
            </div>
          </div>
        </div>
      </Overlay>
    </>
  );
};

type Slide = { text: string; children: Slides };

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
