import { Routes, Route } from 'react-router-dom';
import '../index.css';
import Chat from './components/layout/Chat';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<Chat />} />
      </Routes>
    </div>
  );
}

export default App;
