import {
  BuilderContext,
  BuilderOutput,
  createBuilder
} from '@angular-devkit/architect';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AzureDeployBuilderSchema } from './schema';
import { BlobServiceClient } from '@azure/storage-blob';

// Load the .env file if it exists
import * as dotenv from "dotenv";
dotenv.config();

export function runBuilder(
  options: AzureDeployBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  return Observable.create(async observer => {
    try {
      // Create Blob Service Client from Account connection string or SAS connection string
      // Account connection string example - `DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=accountKey;EndpointSuffix=core.windows.net`
      // SAS connection string example - `BlobEndpoint=https://myaccount.blob.core.windows.net/;QueueEndpoint=https://myaccount.queue.core.windows.net/;FileEndpoint=https://myaccount.file.core.windows.net/;TableEndpoint=https://myaccount.table.core.windows.net/;SharedAccessSignature=sasString`
      const STORAGE_CONNECTION_STRING =
        process.env.STORAGE_CONNECTION_STRING || '';
      // Note - Account connection string can only be used in node.
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        STORAGE_CONNECTION_STRING
      );

      let i = 1;
      for await (const container of blobServiceClient.listContainers()) {
        console.log(`Container ${i++}: ${container.name}`);
      }

      // Create a container
      const containerName = `newcontainer${new Date().getTime()}`;
      const containerClient = blobServiceClient.getContainerClient(
        containerName
      );

      const createContainerResponse = await containerClient.create();
      console.log(
        `Create container ${containerName} successfully`,
        createContainerResponse.requestId
      );

      // Delete container
      await containerClient.delete();

      console.log('deleted container');
      observer.next({ success: true });
      observer.complete();
    } catch (err) {
      observer.error('Error running sample:', err.message);
    }
  }).pipe(
    tap(() => {
      context.logger.info('Builder ran for azure-deploy');
    })
  );
}

export default createBuilder(runBuilder);
