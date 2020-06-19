import debugFactory from 'debug';
import getRawBody from 'raw-body';
import crypto from 'crypto';
import timingSafeCompare from 'tsscmp';
import { packageIdentifier } from './util';

export const errorCodes = {
  SIGNATURE_VERIFICATION_FAILURE: 'SLACKHTTPHANDLER_REQUEST_SIGNATURE_VERIFICATION_FAILURE',
  REQUEST_TIME_FAILURE: 'SLACKHTTPHANDLER_REQUEST_TIMELIMIT_FAILURE',
  BODY_PARSER_NOT_PERMITTED: 'SLACKADAPTER_BODY_PARSER_NOT_PERMITTED_FAILURE', // moved constant from adapter
};

const responseStatuses = {
  OK: 200,
  FAILURE: 500,
  REDIRECT: 302,
  NOT_FOUND: 404,
};

const debug = debugFactory('@slack/events-api:http-handler');

/**
 * Method to verify signature of requests
 *
 * @param {string} signingSecret - Signing secret used to verify request signature
 * @param {string} requestSignature - Signature from request 'x-slack-signature' header
 * @param {number} requestTimestamp - Timestamp from request 'x-slack-request-timestamp' header
 * @param {string} body - Raw body string
 * @returns {boolean} Indicates if request is verified
 */
export function verifyRequestSignature({
  signingSecret, requestSignature, requestTimestamp, body,
}) {
  // Divide current date to match Slack ts format
  // Subtract 5 minutes from current time
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (60 * 5);

  if (requestTimestamp < fiveMinutesAgo) {
    debug('request is older than 5 minutes');
    const error = new Error('Slack request signing verification outdated');
    error.code = errorCodes.REQUEST_TIME_FAILURE;
    throw error;
  }

  const hmac = crypto.createHmac('sha256', signingSecret);
  const [version, hash] = requestSignature.split('=');
  hmac.update(`${version}:${requestTimestamp}:${body}`);

  if (!timingSafeCompare(hash, hmac.digest('hex'))) {
    debug('request signature is not valid');
    const error = new Error('Slack request signing verification failed');
    error.code = errorCodes.SIGNATURE_VERIFICATION_FAILURE;
    throw error;
  }

  debug('request signing verification success');
  return true;
}

export function createHTTPHandler(adapter) {
  const poweredBy = packageIdentifier();

  /**
   * Binds a specific response instance to the function that works like a
   * completion handler
   *
   * @param {Object} res - Response object
   * @returns {Function} Returns a function used to send response
   */
  function sendResponse(res) {
    // This function is the completion handler for sending a response to an event. It can either
    // be invoked by automatically or by the user (when using the `waitForResponse` option).
    return function _sendResponse(err, responseOptions) {
      debug('sending response - error: %s, responseOptions: %o', err, responseOptions);
      // Deal with errors up front
      if (err) {
        if (err.status) {
          res.statusCode = err.status;
        } else if (err.code === errorCodes.SIGNATURE_VERIFICATION_FAILURE ||
            err.code === errorCodes.REQUEST_TIME_FAILURE) {
          res.statusCode = responseStatuses.NOT_FOUND;
        } else {
          res.statusCode = responseStatuses.FAILURE;
        }
      } else {
        // First determine the response status
        if (responseOptions) {
          if (responseOptions.failWithNoRetry) {
            res.statusCode = responseStatuses.FAILURE;
          } else if (responseOptions.redirectLocation) {
            res.statusCode = responseStatuses.REDIRECT;
          } else {
            // URL Verification
            res.statusCode = responseStatuses.OK;
          }
        } else {
          res.statusCode = responseStatuses.OK;
        }

        // Next determine the response headers
        if (responseOptions && responseOptions.failWithNoRetry) {
          res.setHeader('X-Slack-No-Retry', '1');
        }
        res.setHeader('X-Slack-Powered-By', poweredBy);
      }

      // Lastly, send the response
      if (responseOptions && responseOptions.content) {
        res.end(responseOptions.content);
      } else {
        res.end();
      }
    };
  }

  /**
   * Abstracts error handling.
   *
   * @param {Error} error
   * @param {Function} respond
   */
  function handleError(error, respond) {
    debug('handling error - message: %s, code: %s', error.message, error.code);
    try {
      if (adapter.waitForResponse) {
        adapter.emit('error', error, respond);
      } else if (process.env.NODE_ENV === 'development') {
        adapter.emit('error', error);
        respond({ status: 500 }, { content: error.message });
      } else {
        adapter.emit('error', error);
        respond(error);
      }
    } catch (userError) {
      process.nextTick(() => { throw userError; });
    }
  }

  /**
   * Request listener used to handle Slack requests and send responses and
   * verify request signatures
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  return function slackEventRequestListener(req, res) {
    debug('request recieved - method: %s, path: %s', req.method, req.url);

    // Bind a response function to this request's respond object.
    const respond = sendResponse(res);

    // If parser is being used and we don't receive the raw payload via `rawBody`,
    // we can't verify request signature
    if (req.body && !req.rawBody) {
      const error = new Error('Parsing request body prohibits request signature verification');
      error.code = errorCodes.BODY_PARSER_NOT_PERMITTED;
      handleError(error, respond);
      return;
    }

    // Some serverless cloud providers (e.g. Google Firebase Cloud Functions) might populate
    // the request with a bodyparser before it can be populated by the SDK.
    // To prevent throwing an error here, we check the `rawBody` field before parsing the request
    // through the `raw-body` module (see Issue #85 - https://github.com/slackapi/node-slack-events-api/issues/85)
    let parseRawBody;
    if (req.rawBody) {
      debug('Parsing request with a rawBody attribute');
      parseRawBody = new Promise((resolve) => {
        resolve(req.rawBody);
      });
    } else {
      debug('Parsing raw request');
      parseRawBody = getRawBody(req);
    }

    parseRawBody
      .then((r) => {
        const rawBody = r.toString();
        if (verifyRequestSignature({
          signingSecret: adapter.signingSecret,
          requestSignature: req.headers['x-slack-signature'],
          requestTimestamp: req.headers['x-slack-request-timestamp'],
          body: rawBody,
        })) {
          // Request signature is verified
          // Parse raw body
          const body = JSON.parse(rawBody);

          // Handle URL verification challenge
          if (body.type === 'url_verification') {
            debug('handling url verification');
            respond(null, { content: body.challenge });
            return;
          }

          const emitArguments = [body.event];
          if (adapter.includeBody) {
            emitArguments.push(body);
          }
          if (adapter.includeHeaders) {
            emitArguments.push(req.headers);
          }
          if (adapter.waitForResponse) {
            emitArguments.push(respond);
          } else {
            respond();
          }

          debug('emitting event -  type: %s, arguments: %o', body.event.type, emitArguments);
          adapter.emit(body.event.type, ...emitArguments);
        }
      }).catch((error) => {
        handleError(error, respond);
      });
  };
}
