import { Client } from '@elastic/elasticsearch';
import { env } from './env';
import { logger } from '../utils/logger';

let esClient: any = null;
let isEsEnabled = false;

/**
 * Wraps an Elasticsearch client instance with an ES6 Proxy that automatically
 * unpacks the `.body` property from response objects returned by v7 client methods.
 * This makes the v7 client behave identically to the v8 client so that existing
 * query code doesn't require any API modifications.
 */
function wrapClient(client: any): any {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return async function (...args: any[]) {
          const res = await val.apply(target, args);
          return res && res.body !== undefined ? res.body : res;
        };
      }
      if (typeof val === 'object' && val !== null) {
        return wrapClient(val);
      }
      return val;
    }
  });
}

try {
  if (env.ELASTICSEARCH_NODE) {
    const rawClient = new Client({
      node: env.ELASTICSEARCH_NODE,
    });
    esClient = wrapClient(rawClient);
    isEsEnabled = true;
    logger.info(`🔍 Elasticsearch client initialized for node: ${env.ELASTICSEARCH_NODE}`);
  } else {
    logger.warn('⚠️ Elasticsearch node is not configured. Elasticsearch search feature will be disabled.');
  }
} catch (err) {
  logger.error('❌ Failed to initialize Elasticsearch client:', { error: err });
}

/**
 * Perform a quick health check ping against the Elasticsearch cluster.
 * Returns true if reachable and healthy, false otherwise.
 */
export async function checkEsHealth(): Promise<boolean> {
  if (!esClient || !isEsEnabled) {
    return false;
  }
  try {
    const health = await esClient.ping();
    return health === true;
  } catch (err) {
    logger.warn('⚠️ Elasticsearch is unreachable. Search operations will automatically fall back to Postgres.');
    return false;
  }
}

export default esClient;
export { esClient, isEsEnabled };

