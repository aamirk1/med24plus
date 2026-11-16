export interface MedicineCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  itemCount: number;
}

export interface PharmacyService {
  id: string;
  title: string;
  description: string;
  badge: string;
  iconName: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  licenseNumber: string;
  pharmacistCouncilReg: string;
  phone: string;
  email: string;
  operatingHours: string;
  address: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

