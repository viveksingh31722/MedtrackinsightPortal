import { Client } from '@elastic/elasticsearch';
import { env } from './env';
import { logger } from '../utils/logger';

let esClient: Client | null = null;
let isEsEnabled = false;

try {
  if (env.ELASTICSEARCH_NODE) {
    esClient = new Client({
      node: env.ELASTICSEARCH_NODE,
    });
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

