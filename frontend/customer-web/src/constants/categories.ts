import { MedicineCategory, PharmacyService } from "@/types";

export const MEDICINE_CATEGORIES: MedicineCategory[] = [
  {
    id: "cat-1",
    name: "Diabetes & Endocrine Care",
    slug: "diabetes-care",
    description: "Insulins, glucometers, blood glucose test strips & metformin formulations",
    iconName: "Activity",
    itemCount: 240,
  },
  {
    id: "cat-2",
    name: "Cardiac & Hypertension",
    slug: "cardiac-care",
    description: "Blood pressure support, statins, anti-hypertensives & heart wellness",
    iconName: "HeartPulse",
    itemCount: 180,
  },
  {
    id: "cat-3",
    name: "Antibiotics & Anti-Infectives",
    slug: "antibiotics",
    description: "Prescription Schedule H & H1 medications dispensed strictly against valid Rx",
    iconName: "ShieldAlert",
    itemCount: 150,
  },
  {
    id: "cat-4",
    name: "Respiratory & Asthma",
    slug: "respiratory-asthma",
    description: "Inhalers, rotacaps, nebulizer solutions & respiratory relievers",
    iconName: "Wind",
    itemCount: 110,
  },
  {
    id: "cat-5",
    name: "Vitamins, Minerals & Supplements",
    slug: "vitamins-supplements",
    description: "Vitamin D3, B-Complex, Calcium, Omega-3 & daily immunity boosters",
    iconName: "Sparkles",
    itemCount: 320,
  },
  {
    id: "cat-6",
    name: "First Aid & Surgical Essentials",
    slug: "first-aid-surgical",
    description: "Antiseptics, bandages, gauze, thermometers & emergency wound care",
    iconName: "Cross",
    itemCount: 95,
  },
  {
    id: "cat-7",
    name: "Pain Relief & Anti-inflammatory",
    slug: "pain-relief",
    description: "Analgesics, muscle relaxants, joint care ointments & sprays",
    iconName: "Zap",
    itemCount: 140,
  },
  {
    id: "cat-8",
    name: "Ayurveda & Herbal Wellness",
    slug: "ayurveda-herbal",
    description: "Certified AYUSH formulations, herbal tonics & natural wellness remedies",
    iconName: "Leaf",
    itemCount: 210,
  },
];

export const PHARMACY_SERVICES: PharmacyService[] = [
  {
    id: "srv-1",
    title: "1-Tap Prescription Order",
    description: "Upload your doctor's prescription. Our certified pharmacists verify dosage, interactions & prepare your order in minutes.",
    badge: "Rx Verified",
    iconName: "FileCheck",
  },
  {
    id: "srv-2",
    title: "Registered Pharmacist Review",
    description: "Every Schedule H / H1 medicine is strictly vetted and countersigned by a registered Indian Pharmacy Council professional.",
    badge: "PCI Licensed",
    iconName: "UserCheck",
  },
  {
    id: "srv-3",
    title: "Cold-Chain & Safe Packaging",
    description: "Insulin and temperature-sensitive biologicals delivered in 2°C–8°C certified insulated packaging.",
    badge: "Cold Chain",
    iconName: "ThermometerSnowflake",
  },
  {
    id: "srv-4",
    title: "Genuine Batch & Expiry Guarantee",
    description: "Direct sourcing from authorized distributors. Full batch tracking with minimum 6 months remaining shelf-life.",
    badge: "100% Genuine",
    iconName: "ShieldCheck",
  },
];

