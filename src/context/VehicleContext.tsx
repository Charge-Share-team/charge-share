'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const VehicleContext = createContext<any>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const [userCars, setUserCars] = useState<any[]>([]);
  const [selectedCar, setSelectedCarState] = useState<string>('nexon');

  // Load from localStorage on start
  useEffect(() => {
    const saved = localStorage.getItem('user_garage');
    const activeCar = localStorage.getItem('active_car');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUserCars(parsed);
    }
    if (activeCar) {
      setSelectedCarState(activeCar);
    }
  }, []);

  const setSelectedCar = (id: string) => {
    setSelectedCarState(id);
    localStorage.setItem('active_car', id);
  };

  const addCar = (carObj: any) => {
    const updated = [...userCars, { ...carObj, instanceId: Date.now() }];
    setUserCars(updated);
    setSelectedCarState(carObj.id);
    localStorage.setItem('user_garage', JSON.stringify(updated));
    localStorage.setItem('active_car', carObj.id);
  };

  return (
    <VehicleContext.Provider value={{
      userCars,
      selectedCar,   // ✅ fixed: was 'selectedCarId'
      setSelectedCar,
      addCar
    }}>
      {children}
    </VehicleContext.Provider>
  );
}

export const useVehicle = () => useContext(VehicleContext);