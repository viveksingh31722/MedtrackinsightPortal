import { PrismaClient } from '@prisma/client';
import { esClient } from '../src/config/elasticsearch';

const prisma = new PrismaClient();

async function runReindexing() {
  console.log('🔄 Starting Elasticsearch reindexing process for Pipeline & Forecasting...');

  try {
    // 1. Verify ES connectivity
    if (!esClient) {
      throw new Error('Elasticsearch client is not initialized. Please check your ELASTICSEARCH_NODE configuration.');
    }
    const ping = await esClient.ping();
    if (!ping) {
      throw new Error('Could not connect to Elasticsearch cluster.');
    }
    console.log('✅ Connected to Elasticsearch.');

    const indices = ['pipeline_prospector', 'patent_sales_forecasting'];

    for (const indexName of indices) {
      const indexExists = await esClient.indices.exists({ index: indexName });
      if (indexExists) {
        console.log(`🗑️ Index "${indexName}" already exists. Deleting it for a clean rebuild.`);
        await esClient.indices.delete({ index: indexName });
      }

      console.log(`🛠️ Creating index "${indexName}" with custom search mappings...`);
      
      const properties: any = {
        id: { type: 'keyword' },
        createdAt: { type: 'date' },
      };

      if (indexName === 'pipeline_prospector') {
        // Pipeline mappings
        properties.leadDrug = { 
          type: 'text', 
          analyzer: 'drug_search_analyzer',
          fields: { keyword: { type: 'keyword' } }
        };
        properties.primaryIndication = { type: 'text', analyzer: 'drug_search_analyzer' };
        properties.mechanismOfAction = { type: 'text', analyzer: 'drug_search_analyzer' };
        properties.developmentPhase = { type: 'keyword' };
        properties.sponsor = { type: 'text', fields: { keyword: { type: 'keyword' } } };
        properties.routeOfAdministration = { type: 'text' };
        properties.country = { type: 'keyword' };
        
        // Add other key columns that we want searchable or filterable
        properties.companyName = { type: 'text' };
        properties.nctNumber = { type: 'keyword' };
        properties.trialStatus = { type: 'keyword' };
        properties.moleculeType = { type: 'keyword' };
        properties.orphanDrugStatus = { type: 'keyword' };
        properties.fastTrackApproval = { type: 'keyword' };
      } else {
        // Patent & Forecasting mappings
        properties.activeIngredient = { 
          type: 'text', 
          analyzer: 'drug_search_analyzer',
          fields: { keyword: { type: 'keyword' } }
        };
        properties.brandName = { 
          type: 'text', 
          analyzer: 'drug_search_analyzer',
          fields: { keyword: { type: 'keyword' } }
        };
        properties.moa = { type: 'text', analyzer: 'drug_search_analyzer' };
        properties.indicationApproved = { type: 'text', analyzer: 'drug_search_analyzer' };
        properties.applicant = { type: 'text', fields: { keyword: { type: 'keyword' } } };
        properties.roa = { type: 'text' };
        properties.country = { type: 'keyword' };
        
        properties.patentNumber = { type: 'keyword' };
        properties.patentExpiryDate = { type: 'keyword' };
      }

      await esClient.indices.create({
        index: indexName,
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
          properties
        },
      });
      console.log(`✅ Index "${indexName}" created.`);
    }

    // 4. Fetch and Index PipelineProspector data
    console.log('📥 Fetching PipelineProspector records from PostgreSQL...');
    const pipelineRecords = await prisma.pipelineProspector.findMany({});
    console.log(`✅ Loaded ${pipelineRecords.length} records.`);

    if (pipelineRecords.length > 0) {
      console.log('📤 Bulk indexing PipelineProspector records...');
      const body = pipelineRecords.flatMap((rec) => [
        { index: { _index: 'pipeline_prospector', _id: rec.id } },
        rec
      ]);
      const bulkResponse = await esClient.bulk({ refresh: true, body });
      if (bulkResponse.errors) {
        console.error('❌ Errors occurred during pipeline bulk indexing:');
      } else {
        console.log(`🎉 Successfully indexed ${pipelineRecords.length} pipeline records!`);
      }
    }

    // 5. Fetch and Index PatentSalesForecasting data
    console.log('📥 Fetching PatentSalesForecasting records from PostgreSQL...');
    const forecastingRecords = await prisma.patentSalesForecasting.findMany({});
    console.log(`✅ Loaded ${forecastingRecords.length} records.`);

    if (forecastingRecords.length > 0) {
      console.log('📤 Bulk indexing PatentSalesForecasting records...');
      const body = forecastingRecords.flatMap((rec) => [
        { index: { _index: 'patent_sales_forecasting', _id: rec.id } },
        rec
      ]);
      const bulkResponse = await esClient.bulk({ refresh: true, body });
      if (bulkResponse.errors) {
        console.error('❌ Errors occurred during forecasting bulk indexing:');
      } else {
        console.log(`🎉 Successfully indexed ${forecastingRecords.length} forecasting records!`);
      }
    }

  } catch (error) {
    console.error('❌ Critical failure during Elasticsearch re-indexing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute reindexing
runReindexing();
