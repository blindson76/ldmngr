

import { useCallback, useEffect, useRef, useState, useContext,createContext } from 'react';
import { ServiceHandler } from '../main/preload';

const ServiceContext = createContext<ServiceHandler>(window.service);

const ServiceProvider = ({children}) => {
  return (
    <ServiceContext.Provider value={window.service}>{children}</ServiceContext.Provider>
  )
}
export{
  ServiceProvider
}
export function useApi(){
  return useContext(ServiceContext)

}
