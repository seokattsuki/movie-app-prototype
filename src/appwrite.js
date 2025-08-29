import { Client, Databases, ID, Query } from 'appwrite';

// Appwrite configuration
const client = new Client();

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;

// Check if environment variables are defined
if (!PROJECT_ID) {
  throw new Error('VITE_APPWRITE_PROJECT_ID is not defined in environment variables');
}
if (!ENDPOINT) {
  throw new Error('VITE_APPWRITE_ENDPOINT is not defined in environment variables');
}

client
  .setEndpoint(ENDPOINT) // Your API Endpoint
  .setProject(PROJECT_ID); // Your project ID

const databases = new Databases(client);

export const updateSearchCount = async (searchTerm, movieData) => {
  try {
    // Check if required environment variables exist
    if (!DATABASE_ID || !COLLECTION_ID) {
      console.error('Database ID or Collection ID not configured');
      return;
    }

    // First, try to find existing document for this movie
    try {
      const existingDocs = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('movieId', movieData.id)]
      );

      if (existingDocs.documents.length > 0) {
        // Update existing document
        const existingDoc = existingDocs.documents[0];
        const response = await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID,
          existingDoc.$id,
          {
            searchCount: existingDoc.searchCount + 1,
            lastSearched: new Date().toISOString()
          }
        );
        console.log('Search count updated:', response);
        return response;
      }
    } catch (error) {
      console.log('No existing document found, creating new one');
    }

    // Create new document if none exists
    const searchData = {
      searchTerm: searchTerm,
      movieTitle: movieData.title || movieData.original_title,
      movieId: movieData.id,
      posterPath: movieData.poster_path,
      // Construct full poster URL for trending display
      poster_url: movieData.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` 
        : null,
      title: movieData.title || movieData.original_title,
      searchCount: 1,
      lastSearched: new Date().toISOString()
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      searchData
    );

    console.log('New search document created:', response);
    return response;

  } catch (error) {
    console.error('Error updating search count:', error);
  }
};

export const getTrendingMovies = async () => {
  try {
    // Check if required environment variables exist
    if (!DATABASE_ID || !COLLECTION_ID) {
      console.error('Database ID or Collection ID not configured');
      return [];
    }

    const result = await databases.listDocuments(
      DATABASE_ID, 
      COLLECTION_ID, 
      [
        Query.limit(5),
        Query.orderDesc("searchCount") // Fixed: use searchCount instead of count
      ]
    );

    console.log('Trending movies from DB:', result.documents);
    return result.documents;
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    return []; // Return empty array on error
  }
};

export { client, databases };