import { Document } from 'langchain/document';
import { BaseDocumentLoader } from 'langchain/document_loaders';
import { readFile } from 'fs/promises';

export class customTXTLoader extends BaseDocumentLoader {
  constructor(public filePath: string) {
    super();
  }

  public async load(): Promise<Document[]> {
    const buffer = await readFile(this.filePath);
    return [
      new Document({
        pageContent: buffer.toString(),
        metadata: { source: this.filePath },
      }),
    ];
  }
}
