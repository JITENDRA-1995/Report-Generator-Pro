import { FilePlus, FolderOpen, Settings, Zap } from "lucide-react";
import { IS13487Wizard } from "./Wizard";
import { emptyReport, generateRandomReport } from "./generator";
import { defaultPresets } from "./presets";

export const IS13487_CONFIG = {
  id: "is13487",
  version: "2024",
  fullName: "IS 13487 : 2024",
  homeItems: [
    {
      to: "/new",
      title: "New 13487 Report",
      desc: "Start a fresh IS 13487 test report with advanced validation.",
      icon: FilePlus,
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      to: "/saved",
      title: "Archive",
      desc: "Access historical IS 13487 records and analytics.",
      icon: FolderOpen,
      color: "bg-sky-50 text-sky-700",
    },
    {
      to: "/data",
      title: "Parameters",
      desc: "Manage standard-specific limits and technical specs.",
      icon: Settings,
      color: "bg-rose-50 text-rose-700",
    },
  ],
  defaultPresets,
  defaultSpecs: [],   // Will be populated as we design
  storage: {
    reportsKey: "is13487_reports_v1",
    presetsKey: "is13487_presets_v1",
    specsKey: "is13487_specs_v1",
    headersKey: "is13487_custom_headers_v1",
    defaultPresetKey: "is13487_default_preset_id",
  }
};
