import { serialize as mdxSerialize } from "next-mdx-remote/serialize";
import type { Node } from "unist";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import ReactDOMServer from "react-dom/server";
import MdxComponents from "./MdxComponents";
import React from "react";

const CONTENT_REGEX = /(<\w*>)(.*?)(<\/\w*>)/s;

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
          const addId = async (n: Node) => {
            const props = n.properties as { id: string };
            if (n.type === "element" && props) {
              const id = getUid(n);
              if (id) {
                props.id = id;
              }
            } else if (n.type === "jsx") {
              const id = getUid(n);
              n.properties = { id };
              const match = CONTENT_REGEX.exec(n.value as string);
              if (match && match.length >= 4) {
                const [, openingTag, content, closingTag] = match;
                n.value = `${openingTag}${ReactDOMServer.renderToString(
                  React.createElement(MDXRemote, {
                    components: MdxComponents,
                    compiledSource: await serialize(content)
                      .then((r) => r.compiledSource)
                      .catch(() => "Failed to render: " + content),
                  })
                )}${closingTag}`;
              }
            }
            ((n.children as Node[]) || []).forEach(addId);
          };
          return Promise.all((tree.children as Node[]).map((n) => addId(n)))
            .then((a) => {
              return a[0];
            })
            .catch((e) => {
              console.error(e);
            });
        },
      ],
    },
  });
