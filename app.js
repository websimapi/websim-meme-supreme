const room = new WebsimSocket();

function App() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState(null);
  const cards = React.useSyncExternalStore(
    room.collection('meme_card').subscribe,
    room.collection('meme_card').getList
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
          prompt: `Generate a meme card with both a caption and an image description. The caption should be funny and meme-worthy, while the image description should be detailed enough to generate a funny/absurd meme image. Keep the image description relatively simple and focused on clear subjects.

          interface Response {
            caption: string;
            imageDescription: string;
            type: "FORMAT" | "CAPTION";
          }

          {
            "caption": "Me pretending to understand the meeting after zoning out for 20 minutes",
            "imageDescription": "confused cat wearing business suit at desk",
            "type": "FORMAT"
          }
          `,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate card content');
      }

      const cardData = await response.json();
      
      await room.collection('meme_card').create({
        caption: cardData.caption,
        imageDescription: cardData.imageDescription,
        type: cardData.type
      });

    } catch (error) {
      console.error('Error generating card:', error);
      setError('Failed to generate card. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderImage = (card) => {
    try {
      return (
        <img
          key={card.id}
          id={`img-${card.id}`}
          src={`https://images.websim.ai/1024x1024/${encodeURIComponent(card.imageDescription)}`}
          alt={card.imageDescription}
          onError={(e) => {
            e.target.onerror = null;  // Prevent infinite retry loop
            e.target.src = `https://placehold.co/600x400/333/white?text=${encodeURIComponent('Failed to load image')}`;
          }}
        />
      );
    } catch (e) {
      console.error('Error rendering image:', e);
      return (
        <div className="error-image">
          Failed to load image
        </div>
      );
    }
  };

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
        <div className="loading">Generating new meme card...</div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="cards-container">
        {cards.map((card) => (
          <div key={card.id} className="card">
            {renderImage(card)}
            <div className="card-text">
              <strong>{card.type === 'FORMAT' ? '🖼️ Format Card' : '📝 Caption Card'}</strong>
              <p>{card.caption}</p>
              <small style={{color: '#888'}}>Created by: {card.username}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));