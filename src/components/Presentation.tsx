import { Button, Overlay } from "@blueprintjs/core";
import marked from "marked";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  `${"".padStart(i * 4, " ")}- ${c.text}${c.children
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
}) => (
  <section style={{ textAlign: "left" }}>
    <h1>{text}</h1>
    <div
      className="r-stretch"
      dangerouslySetInnerHTML={{
        __html: marked(
          children.map((c) => renderBullet({ c, i: 0 })).join("\n")
        ),
      }}
    />
  </section>
);

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
  const onClose = useCallback(() => {
    setShowOverlay(false);
    setLoaded(false);
    unload();
  }, [setLoaded, setShowOverlay]);

  const open = useCallback(async () => {
    setShowOverlay(true);
    revealStylesLoaded
      .filter(
        (s) =>
          s.id.endsWith(`${normalizedTheme}.css`) || s.id.endsWith("reveal.css")
      )
      .forEach((s) => document.head.appendChild(s));
  }, [setShowOverlay, normalizedTheme]);
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
  const slides = useMemo(getSlides, [getSlides]);
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
