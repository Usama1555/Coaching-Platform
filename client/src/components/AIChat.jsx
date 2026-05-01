import { useEffect, useRef, useState } from 'react';
import { getAIHistory, sendAIMessage } from '../api/ai';

function formatTimestamp(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString();
}

export default function AIChat({ clientId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      if (!clientId) {
        if (mounted) {
          setError('Client profile is not linked to this account yet.');
          setLoadingHistory(false);
        }
        return;
      }

      try {
        const response = await getAIHistory(clientId);

        if (mounted) {
          setMessages(response.messages || []);
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.response?.data?.message || 'Unable to load AI history right now.');
        }
      } finally {
        if (mounted) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [clientId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!input.trim() || sending) {
      return;
    }

    const optimisticMessage = {
      _id: `pending-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setInput('');
    setSending(true);
    setError('');

    try {
      const response = await sendAIMessage({ message: optimisticMessage.content });
      setMessages(response.messages || []);
    } catch (requestError) {
      setMessages((current) => current.filter((message) => message._id !== optimisticMessage._id));
      setError(requestError.response?.data?.message || 'Unable to reach the AI assistant right now.');
      setInput(optimisticMessage.content);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass-panel p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">AI Coach</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Ask training and nutrition questions</h2>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="mt-6 h-[28rem] space-y-4 overflow-y-auto rounded-[1.75rem] border border-white/10 bg-slate-950/35 p-4">
        {loadingHistory ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            Loading chat history...
          </div>
        ) : messages.length ? (
          messages.map((message) => (
            <div
              key={message._id || `${message.role}-${message.createdAt}`}
              className={`max-w-3xl rounded-3xl px-5 py-4 text-sm leading-6 ${
                message.role === 'assistant'
                  ? 'mr-auto border border-white/10 bg-white/8 text-slate-100'
                  : 'ml-auto border border-coral/30 bg-coral/15 text-white'
              }`}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-slate-300">
                {message.role === 'assistant' ? 'AI Coach' : 'You'}
              </p>
              <p className="mt-3 whitespace-pre-wrap">{message.content}</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                {formatTimestamp(message.createdAt)}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm leading-6 text-slate-300">
            Start the conversation with a training, nutrition, or recovery question. The assistant uses your client context to answer more specifically.
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="ai-message" className="mb-2 block text-sm font-medium text-slate-200">
            Message
          </label>
          <textarea
            id="ai-message"
            rows="4"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="input-shell"
            placeholder="Ask about progressive overload, recovery, calories, protein targets, or your current plan..."
          />
        </div>
        <button
          type="submit"
          disabled={sending || loadingHistory}
          className="primary-button disabled:cursor-not-allowed disabled:opacity-70"
        >
          {sending ? 'Thinking...' : 'Send message'}
        </button>
      </form>
    </div>
  );
}
