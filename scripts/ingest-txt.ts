import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { pinecone } from '@/utils/pinecone-client';
import { DirectoryLoader } from 'langchain/document_loaders';
import { BaseDocumentLoader } from 'langchain/document_loaders';
import { Document } from 'langchain/document';
import { readFile } from 'fs/promises';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';

/* Name of directory to retrieve your files from */
const filePath = 'docs';

class customTxtLoader extends BaseDocumentLoader {
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

export const run = async () => {
  try {
    /*load raw docs from all the .txt files in the directory*/
    const directoryLoader = new DirectoryLoader(filePath, {
      '.txt': (path) => new customTxtLoader(path),
    });

    const rawDocs = await directoryLoader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log('split docs', docs);

    console.log('creating vector store...');
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();
    const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

    //embed the text documents
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAME_SPACE,
      textKey: 'text',
    });
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();
