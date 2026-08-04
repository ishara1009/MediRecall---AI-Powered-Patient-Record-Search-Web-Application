export const chatService = {
  ask: async (question) => {
    return fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    }).then((res) => res.json());
  }
};
