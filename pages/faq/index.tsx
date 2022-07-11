import StandardLayout from "../../components/StandardLayout";
import Title from "@dvargas92495/app/components/Title";
import { Prism } from "react-syntax-highlighter";

const Q: React.FC = ({ children }) => (
  <p className="font-bold text-lg">{children}</p>
);
const A: React.FC = ({ children }) => (
  <p className="font-normal text-base whitespace-pre-wrap">{children}</p>
);

const FaqPage: React.FC = () => {
  return (
    <StandardLayout
      title={"FAQ"}
      description={"Answers to frequently asked questions"}
      activeLink={"faq"}
    >
      <Title>FAQ</Title>
      <Q>Are extensions safe to install?</Q>
      <A>
        When you install a Roam extension into your graph, you are giving that
        extension full access to do whatever it wants with your data. This makes
        extensions very dangerous if from an unknown source.
      </A>
      <A>
        You should make sure that either {"A)"} you can understand the source
        code of an extension you install or {"B)"} the extension is vetted by
        someone you trust. With the Roam native extension store, every extension
        is vetted by the Roam team themselves. RoamJS extensions are either
        written or vetted by David Vargas.
      </A>
      <Q>How do I install an extension?</Q>
      <A>
        Roam will soon have a way to install extensions natively within the App.
      </A>
      <A>
        In the meantime, there are a few ways to install extensions manually.
        There fastest way is to click the "Copy Extension" button found in each
        extension page. You could then go to any page in your graph and paste
        the result. Click the "Yes, I know what I'm doing" button to enable.
      </A>
      <A>
        If the above doesn't work, then create a <b>block</b> with the text{" "}
        <code>{"{{[[roam/js]]}}"}</code> on any page in your Roam DB. Then,
        create a single child of this block and type three backticks. A code
        block should appear. Copy this code and paste it into the child code
        block in your graph:
      </A>
      <Prism language="javascript">
        {`var existing = document.getElementById("roamjs-EXTENSION");
if (!existing) {
  var extension = document.createElement("script");
  extension.src = "https://roamjs.com/EXTENSION/main.js";
  extension.id = "roamjs-EXTENSION";
  extension.async = true;
  extension.type = "text/javascript";
  document.getElementsByTagName("head")[0].appendChild(extension);
}`}
      </Prism>
      <A>
        Replace the three instances of <code>EXTENSION</code> above with the id
        of the extension, which you could determine by making the name of the
        extension lowercase and replacing dashes with spaces. For example, the
        id of the Query Builder extension is <code>query-builder</code>. With
        the code set, Click the "Yes, I know what I'm doing" button to enable.
      </A>
      <Q>What are experimental features?</Q>
      <A>
        RoamJS extensions will often have experimental features that can be
        enabled through the Roam Command Palette. These are features that are
        not yet ready for the general audience, but can be beta tested by
        curious users who accept the risk, until one day the feature could be
        integrated with the extension itself.
      </A>
    </StandardLayout>
  );
};

export default FaqPage;
