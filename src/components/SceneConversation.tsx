import { useMemo, useState } from 'react';
import type { Event } from '../data/types';
import { factById } from '../data/facts';
import Conversation from './Conversation';
import { VoiceButton } from './Voice';
export default function SceneConversation({
  scene,
  onClose,
}: {
  scene: Event;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<'intro' | 'choice' | 'response'>(
    scene.dialogue ? 'intro' : 'response',
  );
  const [picked, setPicked] = useState<number | null>(null);
  const lines = useMemo(() => {
    const facts = scene.factIds.map((id) => ({
      speaker: "Franklin's journal",
      text: factById[id].details,
      emphasis: factById[id].answer,
      sourcePages: factById[id].sourcePages,
    }));
    if (!scene.dialogue) return facts;
    const d = scene.dialogue;
    if (stage === 'intro')
      return [{ speaker: d.speaker, text: d.line, sourcePages: scene.sourcePages }];
    return [
      {
        speaker: 'Narrator',
        text: `${d.options[d.actual]} ${d.significance}`,
        sourcePages: scene.sourcePages,
      },
      ...facts,
    ];
  }, [scene, stage]);
  return (
    <div className="scene-conversation">
      {scene.dialogue && <small className="dialogue-paraphrase">Source paraphrase</small>}
      {stage === 'choice' && scene.dialogue ? (
        <div className="conversation-choice">
          <h3>{scene.dialogue.reply}</h3>
          <VoiceButton
            text={`${scene.dialogue.reply} ${scene.dialogue.options.map((option, i) => `${String.fromCharCode(65 + i)}. ${option}`).join('. ')}`}
            auto
          />
          <div className="platform-replies">
            {scene.dialogue.options.map((option, i) => (
              <button
                key={option}
                onClick={() => {
                  setPicked(i);
                  setStage('response');
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {picked !== null && scene.dialogue && (
            <small className="dialogue-reaction">
              {picked === scene.dialogue.actual
                ? 'That is how the exchange went.'
                : 'Here is how the exchange went.'}
            </small>
          )}
          <Conversation
            key={stage}
            lines={lines}
            onFinish={stage === 'intro' ? () => setStage('choice') : onClose}
            finishLabel={stage === 'intro' ? 'Your reply' : 'Back to game'}
          />
        </>
      )}
    </div>
  );
}
