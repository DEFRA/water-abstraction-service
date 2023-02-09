'use strict'

const gotWithProxy = require('./got-with-proxy')
const urlJoin = require('url-join')

const { logger } = require('../../../../logger')
const config = require('../../../../../config.js')

class AccessTokenManager {
  constructor () {
    this._accessToken = null
    this._expiresAt = null
  }

  async token (forceRefresh = false) {
    if (!this._validate() || forceRefresh) {
      await this._refresh()
    }

    return this._accessToken
  }

  /**
   * Checks whether we have a token, and if so whether it has expired
   *
   * @return {Boolean} true if it exists and is not expired, else false
   */
  _validate () {
    if (!this._accessToken) {
      return false
    }

    const currentDateTime = new Date()
    if (this._expiresAt < currentDateTime) {
      return false
    }

    return true
  }

  /**
   * Fetches a new access token from the cognito API
   * @returns
   */
  async _refresh () {
    const uri = urlJoin(config.chargeModule.cognito.host, '/oauth2/token')
    const options = {
      searchParams: {
        grant_type: 'client_credentials'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: `Basic ${this._encodedCredentials()}`
      }
    }

    // Make got request
    const { access_token: accessToken, expires_in: expiresIn } = await gotWithProxy.post(uri, options)

    // Update this instance with the access token and expiry time
    this._accessToken = accessToken
    this._expiresAt = this._expires(expiresIn)
    logger.info(`Obtained a new Cognito token. It expires at ${this._expiresAt}`)

    return this._accessToken
  }

  _encodedCredentials () {
    const buff = Buffer.from(`${config.chargeModule.cognito.username}:${config.chargeModule.cognito.password}`)

    return buff.toString('base64')
  }

  _expires (expiresIn) {
    // The expiry time comes to us in seconds so we need to convert it to milliseconds. We also set it to expire 1
    // minute before the reported expiry time, to avoid cases where the token is retrieved from the cache but expires
    // before the request can be made
    const expiresInLessOneMinuteAsMilliseconds = (expiresIn - 60) * 1000
    const currentDateTime = new Date()

    return new Date(currentDateTime.getTime() + expiresInLessOneMinuteAsMilliseconds)
  }
}

module.exports = AccessTokenManager
