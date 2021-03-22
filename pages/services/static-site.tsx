import { Body } from "@dvargas92495/ui";
import React from "react";
import ServiceLayout, {
  getStaticPropsForPage,
  ServicePageProps,
} from "../../components/ServiceLayout";
import Loom from '../../components/Loom';

const StaticSitePage: React.FC<ServicePageProps> = (props) => {
  return (
    <ServiceLayout {...props}>
      <Body>
        Roam is a powerful CMS (content management system), not just for
        personal knowledge management but for public information as well. There
        are a couple of problems though with using Roam itself as the
        public-facing display of that information:
      </Body>
      <ul>
        <li>Initial load time is brutally slow</li>
        <li>
          Most of the data is rendered client side, so it performs poorly on
          search engines
        </li>
        <li>
          The user interface is foreign to most consumers of the public
          information, particularly if they've never seen Roam.
        </li>
      </ul>
      <Body>
        This RoamJS Service allows you to continue using a Roam graph with all
        of its wonderful networking features as the CMS of your own public
        website. Launching a RoamJS static site will download the content of
        your Roam graph and manage a website for you based on your unique
        website configuration.
      </Body>
      <Loom id={'3f62636bb584456d8e31e725c445b8b4'} />
      {/*
      <H4>Configuration</H4>
      <Body>
        Specify global site configuration by adding settings to the
        `roam/js/static-site` on your graph. Configure a setting by entering the
        setting name in a block and the setting value as a child of that block.
        These are the settings supported: - Index - The page name that will
        serve as the entry point of the site. Could be raw text or a page link.
        - Filter - A set of rules that specifies which pages to build. If a page
        matches any child rule, it will be built into the site. The following
        rules are supported: - Starts With - If a page starts with the given
        text, it will be included in the site. Useful for namespacing, e.g.
        `Article/Article`. - Tagged With - If a page contains a tag with the
        given text, it will be included in the site. Includes pages with any
        form of tags or attributes. Could be raw text or a page link. - Template
        - An HTML Code block that will be used as the template for every
        generated HTML file. - It supports a few variables that can be
        interpolated: - `PAGE_NAME` - The name of the page - `PAGE_CONTENT` -
        The content of the page - `REFERENCES` - An array of pages that
        reference the current page - Reference Template - An HTML Code block
        that will be used as the template for every page reference. The
        REFERENCES variable interpolates to all references each rendered as one
        instance of the template - It supports a few variables that can be
        interpolated: - `REFERENCE` - The name of the page referencing the
        current page - `LINK` - The url of the page in your site To help get
        started, you can copy the configuration that generated
        https://roamjsdemo.com from my graph by clicking the button below.
      </Body>
      <H4>Per Page Configuration</H4>
      <Body>
        You could ignore specific blocks in pages that are included. Nest
        everything that you would like to keep on the page but have filtered out
        of the static site under a block that says
        `[[roam/js/static-site/ignore]]`. You could override any roam page's
        default title with the `roam/js/static-site/title::` attribute. The
        value set to the right of this attribute will be used in place of the
        `PAGE_NAME` variable during template interpolation. You could add
        anything to a page's head with the `roam/js/static-site/head::`
        attribute. The HTML code block defined as a **child** of this block will
        be injected into this page's head.
        ![](/images/static-site-page-config.png) Note, that while you'll usually
        want to have these attributes nested within the ignore block, though
        it's not a strict requirement.
      </Body>
      <H4>Self-Hosted</H4>
      <Body>
        If you prefer to host the site instead of RoamJS hosting it for you, you
        could use the GitHub action found
        [here](https://github.com/dvargas92495/generate-roam-site-action).
      </Body>
      */}
    </ServiceLayout>
  );
};

export const getStaticProps = getStaticPropsForPage("static-site");

export default StaticSitePage;
