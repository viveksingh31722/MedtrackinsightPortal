import { Client } from '@elastic/elasticsearch';
import { env } from './env';

let esClient: Client | null = null;
let isEsEnabled = false;

try {
  if (env.ELASTICSEARCH_NODE) {
    esClient = new Client({
      node: env.ELASTICSEARCH_NODE,
    });
    isEsEnabled = true;
    console.log(`🔍 Elasticsearch client initialized for node: ${env.ELASTICSEARCH_NODE}`);
  } else {
    console.warn('⚠️ Elasticsearch node is not configured. Elasticsearch search feature will be disabled.');
  }
} catch (err) {
  console.error('❌ Failed to initialize Elasticsearch client:', err);
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
    console.warn('⚠️ Elasticsearch is unreachable. Search operations will automatically fall back to Postgres.');
    return false;
  }
}

export default esClient;
export { esClient, isEsEnabled };
