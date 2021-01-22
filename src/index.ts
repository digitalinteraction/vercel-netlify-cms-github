//
// From https://github.com/robinpokorny/netlify-cms-now
// with the goal of moving to a reusable npm module
//

import dedent = require('dedent')
import { NowRequest, NowResponse } from '@vercel/node'
import { randomBytes } from 'crypto'
import { AuthorizationCode, ModuleOptions } from 'simple-oauth2'

const oauthConfig: ModuleOptions = Object.freeze({
  client: Object.freeze({
    id: process.env.OAUTH_CLIENT_ID!,
    secret: process.env.OAUTH_CLIENT_SECRET!,
  }),
  auth: Object.freeze({
    tokenHost: `https://github.com`,
    tokenPath: `/login/oauth/access_token`,
    authorizePath: `/login/oauth/authorize`,
  }),
})

function randomState() {
  return randomBytes(6).toString('hex')
}

/** Render a html response with a script to finish a client-side github authentication */
function renderResponse(status: 'success' | 'error', content: any) {
  return dedent`
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
  `
}

/** An endpoint to start an OAuth2 authentication */
export function auth(req: NowRequest, res: NowResponse) {
  const { host } = req.headers

  console.debug('auth host=%o', host)

  const authorizationCode = new AuthorizationCode(oauthConfig)

  const url = authorizationCode.authorizeURL({
    redirect_uri: `https://${host}/api/callback`,
    scope: `repo,user`,
    state: randomState(),
  })

  res.writeHead(301, { Location: url })
  res.end()
}

/** An endpoint to finish an OAuth2 authentication */
export async function callback(req: NowRequest, res: NowResponse) {
  try {
    const code = req.query.code as string
    const { host } = req.headers

    const authorizationCode = new AuthorizationCode(oauthConfig)

    const accessToken = await authorizationCode.getToken({
      code,
      redirect_uri: `https://${host}/api/callback`,
    })

    console.debug('callback host=%o', host)

    const { token } = authorizationCode.createToken(accessToken)

    res.status(200).send(
      renderResponse('success', {
        token: token.token.access_token,
        provider: 'github',
      })
    )
  } catch (e) {
    res.status(200).send(renderResponse('error', e))
  }
}
