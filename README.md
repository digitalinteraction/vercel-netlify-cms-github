# vercel-netlify-cms-github

An NPM package to allow you to use netlify-cms with GitHub authentication
when deploying on Vercel.

## Installation

**1. Install the module**

```bash
# cd into/your/vercel/project
npm install @openlab/vercel-netlify-cms-github
```

**2. Create the auth route**

Create a vercel endpoint at `api/auth.ts`

```ts
export { auth as default } from '@openlab/vercel-netlify-cms-github'
```

**3. Create the callback route**

Create a vercel endpoint at `api/callback.ts`

```ts
export { callback as default } from '@openlab/vercel-netlify-cms-github'
```

**4. Update your config.yml**

Update your `config.yml` to include this backend

```yaml
backend:
  name: github
  repo: YOUR_GITHUB_REPO
  base_url: YOUR_WEBSITE
  auth_endpoint: api/auth
```

- **repo** should be your GitHub repo path, like `owner/repo`
- **base_url** should be the full url to the root of your site, like `https://example.com/`
- **auth_endpoint** needs to be set to link it up correctly, you can't put it in `base_url`

**(optional) Configure vercel.json**

If you have your admin files in a folder (e.g. `admin/index.html` and `admin/config.yml`)
you might want to force vercel to use trailing slashes.
This is because if you visit `/admin` netlify will look for a config at `/config.yml`,
not in the admin folder.

To solve this add (or update) your [vercel.json](https://vercel.com/docs/configuration)
in the project root:

```json
{
  "trailingSlash": true
}
```

**5. Commit these endpoints to git**

```bash
git add api/auth.ts api/callback.ts
git commit -m ":star: add GitHub auth routes and connect to netlify-cms"
```

**6. Create a GitHub OAuth application**

Go to https://github.com/settings/developers.

- Set **Homepage URL** to your site's homepage
- Set **Authorization callback URL** to `https://YOUR_SITE_HERE/api/callback
- Make a note of your `client_id` and `client_secret`

**7. Setup Vercel environment variables**

Go to your vercel dashboard, https://vercel.com.

- Navigate to your project then **Settings** > **Environment Variables**
- Add `OAUTH_CLIENT_ID` and set the value from the GitHub OAuth application
- Add `OAUTH_CLIENT_SECRET` and set the value from the GitHub OAuth application
- You can store them however you like but secrets should be the most secure
- Make sure your environment variables are exposed on the deployment(s) you need

**Done**

🎉 Your site should now be linked up!

## Configuration

**Environment Variables**

In addition to `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET`,
this package also exposes these variables to configure the GitHub authentication.
These all have default values configured to talk to github.com.

- `OAUTH_HOST` (default: `https://github.com`)
  The GitHub server to talk to
- `OAUTH_TOKEN_PATH` (default: `/login/oauth/access_token`)
  The path of the GitHub OAuth
  [token endpoint](https://datatracker.ietf.org/doc/html/rfc6749#section-3.2)
- `OAUTH_AUTHORIZE_PATH` (default: `/login/oauth/authorize`)
  The path of the GitHub OAuth
  [Authorization endpoint](https://datatracker.ietf.org/doc/html/rfc6749#section-3.1)

## API usage

Other than the Vercel endpoints, these are exported:

- `oauthConfig` is an object with configuration for [simple-oauth2](https://www.npmjs.com/package/simple-oauth2)
- `randomState` is a function to generate a random state for an OAuth2 flow
- `renderResponse` is a function to generate HTML with client-side JavaScript
  to complete the OAuth2 flow using `window.opener.postMessage`

> These were primarily exposed for
> [digitalinteraction/netlify-cms-github-auth](http://github.com/digitalinteraction/netlify-cms-github-auth)
> to use.

---

> This project was set up by [puggle](https://npm.im/puggle)
