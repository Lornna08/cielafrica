'use strict';
/**
 * Ciel M-Pesa STK Push — self-hosted integration for Node.js 18.17+
 *
 *   const { createMpesa, createHttpHandler, configFromEnv } = require('ciel-mpesa-stk');
 *   const mpesa = createMpesa({ ...configFromEnv(), resolveOrder, onPaid, store });
 *   http.createServer(createHttpHandler(mpesa))  // or app.use(createHttpHandler(mpesa))
 */
const { MpesaService } = require('./service');
const { DarajaClient, darajaTimestamp, stkPassword, stateForResult } = require('./daraja');
const { parseStkCallback, ACK } = require('./callback');
const { MemoryStore, JsonFileStore } = require('./store');
const { createHttpHandler } = require('./http');
const { normalizePhone, maskPhone } = require('./phone');
const { DEFAULT_THEME, validateTheme, themeToCssVars } = require('./theme');
const { MpesaError } = require('./errors');

/** Reads the standard environment variables (see .env.example). */
function configFromEnv(env = process.env) {
  return {
    environment: env.MPESA_ENV === 'production' ? 'production' : 'sandbox',
    consumerKey: env.MPESA_CONSUMER_KEY,
    consumerSecret: env.MPESA_CONSUMER_SECRET,
    shortcode: env.MPESA_SHORTCODE,
    passkey: env.MPESA_PASSKEY,
    till: env.MPESA_TILL || '',
    publicUrl: env.MPESA_PUBLIC_URL,
    callbackSecret: env.MPESA_CALLBACK_SECRET,
    basePath: env.MPESA_BASE_PATH || '/mpesa',
    baseUrl: env.MPESA_DARAJA_BASE_URL || undefined
  };
}

function createMpesa(cfg) { return new MpesaService(cfg); }

module.exports = {
  createMpesa, configFromEnv, createHttpHandler,
  MpesaService, DarajaClient, MemoryStore, JsonFileStore, MpesaError,
  parseStkCallback, ACK, normalizePhone, maskPhone, stateForResult, darajaTimestamp, stkPassword,
  DEFAULT_THEME, validateTheme, themeToCssVars
};
