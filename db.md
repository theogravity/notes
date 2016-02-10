# Postgres

## Dealing with bytea from node-postgres

```js
  // conversion for postgres bytea datatype
  // the latter case is a buffer
  const byteaData = '\\x' + (typeof data === 'string' ? data : data.toString('hex'))
  
  // using the pg-promise library here
  const decrypted = await db.one('select * FROM some_func($1::bytea)', byteaData)
```
