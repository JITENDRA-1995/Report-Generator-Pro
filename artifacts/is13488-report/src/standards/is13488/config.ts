import { FilePlus, FolderOpen, Settings } from "lucide-react";
import { defaultPresets, defaultSpecs } from "@/lib/seedPresets";

export const IS13488_CONFIG = {
  id: "is13488",
  version: "2008",
  fullName: "IS 13488 : 2008",
  homeItems: [
    {
      to: "/new",
      title: "New Test Report",
      desc: "Create a new IS 13488 : 2008 test report.",
      icon: FilePlus,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      to: "/saved",
      title: "View Saved Reports",
      desc: "Browse, re-print or export IS 13488 reports.",
      icon: FolderOpen,
      color: "bg-blue-50 text-blue-700",
    },
    {
      to: "/data",
      title: "Data Management",
      desc: "Configure default sizes, classes, discharges, spacings & ranges.",
      icon: Settings,
      color: "bg-amber-50 text-amber-700",
    },
  ],
  defaultPresets,
  defaultSpecs,
  storage: {
    reportsKey: "is13488_reports_v2",
    presetsKey: "is13488_presets_v7",
    specsKey: "is13488_specs_v1",
    headersKey: "is13488_custom_headers_v1",
    defaultPresetKey: "is13488_default_preset_id",
  }
};
