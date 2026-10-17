import {
  Shipment,
  SourcingRequest,
  TrackingLog,
  User,
  Vehicle,
} from "./types";

export type VehicleRecord = Omit<Vehicle, "shipment" | "trackingLogs">;

export interface StoreState {
  users: User[];
  vehicles: VehicleRecord[];
  shipments: Shipment[];
  trackingLogs: TrackingLog[];
  sourcingRequests: SourcingRequest[];
}

export const SEED_USERS: User[] = [
  {
    id: "user-admin-1",
    name: "Ada Okafor",
    email: "ada.okafor@modfemautos.africa",
    role: "ADMIN",
  },
  {
    id: "user-customer-1",
    name: "Tunde Balogun",
    email: "tunde.balogun@example.com",
    role: "CUSTOMER",
  },
];

export const SEED_VEHICLES: VehicleRecord[] = [
  {
    id: "mercedes-amg-gle53",
    vin: "4JGFB4KE1NA123456",
    name: "2022 Mercedes-AMG GLE 53",
    year: 2022,
    make: "Mercedes-AMG",
    model: "GLE 53 4MATIC+",
    basePriceCAD: 54_800,
    location: "Ontario, Canada",
    status: "AVAILABLE",
    specs: {
      engine: "3.0L Inline-6 Turbo + EQ Boost",
      mileageKm: 18_400,
      drivetrain: "4MATIC+ AWD",
      exteriorColor: "Obsidian Black Metallic",
    },
    frontImageUrl:
      "https://images.unsplash.com/photo-1773866796453-27ced06f8984?auto=format&fit=crop&w=2000&q=85",
    rearImageUrl:
      "https://images.unsplash.com/photo-1767373926801-833d96b26c73?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1773866796453-27ced06f8984?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "bmw-x7-m60i",
    vin: "5UX53DP04P9L12345",
    name: "2023 BMW X7 M60i",
    year: 2023,
    make: "BMW",
    model: "X7 M60i",
    basePriceCAD: 68_500,
    location: "Mid-Atlantic — En Route to Lagos",
    status: "IN_TRANSIT",
    specs: {
      engine: "4.4L V8 Twin-Turbo",
      mileageKm: 9_200,
      drivetrain: "xDrive AWD",
      exteriorColor: "Carbon Black Metallic",
    },
    frontImageUrl:
      "https://images.unsplash.com/photo-1731988666894-482242ceae2f?auto=format&fit=crop&w=2000&q=85",
    rearImageUrl:
      "https://images.unsplash.com/photo-1731988666769-ed4dabc44d53?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1731988666894-482242ceae2f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "range-rover-autobiography-p530",
    vin: "SALGS2SE0NA234567",
    name: "2022 Range Rover Autobiography P530",
    year: 2022,
    make: "Land Rover",
    model: "Range Rover Autobiography P530",
    basePriceCAD: 79_900,
    location: "British Columbia, Canada",
    status: "RESERVED",
    ownerId: "user-customer-1",
    specs: {
      engine: "4.4L V8 Twin-Turbo",
      mileageKm: 12_100,
      drivetrain: "Permanent All-Wheel Drive",
      exteriorColor: "Santorini Black",
    },
    frontImageUrl:
      "https://images.unsplash.com/photo-1653641305372-a084f9b78858?auto=format&fit=crop&w=2000&q=85",
    rearImageUrl:
      "https://images.unsplash.com/photo-1758545241974-ea76f6e8edfa?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1653641305372-a084f9b78858?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "lexus-rx350-fsport",
    vin: "2T2HZMDA8MC345678",
    name: "2021 Lexus RX 350 F-Sport",
    year: 2021,
    make: "Lexus",
    model: "RX 350 F-Sport",
    basePriceCAD: 42_300,
    location: "Quebec, Canada",
    status: "AVAILABLE",
    specs: {
      engine: "3.5L V6",
      mileageKm: 31_500,
      drivetrain: "AWD",
      exteriorColor: "Caviar Black",
    },
    frontImageUrl:
      "https://images.unsplash.com/photo-1753030148206-4f6cd95e7512?auto=format&fit=crop&w=2000&q=85",
    rearImageUrl:
      "https://images.unsplash.com/photo-1753030148276-75f09f40e6d9?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1753030148206-4f6cd95e7512?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "toyota-land-cruiser-300",
    vin: "JTMHY7AJ9ND456789",
    name: "2022 Toyota Land Cruiser 300",
    year: 2022,
    make: "Toyota",
    model: "Land Cruiser 300 VX-R",
    basePriceCAD: 85_200,
    location: "Tin Can Island Port, Lagos",
    status: "CLEARING",
    specs: {
      engine: "3.5L V6 Twin-Turbo",
      mileageKm: 14_700,
      drivetrain: "Full-Time 4WD",
      exteriorColor: "Black Onyx",
    },
    frontImageUrl:
      "https://images.unsplash.com/photo-1753030505007-98ceef668415?auto=format&fit=crop&w=2000&q=85",
    rearImageUrl:
      "https://images.unsplash.com/photo-1753030148324-d42f168825ef?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1753030505007-98ceef668415?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "honda-accord-touring",
    vin: "1HGCV1F34MA567890",
    name: "2021 Honda Accord Touring 2.0T",
    year: 2021,
    make: "Honda",
    model: "Accord Touring 2.0T",
    basePriceCAD: 33_800,
    location: "Ontario, Canada",
    status: "AVAILABLE",
    specs: {
      engine: "2.0L Turbo I4",
      mileageKm: 28_900,
      drivetrain: "FWD",
      exteriorColor: "Crystal Black Pearl",
    },
    frontImageUrl:
      "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=2000&q=85",
    rearImageUrl:
      "https://images.unsplash.com/photo-1626621394541-b9a48e35a95d?auto=format&fit=crop&w=2000&q=85",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=600&q=80",
  },
];

export const SEED_SHIPMENTS: Shipment[] = [
  {
    id: "shipment-bmw-x7-m60i",
    vehicleId: "bmw-x7-m60i",
    shippingMethod: "RoRo",
    vesselName: "Grande Lagos",
    bookingNumber: "GRIM-LAG-88213",
    departurePort: "Halifax, Canada",
    arrivalPort: "Tin Can Island, Lagos",
    departureDate: "2026-09-29",
    etaLagos: "2026-10-24",
    customsDutyNGN: 28_300_000,
    clearingFeeNGN: 1_250_000,
    billOfLadingVerified: true,
  },
  {
    id: "shipment-toyota-land-cruiser-300",
    vehicleId: "toyota-land-cruiser-300",
    shippingMethod: "Container",
    vesselName: "MSC Praia",
    bookingNumber: "MSC-APJ-40417",
    departurePort: "Montreal, Canada",
    arrivalPort: "Tin Can Island, Lagos",
    departureDate: "2026-09-02",
    etaLagos: "2026-09-28",
    customsDutyNGN: 35_100_000,
    clearingFeeNGN: 1_250_000,
    billOfLadingVerified: true,
  },
];

export const SEED_TRACKING_LOGS: TrackingLog[] = [
  {
    id: "log-bmw-1",
    vehicleId: "bmw-x7-m60i",
    milestone: "PURCHASED_CANADA",
    title: "Vehicle Purchased",
    location: "Calgary, Alberta",
    description: "Purchase completed and ownership transferred to Modfem Autos.",
    timestamp: "2026-09-18T14:00:00Z",
    completed: true,
  },
  {
    id: "log-bmw-2",
    vehicleId: "bmw-x7-m60i",
    milestone: "EXPORT_INSPECTION",
    title: "Export Inspection Passed",
    location: "Calgary, Alberta",
    description: "Pre-export condition and VIN verification inspection passed.",
    timestamp: "2026-09-22T09:30:00Z",
    completed: true,
  },
  {
    id: "log-bmw-3",
    vehicleId: "bmw-x7-m60i",
    milestone: "AT_PORT_HALIFAX",
    title: "Arrived at Port of Halifax",
    location: "Halifax, Nova Scotia",
    description: "Vehicle received at terminal and staged for RoRo loading.",
    timestamp: "2026-09-27T11:15:00Z",
    completed: true,
  },
  {
    id: "log-bmw-4",
    vehicleId: "bmw-x7-m60i",
    milestone: "ON_VESSEL_ATLANTIC",
    title: "Loaded Aboard Grande Lagos",
    location: "Mid-Atlantic",
    description: "Vessel Grande Lagos departed Halifax, en route to Lagos.",
    timestamp: "2026-09-29T20:00:00Z",
    completed: true,
  },
  {
    id: "log-bmw-5",
    vehicleId: "bmw-x7-m60i",
    milestone: "ARRIVED_LAGOS_PORT",
    title: "Arrival at Tin Can Island",
    location: "Tin Can Island, Lagos",
    description: "Awaiting vessel arrival and berth allocation.",
    timestamp: "2026-10-24T00:00:00Z",
    completed: false,
  },
  {
    id: "log-ltc-1",
    vehicleId: "toyota-land-cruiser-300",
    milestone: "PURCHASED_CANADA",
    title: "Vehicle Purchased",
    location: "Montreal, Quebec",
    description: "Purchase completed and ownership transferred to Modfem Autos.",
    timestamp: "2026-08-20T10:00:00Z",
    completed: true,
  },
  {
    id: "log-ltc-2",
    vehicleId: "toyota-land-cruiser-300",
    milestone: "EXPORT_INSPECTION",
    title: "Export Inspection Passed",
    location: "Montreal, Quebec",
    description: "Pre-export condition and VIN verification inspection passed.",
    timestamp: "2026-08-25T13:45:00Z",
    completed: true,
  },
  {
    id: "log-ltc-2b",
    vehicleId: "toyota-land-cruiser-300",
    milestone: "AT_PORT_HALIFAX",
    title: "Drayage & Port Reception",
    location: "Montreal, Quebec",
    description: "Vehicle received at Port of Montreal terminal, staged for container loading.",
    timestamp: "2026-08-29T09:00:00Z",
    completed: true,
  },
  {
    id: "log-ltc-3",
    vehicleId: "toyota-land-cruiser-300",
    milestone: "ON_VESSEL_ATLANTIC",
    title: "Loaded Aboard MSC Praia",
    location: "Mid-Atlantic",
    description: "Vessel MSC Praia departed Montreal, en route to Lagos.",
    timestamp: "2026-09-02T18:00:00Z",
    completed: true,
  },
  {
    id: "log-ltc-4",
    vehicleId: "toyota-land-cruiser-300",
    milestone: "ARRIVED_LAGOS_PORT",
    title: "Arrived at Tin Can Island",
    location: "Tin Can Island, Lagos",
    description: "Vessel discharged; vehicle offloaded to bonded terminal.",
    timestamp: "2026-09-28T07:20:00Z",
    completed: true,
  },
  {
    id: "log-ltc-5",
    vehicleId: "toyota-land-cruiser-300",
    milestone: "CUSTOMS_CLEARANCE",
    title: "Customs Clearance in Progress",
    location: "Tin Can Island, Lagos",
    description: "Nigerian Customs Service assessing duty against Form M and bill of lading.",
    timestamp: "2026-10-03T12:00:00Z",
    completed: false,
  },
];

export const SEED_SOURCING_REQUESTS: SourcingRequest[] = [
  {
    id: "SR-2026-7K2Q",
    createdAt: "2026-10-01T09:15:00Z",
    status: "NEW",
    buyer: {
      name: "Folarin Adeyemi",
      email: "folarin.adeyemi@example.com",
      phone: "+234 802 410 7731",
    },
    vehicleSpec: {
      year: 2022,
      make: "Porsche",
      model: "Cayenne Coupe",
      trimOrColor: "GTS trim, Jet Black Metallic preferred",
      maxMileageKm: 40_000,
    },
    financials: {
      totalBudgetNGN: 88_000_000,
      maxBidCAD: 50_352,
      shippingMethod: "RoRo",
      destinationPort: "Tin Can Island",
      exchangeRateUsed: 1180,
    },
    dealerNotes: "Buyer based in Victoria Island — flexible on exact trim if spec and mileage match.",
  },
  {
    id: "SR-2026-4M8T",
    createdAt: "2026-10-06T14:40:00Z",
    status: "SOURCING_AT_AUCTION",
    buyer: {
      name: "Zainab Bello",
      email: "zainab.bello@example.com",
      phone: "+234 705 118 2264",
    },
    vehicleSpec: {
      year: 2021,
      make: "Toyota",
      model: "Highlander XSE",
      trimOrColor: "Celestial Silver Metallic, dark interior",
      maxMileageKm: 55_000,
    },
    financials: {
      totalBudgetNGN: 46_000_000,
      maxBidCAD: 25_020,
      shippingMethod: "Container",
      destinationPort: "Apapa",
      exchangeRateUsed: 1180,
    },
    dealerNotes: "Buyer based in Abuja — two auction leads identified at ADESA Montreal, pending condition report.",
  },
];

export const SEED_STATE: StoreState = {
  users: SEED_USERS,
  vehicles: SEED_VEHICLES,
  shipments: SEED_SHIPMENTS,
  trackingLogs: SEED_TRACKING_LOGS,
  sourcingRequests: SEED_SOURCING_REQUESTS,
};

export function cloneSeed(): StoreState {
  return JSON.parse(JSON.stringify(SEED_STATE)) as StoreState;
}
