import { MilestoneCode } from "./types";

export interface MilestoneDefinition {
  code: MilestoneCode;
  title: string;
  description: string;
}

export const MILESTONE_SEQUENCE: MilestoneDefinition[] = [
  {
    code: "PURCHASED_CANADA",
    title: "Vehicle Acquired & Title Verified",
    description:
      "Purchase completed and Canadian title transferred to Modfem Autos.",
  },
  {
    code: "EXPORT_INSPECTION",
    title: "Canadian Export & CARFAX Verification",
    description:
      "Export condition inspection and vehicle history verification completed.",
  },
  {
    code: "AT_PORT_HALIFAX",
    title: "Drayage & Port Reception",
    description:
      "Vehicle received at the Halifax / Montreal export terminal.",
  },
  {
    code: "ON_VESSEL_ATLANTIC",
    title: "Loaded on Vessel — Trans-Atlantic Transit",
    description:
      "Vessel has departed Canada, en route across the Atlantic to Lagos.",
  },
  {
    code: "ARRIVED_LAGOS_PORT",
    title: "Discharged at Lagos Port",
    description: "Vessel discharged at the Tin Can Island / Apapa terminal.",
  },
  {
    code: "CUSTOMS_CLEARANCE",
    title: "NCS Duty Assessment & SONCAP Release",
    description:
      "Nigerian Customs Service assessing duty against Form M and bill of lading.",
  },
  {
    code: "READY_FOR_DELIVERY",
    title: "Cleared & Ready for Lagos Handover",
    description: "Cleared by customs — ready for buyer handover in Lagos.",
  },
];
