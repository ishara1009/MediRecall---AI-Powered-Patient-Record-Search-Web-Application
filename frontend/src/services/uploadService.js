export const uploadService = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/upload`, {
      method: 'POST',
      body: formData
    }).then((res) => res.json());
  }
};
