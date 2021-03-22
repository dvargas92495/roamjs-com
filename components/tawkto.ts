import { useEffect } from "react";

const loader = () => {
  window.Tawk_API = {};
  window.Tawk_LoadStart = new Date();
  const s1 = document.createElement("script");
  s1.async = true;
  s1.src = "https://embed.tawk.to/6004fa7bc31c9117cb6f97fd/1es9n4stl";
  s1.setAttribute("crossorigin", "*");
  document.head.appendChild(s1);
};

declare global {
  interface Window {
    Tawk_API?: { [key: string]: string };
    Tawk_LoadStart: Date;
  }
}

const useTawkTo = (): void => {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.endsWith("oauth")
    ) {
      loader();
    }
  }, []);
};

export default useTawkTo;
