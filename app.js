const room = new WebsimSocket();

function App() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const cards = React.useSyncExternalStore(
    room.collection('meme_card').subscribe,
    room.collection('meme_card').getList
  );

  const generateNewCard = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate a meme card with both a caption and an image description. The caption should be funny and meme-worthy, while the image description should be detailed enough to generate a funny/absurd meme image. Keep the image description concise but descriptive, focusing on key visual elements.

          interface Response {
            caption: string;
            imageDescription: string;
            type: "FORMAT" | "CAPTION";
          }

          {
            "caption": "Me pretending to understand the meeting after zoning out for 20 minutes",
            "imageDescription": "confused cat wearing business suit at desk with scattered papers",
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
      alert('Failed to generate card. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const MemeCard = ({ card }) => {
    const [imageError, setImageError] = React.useState(false);
    const imageUrl = `https://image.websim.ai/dalle/${encodeURIComponent(card.imageDescription)}`;

    return (
      <div className="card">
        {!imageError ? (
          <img
            src={imageUrl}
            alt={card.imageDescription}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="image-error">
            <span>⚠️ Image failed to load</span>
            <small>{card.imageDescription}</small>
          </div>
        )}
        <div className="card-text">
          <strong>{card.type === 'FORMAT' ? '🖼️ Format Card' : '📝 Caption Card'}</strong>
          <p>{card.caption}</p>
          <small style={{color: '#888'}}>Created by: {card.username}</small>
        </div>
      </div>
    );
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

      <div className="cards-container">
        {cards.map((card) => (
          <MemeCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));