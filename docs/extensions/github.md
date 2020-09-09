## Github to Roam Integration

The Github to Roam Integration allows users to import various types of data from Github and bring into their Roam Database. The name of the script is `github`.

### Usage

The script supports the following configuration attributes, to be added in the `[[roam/js/github]]` page:

- `Username` - (Optional) By default, the extension calls the api with my username and token. If you would like to make calls under your username, set this attribute with token below. This give you access to your private data and is called straight from the Roam frontend.
- `Token` - (Optional) Set with Username above to call GitHub's api as another user. [See this page](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) for documentation on how to create a personal access token. The token must have repo scope access. 


#### GitHub Issues

In any page, create a `Import Github Issues` button by typing in `{{import github issues}}` (case-insensitive) in a block. Upon clicking the button, the extension will clear the button and fill the page in with the issues you have assigned to you in the following format:

> [title](html link)

#### GitHub Repos

In any page, create a `Import Github Repos` button by typing in `{{import github repos}}` (case-insensitive) in a block. Upon clicking the button, the extension will clear the button and fill the page in with the repos that you have in your account as new pages with the repo name as the title. By default it will use the `Username` attribute configured in the config page. To override this to query someone else's publicly available repos, you could add ` for {username}` to the button text. For example, `{{import github repos for dvargas92495}}`.

#### GitHub Projects

In any page, create a `Import Github Repos` button by typing in `{{import github repos}}` (case-insensitive) in a block. Upon clicking the button, the extension will clear the button and fill the page in with the projects that you have in your account as new pages with the project name as the title. By default it will use the `Username` attribute configured in the config page and the name of the page as the repo name. To override this to query someone else's publicly available repos, you could add ` for {username} in {name}` to the button text. For example, `{{import github projects for dvargas92495 in roam-js-extensions}}`.

### Installation

Insert this as a child of any `[[roam/js]]` block to install the extension.

```javascript
var old = document.getElementById("github");
if (old) {
  old.remove();
}

var s = document.createElement("script");
s.src = "https://roam.davidvargas.me/master/github.js";
s.id = "github";
s.async = false;
s.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(s);
```
