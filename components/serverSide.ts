import { serialize as mdxSerialize } from "next-mdx-remote/serialize";
import type { Node } from "unist";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

export const serialize = (
    s: string
  ): Promise<MDXRemoteSerializeResult<Record<string, unknown>>> =>
    mdxSerialize(s, {
      mdxOptions: {
        rehypePlugins: [
          () => (tree) => {
            const BLOCK_REF_REGEX = /\(\(([\w\d-]{9})\)\)/;
            const getUid = (n: Node) => {
              if (n.value) {
                const value = n.value as string;
                const uid = BLOCK_REF_REGEX.exec(value)?.[1];
                if (uid) {
                  n.value = value.replace(BLOCK_REF_REGEX, "");
                  return uid;
                }
              }
              const c = n.children as Node[];
              if (c?.length) {
                return c.map((n) => getUid(n)).find((v) => !!v);
              }
              return "";
            };
            const addId = (n: Node) => {
              const props = n.properties as { id: string };
              if (n.type === "element" && props) {
                const id = getUid(n);
                if (id) {
                  props.id = id;
                }
                ((n.children as Node[]) || []).forEach(addId);
              }
            };
            (tree.children as Node[]).forEach(addId);
          },
        ],
      },
    });