import { Routes, Route } from 'react-router-dom';
import '../index.css';
import Chat from './components/layout/Chat/Chat';
import Home from './components/layout/Home/Home';
import LogoBox from './components/shared/LogoBox';
import N8NPage from './components/shared/N8NPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/workflows" element={<N8NPage/>}/>
      </Routes>
    </div>
  );
}

export default App;
