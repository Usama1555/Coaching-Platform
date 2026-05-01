import { Link } from 'react-router-dom';
import AIChat from '../../components/AIChat';
import { useAuth } from '../../hooks/useAuth';

export default function AIAssistant() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">AI Assistant</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Your science-based coach between check-ins.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Ask about training, nutrition, recovery, overload decisions, and adherence. The assistant answers with your client context in mind.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/client" className="secondary-button">
              Back to dashboard
            </Link>
            <Link to="/client/progress" className="secondary-button">
              View progress
            </Link>
          </div>
        </div>
      </section>

      <AIChat clientId={user?.clientProfileId} />
    </div>
  );
}
