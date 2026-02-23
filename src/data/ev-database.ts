// src/data/ev-database.ts

export const EV_BRANDS = ["Tata", "MG", "Mahindra", "Hyundai", "Maruti Suzuki"];

export const EV_MODELS: Record<string, any> = {
  Tata: [
    { id: "nexon-ev", name: "Nexon EV", charger: "CCS2", battery: "45kWh" },
    { id: "punch-ev", name: "Punch EV", charger: "CCS2", battery: "35kWh" },
    { id: "curvv-ev", name: "Curvv EV", charger: "CCS2", battery: "55kWh" },
  ],
  MG: [
    { id: "windsor-ev", name: "Windsor EV", charger: "CCS2", battery: "38kWh" },
    { id: "comet-ev", name: "Comet EV", charger: "Type 2", battery: "17.3kWh" },
  ],
  Mahindra: [
    { id: "xuv 7XO-ev", name: "XUV 7XO.ev", charger: "CCS2", battery: "80kWh" },
  ],
  Hyundai: [
    { id: "creta-ev", name: "Creta EV", charger: "CCS2", battery: "45kWh" },
  ],
  "Maruti Suzuki": [
    { id: "evx", name: "eVX", charger: "CCS2", battery: "60kWh" },
  ]
};

// Add this below your EV_MODELS export
export interface ChargingStation {
  id: string;
  name: string;
  location: [number, number]; // [Latitude, Longitude]
  address: string;
  operator?: string;
  hostType?: "public" | "private";
  connectors: {
    type: "CCS2" | "Type 2" | "CHAdeMO";
    power: string; // e.g., "50kW"
    status: "available" | "busy" | "offline";
    price: string;
  }[];
}

export const CHARGING_STATIONS: ChargingStation[] = [
  {
    id: "station-1",
    name: "Tata Power EZ Charge",
    location: [28.6139, 77.2090], // New Delhi Example
    address: "Connaught Place, New Delhi",
    operator: "Tata Power",
    connectors: [
      { type: "CCS2", power: "50kW", status: "available", price: "₹18/kWh" },
      { type: "Type 2", power: "22kW", status: "busy", price: "₹15/kWh" }
    ]
  },
  {
    id: "station-2",
    name: "Jio-bp Pulse Hub",
    location: [19.0760, 72.8777], // Mumbai Example
    address: "BKC, Mumbai",
    operator: "Jio-bp",
    connectors: [
      { type: "CCS2", power: "60kW", status: "available", price: "₹22/kWh" }
    ]
  },
  {
    id: "station-3",
    name: "Statiq Charging Station",
    location: [12.9716, 77.5946], // Bangalore Example
    address: "MG Road, Bangalore",
    operator: "Statiq",
    connectors: [
      { type: "CCS2", power: "30kW", status: "offline", price: "₹16/kWh" }
    ]
  },


];
export const CHANDIGARH_STATIONS = [
  {
    id: "pub-relux-34",
    name: "Relux Station",
    location: [30.7225, 76.7678], // Sector 34
    address: "Piccadilly Mall, Sector 34, Chandigarh",
    type: "public",
    connectors: [{ type: "CCS2", power: "120kW", price: "₹18/kWh", status: "available" }]
  },
  {
    id: "pub-statiq-elante",
    name: "Statiq Hub",
    location: [30.7056, 76.8013], // Elante Mall
    address: "Nexus Elante Mall, Basement 2",
    type: "public",
    connectors: [{ type: "CCS2", power: "120kW", price: "₹21/kWh", status: "available" }]
  },
  {
    id: "pub-glida-tribune",
    name: "GLIDA Hub",
    location: [30.7050, 76.7900], // Near Tribune Chowk
    address: "Sector 31-B, near Tribune Chowk",
    type: "public",
    connectors: [{ type: "CCS2", power: "60kW", price: "₹19/kWh", status: "busy" }]
  },
  {
    id: "pub-tata-ind",
    name: "Mercedes-Benz (Tata)",
    location: [30.7025, 76.7850], // Industrial Area Ph II
    address: "Plot No. 40, Industrial Area Phase II",
    type: "public",
    connectors: [{ type: "CCS2", power: "180kW", price: "₹24/kWh", status: "available" }]
  }
];