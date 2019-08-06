# Architecture notes for passport.js

These are my personal notes from doing a deep-dive into the internals of `passport.js`, and also from reading:

[Passport: The Hidden Manual by jwalton](https://github.com/jwalton/passport-api-docs)

## Table of Contents

- [Architecture notes for passport.js](#architecture-notes-for-passportjs)
  * [Strategy](#strategy)
  * [Session management](#session-management)
    + [The session store is set / updated in the following situations](#the-session-store-is-set---updated-in-the-following-situations)
  * [User de/serialization](#user-de-serialization)
    + [Serialization](#serialization)
    + [Deserialization](#deserialization)
  * [Authentication / Login](#authentication---login)
    + [`req.login()` notes](#-reqlogin----notes)
  * [Logout](#logout)
- [Authorization Code Flow with Proof Key for Code Exchange (PKCE)](#authorization-code-flow-with-proof-key-for-code-exchange--pkce-)
  * [Notes](#notes)
  * [Implementation: Client](#implementation--client)
    + [Generate Code Verifier](#generate-code-verifier)
    + [Create Code Challenge](#create-code-challenge)
    + [Send Code Challenge with Authorization Request](#send-code-challenge-with-authorization-request)
    + [Server Returns Auth Code / Client Sends Auth Code + Verifier to Token Endpoint](#server-returns-auth-code---client-sends-auth-code---verifier-to-token-endpoint)
  * [Implementation: Server](#implementation--server)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>


## Strategy

- To register multiple copies of the same strategy, do `passport.use('strategy-id', new Strategy())`
- The callback parameter of a strategy is called the `verify callback`
  * This is called first and only on a successful login
  * The "profile" parameter will be the user data returned from the oauth service
  * The point of this callback is to check if a user exists / create user in your local database
  * The `done(err, data)` callback is passed onto `passport.serializeUser()`
  * Set `data` to `false` if the user cannot be authenticated (do not set `err`, this is for server errors only)
  
## Session management

- OAuth2 integrations require the use of a session store, usually provided by `express-session`. The default is an in-memory store.
  * The reason for this is that the session store will contain a computed CSRF token, which is sent as the `state` query param in the initial OAuth2 call to the 3rd party provider. On sucessful login, the `state` and other query params are used to check if the original CSRF matches
  * More info on OAuth2 CSRF attacks: https://security.stackexchange.com/questions/20187/oauth2-cross-site-request-forgery-and-state-parameter
- The session set call has the following format: `fn(sessionId, expTime, data)`
- Most stores will serialize the `data` using `JSON.stringify()`

### The session store is set / updated in the following situations

- Visiting the page for the first time (if not logged in, a session id is generated, with an empty serialized cookie as the 
value + expiration)
- Going to the log in link (session data is updated with cookie data + state value for CSRF) 
- Callback endpoint after logging into 3rd party auth provider (session data is updated with value from `serializeUser()`, 
encoded as property called `passport.user`)

## User de/serialization

The `de/serialize()` registration functions is actually middleware - you can register multiple de/serializers.

### Serialization 

Describes what data to store in the session store.

- `passport.serializeUser(fn(data, done))`: This is called after the `verify callback` in the strategy, 
where `data` is the result from that callback.
  * Undocumented: `fn(req, data, done)`. To skip to the next serializer, set `err='pass'`.
- When calling `done(err, data)`, the `data` is serialized to the session store under the `passport.user` property.
- Most implementations seem to pass the user id for the `data` value, but this is not required; you can store full 
user data if you want.

### Deserialization

Data set in the session store from serialization is the input to the deserializer. The callback sets the `req.user` value.

- `passport.deserializeUser(fn(data, done)`: The `data` param comes from the session store fetch.
  * Undocumented: `fn(req, data, done)`
- Calling `done(err, data)` sets the `req.user` property with the value from `data`.
- Most implementations that have the user id set in the serialization step will use this as an opportunity to 
fetch user data from a database.
- If the user no longer exists for the session, call callback with `null`/`false` for the `data` value

## Authentication / Login

- The first parameter of `passport.authenticate()` can be a single or an array of strategies to try until one is successful.
- Some strategies may redirect the user to login (like OAuth)

**Optional**

- The second parameter are a configuration object to send to the strategy
- The third parameter is a callback in the form of `fn(err, user, info)`
  * if auth fails, `user` will be false
  * You **must** manually set `req.user` by calling `req.login(user, next)` in the callback
    - `req.login` calls the user serializers
  * Use this callback to redirect users to the login screen if `user` is `false`, or handle errors

**If you do not specify a callback**

- If a strategy succeeds, then `req.user` will be set
- If all strategies fail, then a 401 response will be sent

### `req.login()` notes

The auth middleware will call it if you do not specify the callback function. The passport.js doc says that you may want to call it out-of-band in a situation where a user signs up for a new account to automatically log them in after registration is completed.

## Logout 

Call `req.logout()` to remove the `req.user` reference and clear the user session.

# Authorization Code Flow with Proof Key for Code Exchange (PKCE)

Source: https://auth0.com/docs/flows/concepts/auth-code-pkce

You want to use PKCE when:

- Cannot securely store a Client Secret. Decompiling the app will reveal the Client Secret. The Client Secret is bound to the app and is the same for all users and devices.
- May make use of a custom URL scheme to capture redirects (e.g., MyApp://) potentially allowing malicious applications to receive an Authorization Code from your Authorization Server.

## Notes

Sources: 

- https://auth0.com/docs/api-auth/tutorials/authorization-code-grant-pkce
- https://medium.com/passportjs/pkce-support-for-oauth-2-0-e3a77013b278
- https://tools.ietf.org/html/rfc7636

- Instead of storing a Client Secret, the client generates a `code_verifier` and a `code_challenge`
- `code_verifier` should be at least 256 bits of entropy
- The `code_challenge` and `code_challenge_method=S256` (`S256` should only be used) is sent to the `/authorize` endpoint
  * `code_challenge_method=plain` is not a recommended option, but can be used if the request path is already protected, and can be easedropped
  *  The use of `S256` protects against disclosure of the `code_verifier` value to an attacker
- The `S256` method protects against `code_challenge` interception since the challenge cannot be used without the `code_verifier`

## Implementation: Client

Assuming `S256` challenge method.

### Generate Code Verifier

The result should be stored locally on the client.

```javascript
// from https://auth0.com/docs/flows/guides/auth-code-pkce/call-api-auth-code-pkce#create-a-code-verifier
function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
var verifier = base64URLEncode(crypto.randomBytes(32));
```

### Create Code Challenge

This value is to be sent with the authorization request to the OAuth2 server.

RFC7636 states for `S256`:

`code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))`

```javascript
// from https://auth0.com/docs/flows/guides/auth-code-pkce/call-api-auth-code-pkce#create-a-code-verifier

function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}
var challenge = base64URLEncode(sha256(verifier));
```

### Send Code Challenge with Authorization Request

The value of `code_challenge` from the prior step, along with the `code_challenge_method=S256` should be sent as parameters to the auth request to the OAuth server.

### Server Returns Auth Code / Client Sends Auth Code + Verifier to Token Endpoint

In addition to the normal parameters to the token endpoint, `code_verifier` is also sent.

(`code_challenge_method` is not required as a proper server implementation will tie (eg via hashing) the `code_challenge_method` and `code_challenge` to the auth code.

## Implementation: Server

When defining a passport strategy, the following parameters must be used to enable PKCE:

```javascript
passport.use(new OAuth2Strategy({
    ...
    // this must be true - the state needs to be true for the verifier to persist in the session
    state: true,
    pkce: true
  },
  function(accessToken, refreshToken, profile, cb) {
    // ...
  })
);
```

