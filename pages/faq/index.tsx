import StandardLayout from "../../components/StandardLayout";
import Title from "@dvargas92495/app/components/Title";
import React from "react";

const Q: React.FC<{ id: string }> = ({ children, id }) => (
  <p className="font-bold text-lg" id={id}>
    {children}
  </p>
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
      <Q id={"safe"}>Are extensions safe to install?</Q>
      <A>
        All extensions in RoamDepot are vetted by the Roam team and have been
        deemed safe to install by them. Additionally, they are all required to
        be open source, so you or someone you trust are able to vet the
        extensions directly.
      </A>
      <A>
        Roam supports a <code>{"{{[[roam/js]]}}"}</code> feature that allows
        users to execute arbitrary code within. We <b>do not</b> recommend
        accepting any code from third parties to run in this context. Extensions
        should be posted to Roam Depot for official vetting. Any RoamJS
        extensions of this form are in the middle of being ported to RoamDepot.
      </A>
      <Q id={"migrate"}>
        I have a the old RoamJS version of an extension installed. How do I
        migrate to the Roam Depot version?
      </Q>
      <A>
        If an extension is available in Roam Depot, the RoamJS version will
        release a warning that will appear until you migrate. To migrate:
        <ol>
          <li>
            Remove the RoamJS version. You could find this by going to the{" "}
            <code>[[roam/js]]</code> page, checking the linked references, and
            searching for the code block that has the name of the extension in
            it. Delete the block.
          </li>
          <li>Refresh Roam.</li>
          <li>
            Open "Roam Depot Marketplace" from the Roam Command Palette and
            install the extension from there with one click!
          </li>
        </ol>
        And that's it!
      </A>
      <A>
        Settings for most RoamJS extensions live in the{" "}
        <code>roam/js/[name]</code> page. These settings are <b>not</b> migrated
        by default. To migrate them to the Roam Depot settings panels, open the
        Roam Command Palette, and type "Migrate Settings: [name]" with the name
        of the extension. Clicking this command will make a best attempt at
        migrating your settings to the Roam Depot version of the extension and
        renames the old settings page as <code>legacy/roam/js/[name]</code>.
        Once you are sure that all settings migrated correctly, feel free to
        delete this page. It's recommended that you refresh after migrating
        settings. This should be a one time operation per extension.
      </A>
      <Q id={"install"}>How do I install an extension?</Q>
      <A>
        Simply open the Roam Command Palette by hitting CMD+p (CTRL+p on
        Windows) and type "Roam Depot Marketplace". From there, you could see
        all of the wonderful extensions submitted by the community. Click on any
        one of them to see more details about how the extension works. If one
        catches your eye, click the install button to add to your graph!
      </A>
      <Q id={"experimental"}>What are experimental features?</Q>
      <A>
        RoamJS extensions will often have experimental features that can be
        enabled through the Roam Command Palette. These are features that are
        not yet ready for the general audience, but can be beta tested by
        curious users who accept the risk, until one day the feature could be
        integrated with the extension itself.
      </A>
      <Q id={"experimental"}>
        My Roam Graph is slowing down - how do I know if it's because of the
        extensions?
      </Q>
      <A>
        You could load Roam in the browser with <code>?disablejs=true</code> at
        the end of the URL to load Roam with all extensions disabled. If you're
        graph is still slow, we recommend contacting Roam Support. If it's no
        longer slow, then the issue is with one of the extensions you have
        installed. At that point, we recommend turning off and on individual
        extensions until you could spot the one slowing the graph.
      </A>
    </StandardLayout>
  );
};

export default FaqPage;
