# Postgres

## Dealing with bytea from node-postgres

```js
export async function blah (data) {
  // conversion for postgres bytea datatype
  // the former is a hex string
  // the latter case is a buffer
  const byteaData = '\\x' + (typeof data === 'string' ? data : data.toString('hex'))
  
  // using the pg-promise library here
  const rslt = await db.one('select * FROM some_func($1::bytea)', byteaData)
}
```
