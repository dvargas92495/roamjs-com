import { Button, Overlay } from "@blueprintjs/core";
import marked from "marked";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";

const Presentation: React.FunctionComponent<{
  getSlides: () => Slides;
}> = ({ getSlides }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const onClose = useCallback(() => {
    setShowOverlay(false);
    setLoaded(false);
    Array.from(document.getElementsByTagName("style"))
      .filter((s) => s.innerText.includes("reveal.js"))
      .forEach((s) => s.parentElement.removeChild(s));
  }, [setShowOverlay, setLoaded]);
  const open = useCallback(async () => {
    setShowOverlay(true);
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

${s.children.map(c => `- ${c.text}\n`)}                    `),
                  }}
                  key={i}
                />
              ))}
            </div>
          </div>
        </div>
      </Overlay>
    </>
  );
};

type Slides = {text: string, children: Slides}[]

export const render = ({
  button,
  getSlides,
}: {
  button: HTMLButtonElement;
  getSlides: () => Slides;
}): void =>
  ReactDOM.render(<Presentation getSlides={getSlides} />, button.parentElement);

export default Presentation;
