import { useCallback, useEffect, useState } from "react";

export const useArrowKeyDown = <T>({
  results,
  onEnter,
}: {
  results: T[];
  onEnter: (i: T) => void;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        setActiveIndex((activeIndex + 1) % results.length);
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setActiveIndex((activeIndex + results.length - 1) % results.length);
        e.preventDefault();
      } else if (e.key === "Enter" && results.length > 0) {
        onEnter(results[activeIndex]);
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
      }
    },
    [activeIndex, setActiveIndex, results, onEnter]
  );
  return {
    activeIndex,
    onKeyDown,
  };
};

export const useDocumentKeyDown = (eventListener: (e: KeyboardEvent) => void) =>
  useEffect(() => {
    document.addEventListener("keydown", eventListener);
    return () => document.removeEventListener("keydown", eventListener);
  }, [eventListener]);
