# Architecture notes for passport.js

## Strategy

- To register multiple copies of the same strategy, do `passport.use('strategy-id', new Strategy())`
- The callback parameter of a strategy is called the `verify callback`
  * This is called first and only on a successful login
  * The "profile" parameter will be the user data returned from the oauth service
  * The point of this callback is to check if a user exists / create user in your local database
  * The `done(err, data)` callback is passed onto `passport.serializeUser()`
  
## Session management

- OAuth2 integrations require the use of a session store, usually provided by `express-session`. The default is an in-memory store.
- The session set call has the following format: `fn(sessionId, expTime, data)`
- Most stores will serialize the `data` using `JSON.stringify()`

The session store is set / updated in the following situations:

- Visiting the page for the first time (if not logged in, a session id is generated, with an empty serialized cookie as the 
value + expiration)
- Going to the log in link (session data is updated with cookie data + state value for CSRF) 
- Callback endpoint after logging into 3rd party auth provider (session data is updated with value from `serializeUser()`, 
encoded as property called `passport.user`)

## User de/serialization

The `de/serialize()` registration functions is actually middleware - you can register multiple de/serializers.

# Serialization 

Describes what data to store in the session store.

- `passport.serializeUser(fn(data, done))`: This is called after the `verify callback` in the strategy, 
where `data` is the result from that callback.
- When calling `done(err, data)`, the `data` is serialized to the session store under the `passport.user` property.
- Most implementations seem to pass the user id for the `data` value, but this is not required; you can store full 
user data if you want.

# Deserialization

Data set in the session store from serialization is the input to the deserializer. The callback sets the `req.user` value.

- `passport.deserializeUser(fn(data, done)`: The `data` param comes from the session store fetch.
- Calling `done(err, data)` sets the `req.user` property with the value from `data`.
- Most implementations that have the user id set in the serialization step will use this as an opportunity to 
fetch user data from a database.

