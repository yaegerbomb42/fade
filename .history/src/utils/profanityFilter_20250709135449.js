// src/utils/profanityFilter.js

const profanityWords = [
  // Common profanity - you can expand this list
  'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard', 'crap',
  'piss', 'dick', 'cock', 'pussy', 'whore', 'slut', 'fag', 'nigger',
  'retard', 'gay', 'homo', 'lesbian', 'tranny', 'chink', 'spic',
  // Add more as needed
];

export const getProfanityFilterSetting = () => {
  return localStorage.getItem('fade-profanity-filter') === 'true';
};

export const setProfanityFilterSetting = (enabled) => {
  localStorage.setItem('fade-profanity-filter', enabled.toString());
};

export const filterProfanity = (text) => {
  if (!getProfanityFilterSetting()) {
    return text; // Return original text if filter is disabled
  }

  let filteredText = text;
  
  profanityWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const replacement = '*'.repeat(word.length);
    filteredText = filteredText.replace(regex, replacement);
  });

  return filteredText;
};
