import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home/Home';
import RoomPage from './components/Room/RoomPage';
import './index.css';

/**
 * App — root component with routing.
 *
 * Routes:
 *   /              → Home (create or join room)
 *   /room/:roomId  → Room page (collaborative editor)
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}
