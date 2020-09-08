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
  const githubFetch =
    token
      ? fetch(`https://api.github.com/repos`, {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${username}:${token}`
            ).toString("base64")}`,
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

const importGithubRepos = () => {\
  const config = getConfigFromPage("github");
  const username = config["Username"];
  if (!username) {
    await asyncType("Error: Missing required parameter username!");
    return;
  }
  const token = config["Token"];
  const githubFetch =
    token
      ? fetch(`https://api.github.com/users/${username}/repos`, {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${username}:${token}`
            ).toString("base64")}`,
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
            asyncType(`Error fetching repos: ${errorMessage}`)
          );
      }
      return r.json().then(async (issues) => {
        if (issues.length === 0) {
          await asyncType("No repos in your account!");
          return;
        }
        const bullets = issues.map((i: any) => `[${i.title}](${i.html_url})`);
        await pushBullets(bullets);
      });
    })
    .catch((e) => asyncType(`Error: ${e.message}`));
}

addButtonListener("Import Github Cards", () => {});
addButtonListener("Import Github Issues", importGithubIssues);
addButtonListener("Import Github Projects", () => {});
addButtonListener("Import Github Repos", importGithubRepos);
