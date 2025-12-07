import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './global/AppProvider';
import '../style/styles.css';
import '../style/colors.css';
import '../style/theme.css';
import '../style/fonts.css';
import Chat from './components/layout/Chat/Chat';
import Home from './components/layout/Home/Home';
import CustomUI from "./components/layout/CustomModel/CustomUI";
import Control from "./components/layout/Control/Control";


function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-n-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/custom" element={<CustomUI />} />
          <Route path="/models" element={<Control />} />
        </Routes>
      </div>
    </AppProvider>
  );
}

export default App;
