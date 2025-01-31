const room = new WebsimSocket();

function MemeCard({ card }) {
  const imageUrl = `https://images.websim.ai/1024x1024/${encodeURIComponent(card.imageDescription)}`;
  
  return (
    <div className="card">
      <img
        id={`img-${card.id}`}
        src={imageUrl}
        alt={card.imageDescription}
        loading="lazy"
      />
      <div className="card-text">
        <strong>{card.type}</strong>
        <p>{card.caption}</p>
        <small style={{color: '#888'}}>ID: {card.id}</small>
      </div>
    </div>
  );
}

function App() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  // Use React.useSyncExternalStore for more reliable state management
  const cards = React.useSyncExternalStore(
    React.useCallback((callback) => room.collection('meme_card').subscribe(callback), []),
    React.useCallback(() => room.collection('meme_card').getList(), [])
  );

  const generateNewCard = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate a meme card with both a caption and an image description. The caption should be funny and meme-worthy, while the image description should be detailed enough to generate a funny/absurd meme image. The type should be a creative category name for this specific meme (e.g. "Confused Professional", "Gaming Moment", "Pet Logic", etc).

          interface Response {
            caption: string;
            imageDescription: string;
            type: string;
          }

          Example response:
          {
            "caption": "Me pretending to understand the meeting after zoning out for 20 minutes",
            "imageDescription": "A confused cat wearing business attire sitting at a desk with papers scattered everywhere, pretending to take notes while clearly having no idea what's happening",
            "type": "Office Space Chaos"
          }
          `,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate card');
      }

      const cardData = await response.json();
      
      // Create new card in database
      await room.collection('meme_card').create({
        caption: cardData.caption,
        imageDescription: cardData.imageDescription,
        type: cardData.type,
        created_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating card:', error);
      setError('Failed to generate card. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Sort cards by creation date, newest first
  const sortedCards = React.useMemo(() => {
    return [...cards].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [cards]);

  return (
    <div>
      <h1>🎮 Meme Supreme</h1>
      <div style={{textAlign: 'center', marginBottom: '20px'}}>
        <button 
          className="generate-btn"
          onClick={generateNewCard}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate New Card'}
        </button>
      </div>
      
      {isGenerating && (
        <div className="loading">
          🎲 Generating new meme card...
        </div>
      )}

      {error && (
        <div className="error">{error}</div>
      )}

      <div className="cards-container">
        {sortedCards.map((card) => (
          <MemeCard key={card.id} card={card} />
        ))}
        {sortedCards.length === 0 && !isGenerating && (
          <div className="no-cards">
            No cards yet! Click the generate button to create your first meme card.
          </div>
        )}
      </div>
    </div>
  );
}

// Create the root and render the app
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);