import { useEffect, useState } from 'react';

export default function CommentBox({ sessionId, existingComment, onSave, saving }) {
  const [comment, setComment] = useState(existingComment || '');

  useEffect(() => {
    setComment(existingComment || '');
  }, [existingComment, sessionId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!comment.trim()) {
      return;
    }

    await onSave(sessionId, comment.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <textarea
        rows="3"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        className="input-shell"
        placeholder="Leave coach feedback for this session..."
      />
      <button
        type="submit"
        disabled={saving}
        className="secondary-button disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? 'Saving comment...' : existingComment ? 'Update comment' : 'Add comment'}
      </button>
    </form>
  );
}

