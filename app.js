const { useState, useEffect } = React;

// Simpel storage implementation
window.storage = {
    get: async (key) => {
        const value = localStorage.getItem(key);
        return value ? { key, value, shared: false } : null;
    },
    set: async (key, value) => {
        localStorage.setItem(key, value);
        return { key, value, shared: false };
    },
    delete: async (key) => {
        localStorage.removeItem(key);
        return { key, deleted: true, shared: false };
    },
    list: async (prefix) => {
        const keys = Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix));
        return { keys, prefix, shared: false };
    }
};

// SVG Icons som komponenter
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ResetIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

function StrengthTrainingTracker() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [exercises, setExercises] = useState([]);
  const [newExercise, setNewExercise] = useState('');
  const [currentWeek, setCurrentWeek] = useState('');
  const [loading, setLoading] = useState(true);

  // ⚠️ VIGTIGT: SKIFT DETTE PASSWORD FØR DU UDGIVER! ⚠️
  const correctPassword = "2312";

  // Tjek om bruger allerede er logget ind
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      const week = getWeekNumber(new Date());
      setCurrentWeek(week);
      loadData(week);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('auth', 'true');
      const week = getWeekNumber(new Date());
      setCurrentWeek(week);
      loadData(week);
      setPasswordInput('');
    } else {
      alert('Forkert password!');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('auth');
  };

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
  };

  const loadData = async (week) => {
    setLoading(true);
    try {
      const result = await window.storage.get(`exercises-${week}`);
      if (result && result.value) {
        setExercises(JSON.parse(result.value));
      } else {
        const prevWeekResult = await window.storage.get('exercises-template');
        if (prevWeekResult && prevWeekResult.value) {
          const template = JSON.parse(prevWeekResult.value);
          const newWeekExercises = template.map(ex => ({ ...ex, completed: false }));
          setExercises(newWeekExercises);
        }
      }
    } catch (error) {
      console.log('Ingen gemt data fundet');
    }
    setLoading(false);
  };

  const saveData = async () => {
    try {
      await window.storage.set(`exercises-${currentWeek}`, JSON.stringify(exercises));
      await window.storage.set('exercises-template', JSON.stringify(exercises));
      alert('✓ Data gemt!');
    } catch (error) {
      alert('Fejl ved gemning af data');
      console.error('Save error:', error);
    }
  };

  const addExercise = () => {
    if (newExercise.trim()) {
      setExercises([...exercises, { 
        id: Date.now(), 
        name: newExercise.trim(), 
        completed: false 
      }]);
      setNewExercise('');
    }
  };

  const toggleExercise = (id) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, completed: !ex.completed } : ex
    ));
  };

  const deleteExercise = (id) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const resetWeek = () => {
    if (confirm('Er du sikker på at du vil nulstille alle øvelser?')) {
      setExercises(exercises.map(ex => ({ ...ex, completed: false })));
    }
  };

  const completedCount = exercises.filter(ex => ex.completed).length;
  const progress = exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;

  // Login skærm
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <div className="text-blue-600">
                <LockIcon />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">💪 Styrketræning</h1>
            <p className="text-gray-600">Log ind for at fortsætte</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Indtast dit password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Log ind
            </button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Vigtigt:</strong> Husk at ændre passwordet i app.js før du udgiver siden!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Indlæser...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">💪 Styrketræning</h1>
              <p className="text-gray-600">Uge {currentWeek.split('-W')[1]}, {currentWeek.split('-W')[0]}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Log ud
            </button>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Fremskridt</span>
              <span>{completedCount} / {exercises.length} øvelser</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Tilføj øvelse</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newExercise}
              onChange={(e) => setNewExercise(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addExercise()}
              placeholder="F.eks. Bænkpres, Squats, Dødløft..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addExercise}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
            >
              <PlusIcon />
              Tilføj
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Mine øvelser</h2>
            <button
              onClick={resetWeek}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2 text-sm"
            >
              <ResetIcon />
              Nulstil uge
            </button>
          </div>
          
          {exercises.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen øvelser tilføjet endnu</p>
          ) : (
            <div className="space-y-2">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition ${
                    exercise.completed
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={exercise.completed}
                    onChange={() => toggleExercise(exercise.id)}
                    className="w-6 h-6 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <span
                    className={`flex-1 text-lg ${
                      exercise.completed
                        ? 'line-through text-gray-500'
                        : 'text-gray-800'
                    }`}
                  >
                    {exercise.name}
                  </span>
                  <button
                    onClick={() => deleteExercise(exercise.id)}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={saveData}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl hover:from-green-600 hover:to-green-700 transition shadow-lg flex items-center justify-center gap-2 text-lg font-semibold"
        >
          <SaveIcon />
          Gem træningsdata
        </button>

        <p className="text-center text-gray-600 text-sm mt-4">
          Du er logget ind. Data gemmes til din browser.
        </p>
      </div>
    </div>
  );
}

ReactDOM.render(<StrengthTrainingTracker />, document.getElementById('root'));
