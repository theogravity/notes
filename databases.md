https://news.ycombinator.com/item?id=15569478 - Implementing Stripe-Like Idempotency Keys in Postgres (brandur.org)

https://begriffs.com/posts/2017-08-01-practical-guide-sql-isolation.html

http://highscalability.com/blog/2010/12/6/what-the-heck-are-you-actually-using-nosql-for.html - when to use a nosql database

https://news.ycombinator.com/item?id=14523523 - uuid in databases

# Postgres

- Postgres internals http://www.interdb.jp/pg/index.html

- Securing postgres http://thebuild.com/presentations/pgconfeu-2016-securing-postgresql.pdf

- why uber switched from postgres to mysql https://ayende.com/blog/175137/re-why-uber-engineering-switched-from-postgres-to-mysql

- Really liked using https://github.com/vitaly-t/pg-promise compared to `postgres-gen`. `pg-promise` combined with `async`/`await` was a seamless experience
- It is just as seamless using the default support for ES6 generators provided by [pg-promise](https://github.com/vitaly-t/pg-promise), see [Tasks](https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example#tasks) and [Generators](https://github.com/vitaly-t/pg-promise#generators)
- `bytea` data types require specific conversion
- be aware of which db call to use depending on the situation https://github.com/vitaly-t/pg-promise#query-result-mask

## Trigram indices

https://about.gitlab.com/2016/03/18/fast-search-using-postgresql-trigram-indexes/?

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

# Misc

http://rethinkdb.com/ looks pretty neat
