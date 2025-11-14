interface FavoriteResponse {
  success: boolean;
  data?: {
    apiIds: string[];
    apis: any[];
  };
  error?: string;
}

interface FavoriteActionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Fetch user's favorite APIs
 */
export async function getUserFavorites(userAddress: string): Promise<FavoriteResponse> {
  try {
    // Use absolute URL to ensure proper routing
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/api/favorites/${userAddress.toLowerCase()}`;

    console.log('Fetching favorites from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // Check if we got HTML instead of JSON (404 page)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('API route not found - received HTML response');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch favorites',
    };
  }
}

/**
 * Add an API to user's favorites
 */
export async function addFavorite(apiId: string, userAddress: string): Promise<FavoriteActionResponse> {
  try {
    const baseUrl = window.location.origin;
    const requestBody = {
      apiId,
      userAddress: userAddress.toLowerCase(),
    };

    console.log('Adding favorite with request body:', requestBody);
    const response = await fetch(`${baseUrl}/api/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error('API Error Response:', errorData);
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding favorite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add favorite',
    };
  }
}

/**
 * Remove an API from user's favorites
 */
export async function removeFavorite(apiId: string, userAddress: string): Promise<FavoriteActionResponse> {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/favorites?apiId=${apiId}&userAddress=${userAddress.toLowerCase()}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error('API Error Response:', errorData);
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error removing favorite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove favorite',
    };
  }
}

/**
 * Check if an API is favorited by the user
 */
export function isApiFavorited(apiId: string, favoriteApiIds: string[]): boolean {
  return favoriteApiIds.includes(apiId);
}