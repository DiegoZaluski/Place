const BASE_URL = 'http://localhost:8001/configs';

export const GetConfigLlm = async (
  idModel: string
): Promise<object | string | null> => {
  try {
    const response = await fetch(`${BASE_URL}/${idModel}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn(`HTTP ${response.status}: ${response.statusText}`);
      return "ERRO GET CONFIG IN - (CurrentConfigLlm)";
    }
    
    const data = await response.json();
    return data.config || data;

  } catch (error) {
    console.error('Failed to fetch config:', error);
    return null;
  }
};