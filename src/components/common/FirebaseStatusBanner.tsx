import React, { useState } from 'react';
import { Database, CheckCircle2, Info, ChevronRight, X, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';

export const FirebaseStatusBanner: React.FC = () => {
  const { isFirebase } = useAuth();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const envSample = `# Firebase Client Configuration
VITE_FIREBASE_API_KEY="AIzaSyYourActualApiKeyHere"
VITE_FIREBASE_AUTH_DOMAIN="your-app-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-app-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (dismissed && isFirebase) return null;

  return (
    <>
      <div
        className={`px-4 py-2 text-[13px] transition-colors border-b ${
          isFirebase
            ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
            : 'bg-blue-600/8 text-blue-950 dark:text-blue-200 border-blue-500/15'
        }`}
      >
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            {isFirebase ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <span className="truncate">
              {isFirebase ? (
                <strong className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Live Firebase Firestore & Auth Active.
                </strong>
              ) : (
                <>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Demo Persistent Storage Mode:</span>{' '}
                  <span className="hidden sm:inline">Operating with pre-seeded university data. Ready for Firebase credentials.</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isFirebase && (
              <button
                onClick={() => setShowGuide(true)}
                className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 hover:underline py-0.5"
              >
                <span>Setup Guide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {isFirebase && (
              <button
                onClick={() => setDismissed(true)}
                className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        title="Firebase Configuration & Architecture Guide"
        description="Connect JSTU Campus directly to your Google Cloud Firestore and Firebase Auth project"
        maxWidth="xl"
      >
        <div className="space-y-5 text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200/70 dark:border-blue-900/50">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1.5 flex items-center gap-2 text-base">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Production Architecture Prepared
            </h4>
            <p className="text-sm leading-relaxed">
              JSTU Campus includes complete Firebase services for <strong>Auth</strong>, <strong>Firestore</strong>, and <strong>Storage</strong>, alongside <code>firestore.rules</code> and <code>storage.rules</code>. In this preview, it falls back to local persistent storage so all student and admin modules work immediately.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-base">Step 1: Obtain Firebase Web Keys</h4>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-sm">
              <li>Open <span className="font-mono text-blue-600 dark:text-blue-400">console.firebase.google.com</span> and create a new project.</li>
              <li>Enable <strong>Authentication</strong> (Email/Password provider).</li>
              <li>Enable <strong>Cloud Firestore</strong> (Production mode, using the included <span className="font-mono">firestore.rules</span>).</li>
              <li>Enable <strong>Firebase Storage</strong> (using the included <span className="font-mono">storage.rules</span>).</li>
              <li>Register a Web App (<code>&lt;/&gt;</code>) and copy the configuration keys.</li>
            </ol>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-base">Step 2: Add Keys to .env</h4>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Template'}
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto font-mono text-[13px] leading-relaxed border border-slate-800">
              {envSample}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5 text-base">Step 3: Initializing the First Administrator</h4>
            <p className="text-sm leading-relaxed">
              Per strict security requirements, students cannot self-appoint administrative privileges during registration. To grant admin access to a user, set <code>role: 'admin'</code> in their Firestore <code>users/{'{uid}'}</code> document or use the Admin Student Management panel.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setShowGuide(false)}
              className="jstu-btn-primary"
            >
              Close Guide
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
