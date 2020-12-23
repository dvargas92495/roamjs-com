import { Button, Overlay } from "@blueprintjs/core";
import marked from "marked";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";

const renderBullet = ({ c, i }: { c: Slide; i: number }): string =>
  `${"".padStart(i * 4, " ")}- ${c.text}${c.children
    .map((nested) => `\n${renderBullet({ c: nested, i: i + 1 })}`)
    .join("")}`;

const Presentation: React.FunctionComponent<{
  getSlides: () => Slides;
}> = ({ getSlides }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const onClose = useCallback(() => {
    setShowOverlay(false);
    setLoaded(false);
    window.roamjs.extension.presentation.unload();
  }, [setLoaded, setShowOverlay]);

  const open = useCallback(async () => {
    setShowOverlay(true);
    window.roamjs.extension.presentation.load();
  }, [setShowOverlay]);
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
        center: false,
      });
      deck.initialize();
    }
  }, [loaded]);
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
              {slides.map((s, i) => (
                <section
                  dangerouslySetInnerHTML={{
                    __html: marked(`# ${s.text}

${s.children.map((c) => renderBullet({ c, i: 0 })).join("\n")}`),
                  }}
                  key={i}
                  className={s.children.length ? "" : "center"}
                />
              ))}
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
}: {
  button: HTMLButtonElement;
  getSlides: () => Slides;
}): void =>
  ReactDOM.render(<Presentation getSlides={getSlides} />, button.parentElement);

export default Presentation;
