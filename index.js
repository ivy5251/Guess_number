import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

const h = React.createElement;

// --- Helpers ---

// Check if a string has 4 distinct digits
const isValidNumber = (num) => {
  if (!/^\d{4}$/.test(num)) return false;
  const digits = new Set(num.split(''));
  return digits.size === 4;
};

// Generate all valid 4-digit distinct numbers (5040 total)
const generateAllPossibilities = () => {
  const result = [];
  for (let i = 0; i < 10000; i++) {
    const s = i.toString().padStart(4, '0');
    if (isValidNumber(s)) {
      result.push(s);
    }
  }
  return result;
};

// Calculate A and B
const calculateAB = (secret, guess) => {
  let a = 0;
  let b = 0;
  for (let i = 0; i < 4; i++) {
    if (guess[i] === secret[i]) {
      a++;
    } else if (secret.includes(guess[i])) {
      b++;
    }
  }
  return { a, b };
};

// Generate a random 4 distinct digit number
const generateSecretNumber = () => {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let result = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    result += digits[randomIndex];
    digits.splice(randomIndex, 1);
  }
  return result;
};

// --- Components ---

const Menu = ({ onSelectMode }) => {
  return h('div', { className: "flex flex-col items-center justify-center h-full p-6 space-y-8 max-w-md mx-auto w-full" },
    h('div', { className: "text-center space-y-2" },
      h('h1', { className: "text-4xl font-bold text-indigo-600 tracking-tight" }, "1A2B Master"),
      h('p', { className: "text-slate-500" }, "The Classic Code-Breaking Game")
    ),

    h('div', { className: "grid gap-4 w-full" },
      h('button', {
        onClick: () => onSelectMode('computer-guessing'),
        className: "group relative w-full bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-xl shadow-lg transition-all hover:shadow-xl text-left"
      },
        h('div', { className: "flex items-center justify-between" },
          h('div', null,
            h('h3', { className: "text-xl font-bold" }, "Computer Guesses"),
            h('p', { className: "text-indigo-200 text-sm mt-1" }, "You think of a number, Computer guesses instantly.")
          ),
          h('span', { className: "text-3xl opacity-80 group-hover:scale-110 transition-transform" }, "⚡️")
        )
      ),

      h('button', {
        onClick: () => onSelectMode('user-guessing'),
        className: "group relative w-full bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 p-6 rounded-xl shadow-sm transition-all hover:border-indigo-300 text-left"
      },
        h('div', { className: "flex items-center justify-between" },
          h('div', null,
            h('h3', { className: "text-xl font-bold" }, "Player Guesses"),
            h('p', { className: "text-slate-500 text-sm mt-1" }, "Computer thinks of a number, you try to guess it.")
          ),
          h('span', { className: "text-3xl opacity-80 group-hover:scale-110 transition-transform" }, "👤")
        )
      )
    ),
    
    h('div', { className: "text-xs text-slate-400 text-center max-w-xs" },
      h('p', null, "Rules: The secret number has 4 distinct digits (0-9)."),
      h('p', null, "'A' = Correct digit, correct position."),
      h('p', null, "'B' = Correct digit, wrong position.")
    )
  );
};

// --- Computer Guessing Mode (Pure Logic) ---
const ComputerGuessingGame = ({ onBack }) => {
  const [history, setHistory] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [currentGuess, setCurrentGuess] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [feedbackA, setFeedbackA] = useState(0);
  const [feedbackB, setFeedbackB] = useState(0);
  const [error, setError] = useState(null);

  // Initialize Candidates and First Guess
  useEffect(() => {
    const all = generateAllPossibilities();
    setCandidates(all);
    // Pick a random first guess
    const firstGuess = all[Math.floor(Math.random() * all.length)];
    setCurrentGuess(firstGuess);
  }, []);

  const handleSubmitFeedback = () => {
    if (!currentGuess) return;

    // Validate Inputs
    if (feedbackA + feedbackB > 4) {
      setError("A + B cannot be greater than 4!");
      return;
    }
    setError(null);

    // Game Over Check
    if (feedbackA === 4) {
      setGameOver(true);
      setHistory([...history, { guess: currentGuess, a: 4, b: 0 }]);
      return;
    }

    // 1. Update History
    const newHistory = [...history, { guess: currentGuess, a: feedbackA, b: feedbackB }];
    setHistory(newHistory);

    // 2. Local Elimination Logic (Instant)
    // Filter the current pool of candidates. 
    // We keep candidates that would produce the SAME A/B result if they were the secret.
    const nextCandidates = candidates.filter(candidate => {
      // Assume 'candidate' is the secret number.
      // Does 'currentGuess' produce 'feedbackA' and 'feedbackB' against it?
      const { a, b } = calculateAB(candidate, currentGuess);
      return a === feedbackA && b === feedbackB;
    });

    setCandidates(nextCandidates);

    if (nextCandidates.length === 0) {
      setError("Impossible! Please check your previous feedback.");
      setGameOver(true); // Technically a forfeit due to error
      return;
    }

    // 3. Pick Next Guess
    // Simple Strategy: Pick random from remaining possibilities
    const nextGuessIndex = Math.floor(Math.random() * nextCandidates.length);
    const nextGuessStr = nextCandidates[nextGuessIndex];
    
    setCurrentGuess(nextGuessStr);

    // 4. Reset UI
    setFeedbackA(0);
    setFeedbackB(0);
  };

  return h('div', { className: "flex flex-col h-full max-w-2xl mx-auto w-full p-4" },
    // Header
    h('div', { className: "flex items-center justify-between mb-6" },
      h('button', { onClick: onBack, className: "text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-1" }, "← Back"),
      h('h2', { className: "text-lg font-bold text-indigo-700" }, "Computer Guesses"),
      h('div', { className: "bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-mono font-medium" },
          `${candidates.length} possibilities`
      ) 
    ),

    // Game Area
    h('div', { className: "flex-grow overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar" },
      history.map((turn, idx) => (
        h('div', { key: idx, className: "flex items-center justify-between bg-white border border-slate-100 p-3 rounded-lg shadow-sm opacity-80" },
          h('span', { className: "text-slate-400 font-mono text-sm" }, `#${idx + 1}`),
          h('span', { className: "font-mono text-xl tracking-widest text-slate-700" }, turn.guess),
          h('span', { className: `font-bold font-mono ${turn.a === 4 ? 'text-green-600' : 'text-orange-500'}` },
            `${turn.a}A${turn.b}B`
          )
        )
      )),
      h('div', { ref: (el) => el?.scrollIntoView({ behavior: 'smooth' }) })
    ),

    // Active Turn UI
    h('div', { className: "bg-white border-t border-slate-200 p-6 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" },
      gameOver ? (
        h('div', { className: "text-center space-y-4" },
          error ? (
            h(React.Fragment, null,
                h('div', { className: "text-5xl" }, "😵‍💫"),
                h('h3', { className: "text-xl font-bold text-red-600" }, "Contradiction!"),
                h('p', { className: "text-slate-600 text-sm" }, error)
            )
          ) : (
            h(React.Fragment, null,
                h('div', { className: "text-5xl animate-bounce" }, "🎉"),
                h('h3', { className: "text-2xl font-bold text-slate-800" }, "I got it!"),
                h('p', { className: "text-slate-600" }, `It took me ${history.length} attempts.`)
            )
          ),
          h('button', { 
            onClick: onBack,
            className: "bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors"
          }, "Menu")
        )
      ) : (
        h('div', { className: "space-y-6" },
          h('div', { className: "text-center" },
            h('p', { className: "text-xs uppercase tracking-wide text-slate-400 mb-2 font-bold" }, "My Guess"),
            h('div', { className: "text-6xl font-mono font-bold text-indigo-600 tracking-[0.2em] ml-4" }, currentGuess)
          ),

          currentGuess && h('div', { className: "space-y-4" },
            h('div', { className: "grid grid-cols-2 gap-4 sm:gap-8" },
              // A Selector
              h('div', { className: "space-y-2" },
                h('label', { className: "block text-xs font-bold text-center text-slate-500 uppercase" }, "A (Correct Place)"),
                h('div', { className: "flex justify-center gap-1 flex-wrap" },
                  [0, 1, 2, 3, 4].map(num => (
                    h('button', {
                      key: `a-${num}`,
                      onClick: () => setFeedbackA(num),
                      className: `w-10 h-10 rounded-full font-bold transition-all ${
                        feedbackA === num 
                          ? 'bg-green-500 text-white scale-110 shadow-md ring-2 ring-green-200' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`
                    }, num)
                  ))
                )
              ),

              // B Selector
              h('div', { className: "space-y-2" },
                h('label', { className: "block text-xs font-bold text-center text-slate-500 uppercase" }, "B (Wrong Place)"),
                h('div', { className: "flex justify-center gap-1 flex-wrap" },
                  [0, 1, 2, 3, 4].map(num => (
                    h('button', {
                      key: `b-${num}`,
                      onClick: () => setFeedbackB(num),
                      className: `w-10 h-10 rounded-full font-bold transition-all ${
                        feedbackB === num 
                          ? 'bg-orange-400 text-white scale-110 shadow-md ring-2 ring-orange-200' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`
                    }, num)
                  ))
                )
              )
            ),
            
            error && h('div', { className: "text-red-500 text-sm text-center animate-pulse font-medium" }, error),

            h('button', {
              onClick: handleSubmitFeedback,
              className: "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            },
              h('span', null, "Confirm"),
              h('span', { className: "text-indigo-300 text-sm font-normal" }, "(Instant)")
            )
          )
        )
      )
    )
  );
};

// --- User Guessing Mode (Classic) ---
const UserGuessingGame = ({ onBack }) => {
  const [secret, setSecret] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [input, setInput] = useState('');
  const [won, setWon] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSecret(generateSecretNumber());
  }, []);

  const handleGuess = (e) => {
    if (e) e.preventDefault();
    if (input.length !== 4) return;
    
    if (!isValidNumber(input)) {
      setError("Please enter 4 distinct digits (no duplicates).");
      return;
    }
    setError(null);

    const { a, b } = calculateAB(secret, input);
    const newGuess = { guess: input, a, b };
    setGuesses([...guesses, newGuess]);
    setInput('');

    if (a === 4) {
      setWon(true);
    }
  };

  return h('div', { className: "flex flex-col h-full max-w-2xl mx-auto w-full p-4" },
    // Header
    h('div', { className: "flex items-center justify-between mb-6" },
      h('button', { onClick: onBack, className: "text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-1" }, "← Back"),
      h('h2', { className: "text-lg font-bold text-slate-800" }, "Player Guesses"),
      h('div', { className: "w-12" }) 
    ),

    // History
    h('div', { className: "flex-grow overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar" },
      guesses.length === 0 && h('div', { className: "text-center text-slate-400 mt-20" },
         h('div', { className: "text-6xl mb-4" }, "❓"),
         h('p', null, "I have a secret 4-digit number."),
         h('p', null, "Can you guess it?")
      ),
      guesses.map((turn, idx) => (
        h('div', { key: idx, className: "flex items-center justify-between bg-white border border-slate-200 p-4 rounded-lg shadow-sm" },
          h('span', { className: "text-slate-400 font-mono text-sm" }, `#${idx + 1}`),
          h('span', { className: "font-mono text-xl tracking-widest text-slate-800" }, turn.guess),
          h('span', { className: `font-bold font-mono ${turn.a === 4 ? 'text-green-600' : 'text-orange-500'}` },
            `${turn.a}A${turn.b}B`
          )
        )
      )),
      h('div', { ref: (el) => el?.scrollIntoView({ behavior: 'smooth' }) })
    ),

    // Input Area
    h('div', { className: "bg-white border-t border-slate-200 p-6 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" },
      won ? (
         h('div', { className: "text-center space-y-4" },
            h('div', { className: "text-5xl animate-bounce" }, "🏆"),
            h('h3', { className: "text-2xl font-bold text-slate-800" }, "You Won!"),
            h('p', { className: "text-slate-600" }, "The number was ", h('span', { className: "font-mono font-bold" }, secret)),
            h('button', { 
              onClick: onBack,
              className: "bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors"
            }, "Play Again")
        )
      ) : (
        h('form', { onSubmit: handleGuess, className: "space-y-4" },
           h('input', {
              type: "text",
              inputMode: "numeric",
              maxLength: 4,
              value: input,
              onChange: (e) => {
                  setInput(e.target.value);
                  if (error) setError(null);
              },
              placeholder: "Enter 4 digits...",
              className: `w-full text-center text-3xl font-mono tracking-[0.5em] p-4 border-2 rounded-xl focus:ring-0 outline-none transition-colors placeholder-slate-200 text-slate-800 ${error ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}`,
              autoFocus: true
            }),
            error && h('div', { className: "text-red-500 text-sm text-center font-medium animate-pulse" }, error),
            h('button', {
              type: "submit",
              disabled: input.length !== 4,
              className: "w-full bg-slate-900 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
            }, "Guess")
        )
      )
    )
  );
};


const App = () => {
  const [mode, setMode] = useState('menu');

  return h(React.Fragment, null,
    mode === 'menu' && h(Menu, { onSelectMode: setMode }),
    mode === 'computer-guessing' && h(ComputerGuessingGame, { onBack: () => setMode('menu') }),
    mode === 'user-guessing' && h(UserGuessingGame, { onBack: () => setMode('menu') })
  );
};

const root = createRoot(document.getElementById('root'));
root.render(h(App));