import { BigQuery, Table, TableSchema } from '@google-cloud/bigquery';
import fs from 'fs/promises';
import tmp from 'tmp';
import { Visitor } from '../model';

const schema: TableSchema = {
  fields: [
    { name: 'clientId', type: 'string', mode: 'REQUIRED' },
    { name: 'lastModified', type: 'integer', mode: 'REQUIRED' },
    { name: 'couponGroup', type: 'string' },
    { name: 'eventCounts', type: 'string' },
  ],
};

const visitorToSchema = (visitor: Visitor) => ({
  clientId: visitor.clientId,
  lastModified: visitor.lastModified,
  couponGroup: visitor.group,
  eventCounts: JSON.stringify(visitor.eventCounts),
});
const stringify = (data: any) => JSON.stringify(data);

class BigQueryService {
  private readonly bq = new BigQuery();

  private createTempFile() {
    console.log('BigQueryService.createTempFile');
    return new Promise<string>((resolve, reject) =>
      tmp.file((err, path) => (err ? reject(err) : resolve(path)))
    );
  }

  private async writeVisitorsToTempFile(visitors: Visitor[]) {
    console.log('BigQueryService.writeVisitorsToTempFile', visitors.length);
    const file = await this.createTempFile();
    console.log('BigQueryService.writeVisitorsToTempFile#file', file);
    const contents = visitors.map(visitorToSchema).map(stringify).join('\n');
    console.log(
      'BigQueryService.writeVisitorsToTempFile#contents',
      contents.length
    );
    await fs.writeFile(file, contents, { encoding: 'utf-8' });
    console.log('BigQueryService.writeVisitorsToTempFile', 'done');
    return file;
  }

  private async mergeNewData(tempTable: Table) {
    console.log('BigQueryService.mergeNewData', tempTable.id);
    const dataset = tempTable.dataset;
    const archiveTable = dataset.table('firestore');
    console.log('BigQueryService.mergeNewData#archiveTable', archiveTable.id);
    const archiveTableExists = await archiveTable.exists();
    if (!archiveTableExists) {
      console.log('BigQueryService.mergeNewData', 'created archive table');
      await archiveTable.create({ schema });
    } else {
      console.log('BigQueryService.mergeNewData', 'archive table exists');
    }
    const mergeQuery = `
        MERGE \`${dataset.id}.${archiveTable.id}\` AS o
        USING \`${dataset.id}.${tempTable.id}\` AS n
        ON o.clientId = n.clientId
        WHEN MATCHED THEN
          UPDATE SET
            lastModified = n.lastModified,
            couponGroup = n.couponGroup,
            eventCounts = n.eventCounts
        WHEN NOT MATCHED THEN
          INSERT(clientId, lastModified, couponGroup, eventCounts)
          VALUES(n.clientId, n.lastModified, n.couponGroup, n.eventCounts)
        ;
    `;
    console.log('BigQueryService.mergeNewData#mergeQuery', mergeQuery);

    return this.bq.query(mergeQuery);
  }

  private async uploadToBigQuery(visitors: Visitor[]) {
    const dataset = this.bq.dataset('behco');

    console.log('BigQueryService.uploadToBigQuery', visitors.length);
    const tempFile = await this.writeVisitorsToTempFile(visitors);
    console.log('BigQueryService.uploadToBigQuery#tempFile', tempFile);
    const tempTable = dataset.table('firestore_temp');
    console.log('BigQueryService.uploadToBigQuery#tempTable', tempTable);
    await tempTable.load(tempFile, {
      sourceFormat: 'NEWLINE_DELIMITED_JSON',
      schema,
      createDisposition: 'CREATE_IF_NEEDED',
      writeDisposition: 'WRITE_TRUNCATE',
    });
    console.log('BigQueryService.uploadToBigQuery', 'done loading to bq');
    await Promise.all([fs.rm(tempFile), this.mergeNewData(tempTable)]);
  }

  async persistVisitors(visitors: Visitor[]) {
    console.log('BigQueryService.persistVisitors', visitors.length);
    if (!visitors.length) {
      return;
    }
    await this.uploadToBigQuery(visitors);
  }
  async retrieveVisitor(clientId: string) {
    console.log('BigQueryService.retrieveVisitor', clientId);
    const fields = schema.fields!.map((field) => field.name).join(',');
    const query = `SELECT ${fields} FROM \`behco.firestore\` WHERE clientId = "${clientId}"`;
    console.log('BigQueryService.retrieveVisitor#query', query);
    const rows = await this.bq.query(query);
    if (rows.length && rows[0].length) {
      console.log('BigQueryService.retrieveVisitor#rows', JSON.stringify(rows));
      const record = rows[0][0];
      console.log(
        'BigQueryService.retrieveVisitor#record',
        JSON.stringify(record)
      );
      const visitor: Visitor = {
        clientId: record['clientId'],
        lastModified: record['lastModified'],
        group: record['couponGroup'],
        eventCounts: JSON.parse(record['eventCounts']),
      };
      console.log(
        'BigQueryService.retrieveVisitor#record',
        JSON.stringify(visitor)
      );
      return visitor;
    }
  }
}

export const longtermDatabase = new BigQueryService();
