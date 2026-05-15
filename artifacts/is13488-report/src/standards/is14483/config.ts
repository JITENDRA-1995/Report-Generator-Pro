import { FilePlus, FolderOpen, Settings } from "lucide-react";

export const IS14483_CONFIG = {
  id: "is14483",
  version: "2024",
  fullName: "IS 14483 : 2024",
  homeItems: [
    {
      to: "/new",
      title: "New 14483 Report",
      desc: "Generate IS 14483 : 2024 technical test reports.",
      icon: FilePlus,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      to: "/saved",
      title: "Records",
      desc: "View archived IS 14483 reports.",
      icon: FolderOpen,
      color: "bg-blue-50 text-blue-700",
    },
    {
      to: "/data",
      title: "Settings",
      desc: "Manage standard specifications.",
      icon: Settings,
      color: "bg-amber-50 text-amber-700",
    },
  ],
  defaultPresets: [],
  defaultSpecs: [],
  storage: {
    reportsKey: "is14483_reports_v1",
    presetsKey: "is14483_presets_v1",
    specsKey: "is14483_specs_v1",
    headersKey: "is14483_custom_headers_v1",
    defaultPresetKey: "is14483_default_preset_id",
  }
};
