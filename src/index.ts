//
// From https://github.com/robinpokorny/netlify-cms-now
// with the goal of moving to a reusable npm module
//

import { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes } from 'crypto'
import { AuthorizationCode, ModuleOptions } from 'simple-oauth2'
import { GitHubScope, isGitHubError, gitHubErrorToNetlifyError } from './github'

const {
  OAUTH_CLIENT_ID = '',
  OAUTH_CLIENT_SECRET = '',
  OAUTH_HOST = 'https://github.com',
  OAUTH_TOKEN_PATH = '/login/oauth/access_token',
  OAUTH_AUTHORIZE_PATH = '/login/oauth/authorize',
} = process.env

export const oauthConfig: ModuleOptions = Object.freeze({
  client: Object.freeze({
    id: OAUTH_CLIENT_ID,
    secret: OAUTH_CLIENT_SECRET,
  }),
  auth: Object.freeze({
    tokenHost: OAUTH_HOST,
    tokenPath: OAUTH_TOKEN_PATH,
    authorizePath: OAUTH_AUTHORIZE_PATH,
  }),
})

export function randomState() {
  return randomBytes(6).toString('hex')
}

interface Options {
  secure?: boolean
  scopes?: GitHubScope[]
}

const defaultOptions: Required<Options> = {
  secure: true,
  scopes: ['repo', 'user'],
}

/** Render a html response with a script to finish a client-side github authentication */
export function renderResponse(status: 'success' | 'error', content: any) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Authorizing ...</title>
  </head>
  <body>
    <p id="message"></p>
    <script>
      // Output a message to the user
      function sendMessage(message) {
        document.getElementById("message").innerText = message;
        document.title = message
      }

      // Handle a window message by sending the auth to the "opener"
      function receiveMessage(message) {
        console.debug("receiveMessage", message);
        window.opener.postMessage(
          'authorization:github:${status}:${JSON.stringify(content)}',
          message.origin
        );
        window.removeEventListener("message", receiveMessage, false);
        sendMessage("Authorized, closing ...");
      }

      sendMessage("Authorizing ...");
      window.addEventListener("message", receiveMessage, false);

      console.debug("postMessage", "authorizing:github", "*")
      window.opener.postMessage("authorizing:github", "*");
    </script>
  </body>
</html>
  `.trim()
}

/** An endpoint to start an OAuth2 authentication */
export const getAuth = (options: Options = {}) =>
  function auth(req: VercelRequest, res: VercelResponse) {
    const protocol = options.secure ?? defaultOptions.secure ? 'https' : 'http'
    const scope = (options.scopes ?? defaultOptions.scopes).join(',')

    const { host } = req.headers

    console.debug('auth host=%o', host)

    const authorizationCode = new AuthorizationCode(oauthConfig)

    const url = authorizationCode.authorizeURL({
      redirect_uri: `${protocol}://${host}/api/callback`,
      scope,
      state: randomState(),
    })

    res.writeHead(301, { Location: url })
    res.end()
  }
export const auth = getAuth()

/** An endpoint to finish an OAuth2 authentication */
export const getCallback = (options: Options = {}) =>
  async function callback(req: VercelRequest, res: VercelResponse) {
    const protocol = options.secure ?? defaultOptions.secure ? 'https' : 'http'

    try {
      if (isGitHubError(req.query)) {
        throw gitHubErrorToNetlifyError(req.query)
      }

      const code = req.query.code as string
      const { host } = req.headers

      const authorizationCode = new AuthorizationCode(oauthConfig)

      const accessToken = await authorizationCode.getToken({
        code,
        redirect_uri: `${protocol}://${host}/api/callback`,
      })

      if (isGitHubError(accessToken.token)) {
        throw gitHubErrorToNetlifyError(accessToken.token)
      }

      console.debug('callback host=%o', host)

      const { token } = authorizationCode.createToken(accessToken)

      if (isGitHubError(token)) {
        throw gitHubErrorToNetlifyError(token)
      }

      res.setHeader('Content-Type', 'text/html')
      res.status(200).send(
        renderResponse('success', {
          token: token.token.access_token,
          provider: 'github',
        })
      )
    } catch (e) {
      res.setHeader('Content-Type', 'text/html')
      res.status(200).send(renderResponse('error', e))
    }
  }
export const callback = getCallback()
