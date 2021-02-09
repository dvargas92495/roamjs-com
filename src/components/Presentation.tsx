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
import { addStyle, isControl, resolveRefs } from "../entry-helpers";
import { isSafari } from "mobile-device-detect";
import { getUids, ViewType } from "roam-client";

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

const IMG_MAX_WIDTH = 580;
const IMG_MAX_HEIGHT = 720;

const renderViewType = (viewType: ViewType) => {
  switch (viewType) {
    case "numbered":
      return "1. ";
    case "document":
    case "bullet":
    default:
      return "- ";
  }
};

const unload = () =>
  Array.from(window.roamjs.dynamicElements)
    .filter((s) => !!s.parentElement)
    .forEach((s) => s.parentElement.removeChild(s));

// I'll clean this up if anyone asks. My god it's horrendous
const renderBullet = ({
  c,
  i,
  parentViewType,
}: {
  c: Slide;
  i: number;
  parentViewType?: ViewType;
}): string =>
  `${"".padStart(i * 4, " ")}${renderViewType(parentViewType)}${
    c.heading ? `${"".padStart(c.heading, "#")} ` : ""
  }${resolveRefs(c.text)}${
    c.open && c.children.length
      ? `\n${c.children
          .map(
            (nested) =>
              `${renderBullet({
                c: nested,
                i: i + 1,
                parentViewType: c.viewType,
              })}`
          )
          .join(parentViewType === "document" ? "\n\n" : "\n")}`
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
  imageResizes?: {
    [link: string]: {
      height: number;
      width: number;
    };
  };
};

const IMG_REGEX = /!\[(.*)\]\((.*)\)/;

const ImageFromText: React.FunctionComponent<
  ImageFromTextProps & {
    Alt: React.FunctionComponent<ImageFromTextProps>;
  }
> = ({ text, Alt, imageResizes }) => {
  const imageMatch = text.match(IMG_REGEX);
  const [style, setStyle] = useState({});
  const imageRef = useRef(null);
  const imageResize = imageMatch && imageResizes[imageMatch[2]];
  const imageOnLoad = useCallback(() => {
    const imageAspectRatio = imageRef.current.width / imageRef.current.height;
    const containerAspectRatio =
      imageRef.current.parentElement.offsetWidth /
      imageRef.current.parentElement.offsetHeight;
    if (imageResize) {
      setStyle({
        width: isNaN(imageResize.width)
          ? "auto"
          : `${Math.ceil((100 * imageResize.width) / IMG_MAX_WIDTH)}%`,
        height: isNaN(imageResize.height)
          ? "auto"
          : `${(100 * imageResize.height) / IMG_MAX_HEIGHT}%`,
      });
    } else if (!isNaN(imageAspectRatio) && !isNaN(containerAspectRatio)) {
      if (imageAspectRatio > containerAspectRatio) {
        setStyle({ width: "100%", height: "auto" });
      } else {
        setStyle({ height: "100%", width: "auto" });
      }
    }
  }, [setStyle, imageRef, imageResize]);
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
  const style = IMG_REGEX.test(text) ? { bottom: 0 } : {};
  return (
    <section style={style}>
      <ImageFromText text={text} Alt={({ text }) => <h1>{text}</h1>} />
      <Notes note={note} />
    </section>
  );
};

const STARTS_WITH_IMAGE = new RegExp("^image ", "i");
const ENDS_WITH_LEFT = new RegExp(" left$", "i");

type ContentSlideExtras = { note: Slide; layout: string; collapsible: boolean };

const setDocumentLis = ({
  e,
  s,
  v,
}: {
  e: HTMLElement;
  s: Slides;
  v: ViewType;
}): void => {
  Array.from(e.children).forEach((li: HTMLLIElement, i) => {
    const lastChild = li.lastElementChild as HTMLElement;
    if (["UL", "OL"].includes(lastChild?.tagName)) {
      setDocumentLis({ e: lastChild, s: s[i].children, v: s[i].viewType });
    }
    if (v === "document") {
      li.classList.add("roamjs-document-li");
    } else if (Array.from(li.children).some((e) => e.tagName === "IMG")) {
      li.classList.add("roamjs-document-li");
    }
  });
};

const LAYOUTS = ["Image Left", "Image Right"];

const ContentSlide = ({
  text,
  children,
  note,
  layout,
  collapsible,
  viewType,
}: {
  text: string;
  children: Slides;
  viewType: ViewType;
} & ContentSlideExtras) => {
  const isImageLayout = STARTS_WITH_IMAGE.test(layout);
  const isLeftLayout = ENDS_WITH_LEFT.test(layout);
  const bullets = isImageLayout ? children.slice(1) : children;
  const slideRoot = useRef<HTMLDivElement>(null);
  const [caretsLoaded, setCaretsLoaded] = useState(false);
  useEffect(() => {
    if (collapsible && !caretsLoaded) {
      const lis = Array.from(slideRoot.current.getElementsByTagName("li"));
      let minDepth = Number.MAX_VALUE;
      lis.forEach((l) => {
        if (
          l.getElementsByTagName("ul").length ||
          l.getElementsByTagName("ol").length
        ) {
          const spanIcon = document.createElement("span");
          spanIcon.className =
            "bp3-icon bp3-icon-caret-right roamjs-collapsible-caret";
          l.style.position = "relative";
          l.insertBefore(spanIcon, l.childNodes[0]);
          l.classList.add("roamjs-collapsible-bullet");
        }
        let depth = 0;
        let parentElement = l as HTMLElement;
        while (parentElement !== slideRoot.current) {
          parentElement = parentElement.parentElement;
          depth++;
        }
        minDepth = Math.min(minDepth, depth);
        l.setAttribute("data-dom-depth", depth.toString());
      });
      lis.forEach((l) => {
        const depth = parseInt(l.getAttribute("data-dom-depth"));
        if (depth === minDepth) {
          l.style.display = "list-item";
        } else {
          l.style.display = "none";
        }
      });
      setCaretsLoaded(true);
    }
  }, [collapsible, slideRoot.current, caretsLoaded, setCaretsLoaded]);
  useEffect(() => {
    setDocumentLis({
      e: slideRoot.current.firstElementChild as HTMLElement,
      s: bullets,
      v: viewType,
    });
  }, [bullets, slideRoot.current, viewType]);
  const onRootClick = useCallback(
    (e: React.MouseEvent) => {
      if (collapsible) {
        const target = e.target as HTMLElement;
        const className = target.className;
        if (className.includes("roamjs-collapsible-caret")) {
          let minDepth = Number.MAX_VALUE;
          const lis = Array.from(
            target.parentElement.getElementsByTagName("li")
          );
          lis.forEach((l) => {
            const depth = parseInt(l.getAttribute("data-dom-depth"));
            minDepth = Math.min(depth, minDepth);
          });
          const lisToRestyle = lis.filter(
            (l) => parseInt(l.getAttribute("data-dom-depth")) === minDepth
          );
          if (className.includes("bp3-icon-caret-right")) {
            target.className = className.replace(
              "bp3-icon-caret-right",
              "bp3-icon-caret-down"
            );
            lisToRestyle.forEach((l) => (l.style.display = "list-item"));
          } else if (className.includes("bp3-icon-caret-down")) {
            target.className = className.replace(
              "bp3-icon-caret-down",
              "bp3-icon-caret-right"
            );
            lisToRestyle.forEach((l) => (l.style.display = "none"));
          }
        }
      }
    },
    [collapsible]
  );
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
        {caretsLoaded && (
          <style>
            {`.roamjs-collapsible-bullet::marker, .roamjs-document-li::marker {
  color:${
    document.getElementById("roamjs-reveal-root")
      ? getComputedStyle(document.getElementById("roamjs-reveal-root"))
          .backgroundColor
      : ""
  };
}`}
          </style>
        )}
        <div
          className={"roamjs-bullets-container"}
          dangerouslySetInnerHTML={{
            __html: marked(
              bullets
                .map((c) => renderBullet({ c, i: 0, parentViewType: viewType }))
                .join(viewType === "document" ? "\n\n" : "\n")
            ),
          }}
          style={{
            width: isImageLayout ? "50%" : "100%",
            transformOrigin: "left top",
          }}
          ref={slideRoot}
          onClick={onRootClick}
        />
        {isImageLayout && (
          <div
            style={{
              width: "50%",
              textAlign: "center",
              alignSelf: "center",
              height: "100%",
            }}
          >
            <span
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                height: "100%",
              }}
            />
            <ImageFromText
              text={children[0].text}
              Alt={() => <div />}
              imageResizes={children[0].props.imageResize}
            />
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

export const COLLAPSIBLE_REGEX = /({collapsible}|\[\[{collapsible}\]\])|{\[\[collapsible\]\]}/i;

const PresentationContent: React.FunctionComponent<{
  slides: Slides;
  showNotes: boolean;
  onClose: (index: number) => void;
  globalCollapsible: boolean;
  startIndex: number;
}> = ({ slides, onClose, showNotes, globalCollapsible, startIndex }) => {
  const revealRef = useRef(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const mappedSlides = slides.map((s) => {
    let layout = "default";
    let collapsible = globalCollapsible || false;
    const text = s.text
      .replace(
        new RegExp(`{layout:(${LAYOUTS.join("|")})}`, "is"),
        (_, capture) => {
          layout = capture;
          return "";
        }
      )
      .replace(COLLAPSIBLE_REGEX, () => {
        collapsible = true;
        return "";
      })
      .trim();
    return {
      ...s,
      text,
      layout,
      collapsible,
      children: showNotes
        ? s.children.slice(0, s.children.length - 1)
        : s.children,
      note: showNotes && s.children[s.children.length - 1],
    };
  });
  const onCloseClick = useCallback(
    (e: Event) => {
      revealRef.current.getRevealElement().style.display = "none";
      onClose(revealRef.current.getState().indexh);
      e.stopImmediatePropagation();
    },
    [onClose, revealRef]
  );
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    const deck = new Reveal({
      embedded: true,
      slideNumber: "c/t",
      width: window.innerWidth * 0.9,
      height: window.innerHeight * 0.9,
      showNotes,
      minScale: 1,
      maxScale: 1,
    });
    deck.initialize();
    revealRef.current = deck;
    const observer = new MutationObserver(observerCallback);
    observer.observe(slidesRef.current, {
      attributeFilter: ["class"],
      subtree: true,
    });
    setInitialized(true);
    return () => observer.disconnect();
  }, [revealRef, slidesRef, setInitialized]);
  const bodyEscapePrint = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseClick(e);
      } else if (isControl(e) && e.key === "p" && !e.shiftKey && !e.altKey) {
        revealRef.current.isPrintingPdf = () => true;
        const injectedStyle = addStyle(`@media print {
  body * {
    visibility: hidden;
  }
  #roamjs-presentation-container #roamjs-reveal-root * {
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
    [onCloseClick, revealRef]
  );
  useEffect(() => {
    document.body.addEventListener("keydown", bodyEscapePrint);
    return () => document.body.removeEventListener("keydown", bodyEscapePrint);
  }, [bodyEscapePrint]);
  useEffect(() => {
    if (initialized && startIndex > 0) {
      revealRef.current.slide(startIndex);
    }
  }, [revealRef, initialized, startIndex]);
  return (
    <>
      <div className="reveal" id="roamjs-reveal-root">
        <div className="slides" ref={slidesRef}>
          {mappedSlides.map((s: Slide & ContentSlideExtras, i) => (
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
      <Button
        icon={"cross"}
        onClick={(e: React.MouseEvent) => onCloseClick(e.nativeEvent)}
        minimal
        style={{ position: "absolute", top: 8, right: 8 }}
      />
    </>
  );
};

const Presentation: React.FunctionComponent<{
  getSlides: () => Slides;
  theme?: string;
  notes?: string;
  collapsible?: boolean;
}> = ({ getSlides, theme, notes, collapsible }) => {
  const normalizedTheme = useMemo(
    () =>
      (isSafari ? SAFARI_THEMES : VALID_THEMES).includes(theme)
        ? theme
        : "black",
    []
  );
  const showNotes = notes === "true";
  const [showOverlay, setShowOverlay] = useState(false);
  const [slides, setSlides] = useState<Slides>([]);
  const [startIndex, setStartIndex] = useState(0);
  const onClose = useCallback(
    (currentSlide: number) => {
      setShowOverlay(false);
      setTimeout(() => {
        unload();
        const uidToFocus = slides[currentSlide].uid;
        const target = Array.from(
          document.getElementsByClassName("roam-block")
        ).find((d) => d.id.endsWith(uidToFocus));
        if (target) {
          target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          setTimeout(() => {
            const textArea = document.getElementById(
              target.id
            ) as HTMLTextAreaElement;
            textArea.dispatchEvent(
              new MouseEvent("mouseup", { bubbles: true })
            );
            textArea.setSelectionRange(
              textArea.value.length,
              textArea.value.length
            );
          }, 50);
        }
      }, 1);
    },
    [setShowOverlay, slides]
  );

  const open = useCallback(async () => {
    setShowOverlay(true);
    Array.from(window.roamjs.dynamicElements)
      .filter(
        (s) =>
          s.id.endsWith(`${normalizedTheme}.css`) || s.id.endsWith("reveal.css")
      )
      .forEach((s) => document.head.appendChild(s));
  }, [setShowOverlay, normalizedTheme]);
  const onMouseDown = useCallback(() => {
    const slides = getSlides();
    setSlides(slides);
    const { blockUid } = getUids(document.activeElement as HTMLTextAreaElement);
    if (blockUid) {
      const someFcn = (s: Slide) =>
        s.uid === blockUid || s.children.some(someFcn);
      const startIndex = slides.findIndex(someFcn);
      setStartIndex(Math.max(0, startIndex));
    } else {
      setStartIndex(0);
    }
  }, [getSlides, setSlides, setStartIndex]);
  return (
    <>
      <Button
        onClick={open}
        data-roamjs-presentation
        text={"PRESENT"}
        onMouseDown={onMouseDown}
      />
      <Overlay isOpen={showOverlay}>
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
            globalCollapsible={collapsible}
            startIndex={startIndex}
          />
        </div>
      </Overlay>
    </>
  );
};

type Slide = {
  uid: string;
  text: string;
  children: Slides;
  heading?: number;
  open: boolean;
  viewType: ViewType;
  props: {
    imageResize: {
      [link: string]: {
        height: number;
        width: number;
      };
    };
  };
};

type Slides = Slide[];

export const render = ({
  button,
  getSlides,
  options,
}: {
  button: HTMLButtonElement;
  getSlides: () => Slides;
  options: { [key: string]: string | boolean };
}): void =>
  ReactDOM.render(
    <Presentation getSlides={getSlides} {...options} />,
    button.parentElement
  );

export default Presentation;
