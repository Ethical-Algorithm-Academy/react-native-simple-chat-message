import { supabase } from '../lib/supabase';
import { generateUUID, getFileExtension } from './chatUtils';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const uploadFileToSupabase = async (file, channelId) => {
  try {
    console.log('Uploading file:', file);
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    });

    // Generate UUID and get file extension
    const uuid = generateUUID();
    const fileExt = getFileExtension(file.name);
    
    // Create organized path: channels/[channelId]/[uuid].[ext]
    const filePath = `channels/${channelId}/${uuid}.${fileExt}`;
    console.log('Upload path:', filePath);

    const { data, error } = await supabase.storage
      .from('simple-chat-bucket')
      .upload(filePath, formData, {
        contentType: file.mimeType || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', JSON.stringify(error, null, 2));
      throw error;
    }
    console.log('Upload success:', data);
    return {
      filePath,
      fileType: file.mimeType,
      fileName: file.name
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export async function fileUriToBlob(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
} 