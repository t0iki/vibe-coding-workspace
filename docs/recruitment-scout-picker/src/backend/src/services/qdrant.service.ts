import axios from 'axios';

interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, any>;
}

interface SearchResult {
  id: string;
  score: number;
  payload: Record<string, any>;
}

export class QdrantService {
  private baseUrl: string;
  private collectionName: string;
  
  constructor(baseUrl: string, collectionName: string) {
    this.baseUrl = baseUrl;
    this.collectionName = collectionName;
  }

  async createCollection(vectorSize: number): Promise<void> {
    try {
      await axios.put(
        `${this.baseUrl}/collections/${this.collectionName}`,
        {
          vectors: {
            size: vectorSize,
            distance: 'Cosine'
          }
        }
      );
    } catch (error: any) {
      if (error.response?.status !== 409) { // 409 = already exists
        console.error('Error creating collection:', error);
        throw error;
      }
    }
  }

  async upsertPoint(point: QdrantPoint): Promise<void> {
    try {
      await axios.put(
        `${this.baseUrl}/collections/${this.collectionName}/points`,
        {
          points: [
            {
              id: point.id,
              vector: point.vector,
              payload: point.payload
            }
          ]
        }
      );
    } catch (error) {
      console.error('Error upserting point:', error);
      throw error;
    }
  }

  async upsertPoints(points: QdrantPoint[]): Promise<void> {
    try {
      await axios.put(
        `${this.baseUrl}/collections/${this.collectionName}/points`,
        {
          points: points.map(point => ({
            id: point.id,
            vector: point.vector,
            payload: point.payload
          }))
        }
      );
    } catch (error) {
      console.error('Error upserting points:', error);
      throw error;
    }
  }

  async searchSimilar(
    vector: number[], 
    limit: number = 10,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/collections/${this.collectionName}/points/search`,
        {
          vector,
          limit,
          filter,
          with_payload: true
        }
      );

      return response.data.result.map((item: any) => ({
        id: item.id,
        score: item.score,
        payload: item.payload
      }));
    } catch (error) {
      console.error('Error searching similar vectors:', error);
      throw error;
    }
  }

  async deletePoint(id: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/collections/${this.collectionName}/points/delete`,
        {
          points: [id]
        }
      );
    } catch (error) {
      console.error('Error deleting point:', error);
      throw error;
    }
  }

  async getCollectionInfo(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/collections/${this.collectionName}`
      );
      return response.data.result;
    } catch (error) {
      console.error('Error getting collection info:', error);
      throw error;
    }
  }
}