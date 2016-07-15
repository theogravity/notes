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
const PLACEHOLDER_REGXP = /\$\w+(?:::\w*)?/g

let dbInstance = null

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

  constructor () {
    this._db = null
  }

  async _openDb () {
    if (!this._db) {
      this._db = await db.open(':memory:', { verbose: true })
    }

    return Promise.resolve()
  }

  async none (q, params) {
    params = params || []

    await this._openDb()
    
    try {
      return await this._db.run(transformFromPgStmt(q, params), ...params)
    } catch (e) {
      return await Promise.reject(e)
    }
  }

  async one (q, params) {
    params = params || []

    await this._openDb()

    let row = null

    try {
      row = await this.oneOrNone(q, params)

      if (row) {
        return await Promise.resolve(row)
      }

      return await Promise.reject({ code: '_RESULT_MISMATCH', msg: 'Got no results'})
    } catch (e) {
      return await Promise.reject(e)
    }
  }

  async oneOrNone (q, params) {
    params = params || []

    await this._openDb()

    try {
      return await this._db.get(transformFromPgStmt(q, params), ...params)
    } catch (e) {
      return await Promise.reject(e)
    }
  }

  async many (q, params) {
    params = params || []

    await this._openDb()

    let rows = null

    try {
      rows = await this.manyOrNone(q, params)

      if (rows.length > 1) {
        return await Promise.resolve(rows)
      }

      return await Promise.reject({ code: '_RESULT_MISMATCH', msg: 'Got no results'})
    } catch (e) {
      return await Promise.reject(e)
    }
  }

  async manyOrNone (q, params) {
    params = params || []

    await this._openDb()

    try {
      return await this._db.all(transformFromPgStmt(q, params), ...params)
    } catch (e) {
      return await Promise.reject(e)
    }
  }
}

/**
 * Translates the query parameters in the statement to
 * be used with the sqlite lib
 * @param {string} q
 * @param {mixed} params
 */
function transformFromPgStmt (q, params) {
  let query = q.replace(PLACEHOLDER_REGXP, '?')

  if (NOW_REGEXP.test(query)) {
    const d = new Date()
    query = query.replace(NOW_REGEXP, `'${d.toISOString()}'`)
  }

  console.log('[sqlite]', query, params)
  return query
}
