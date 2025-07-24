export function getRandomChannelName() {
    const adjectives = ["Cool", "Fun", "Secret", "Chill", "Epic", "Quick", "Smart", "Happy"];
    const nouns = ["Group", "Squad", "Team", "Chat", "Room", "Circle", "Crew", "Club"];
  
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
    return `${adj} ${noun}`;
  }