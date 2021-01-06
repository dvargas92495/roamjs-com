import { Button, Overlay } from "@blueprintjs/core";
import marked from "roam-marked";
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
import { isSafari } from "mobile-device-detect";

const SAFARI_THEMES = ["black", "white", "beige"];

export const VALID_THEMES = [
  ...SAFARI_THEMES,
  "league",
  "sky",
  "night",
  "serif",
  "simple",
  "solarized",
  "blood",
  "moon",
];

const blockRefRegex = new RegExp("\\(\\((..........?)\\)\\)", "g");
const resolveRefs = (text: string) => {
  return text.replace(blockRefRegex, (_, blockUid) => {
    const reference = getTextByBlockUid(blockUid);
    return reference || blockUid;
  });
};

const unload = () =>
  Array.from(window.roamjs.dynamicElements)
    .filter((s) => !!s.parentElement)
    .forEach((s) => s.parentElement.removeChild(s));
unload();

// I'll clean this up if anyone asks. My god it's horrendous
const renderBullet = ({ c, i }: { c: Slide; i: number }): string =>
  `${"".padStart(i * 4, " ")}${c.text.match("!\\[.*\\]\\(.*\\)") ? "" : "- "}${
    c.heading ? `${"".padStart(c.heading, "#")} ` : ""
  }${resolveRefs(c.text)}${
    c.open
      ? c.children
          .map((nested) => `\n${renderBullet({ c: nested, i: i + 1 })}`)
          .join("")
      : ""
  }`;

const Notes = ({ note }: { note?: Slide }) => (
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

type ImageFromTextProps = {
  text: string;
};

const ImageFromText: React.FunctionComponent<
  ImageFromTextProps & {
    Alt: React.FunctionComponent<ImageFromTextProps>;
  }
> = ({ text, Alt }) => {
  const imageMatch = text.match(/!\[(.*)\]\((.*)\)/);
  const [style, setStyle] = useState({});
  const imageRef = useRef(null);
  const imageOnLoad = useCallback(() => {
    const imageAspectRatio = imageRef.current.width / imageRef.current.height;
    const containerAspectRatio =
      imageRef.current.parentElement.offsetWidth /
      imageRef.current.parentElement.offsetHeight;
    if (!isNaN(imageAspectRatio) && !isNaN(containerAspectRatio)) {
      if (imageAspectRatio > containerAspectRatio) {
        setStyle({ width: "100%", height: "auto" });
      } else {
        setStyle({ height: "100%", width: "auto" });
      }
    }
  }, [setStyle, imageRef]);
  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.onload = imageOnLoad;
    }
  }, [imageOnLoad, imageRef]);
  return imageMatch ? (
    <img alt={imageMatch[1]} src={imageMatch[2]} ref={imageRef} style={style} />
  ) : (
    <Alt text={text} />
  );
};

const TitleSlide = ({ text, note }: { text: string; note: Slide }) => {
  return (
    <section>
      <ImageFromText text={text} Alt={({ text }) => <h1>{text}</h1>} />
      <Notes note={note} />
    </section>
  );
};

const STARTS_WITH_IMAGE = new RegExp("^image ", "i");
const ENDS_WITH_LEFT = new RegExp(" left$", "i");

const ContentSlide = ({
  text,
  children,
  note,
  layout,
}: {
  text: string;
  children: Slides;
  note: Slide;
  layout: string;
}) => {
  const isImageLayout = STARTS_WITH_IMAGE.test(layout);
  const isLeftLayout = ENDS_WITH_LEFT.test(layout);
  const bullets = isImageLayout ? children.slice(1) : children;
  return (
    <section style={{ textAlign: "left" }}>
      <h1>{text}</h1>
      <div
        style={{
          display: "flex",
          flexDirection: isLeftLayout ? "row-reverse" : "row",
        }}
        className="r-stretch"
      >
        <div
          className={"roamjs-bullets-container"}
          dangerouslySetInnerHTML={{
            __html: marked(
              bullets.map((c) => renderBullet({ c, i: 0 })).join("\n")
            ),
          }}
          style={{
            width: isImageLayout ? "50%" : "100%",
            transformOrigin: "left top",
          }}
        />
        {isImageLayout && (
          <div
            style={{ width: "50%", textAlign: "center", alignSelf: "center" }}
          >
            <ImageFromText text={children[0].text} Alt={() => <div />} />
          </div>
        )}
      </div>
      <Notes note={note} />
    </section>
  );
};

const observerCallback = (ms: MutationRecord[]) =>
  ms
    .map((m) => m.target as HTMLElement)
    .filter((m) => m.className === "present")
    .map(
      (s) =>
        s.getElementsByClassName(
          "roamjs-bullets-container"
        )[0] as HTMLDivElement
    )
    .filter((d) => !!d)
    .forEach((d) => {
      const containerHeight = d.offsetHeight;
      if (containerHeight > 0) {
        const contentHeight = (d.children[0] as HTMLElement).offsetHeight;
        if (contentHeight > containerHeight) {
          const scale = containerHeight / contentHeight;
          d.style.transform = `scale(${scale})`;
        } else {
          d.style.transform = "initial";
        }
      }
    });

const PresentationContent: React.FunctionComponent<{
  slides: Slides;
  showNotes: boolean;
  onClose: () => void;
}> = ({ slides, onClose, showNotes }) => {
  const revealRef = useRef(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const mappedSlides = slides.map((s) => {
    let layout = "default";
    const text = s.text
      .replace(new RegExp("{layout:(.*)}", "is"), (_, capture) => {
        layout = capture;
        return "";
      })
      .trim();
    return {
      ...s,
      text,
      layout,
      children: showNotes
        ? s.children.slice(0, s.children.length - 1)
        : s.children,
      note: showNotes && s.children[s.children.length - 1],
    };
  });
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
    const observer = new MutationObserver(observerCallback);
    observer.observe(slidesRef.current, {
      attributeFilter: ["class"],
      subtree: true,
    });
    return () => observer.disconnect();
  }, [revealRef, slidesRef]);
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
      <div className="slides" ref={slidesRef}>
        {mappedSlides.map((s: Slide & { note: Slide; layout: string }, i) => (
          <React.Fragment key={i}>
            {s.children.length ? (
              <ContentSlide {...s} />
            ) : (
              <TitleSlide text={s.text} note={s.note} />
            )}
          </React.Fragment>
        ))}
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
    () =>
      (isSafari ? SAFARI_THEMES : VALID_THEMES).includes(theme)
        ? theme
        : "black",
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
    Array.from(window.roamjs.dynamicElements)
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
