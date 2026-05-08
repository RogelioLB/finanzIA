const OPENAI_WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

export async function transcribeAudio(
  audioUri: string,
  apiKey: string
): Promise<string> {
  try {
    const formData = new FormData();
    
    const fileExtension = audioUri.split('.').pop()?.toLowerCase() || 'm4a';
    const mimeType = fileExtension === 'webm' ? 'audio/webm' : 'audio/mp4';
    
    formData.append('file', {
      uri: audioUri,
      type: mimeType,
      name: `audio.${fileExtension}`,
    } as any);
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');
    
    const result = await fetch(OPENAI_WHISPER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });
    
    if (!result.ok) {
      const error = await result.text();
      throw new Error(`Whisper API error: ${error}`);
    }
    
    const data = await result.json();
    return data.text || '';
  } catch (error) {
    console.error('[TranscriptionService] Error:', error);
    throw error;
  }
}

export async function testTranscriptionApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}