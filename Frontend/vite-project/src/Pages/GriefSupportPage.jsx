import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Volume2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
);

const ArrowLeft = () => (
  <svg width="16" height="16" className="mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);

const ImageIcon = () => (
  <svg width="18" height="18" className="mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);

const Heart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);

const MessageCircle = () => (
  <svg width="18" height="18" className="mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
);

const RitualCard = ({ title, description, steps }) => {
  const [audioState, setAudioState] = React.useState('idle'); // 'idle' | 'playing' | 'paused'
  const utteranceRef = React.useRef(null);

  const getScript = () =>
    `${title}. ${description}. Here are the steps. ` +
    steps.map((s, i) => `Step ${i + 1}. ${s}`).join('. ');

  const handlePlay = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(getScript());
    utter.rate = 0.82;
    utter.pitch = 0.95;
    utter.volume = 1;
    // Prefer a calm female voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && /female|woman|zira|samantha|karen|moira/i.test(v.name));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setAudioState('playing');
    utter.onend = () => setAudioState('idle');
    utter.onpause = () => setAudioState('paused');
    utter.onresume = () => setAudioState('playing');
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setAudioState('playing');
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setAudioState('paused');
  };

  const handleResume = () => {
    window.speechSynthesis.resume();
    setAudioState('playing');
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setAudioState('idle');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>

        {/* Audio Controls */}
        <div className="flex items-center gap-2">
          {audioState === 'playing' && (
            <span className="flex items-end gap-[3px] h-4 mr-1">
              {[1,2,3,4].map(i => (
                <span key={i} className="w-[3px] bg-slate-400 rounded-full animate-bounce"
                  style={{ height: `${6 + (i % 3) * 4}px`, animationDelay: `${i * 0.12}s`, animationDuration: '0.7s' }} />
              ))}
            </span>
          )}

          {audioState === 'idle' && (
            <button
              onClick={handlePlay}
              title="Listen to this ritual"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium rounded-full transition-colors"
            >
              <Volume2 /> Listen
            </button>
          )}

          {audioState === 'playing' && (
            <>
              <button
                onClick={handlePause}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-full border border-amber-200 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                Pause
              </button>
              <button
                onClick={handleStop}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 text-xs font-medium rounded-full border border-rose-200 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                Stop
              </button>
            </>
          )}

          {audioState === 'paused' && (
            <>
              <button
                onClick={handleResume}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium rounded-full transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Resume
              </button>
              <button
                onClick={handleStop}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 text-xs font-medium rounded-full border border-rose-200 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                Stop
              </button>
            </>
          )}
        </div>
      </div>
      <p className="text-gray-600 mb-6 italic">{description}</p>
      <ol className="space-y-4">
        {steps.map((step, idx) => (
          <li key={idx} className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-semibold">
              {idx + 1}
            </span>
            <span className="text-gray-700 leading-relaxed pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};


const GriefSupportPage = () => {
  const navigate = useNavigate();
  const [journalEntry, setJournalEntry] = useState('');
  const [attachedPhoto, setAttachedPhoto] = useState(null); // { url, name, base64 }
  const photoInputRef = useRef(null);

  // Load entries from localStorage on mount
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('memorial_journal_entries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist entries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('memorial_journal_entries', JSON.stringify(entries));
    } catch (e) {
      console.warn('Could not save journal entries to localStorage:', e);
    }
  }, [entries]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedPhoto({ url: ev.target.result, name: file.name });
    };
    reader.readAsDataURL(file); // base64 so it can be saved to localStorage
  };

  const handleSaveEntry = () => {
    if (!journalEntry.trim()) return;
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      text: journalEntry,
      photo: attachedPhoto || null
    };
    setEntries(prev => [newEntry, ...prev]);
    setJournalEntry('');
    setAttachedPhoto(null);
  };

  const handleDeleteEntry = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const rituals = [
    {
      title: "The Empty Leash Walk",
      description: "Retrace a familiar walk, pausing at each spot your dog used to stop and sniff.",
      steps: [
        "Leave your phone and headphones behind.",
        "Take your dog's leash, or just walk with your hands free.",
        "Walk your usual route. Pause wherever your dog would naturally pause, allowing yourself to feel their absence and the memory of their presence."
      ]
    },
    {
      title: "The Thank You Ritual",
      description: "A moment of profound gratitude and connection.",
      steps: [
        "Sit quietly with a photo of your dog.",
        "Place your hand gently over your heart.",
        "Speak aloud or internally, starting with 'Thank you for...' and naming specific memories, quirks, or lessons.",
        "Continue until no more words come."
      ]
    },
    {
      title: "Still Influencing",
      description: "Reflecting on the permanent changes your dog made to your life.",
      steps: [
        "Sit near your dog's bed, favorite spot, or ashes for 10 minutes.",
        "Reflect on what habits, lessons, or ways of being remain with you because of them.",
        "Acknowledge how they are still influencing your life today."
      ]
    },
    {
      title: "The Memory Breath",
      description: "Pairing a calming breath with a cherished memory.",
      steps: [
        "Look at a photo of your dog.",
        "Inhale softly for 4 seconds.",
        "Exhale slowly for 6 seconds.",
        "As you exhale, bring a specific, happy memory to mind. Let the feeling of that memory wash over you."
      ]
    },
    {
      title: "The Legacy Walk",
      description: "Honoring your dog through a small act of kindness in the world.",
      steps: [
        "Dedicate a walk or an action to your dog.",
        "Perform a small act of kindness—picking up trash, helping a neighbor, or making a donation.",
        "Silently or aloud, say: 'My dog made the world better through me.'"
      ]
    },
    {
      title: "The Good Dog Journal",
      description: "A nightly practice of preserving small stories.",
      steps: [
        "Keep a notebook by your bed.",
        "Each night, write down one small memory, quirk, or story about your dog.",
        "Allow this to be a space purely for remembering the good."
      ]
    },
    {
      title: "The Co-Regulation Recall",
      description: "Accessing the felt sense of calm your dog provided.",
      steps: [
        "Close your eyes and find a comfortable position.",
        "Recall the physical sensation of petting your dog or having them rest against you.",
        "Notice the feeling of calm that arises in your body. Breathe into that feeling."
      ]
    },
    {
      title: "The Continuing Bond Meditation",
      description: "A mental space to connect with your dog in peace.",
      steps: [
        "Find a quiet space to sit.",
        "Imagine your dog at peace, completely comfortable and happy.",
        "Repeat a short affirming phrase, such as 'I carry you with me' or 'You are safe, and I am safe.'"
      ]
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-100 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">


            <h1 className="text-4xl md:text-5xl font-light text-slate-800 mb-6 tracking-tight">
              Honoring & Transition
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-6 font-light">
              The death of a dog is one of the most intense grief experiences many people face. This space holds that grief — and the ongoing bond — for as long as you need it.
            </p>
            <div className="inline-block bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
              <p className="text-sm text-slate-500 italic">
                There is no expiration on this section. It remains available to you for as long as you need it.
              </p>
            </div>
          </div>
        </div>

        {/* Core Framing */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
          <div className="bg-stone-50 rounded-2xl p-6 md:p-8 border border-stone-100">
            <p className="text-stone-700 leading-relaxed text-lg font-light">
              Co-regulation is not a technique. It is a way of being with another living creature. And it does not end when the heart stops. This approach focuses on a continuing bond, honoring the permanent changes your dog made to your life, rather than seeking "closure."
            </p>
          </div>
        </div>

        {/* Rituals Section */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <h2 className="text-2xl font-light text-slate-800 mb-8 tracking-tight">Rituals for the Journey</h2>
          
          {rituals.map((ritual, index) => (
            <RitualCard key={index} {...ritual} />
          ))}
        </div>

        {/* Memorial Journal */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-light text-slate-800 mb-2 tracking-tight">Memorial Journal</h2>
            <p className="text-gray-500 mb-6 text-sm">
              A private space to write freeform entries, preserve memories, and honor your dog.
            </p>
            
            <div className="mb-6">
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="What memory is resting on your heart today?"
                className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-300 outline-none resize-y text-gray-700 placeholder-gray-400"
              />
              <div className="flex justify-between items-center mt-3">
                {/* Hidden file input */}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <button
                  onClick={() => photoInputRef.current && photoInputRef.current.click()}
                  className="flex items-center text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  <ImageIcon /> {attachedPhoto ? 'Change Photo' : 'Attach Photo'}
                </button>
                <button 
                  onClick={handleSaveEntry}
                  disabled={!journalEntry.trim()}
                  className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Entry
                </button>
              </div>
              {/* Photo preview */}
              {attachedPhoto && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={attachedPhoto.url} alt="Attached" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
                  <div>
                    <p className="text-xs text-gray-500 truncate max-w-[160px]">{attachedPhoto.name}</p>
                    <button
                      onClick={() => setAttachedPhoto(null)}
                      className="text-xs text-rose-400 hover:text-rose-600 mt-1 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Display local entries */}
            {entries.length > 0 && (
              <div className="space-y-4 mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Past Entries</h3>
                {entries.map(entry => (
                  <div key={entry.id} className="bg-gray-50 rounded-xl p-5 border border-gray-100 relative group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs text-gray-400 font-medium">{entry.date}</p>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        title="Delete entry"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-rose-400 p-1 rounded-full hover:bg-rose-50"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                          <path d="M10 11v6"></path>
                          <path d="M14 11v6"></path>
                          <path d="M9 6V4h6v2"></path>
                        </svg>
                      </button>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{entry.text}</p>
                    {entry.photo && (
                      <img src={entry.photo.url} alt="Memory" className="mt-3 rounded-lg max-h-48 object-cover border border-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Community & Closing Notes */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-300 rounded-full flex items-center justify-center mb-4">
              <Heart />
            </div>
            <p className="text-gray-600 mb-4">
              You do not have to carry this alone. Connect with others who understand this specific loss in our Community.
            </p>
            <button 
              onClick={() => navigate('/community')}
              className="text-slate-600 font-medium hover:text-slate-900 flex items-center transition-colors"
            >
              <MessageCircle />
              Go to Community Support
            </button>
          </div>

          <div className="border-t border-gray-200 pt-12 max-w-xl mx-auto">
            <p className="text-stone-500 text-sm leading-relaxed italic">
              When you are ready, the platform also offers resources for welcoming a new dog. This is never a replacement, but a new relationship.
            </p>
          </div>
          
        </div>
      </div>
    </>
  );
};

export default GriefSupportPage;
