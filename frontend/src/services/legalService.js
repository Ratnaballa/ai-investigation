import api from './api';

export const legalService = {
  async recommend(caseDescription, language = 'en') {
    const { data } = await api.post('/legal/recommend', {
      case_description: caseDescription,
      language,
    });
    return data;
  },
};
