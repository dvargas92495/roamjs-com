import { Button, Overlay } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";

const Presentation: React.FunctionComponent = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const onClose = useCallback(() => setShowOverlay(false), [setShowOverlay]);
  const open = useCallback(async () => {
    const Reveal = await import("reveal.js").then((r) => r.default);
    setShowOverlay(true);
    const deck = new Reveal({
      embedded: true,
    });
    deck.initialize();
  }, [setShowOverlay]);
  return (
    <>
      <Button onClick={open} data-roamjs-presentation text={"PRESENT"} />
      <Overlay isOpen={showOverlay}>
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
        <Button
          icon={'cross'}
          onClick={onClose}
          style={{ display: "fixed", right: 32, top: 32, zIndex: 3000 }}
        />
      </Overlay>
    </>
  );
};

export const DemoPresentation: React.FunctionComponent = () => <Presentation />;

export const render = (b: HTMLButtonElement): void =>
  ReactDOM.render(<Presentation />, b.parentElement);

export default Presentation;
