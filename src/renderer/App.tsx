import icon from '../../assets/icon.svg';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useContext,
  createContext,
} from 'react';
import Loader from './Loader';
import MainPanel from './MainPanel';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/themes/lara-light-cyan/theme.css';
import 'primeicons/primeicons.css';
import { ServiceProvider } from './serviceProvider';
import { loadConfig } from './imp/service';
export default function App() {
  const [cfg, setCfg] = useState("D:\\work\\root\\atest.json");
  const [config, setConfig] = useState()

  useEffect(()=>{
    if(!cfg){
      return
    }
    loadConfig(cfg)
    .then(res=>{
      console.log('config loaded', res)
      setConfig(res)
    })


  }, [cfg])

  return (
    <ServiceProvider>
      <PrimeReactProvider>
        {config ? <Loader config={config} /> : <MainPanel onSelect={setCfg} />}
      </PrimeReactProvider>
    </ServiceProvider>
  );
}
