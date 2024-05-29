
import icon from '../../assets/icon.svg';
import { useCallback, useEffect, useRef, useState, useContext,createContext } from 'react';
import Loader from './Loader';
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import 'primeicons/primeicons.css';
import { ServiceProvider } from './serviceProvider';
export default function App() {

  return (
    <ServiceProvider>
      <PrimeReactProvider>
        <Loader/>
      </PrimeReactProvider>
    </ServiceProvider>
  );
}
