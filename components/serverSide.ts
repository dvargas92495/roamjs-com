import { serialize as mdxSerialize } from "next-mdx-remote/serialize";
import type { Node } from "unist";
import { MDXRemoteSerializeResult } from "next-mdx-remote";
import { createMdxAstCompiler } from "@mdx-js/mdx";
import fs from "fs";

const strToHastCompiler = createMdxAstCompiler({
  remarkPlugins: [],
  rehypePlugins: [],
  compilers: [],
  skipExport: true,
});

const debug = (tree: Node) => {
  if (process.env.NODE_ENV === "development") {
    let charcode = 97;
    while (charcode < 123) {
      const fn = `out/${String.fromCharCode(charcode)}.json`;
      if (!fs.existsSync(fn)) {
        if (process.env.NODE_ENV === "development")
          fs.writeFileSync(fn, JSON.stringify(tree, null, 2));
      } else {
        charcode++;
      }
    }
  }
};

export const serialize = (
  s: string
): Promise<MDXRemoteSerializeResult<Record<string, unknown>>> => {
  if (process.env.NODE_ENV === "development")
    fs.readdirSync("./out")
      .filter((s) => s.endsWith(".json"))
      .forEach((s) => {console.log('deleting', s); fs.unlinkSync(`./out/${s}`);});
  return mdxSerialize(s, {
    mdxOptions: {
      rehypePlugins: [
        () => (tree) => {
          debug(tree);
          const expandJsx = async (n: Node) => {
            if (n.type === "jsx") {
              const match = /^<(\w*)((?: \w*={"[\w\d_-]*"})*?)>(.*)$/s.exec(
                n.value as string
              );
              if (match && match.length >= 3) {
                const [, tag, props, rest] = match;
                const content = new RegExp(`^(.*?)(</${tag}>)$`, "s").exec(
                  rest
                )?.[1];
                if (content) {
                  n.type = "element";
                  n.tagName = tag;
                  n.children = await strToHastCompiler
                    .run(strToHastCompiler.parse(content))
                    .then((c) => c.children);
                  n.properties = props
                    ? Object.fromEntries(
                        props
                          .trim()
                          .split(" ")
                          .map((prop) =>
                            /(\w*)={"([\w\d_-]*)"}/.exec(prop.trim())
                          )
                          .filter((prop) => !!prop)
                          .map(([, key, value]) => [key, value])
                      )
                    : {};
                  delete n.value;
                }
              }
            }
            ((n.children as Node[]) || []).forEach(expandJsx);
          };
          debug(tree);
          return Promise.all((tree.children as Node[]).map(expandJsx))
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
};
