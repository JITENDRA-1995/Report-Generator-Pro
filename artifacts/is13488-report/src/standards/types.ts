import type { Preset, ReportData, BasicInfo, StandardSpec } from "@/lib/types";
import { LucideIcon } from "lucide-react";

export interface HomeItem {
  to: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  color: string;
}

export interface StandardDefinition {
  id: string;
  version: string;
  fullName: string;
  
  // UI Configuration
  homeItems: HomeItem[];

  // Default Data
  defaultPresets: Preset[];
  defaultSpecs: StandardSpec[];

  // Storage Keys
  storage: {
    reportsKey: string;
    presetsKey: string;
    specsKey: string;
    headersKey: string;
    defaultPresetKey: string;
  };

  // Logic
  generator: {
    generateRandom: (preset: Preset, spacingId: string, overrides: Partial<BasicInfo>, manualValues?: number[]) => ReportData;
    getEmpty: (preset: Preset, spacingId: string, overrides: Partial<BasicInfo>) => ReportData;
  };

  // UI Components
  components: {
    Wizard: React.ComponentType<{ 
      data: ReportData;
      setData: (data: ReportData) => void;
      preset: Preset;
      onPreview?: () => void;
    }>;
    Template: React.ComponentType<{
      data: ReportData;
      isExporting?: boolean;
    }>;
  };
}
