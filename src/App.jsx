import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './global/AppProvider';
import '../style/styles.css';
import '../style/colors.css';
import '../style/theme.css';
import '../style/fonts.css';
import Chat from './components/layout/Chat/Chat';
import Home from './components/layout/Home/Home';
import CustomUI from "./components/layout/CustomModel/CustomUI";
import SearchAnime from './components/shared/Animations/SearchAnime';


function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/custom" element={<CustomUI />} />
          <Route path="/models" element={<SearchAnime />} />
        </Routes>
      </div>
    </AppProvider>
  );
}

export default App;
