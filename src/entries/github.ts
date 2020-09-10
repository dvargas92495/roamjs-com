import {
  addButtonListener,
  asyncType,
  pushBullets,
  getConfigFromPage,
} from "../entry-helpers";

const importGithubIssues = async () => {
  const config = getConfigFromPage("github");
  const username = config["Username"];
  if (!username) {
    await asyncType("Error: Missing required parameter username!");
    return;
  }
  const token = config["Token"];
  const githubFetch = token
    ? fetch(`https://api.github.com/repos`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${username}:${token}`).toString(
            "base64"
          )}`,
        },
      })
    : fetch(
        `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/github-issues?username=${username}`
      );
  githubFetch
    .then((r) => {
      if (!r.ok) {
        return r
          .text()
          .then((errorMessage) =>
            asyncType(`Error fetching issues: ${errorMessage}`)
          );
      }
      return r.json().then(async (issues) => {
        if (issues.length === 0) {
          await asyncType("No issues assigned to you!");
          return;
        }
        const bullets = issues.map((i: any) => `[${i.title}](${i.html_url})`);
        await pushBullets(bullets);
      });
    })
    .catch((e) => asyncType(`Error: ${e.message}`));
};

const importGithubRepos = async (buttonConfig: { [key: string]: string }) => {
  const config = getConfigFromPage("github");
  const username = buttonConfig.FOR ? buttonConfig.FOR : config["Username"];
  if (!username) {
    await asyncType("Error: Missing required parameter username!");
    return;
  }
  const token = config["Token"];
  const githubFetch = token
    ? fetch(`https://api.github.com/users/${username}/repos`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config["Username"]}:${token}`
          ).toString("base64")}`,
        },
      })
    : fetch(
        `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/github-repositories?username=${username}`
      );
  githubFetch
    .then((r) => {
      if (!r.ok) {
        return r
          .text()
          .then((errorMessage) =>
            asyncType(`Error fetching repos: ${errorMessage}`)
          );
      }
      return r.json().then(async (repos) => {
        if (repos.length === 0) {
          await asyncType(`No repos in ${username}'s account!`);
          return;
        }
        const bullets = repos.map((i: any) => `[[${i.name}]]`);
        await pushBullets(bullets);
      });
    })
    .catch((e) => asyncType(`Error: ${e.message}`));
};

const importGithubProjects = async (buttonConfig: {
  [key: string]: string;
}) => {
  const config = getConfigFromPage("github");
  const username = buttonConfig.FOR ? buttonConfig.FOR : config["Username"];
  const pageTitle = document.getElementsByClassName(
    "rm-title-display"
  )[0] as HTMLHeadingElement;
  const repoName = buttonConfig.IN ? buttonConfig.IN : pageTitle.innerText;
  const repository = `${username}/${repoName}`;
  const token = config["Token"];
  const githubFetch = token
    ? fetch(`https://api.github.com/repos/${repository}/projects`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config["Username"]}:${token}`
          ).toString("base64")}`,
          Accept: "application/vnd.github.inertia-preview+json",
        },
      })
    : fetch(
        `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/github-projects?repository=${repository}`
      );
  githubFetch
    .then((r) => {
      if (!r.ok) {
        return r
          .text()
          .then((errorMessage) =>
            asyncType(`Error fetching projects: ${errorMessage}`)
          );
      }
      return r.json().then(async (projects) => {
        if (projects.length === 0) {
          await asyncType(`No projects in ${repository}`);
          return;
        }
        const bullets = projects.map((i: any) => `[[${i.name}]]`);
        await pushBullets(bullets);
      });
    })
    .catch((e) => asyncType(`Error: ${e.message}`));
};

const importGithubCards = async (buttonConfig: { [key: string]: string }) => {
  const config = getConfigFromPage("github");
  const pageTitle = document.getElementsByClassName(
    "rm-title-display"
  )[0] as HTMLHeadingElement;
  const parentBlocks = window.roamAlphaAPI
    .q(
      `[:find (pull ?parentPage [:node/title]) :where [?parentPage :block/children ?referencingBlock] [?referencingBlock :block/refs ?referencedPage] [?referencedPage :node/title "${pageTitle.innerText}"]]`
    )
    .filter((block) => block.length);
  const repoAsParent = parentBlocks.length > 0 ? parentBlocks[0][0]?.title : "";

  const username = buttonConfig.FOR ? buttonConfig.FOR : config["Username"];
  const repoName = buttonConfig.IN ? buttonConfig.IN : repoAsParent;
  const repository = `${username}/${repoName}`;
  const project = buttonConfig.UNDER ? buttonConfig.UNDER : pageTitle.innerText;
  const column = buttonConfig.AS ? buttonConfig.AS : "To do";

  if (!config["Token"]) {
    fetch(
      `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/github-cards?repository=${repository}&project=${project}&column=${column}`
    )
      .then((r) => {
        if (!r.ok) {
          return r
            .text()
            .then((errorMessage) =>
              asyncType(`Error fetching cards: ${errorMessage}`)
            );
        }
        return r.json().then(async (cards) => {
          if (cards.length === 0) {
            await asyncType(`No cards in ${repository}`);
            return;
          }
          const bullets = cards.map((i: any) => i.note ? i.note : i.content_url);
          await pushBullets(bullets);
        });
      })
      .catch((e) => asyncType(`Error: ${e.message}`));
  } else {
    await asyncType("Personal Token currently not supported for cards");
  }
};

addButtonListener("Import Github Cards", importGithubCards);
addButtonListener("Import Github Issues", importGithubIssues);
addButtonListener("Import Github Projects", importGithubProjects);
addButtonListener("Import Github Repos", importGithubRepos);
