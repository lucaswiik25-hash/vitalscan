export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const match = String(dataUrl).match(/^data:(.*?);base64,(.+)$/);
      resolve({
        base64: match?.[2] || '',
        mediaType: match?.[1] || file.type || 'image/jpeg',
        dataUrl,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
