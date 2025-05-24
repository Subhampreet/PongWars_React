import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import PongWars from './components/PongWars';

function App() {
  const [count, setCount] = useState(0);

  return (<>
    <PongWars />
  </>);
}

export default App;
