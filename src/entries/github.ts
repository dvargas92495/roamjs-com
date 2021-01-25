import { getPageTitle, runExtension } from "../entry-helpers";
import {
  addButtonListener,
  genericError,
  getConfigFromPage,
  getParentUidByBlockUid,
  pushBullets,
  RoamBlock,
  updateActiveBlock,
} from "roam-client";
import axios from "axios";

const importGithubIssues = async (
  _: {
    [key: string]: string;
  },
  blockUid: string
) => {
  const parentUid = getParentUidByBlockUid(blockUid);
  const config = getConfigFromPage("roam/js/github");
  const username = config["Username"];
  if (!username) {
    updateActiveBlock("Error: Missing required parameter username!");
    return;
  }
  const token = config["Token"];
  const githubReq = token
    ? axios.get(`https://api.github.com/repos`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${username}:${token}`).toString(
            "base64"
          )}`,
        },
      })
    : axios.get(
        `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/github-issues?username=${username}`
      );
  githubReq
    .then(async (r) => {
      const issues = r.data;
      if (issues.length === 0) {
        updateActiveBlock("No issues assigned to you!");
        return;
      }
      const bullets = issues.map(
        (i: { title: string; html_url: string }) =>
          `[${i.title}](${i.html_url})`
      );
      await pushBullets(bullets, blockUid, parentUid);
    })
    .catch(genericError);
};

const importGithubRepos = async (
  buttonConfig: { [key: string]: string },
  blockUid: string
) => {
  const parentUid = getParentUidByBlockUid(blockUid);
  const config = getConfigFromPage("roam/js/github");
  const username = buttonConfig.FOR ? buttonConfig.FOR : config["Username"];
  if (!username) {
    updateActiveBlock("Error: Missing required parameter username!");
    return;
  }
  const token = config["Token"];
  const githubReq = token
    ? axios.get(`https://api.github.com/users/${username}/repos`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config["Username"]}:${token}`
          ).toString("base64")}`,
        },
      })
    : axios.get(
        `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/github-repositories?username=${username}`
      );
  githubReq
    .then(async (r) => {
      const repos = r.data;
      if (repos.length === 0) {
        updateActiveBlock(`No repos in ${username}'s account!`);
        return;
      }
      const bullets = repos.map((i: { name: string }) => `[[${i.name}]]`);
      await pushBullets(bullets, blockUid, parentUid);
    })
    .catch(genericError);
};

const importGithubProjects = async (
  buttonConfig: {
    [key: string]: string;
  },
  blockUid: string
) => {
  const parentUid = getParentUidByBlockUid(blockUid);
  const config = getConfigFromPage("roam/js/github");
  const username = buttonConfig.FOR ? buttonConfig.FOR : config["Username"];
  const pageTitle = getPageTitle(document.activeElement);
  const repoName = buttonConfig.IN ? buttonConfig.IN : pageTitle.textContent;
  const repository = `${username}/${repoName}`;
  const token = config["Token"];
  const githubReq = token
    ? axios.get(`https://api.github.com/repos/${repository}/projects`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config["Username"]}:${token}`
          ).toString("base64")}`,
          Accept: "application/vnd.github.inertia-preview+json",
        },
      })
    : axios.get(
        `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/github-projects?repository=${repository}`
      );
  githubReq
    .then(async (r) => {
      const projects = r.data;
      if (projects.length === 0) {
        updateActiveBlock(`No projects in ${repository}`);
        return;
      }
      const bullets = projects.map((i: { name: string }) => `[[${i.name}]]`);
      await pushBullets(bullets, blockUid, parentUid);
    })
    .catch(genericError);
};

const importGithubCards = async (
  buttonConfig: { [key: string]: string },
  blockUid: string
) => {
  const parentUid = getParentUidByBlockUid(blockUid);
  const config = getConfigFromPage("roam/js/github");
  const pageTitle = getPageTitle(document.activeElement);
  const parentBlocks = window.roamAlphaAPI
    .q(
      `[:find (pull ?parentPage [:node/title]) :where [?parentPage :block/children ?referencingBlock] [?referencingBlock :block/refs ?referencedPage] [?referencedPage :node/title "${pageTitle.textContent}"]]`
    )
    .filter((block) => block.length) as RoamBlock[][];
  const repoAsParent = parentBlocks.length > 0 ? parentBlocks[0][0]?.title : "";

  const username = buttonConfig.FOR ? buttonConfig.FOR : config["Username"];
  const repoName = buttonConfig.IN ? buttonConfig.IN : repoAsParent;
  const repository = `${username}/${repoName}`;
  const project = buttonConfig.UNDER
    ? buttonConfig.UNDER
    : pageTitle.textContent;
  const column = buttonConfig.AS ? buttonConfig.AS : "To do";

  if (!config["Token"]) {
    axios
      .get(
        `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/github-cards?repository=${repository}&project=${project}&column=${column}`
      )
      .then(async (r) => {
        const cards = r.data;
        if (cards.length === 0) {
          updateActiveBlock(`No cards in ${repository}`);
          return;
        }
        const bullets = cards.map(
          (i: { note: string; content_url: string; html_url: string }) =>
            `[${
              i.note
                ? i.note
                : i.content_url.substring(
                    "https://api.github.com/repos/".length
                  )
            }](${i.html_url})`
        );
        await pushBullets(bullets, blockUid, parentUid);
      })
      .catch(genericError);
  } else {
    updateActiveBlock("Personal Token currently not supported for cards");
  }
};

runExtension("github", () => {
  addButtonListener("Import Github Cards", importGithubCards);
  addButtonListener("Import Github Issues", importGithubIssues);
  addButtonListener("Import Github Projects", importGithubProjects);
  addButtonListener("Import Github Repos", importGithubRepos);
});
