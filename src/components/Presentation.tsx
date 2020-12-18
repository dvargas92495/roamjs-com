import { Button, Overlay } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";

const Presentation: React.FunctionComponent = () => {
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
              <section>Vertical Slide 1</section>
              <section>Vertical Slide 2</section>
              <section>Vertical Slide 3</section>
              <section>Vertical Slide 4</section>
            </div>
          </div>
        </div>
      </Overlay>
    </>
  );
};

export const render = (b: HTMLButtonElement): void =>
  ReactDOM.render(<Presentation />, b.parentElement);

export default Presentation;
