import { Button, Overlay } from "@blueprintjs/core";
import marked from "marked";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";

const Presentation: React.FunctionComponent<{
  getMarkdown: () => string[];
}> = ({ getMarkdown }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const onClose = useCallback(() => {
    setShowOverlay(false);
    setLoaded(false);
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
  const slides = useMemo(getMarkdown, [getMarkdown]);
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
                  dangerouslySetInnerHTML={{ __html: marked(s) }}
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

export const render = ({
  button,
  getMarkdown,
}: {
  button: HTMLButtonElement;
  getMarkdown: () => string[];
}): void =>
  ReactDOM.render(
    <Presentation getMarkdown={getMarkdown} />,
    button.parentElement
  );

export default Presentation;
