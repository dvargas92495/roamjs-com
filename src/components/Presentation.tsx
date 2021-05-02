import { Button, Overlay, Dialog } from "@blueprintjs/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import Reveal from "reveal.js";
import { addStyle, isControl, parseRoamBlocks } from "../entry-helpers";
import { isSafari } from "mobile-device-detect";
import { getUids, TreeNode, ViewType } from "roam-client";

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

const unload = () =>
  Array.from(window.roamjs.dynamicElements)
    .filter((s) => !!s.parentElement)
    .forEach((s) => s.parentElement.removeChild(s));

const Notes = ({ note }: { note?: TreeNode }) => (
  <>
    {note && (
      <aside
        className="notes"
        dangerouslySetInnerHTML={{
          __html: parseRoamBlocks({content: [note], viewType: 'bullet'}),
        }}
      />
    )}
  </>
);

type SrcFromTextProps = {
  text: string;
  resizes?: {
    [link: string]: {
      height: number;
      width: number;
    };
  };
  type?: "image" | "iframe";
};

const URL_REGEX = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
const SRC_REGEXES = {
  image: /!\[(.*)\]\((.*)\)/,
  iframe: new RegExp(`{{(?:\\[\\[)?iframe(?:\\]\\])?:(${URL_REGEX.source})}}`),
};
const SRC_INDEX = {
  image: 2,
  iframe: 1,
};
const getResizeStyle = (imageResize?: { width: number; height: number }) => ({
  width: isNaN(imageResize?.width)
    ? "auto"
    : `${Math.ceil((100 * imageResize?.width) / IMG_MAX_WIDTH)}%`,
  height: isNaN(imageResize?.height)
    ? "auto"
    : `${(100 * imageResize?.height) / IMG_MAX_HEIGHT}%`,
});

const SrcFromText: React.FunctionComponent<
  SrcFromTextProps & {
    Alt: React.FunctionComponent<SrcFromTextProps>;
  }
> = ({ text, Alt, resizes, type = "image" }) => {
  const match = text.match(SRC_REGEXES[type]);
  const [style, setStyle] = useState({});
  const srcRef = useRef(null);
  const srcResize = match && resizes[match[SRC_INDEX[type]]];
  const srcOnLoad = useCallback(() => {
    const srcAspectRatio = srcRef.current.width / srcRef.current.height;
    const containerAspectRatio =
      srcRef.current.parentElement.offsetWidth /
      srcRef.current.parentElement.offsetHeight;
    if (srcResize) {
      setStyle(getResizeStyle(srcResize));
    } else if (!isNaN(srcAspectRatio) && !isNaN(srcAspectRatio)) {
      if (srcAspectRatio > containerAspectRatio) {
        setStyle({ width: "100%", height: "auto" });
      } else {
        setStyle({ height: "100%", width: "auto" });
      }
    }
  }, [setStyle, srcRef, srcResize]);
  useEffect(() => {
    if (srcRef.current) {
      srcRef.current.onload = srcOnLoad;
    }
  }, [srcOnLoad, srcRef]);
  return match ? (
    <>
      {type === "image" && (
        <img alt={match[1]} src={match[2]} ref={srcRef} style={style} />
      )}
      {type === "iframe" && (
        <iframe frameBorder={0} src={match[1]} ref={srcRef} style={style} />
      )}
    </>
  ) : (
    <Alt text={text} />
  );
};

const TitleSlide = ({
  text,
  note,
  transition,
  animate,
}: {
  text: string;
  note: TreeNode;
  transition: string;
  animate: boolean;
}) => {
  const type = Object.keys(SRC_REGEXES).find((k: keyof typeof SRC_REGEXES) =>
    SRC_REGEXES[k].test(text)
  ) as keyof typeof SRC_REGEXES;
  const props = {
    ...(type ? { style: { bottom: 0 } } : {}),
    ...(animate ? { "data-auto-animate": true } : {}),
    ...(transition ? { "data-transition": transition } : {}),
  };
  return (
    <section {...props}>
      <SrcFromText
        text={text}
        Alt={({ text }) => <h1>{text}</h1>}
        type={type}
      />
      <Notes note={note} />
    </section>
  );
};

const STARTS_WITH_IMAGE = new RegExp("^image ", "i");
const STARTS_WITH_IFRAME = new RegExp("^iframe ", "i");
const ENDS_WITH_LEFT = new RegExp(" left$", "i");
const ENDS_WITH_CENTER = new RegExp(" center$", "i");

type ContentSlideExtras = {
  note: TreeNode;
  layout: string;
  collapsible: boolean;
  animate: boolean;
  transition: string;
};

const setDocumentLis = ({
  e,
  s,
  v,
}: {
  e: HTMLElement;
  s: TreeNode[];
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

const LAYOUTS = [
  "Image Left",
  "Image Center",
  "Image Right",
  "Iframe Left",
  "Iframe Center",
  "Iframe Right",
];
const findLinkResize = ({
  src,
  slides,
  field,
}: {
  slides: TreeNode[];
  src: string;
  field: "imageResize" | "iframe";
}): LinkResize => {
  if (slides.length === 0) {
    return {};
  }
  const slideWithImage = slides.find((s) => s.text.includes(src));
  if (slideWithImage) {
    return slideWithImage.props[field];
  }
  return findLinkResize({
    src,
    slides: slides.flatMap((s) => s.children),
    field,
  });
};

const ContentSlide = ({
  text,
  children,
  note,
  layout,
  collapsible,
  viewType,
  animate,
  transition,
}: {
  text: string;
  children: TreeNode[];
  viewType: ViewType;
  transition: string;
  animate: boolean;
} & ContentSlideExtras) => {
  const isImageLayout = STARTS_WITH_IMAGE.test(layout);
  const isIframeLayout = STARTS_WITH_IFRAME.test(layout);
  const isSourceLayout = isImageLayout || isIframeLayout;
  const isLeftLayout = ENDS_WITH_LEFT.test(layout);
  const isCenterLayout = ENDS_WITH_CENTER.test(layout);
  const bullets = isSourceLayout ? children.slice(1) : children;
  const slideRoot = useRef<HTMLDivElement>(null);
  const [htmlEditsLoaded, setHtmlEditsLoaded] = useState(false);
  const [imageDialogSrc, setImageDialogSrc] = useState("");
  useEffect(() => {
    if (!htmlEditsLoaded) {
      if (collapsible) {
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
      }
      Array.from(slideRoot.current.getElementsByTagName("a")).forEach((a) => {
        a.target = "_blank";
        a.rel = "noopener";
      });
      Array.from(slideRoot.current.getElementsByTagName("img")).forEach(
        (img) => {
          const src = img.src;
          const resizeProps = findLinkResize({
            src,
            slides: children,
            field: "imageResize",
          });
          const { width, height } = getResizeStyle(resizeProps[src]);
          img.style.width = width;
          img.style.height = height;
        }
      );
      Array.from(slideRoot.current.getElementsByTagName("iframe")).forEach(
        (iframe) => {
          const src = iframe.src;
          const resizeProps = findLinkResize({
            src,
            slides: children,
            field: "iframe",
          });
          const { width, height } = resizeProps[src] || {};
          iframe.width = `${width || 500}px`;
          iframe.height = `${height || 500}px`;
        }
      );
      setHtmlEditsLoaded(true);
    }
  }, [
    collapsible,
    slideRoot.current,
    htmlEditsLoaded,
    setHtmlEditsLoaded,
    children,
  ]);
  useEffect(() => {
    if (bullets.length) {
      setDocumentLis({
        e: slideRoot.current.firstElementChild as HTMLElement,
        s: bullets,
        v: viewType,
      });
    }
  }, [bullets, slideRoot.current, viewType]);
  const onRootClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        setImageDialogSrc((target as HTMLImageElement).src);
      } else if (collapsible) {
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
    [collapsible, setImageDialogSrc]
  );
  const onDialogClose = useCallback(() => setImageDialogSrc(""), [
    setImageDialogSrc,
  ]);

  const props = {
    ...(animate ? { "data-auto-animate": true } : {}),
    ...(transition ? { "data-transition": transition } : {}),
  };
  return (
    <section style={{ textAlign: "left" }} {...props}>
      <h1>{text}</h1>
      <div
        style={{
          display: "flex",
          flexDirection: isLeftLayout ? "row-reverse" : "row",
        }}
        className="r-stretch"
        onClick={onRootClick}
      >
        <div
          className={"roamjs-bullets-container"}
          dangerouslySetInnerHTML={{
            __html: parseRoamBlocks({content: bullets, viewType}),
          }}
          style={{
            width: isImageLayout ? "50%" : "100%",
            transformOrigin: "left top",
            wordBreak: "break-word",
            display: isCenterLayout ? "none" : "block",
          }}
          ref={slideRoot}
        />
        {isSourceLayout && (
          <div
            style={{
              width: isCenterLayout ? "100%" : "50%",
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
            <SrcFromText
              text={children[0].text}
              Alt={() => <div />}
              resizes={
                children[0].props[isIframeLayout ? "iframe" : "imageResize"]
              }
              type={isIframeLayout ? "iframe" : "image"}
            />
          </div>
        )}
      </div>
      <Notes note={note} />
      <Dialog
        isOpen={!!imageDialogSrc}
        onClose={onDialogClose}
        portalClassName={"roamjs-presentation-img-dialog"}
        style={{ paddingBottom: 0 }}
      >
        <img src={imageDialogSrc} />
      </Dialog>
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
      const containerWidth = d.offsetWidth;
      if (containerHeight > 0 && containerWidth > 0) {
        const contentHeight = (d.children[0] as HTMLElement).offsetHeight;
        const contentWidth = (d.children[0] as HTMLElement).offsetWidth;
        if (contentHeight > containerHeight || contentWidth > containerWidth) {
          const scale = Math.min(
            containerHeight / contentHeight,
            containerWidth / contentWidth
          );
          d.style.transform = `scale(${scale})`;
        } else {
          d.style.transform = "initial";
        }
      }
    });

export const COLLAPSIBLE_REGEX = /(?:\[\[{|{\[\[|{)collapsible(:ignore)?(?:\]\]}|}\]\]|})/i;
export const ANIMATE_REGEX = /(?:\[\[{|{\[\[|{)animate(?:\]\]}|}\]\]|})/i;
export const TRANSITION_REGEX = /(?:\[\[{|{\[\[|{)transition:(none|fade|slide|convex|concave|zoom)(?:\]\]}|}\]\]|})/i;
const HIDE_REGEX = /(?:\[\[{|{\[\[|{)hide(?:\]\]}|}\]\]|})/i;

const filterHideBlocks = (s: TreeNode) => {
  s.children = s.children.filter(t => !HIDE_REGEX.test(t.text)).map(filterHideBlocks);
  return s;
}

const PresentationContent: React.FunctionComponent<{
  slides: TreeNode[];
  showNotes: boolean;
  onClose: (index: number) => void;
  globalCollapsible: boolean;
  globalAnimate: boolean;
  globalTransition: string;
  startIndex: number;
}> = ({
  slides,
  onClose,
  showNotes,
  globalCollapsible,
  globalAnimate,
  globalTransition,
  startIndex,
}) => {
  const revealRef = useRef(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const mappedSlides = slides
    .filter((s) => !HIDE_REGEX.test(s.text))
    .map((s) => filterHideBlocks(s))
    .map((s) => {
      let layout = "default";
      let collapsible = globalCollapsible || false;
      let transition = globalTransition || undefined;
      let animate = globalAnimate || false;
      const text = s.text
        .replace(
          new RegExp(
            `(?:\\[\\[{|{\\[\\[|{)layout:(${LAYOUTS.join(
              "|"
            )})(?:\\]\\]}|}\\]\\]|})`,
            "is"
          ),
          (_, capture) => {
            layout = capture;
            return "";
          }
        )
        .replace(COLLAPSIBLE_REGEX, (_, ignore) => {
          collapsible = !ignore;
          return "";
        })
        .replace(ANIMATE_REGEX, () => {
          animate = true;
          return "";
        })
        .replace(TRANSITION_REGEX, (_, val) => {
          transition = val;
          return "";
        })
        .trim();
      return {
        ...s,
        text,
        layout,
        collapsible,
        animate,
        transition,
        children: showNotes
          ? s.children.slice(0, s.children.length - 1)
          : s.children,
        note: showNotes && s.children[s.children.length - 1],
      };
    });
  const onCloseClick = useCallback(
    (e: Event) => {
      revealRef.current.getRevealElement().style.display = "none";
      const actualStartIndex = slides.findIndex(
        (s) => s.uid === mappedSlides[revealRef.current.getState().indexh].uid
      );
      onClose(actualStartIndex);
      e.stopImmediatePropagation();
    },
    [onClose, revealRef, slides, mappedSlides]
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
      const actualStartIndex = mappedSlides.findIndex(
        (s) => s.uid === slides[startIndex].uid
      );
      revealRef.current.slide(actualStartIndex);
    }
  }, [revealRef, initialized, startIndex, slides, mappedSlides]);
  return (
    <>
      <div className="reveal" id="roamjs-reveal-root">
        <div className="slides" ref={slidesRef}>
          {mappedSlides.map((s: TreeNode & ContentSlideExtras, i) => (
            <React.Fragment key={i}>
              {s.children.length ? (
                <ContentSlide {...s} />
              ) : (
                <TitleSlide
                  text={s.text}
                  note={s.note}
                  transition={s.transition}
                  animate={s.animate}
                />
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
  getSlides: () => TreeNode[];
  theme?: string;
  notes?: string;
  collapsible?: boolean;
  animate?: boolean;
  transition?: string;
}> = ({ getSlides, theme, notes, collapsible, animate, transition }) => {
  const normalizedTheme = useMemo(
    () =>
      (isSafari ? SAFARI_THEMES : VALID_THEMES).includes(theme)
        ? theme
        : "black",
    []
  );
  const showNotes = notes === "true";
  const [showOverlay, setShowOverlay] = useState(false);
  const [slides, setSlides] = useState<TreeNode[]>([]);
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
      const someFcn = (s: TreeNode) =>
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
            globalAnimate={animate}
            globalTransition={transition}
            startIndex={startIndex}
          />
        </div>
      </Overlay>
    </>
  );
};

type LinkResize = {
  [link: string]: {
    height: number;
    width: number;
  };
};

export const render = ({
  button,
  getSlides,
  options,
}: {
  button: HTMLButtonElement;
  getSlides: () => TreeNode[];
  options: { [key: string]: string | boolean };
}): void =>
  ReactDOM.render(
    <Presentation getSlides={getSlides} {...options} />,
    button.parentElement
  );

export default Presentation;
