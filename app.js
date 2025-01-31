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
          prompt: `Generate a meme card with both a caption and an image description. The caption should be funny and meme-worthy, while the image description should be detailed enough to generate a funny/absurd meme image.

          interface Response {
            caption: string;
            imageDescription: string;
            type: "FORMAT" | "CAPTION"; // FORMAT cards are meme templates, CAPTION cards are player submissions
          }

          {
            "caption": "Me pretending to understand the meeting after zoning out for 20 minutes",
            "imageDescription": "A confused cat wearing business attire sitting at a desk with papers scattered everywhere, pretending to take notes while clearly having no idea what's happening",
            "type": "FORMAT"
          }
          `,
        }),
      });

      const cardData = await response.json();
      
      await room.collection('meme_card').create({
        caption: cardData.caption,
        imageDescription: cardData.imageDescription,
        type: cardData.type
      });

    } catch (error) {
      console.error('Error generating card:', error);
    } finally {
      setIsGenerating(false);
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

      <div className="cards-container">
        {cards.map((card) => (
          <div key={card.id} className="card">
            <img
              id={`img-${card.id}`}
              src={`https://images.websim.ai/1024x1024/${encodeURIComponent(card.imageDescription)}`}
              alt={card.imageDescription}
            />
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