## 1.1.1

- Explicitly set the `Content-Type` to be `text/html` to prevent
  errors when `X-Content-Type-Options: nosniff` is set.

Thanks to [Michał Miszczyszyn](https://github.com/mmiszy).

## 1.1.0

- expose `oauthConfig`, `randomState` and `renderResponse` methods
  to allow repurposing of the internals for non-vercel contexts.
- add `OAUTH_HOST`, `OAUTH_TOKEN_PATH` and `OAUTH_AUTHORIZE_PATH`
  environment variables for more configuration.

## 1.0.0

Initial release
