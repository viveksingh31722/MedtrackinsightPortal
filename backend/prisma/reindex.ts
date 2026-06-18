import { PrismaClient } from '@prisma/client';
import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX || 'medicines';

const prisma = new PrismaClient();
const esClient = new Client({
  node: ELASTICSEARCH_NODE,
});

async function runReindexing() {
  console.log('🔄 Starting Elasticsearch reindexing process...');

  try {
    // 1. Verify ES connectivity
    const ping = await esClient.ping();
    if (!ping) {
      throw new Error('Could not connect to Elasticsearch cluster.');
    }
    console.log('✅ Connected to Elasticsearch.');

    // 2. Check if index exists, and delete it to reset mappings
    const indexExists = await esClient.indices.exists({ index: ELASTICSEARCH_INDEX });
    if (indexExists) {
      console.log(`🗑️ Index "${ELASTICSEARCH_INDEX}" already exists. Deleting it for a clean rebuild.`);
      await esClient.indices.delete({ index: ELASTICSEARCH_INDEX });
    }

    // 3. Create index with custom mappings
    console.log(`🛠️ Creating index "${ELASTICSEARCH_INDEX}" with custom search mappings...`);
    await esClient.indices.create({
      index: ELASTICSEARCH_INDEX,
      settings: {
        analysis: {
          analyzer: {
            drug_search_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding'],
            },
          },
        },
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          drugName: { 
            type: 'text', 
            analyzer: 'drug_search_analyzer',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          indication: { type: 'text', analyzer: 'drug_search_analyzer' },
          moa: { type: 'text', analyzer: 'drug_search_analyzer' },
          phase: { type: 'keyword' },
          dataset: { type: 'keyword' },
          sponsor: { type: 'text' },
          brandName: { type: 'text' },
          target: { type: 'text' },
          status: { type: 'keyword' },
          route: { type: 'text' },
          createdAt: { type: 'date' },
          additionalData: { type: 'text', index: false } // Stored only, not searchable raw JSON string
        },
      },
    });
    console.log('✅ Index created.');

    // 4. Fetch all data from Postgres
    console.log('📥 Fetching medicine records from PostgreSQL...');
    const medicines = await prisma.medicine.findMany({});
    console.log(`✅ Loaded ${medicines.length} records from PostgreSQL.`);

    if (medicines.length === 0) {
      console.warn('⚠️ No medicine records found in PostgreSQL. Seeding may be required.');
      return;
    }

    // 5. Bulk index documents
    console.log('📤 Bulk indexing documents into Elasticsearch...');
    const body = medicines.flatMap((med) => {
      let additional: any = {};
      try {
        additional = JSON.parse(med.additionalData || '{}');
      } catch {
        additional = {};
      }

      return [
        { index: { _index: ELASTICSEARCH_INDEX, _id: med.id } },
        {
          id: med.id,
          drugName: med.drugName,
          indication: med.indication,
          moa: med.moa,
          phase: additional.phase || 'N/A',
          dataset: additional.dataset || 'Approved Drugs',
          sponsor: additional.sponsor || 'N/A',
          brandName: additional.brandName || 'N/A',
          target: additional.target || 'N/A',
          status: additional.status || 'Active',
          route: additional.route || 'N/A',
          createdAt: med.createdAt,
          additionalData: med.additionalData
        }
      ];
    });

    const bulkResponse = await esClient.bulk({ refresh: true, body });

    if (bulkResponse.errors) {
      console.error('❌ Some errors occurred during bulk indexing:');
      const erroredItems = bulkResponse.items.filter((item: any) => item.index && item.index.error);
      console.error(erroredItems.slice(0, 5));
    } else {
      console.log(`🎉 Successfully indexed ${medicines.length} medicine profiles into Elasticsearch!`);
    }

  } catch (error) {
    console.error('❌ Critical failure during Elasticsearch re-indexing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute reindexing
runReindexing();
