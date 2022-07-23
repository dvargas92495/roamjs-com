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
import {
  addStyle,
  getBlockUidFromTarget,
  isControl,
  openBlockElement,
  parseRoamBlocks,
} from "../entry-helpers";
import { isSafari } from "mobile-device-detect";
import { getUids, TreeNode, ViewType } from "roam-client";
import BlockErrorBoundary from "roamjs-components/components/BlockErrorBoundary";
import { TextAlignment } from "roamjs-components/types";

const SAFARI_THEMES = ["black", "white", "beige"];

const parseSolo = ({
  text = "",
  textAlign = "left",
}: {
  text?: string;
  textAlign?: TextAlignment;
}): string =>
  parseRoamBlocks({
    content: [
      {
        text,
        order: 0,
        viewType: "document",
        children: [],
        uid: "",
        heading: 0,
        open: true,
        textAlign,
        editTime: new Date(),
        props: { imageResize: {}, iframe: {} },
      },
    ],
    viewType: "document",
  });

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
  Array.from(document.querySelectorAll("style.roamjs-style-reveal")).forEach(
    (s) => ((s as HTMLStyleElement).disabled = true)
  );

const Notes = ({ note }: { note?: TreeNode }) => (
  <>
    {note && (
      <aside
        className="notes"
        dangerouslySetInnerHTML={{
          __html: parseRoamBlocks({ content: [note], viewType: "bullet" }),
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
  type?: "image" | "iframe" | "media";
};

const URL_REGEX =
  /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=$,]*)/;
const SRC_REGEXES = {
  image: /!\[(.*)\]\((.*)\)/,
  iframe: new RegExp(
    `{{(?:\\[\\[)?iframe(?:\\]\\])?:\\s*(${URL_REGEX.source})}}`
  ),
  media: /$^/,
};
const SRC_INDEX = {
  image: 2,
  iframe: 1,
  media: 0,
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
  const match = text.match(SRC_REGEXES[type] || "");
  const [style, setStyle] = useState({});
  const srcRef = useRef(null);
  const srcResize = match && resizes && resizes[match[SRC_INDEX[type]]];
  const srcOnLoad = useCallback(() => {
    if (srcResize) {
      setStyle(getResizeStyle(srcResize));
    } else if (srcRef.current.parentElement) {
      const srcWidth = Number(
        getComputedStyle(srcRef.current).width.replace(/px$/, "")
      );
      const srcHeight = Number(
        getComputedStyle(srcRef.current).height.replace(/px$/, "")
      );
      const srcAspectRatio = srcWidth / srcHeight;
      const containerWidth = srcRef.current.parentElement.offsetWidth;
      const containerHeight = srcRef.current.parentElement.offsetHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      if (!isNaN(srcAspectRatio) && !isNaN(srcAspectRatio)) {
        if (srcAspectRatio > containerAspectRatio) {
          setStyle({
            width: "100%",
            height: `${(srcHeight * containerWidth) / srcWidth}px`,
          });
        } else {
          setStyle({
            height: "100%",
            width: `${(srcWidth * containerHeight) / srcHeight}px`,
          });
        }
      }
    }
  }, [setStyle, srcRef, srcResize]);
  useEffect(() => {
    if (srcRef.current) {
      srcRef.current.onload = srcOnLoad;
    }
  }, [srcOnLoad, srcRef]);
  return type === "media" ? (
    <div
      ref={srcRef}
      dangerouslySetInnerHTML={{
        __html: parseRoamBlocks({ viewType: "document", content: [] }),
      }}
    />
  ) : match ? (
    <>
      <span
        style={{
          display: "inline-block",
          verticalAlign: "middle",
          height: "100%",
        }}
      />
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
  texts,
  note,
  transition,
  animate,
}: {
  texts: Partial<TreeNode>[];
  note: TreeNode;
  transition: string;
  animate: boolean;
}) => {
  const text = texts[0];
  const type = Object.keys(SRC_REGEXES).find((k: keyof typeof SRC_REGEXES) =>
    SRC_REGEXES[k].test(text.text)
  ) as keyof typeof SRC_REGEXES;
  const props = {
    ...(type ? { style: { bottom: 0 } } : {}),
    ...(animate ? { "data-auto-animate": true } : {}),
    ...(transition ? { "data-transition": transition } : {}),
  };
  return (
    <section {...props}>
      <SrcFromText
        text={text.text}
        Alt={() => (
          <>
            {texts.map((t, i) =>
              i === 0 ? (
                <h1
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: parseSolo(t),
                  }}
                />
              ) : (
                <h3
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: parseSolo(t),
                  }}
                />
              )
            )}
          </>
        )}
        type={type}
      />
      <Notes note={note} />
    </section>
  );
};

const STARTS_WITH_IMAGE = new RegExp("^image ", "i");
const STARTS_WITH_IFRAME = new RegExp("^iframe ", "i");
const STARTS_WITH_MEDIA = new RegExp("^media ", "i");
const ENDS_WITH_LEFT = new RegExp(" left$", "i");
const ENDS_WITH_CENTER = new RegExp(" center$", "i");

type ContentSlideExtras = {
  note: TreeNode;
  layout: string;
  collapsible: boolean;
  animate: boolean;
  transition: string;
  isTitle: boolean;
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
  "Media Left",
  "Media Center",
  "Media Right",
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
  textAlign,
  children,
  note,
  layout,
  collapsible,
  viewType,
  animate,
  transition,
}: TreeNode & ContentSlideExtras) => {
  const isImageLayout = STARTS_WITH_IMAGE.test(layout);
  const isIframeLayout = STARTS_WITH_IFRAME.test(layout);
  const isMediaLayout = STARTS_WITH_MEDIA.test(layout);
  const isSourceLayout = isImageLayout || isIframeLayout || isMediaLayout;
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
        a.rel = "noreferrer";
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

          const item = img.closest<HTMLLIElement>("li");
          if (item) item.classList.add("roamjs-document-li");
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

          const item = iframe.closest<HTMLLIElement>("li");
          if (item) item.classList.add("roamjs-document-li");
        }
      );
      Array.from(slideRoot.current.getElementsByTagName("blockquote")).forEach(
        (bq) => {
          const item = bq.closest<HTMLLIElement>("li");
          if (item) item.style.listStyle = "none";
        }
      );
      Array.from(slideRoot.current.getElementsByTagName("table")).forEach(
        (t) => {
          const item = t.closest<HTMLLIElement>("li");
          if (item) item.classList.add("roamjs-document-li");
        }
      );
      Array.from(
        slideRoot.current.parentElement.querySelectorAll<HTMLDivElement>(
          "div.roam-render"
        )
      ).forEach((el) => {
        window.roamAlphaAPI.ui.components.renderBlock({
          uid: el.parentElement.id,
          el,
        });
        setTimeout(() => {
          Array.from(
            el.querySelectorAll<HTMLDivElement>("div.excalidraw-host")
          ).forEach((d) => {
            const style = getComputedStyle(d);
            const rect = d.getElementsByTagName("rect")[0];
            if (style.height.startsWith("0") && rect) {
              d.style.height = `${rect.height.animVal.valueAsString}px`;
            }
            if (style.width.startsWith("0") && rect) {
              d.style.width = `${rect.width.animVal.valueAsString}px`;
            }

            const clientWidth = Number(d.style.width.replace("px", ""));
            const clientHeight = Number(d.style.height.replace("px", ""));
            const parent =
              d.closest(".roamjs-bullets-container") ||
              d.closest(".roamjs-media-container");
            if (parent) {
              const containerWidth = parent.clientWidth;
              const containerHeight = parent.clientHeight;
              if (
                clientWidth / clientHeight <
                containerWidth / containerHeight
              ) {
                d.style.height = `${containerHeight}px`;
                d.style.width = `${
                  (containerHeight * clientWidth) / clientHeight
                }px`;
              } else if (
                clientWidth / clientHeight >
                containerWidth / containerHeight
              ) {
                d.style.height = `${
                  (containerWidth * clientHeight) / clientWidth
                }px`;
                d.style.width = `${containerWidth}px`;
              } else {
                d.style.height = `${containerHeight}px`;
                d.style.width = `${containerWidth}px`;
              }
            }

            d.style.maxWidth = "100%";
            d.style.resize = "unset";
            const roamBlock = d.closest<HTMLDivElement>(".roam-block");
            if (roamBlock) {
              roamBlock.style.minWidth = "100%";
            }
          });
        }, 1);

        const item = el.closest<HTMLLIElement>("li");
        if (item) item.classList.add("roamjs-document-li");
      });
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
  const onDialogClose = useCallback(
    () => setImageDialogSrc(""),
    [setImageDialogSrc]
  );

  const props = {
    ...(animate ? { "data-auto-animate": true } : {}),
    ...(transition ? { "data-transition": transition } : {}),
  };
  return (
    <section style={{ textAlign: "left" }} {...props}>
      <h1
        dangerouslySetInnerHTML={{
          __html: parseSolo({ text, textAlign }),
        }}
      />
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
            __html: parseRoamBlocks({ content: bullets, viewType }),
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
            className={"roamjs-media-container"}
          >
            {isMediaLayout ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: parseRoamBlocks({
                    viewType: "document",
                    content: children.slice(0, 1),
                  }),
                }}
              />
            ) : (
              <SrcFromText
                text={children[0].text}
                Alt={() => <div />}
                resizes={
                  isMediaLayout
                    ? {}
                    : children[0].props[
                        isIframeLayout ? "iframe" : "imageResize"
                      ]
                }
                type={
                  isIframeLayout ? "iframe" : isMediaLayout ? "media" : "image"
                }
              />
            )}
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
        const contentHeight = (d.children[0] as HTMLElement)?.offsetHeight || 0;
        const contentWidth = (d.children[0] as HTMLElement)?.offsetWidth || 0;
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

export const COLLAPSIBLE_REGEX =
  /(?:\[\[{|{\[\[|{)collapsible(:ignore)?(?:\]\]}|}\]\]|})/i;
export const ANIMATE_REGEX = /(?:\[\[{|{\[\[|{)animate(?:\]\]}|}\]\]|})/i;
export const TRANSITION_REGEX =
  /(?:\[\[{|{\[\[|{)transition:(none|fade|slide|convex|concave|zoom)(?:\]\]}|}\]\]|})/i;
export const TITLE_REGEX = /(?:\[\[{|{\[\[|{)title(?:\]\]}|}\]\]|})/i;
const HIDE_REGEX = /(?:\[\[{|{\[\[|{)hide(?:\]\]}|}\]\]|})/i;

const filterHideBlocks = (s: TreeNode) => {
  s.children = s.children
    .filter((t) => !HIDE_REGEX.test(t.text))
    .map(filterHideBlocks);
  return s;
};

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
      let isTitle = !s.children.length;
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
        .replace(TITLE_REGEX, () => {
          isTitle = true;
          return "";
        })
        .trim();
      return {
        ...s,
        text,
        isTitle,
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
              {s.isTitle ? (
                <TitleSlide
                  texts={[
                    { text: s.text, textAlign: s.textAlign },
                    ...s.children.map((ss) => ({
                      text: ss.text,
                      textAlign: ss.textAlign,
                    })),
                  ]}
                  note={s.note}
                  transition={s.transition}
                  animate={s.animate}
                />
              ) : (
                <ContentSlide {...s} />
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
        openBlockElement(target as HTMLElement);
      }, 1);
    },
    [setShowOverlay, slides]
  );

  const open = useCallback(async () => {
    setShowOverlay(true);
    Array.from(document.head.children)
      .filter(
        (s) =>
          s.id.endsWith(`${normalizedTheme}.css`) || s.id.endsWith("reveal.css")
      )
      .forEach((s) => ((s as HTMLStyleElement).disabled = false));
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
    <BlockErrorBoundary
      blockUid={getBlockUidFromTarget(button)}
      message={
        "Error thrown when rendering presentation. Reach out to support@roamjs.com for help with this message: {ERROR}"
      }
    >
      <Presentation getSlides={getSlides} {...options} />
    </BlockErrorBoundary>,
    button.parentElement
  );

export default Presentation;
