import { useClerk } from "@clerk/clerk-react";
import axios, { AxiosResponse } from "axios";
import { useCallback, useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { API_URL } from "./constants";

export const cleanCode = (text: string): string =>
  text.replace(/\n/g, "\\n").replace(/"/g, '\\"');

export const getCodeContent = (
  id: string,
  src: string
): string => `var existing = document.getElementById("roamjs-${id}");
if (!existing) {
  var extension = document.createElement("script");
  extension.src = "${src}";
  extension.id = "roamjs-${id}";
  extension.async = true;
  extension.type = "text/javascript";
  document.getElementsByTagName("head")[0].appendChild(extension);
}`;

export const getSingleCodeContent = (id: string): string =>
  getCodeContent(
    id.replace("/", "-"),
    `${
      process.env.NODE_ENV === "development"
        ? "http://localhost:8080/build"
        : "https://roamjs.com"
    }/${id}.js`
  );

const copyCode = (id: string, entry: string, initialLines: string) => (e) => {
  const idNormal = id.replace(/ /g, "-").toLowerCase();
  const codeContent = `\`\`\`javascript
${initialLines}${
    entry ? getCodeContent(idNormal, entry) : getSingleCodeContent(id)
  }
\`\`\``;
  e.clipboardData.setData(
    "text/plain",
    `{{[[roam/js]]}}
    ${codeContent.replace(/"/g, "\u0022")}
  `
  );
  e.clipboardData.setData(
    "roam/data",
    `["^ ","~:type","~:copy","~:copied-data",[["^ ","~:block/string","{{[[roam/js]]}}","~:block/children",[["^ ","~:block/string","~${cleanCode(
      codeContent
    )}","~:block/open",true,"~:block/order",0]],"~:block/open",true]]]`
  );
  e.preventDefault();
};

export const useCopyCode = (
  setCopied: (flag: boolean) => void,
  initialLines?: string,
  skipAutoHide?: boolean
): ((id: string, entry?: string) => void) =>
  useCallback(
    (id: string, entry?: string) => {
      document.addEventListener(
        "copy",
        copyCode(id, entry || "", initialLines || ""),
        {
          once: true,
        }
      );
      document.execCommand("copy");
      setCopied(true);
      if (!skipAutoHide) setTimeout(() => setCopied(false), 1000);
    },
    [setCopied, initialLines]
  );

export const useIsMobile = (): boolean => {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile);
  }, [setMobile]);

  return mobile;
};

export const useAuthenticatedAxiosGet = <T = unknown>(): ((
  path: string
) => Promise<AxiosResponse>) => {
  const { session } = useClerk();
  return useCallback(
    (path: string) => {
      const url = new URL(`${API_URL}/${path}`);
      url.searchParams.set("_clerk_session_id", session?.id || "");
      return axios.get<T>(url.toString(), {
        withCredentials: true,
      });
    },
    [session]
  );
};

export const useAuthenticatedAxiosPost = (): ((
  path: string,
  data?: Record<string, unknown>
) => Promise<AxiosResponse>) => {
  const { session } = useClerk();
  return useCallback(
    (path: string, data = {}) => {
      const url = new URL(`${API_URL}/${path}`);
      url.searchParams.set("_clerk_session_id", session?.id || "");
      return axios.post(url.toString(), data, {
        withCredentials: true,
      });
    },
    [session]
  );
};

export const useAuthenticatedAxiosPut = (): ((
  path: string,
  data?: Record<string, unknown>
) => Promise<AxiosResponse>) => {
  const { session } = useClerk();
  return useCallback(
    (path: string, data?: Record<string, unknown>) => {
      const url = new URL(`${API_URL}/${path}`);
      url.searchParams.set("_clerk_session_id", session?.id || "");
      return axios.put(url.toString(), data || {}, {
        withCredentials: true,
      });
    },
    [session]
  );
};

export const useAuthenticatedAxiosDelete = <T = unknown>(): ((
  path: string
) => Promise<AxiosResponse>) => {
  const { session } = useClerk();
  return useCallback(
    (path: string) => {
      const url = new URL(`${API_URL}/${path}`);
      url.searchParams.set("_clerk_session_id", session?.id || "");
      return axios.delete<T>(url.toString(), {
        withCredentials: true,
      });
    },
    [session]
  );
};

export const idToTitle = (id: string): string =>
  id
    .split("-")
    .map((s) => `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`)
    .join(" ")
    .replace(/_/g, " ");

export const idToCamel = (id: string): string =>
  `${id.substring(0, 1)}${idToTitle(id).replace(/ /g, "").substring(1)}`;
