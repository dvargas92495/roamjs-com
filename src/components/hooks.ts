import { useCallback } from "react";

export const useArrowKeyDown = <T>({
  activeIndex,
  setActiveIndex,
  results,
  onEnter,
}: {
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  results: T[];
  onEnter: (i: T) => void;
}) =>
  useCallback(
    (e) => {
      if (e.key === "ArrowDown") {
        setActiveIndex((activeIndex + 1) % results.length);
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setActiveIndex((activeIndex + results.length - 1) % results.length);
        e.preventDefault();
      } else if (e.key === "Enter" && results.length > 0) {
        onEnter(results[activeIndex]);
        e.preventDefault();
      }
    },
    [activeIndex, setActiveIndex, results, onEnter]
  );
