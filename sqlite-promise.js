/**
 * Wrapper around sqlite (it's sqlite3 w/ promise support)
 * that matches the pg-promise interface
 * meant for use in unit testing against simple queries so pg doesn't have to be set up
 * author: Theo Gravity <theo@suteki.nu>
 *
 * MIT license.
 */

import db from 'sqlite'

// translate now() to a date format of sorts
const NOW_REGEXP = /(now\(\))/g

// translate $1, $2, $x, $x::type to generate placeholder
const PLACEHOLDER_REGEXP = /\$\w+(?:::\w*)?/g

// grab named placeholders defined by $(x)
const NAMED_PLACEHOLDER_REGEXP = /\$\((\w*)\)/g

let dbInstance = null
let id = 0

/**
 * Exposes some of the pg-promise interface to Sqlite. Used for tests.
 */
export default class Sqlite {

  /**
   * Singleton method to get the db instance
   * @returns {Sqlite}
   */
  static db () {
    if (!dbInstance) {
      dbInstance = new Sqlite()
    }

    return dbInstance
  }

  static restartDB () {
    if (dbInstance && dbInstance._db) {
      dbInstance._db.close()
      dbInstance = null
    }

    return Sqlite.db()
  }

  constructor (options) {
    super(options)
    this._db = null
    this._instanceId = ++id
  }

  async _openDb () {
    if (!this._db) {
      try {
        this._db = await db.open(':memory:', { verbose: true })
      } catch (e) {
        throw new Error('Could not open db')
      }
    }

    return Promise.resolve()
  }

  /**
   * @param q
   * @param params
   * @returns {*}
   */
  async none (q, params) {
    params = params || []

    await this._openDb()

    /*
     * see https://github.com/mapbox/node-sqlite3/wiki/API#databaserunsql-param--callback
     *
     * If execution was successful, the this object will contain two properties named lastID and changes which
     * contain the value of the last inserted row ID and the number of rows affected by this query respectively.
     * Note that lastID only contains valid information when the query was a successfully completed INSERT statement
     * and changes only contains valid information when the query was a successfully completed UPDATE or DELETE
     * statement. In all other cases, the content of these properties is inaccurate and should not be used.
     */
    const t = transformFromPgStmt(q, params, this._instanceId)

    if (typeof params === 'object' && !Array.isArray(params)) {
      return await this._db.run(t.query, t.params)
    }

    return await this._db.run(t.query, ...t.params)
  }

  async one (q, params) {
    params = params || []

    await this._openDb()

    let row = null

    row = await this.oneOrNone(q, params, this._instanceId)

    if (row) {
      return row
    }

    throw new Error('Got no results')
  }

  async oneOrNone (q, params) {
    params = params || []

    await this._openDb()

    const t = transformFromPgStmt(q, params, this._instanceId)

    if (typeof params === 'object' && !Array.isArray(params)) {
      return await this._db.get(t.query, t.params)
    }

    return await this._db.get(t.query, ...t.params)
  }

  async many (q, params) {
    params = params || []

    await this._openDb()

    let rows = await this.manyOrNone(q, params, this._instanceId)

    if (rows.length > 1) {
      return rows
    }

    throw new Error('Got no results')
  }

  async manyOrNone (q, params) {
    params = params || []

    await this._openDb()

    const t = transformFromPgStmt(q, params, this._instanceId)

    if (typeof params === 'object' && !Array.isArray(params)) {
      return await this._db.all(t.query, t.params)
    }

    return await this._db.all(t.query, ...t.params)
  }

  /**
   * Just a simple stub around the pg transaction
   * @param fn
   * @returns {*}
   */
  async tx (fn) {
    return await fn(this)
  }

  /**
   * To be used with tx(). Executes and returns result of Promise.all on queries
   * @param {Array} queries
   */
  async batch (queries) {
    return await Promise.all(queries)
  }
}

/**
 * Translates the query parameters in the statement to
 * be used with the sqlite lib
 */
function transformFromPgStmt (q, params, instanceId) {
  let newParams = params
  let query = q.replace(PLACEHOLDER_REGEXP, '?')

  // deal with named parameters
  if (typeof newParams === 'object' && !Array.isArray(newParams)) {
    newParams = {}
    const tokens = []

    let match = NAMED_PLACEHOLDER_REGEXP.exec(query)

    while (match !== null) {
      tokens.push(match[1])
      match = NAMED_PLACEHOLDER_REGEXP.exec(query)
    }

    if (tokens.length > 0) {
      // convert the named params to proper sqlite3 binding
      tokens.forEach((token) => {
        query = query.replace(`$(${token})`, `@${token}`)
      })
    }

    Object.keys(params).forEach((param) => {
      const value = params[param]

      // the param needs to have a $ in front of it for proper binding in sqlite3
      newParams[`@${param}`] = value

      // check if the params object contains an array (via IN expansion) and blow that out
      // https://github.com/mapbox/node-sqlite3/issues/527
      if (Array.isArray(value)) {
        query = query.replace(`@${param}`, value.map((item, idx) => `@${param}${idx}`).join(','))

        value.map((item, idx) => {
          newParams[`@${param}${idx}`] = item
        })
      }
    })
  }

  if (NOW_REGEXP.test(query)) {
    const d = new Date()
    query = query.replace(NOW_REGEXP, `'${d.toISOString()}'`)
  }

  // convert ILIKE

  query = query.replace('ILIKE', 'LIKE')

  console.log(`[sqlite:${instanceId}]`, query, newParams)

  return {
    query,
    params: newParams
  }
}
