'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const VehicleContext = createContext<any>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const [userCars, setUserCars] = useState<any[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  // Load from local storage on start
  useEffect(() => {
    const saved = localStorage.getItem('user_garage');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUserCars(parsed);
      if (parsed.length > 0) setSelectedCarId(parsed[0].id);
    }
  }, []);

  // Use the name 'setSelectedCar' so your buttons work!
  const setSelectedCar = (id: string) => {
    setSelectedCarId(id);
    localStorage.setItem('active_car', id);
  };

const addCar = (carObj: any) => {
  const updated = [...userCars, { ...carObj, instanceId: Date.now() }];
  setUserCars(updated);
  setSelectedCarId(carObj.id);
  localStorage.setItem('user_garage', JSON.stringify(updated));
};

  return (
    <VehicleContext.Provider value={{ 
      userCars, 
      selectedCarId, 
      setSelectedCar, // This fixes the function error
      addCar 
    }}>
      {children}
    </VehicleContext.Provider>
  );
}

export const useVehicle = () => useContext(VehicleContext);