import { FilePlus, FolderOpen, Settings } from "lucide-react";

export const IS14483_CONFIG = {
  id: "is14483",
  version: "2024",
  fullName: "IS 14483 (PART - 1) : 2024",
  homeItems: [
    {
      to: "/new",
      title: "New 14483 Report",
      desc: "Generate IS 14483 (PART - 1) : 2024 technical test reports.",
      icon: FilePlus,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      to: "/saved",
      title: "Records",
      desc: "View archived IS 14483 (PART - 1) : 2024 reports.",
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
  defaultPresets: [
    {
      id: "a6817887-fc30-4374-8a19-55e19abeeb20",
      name: "V2",
      size: "2\"(50MM)",
      className: "",
      category: "V2",
      is14483Table: [
        { pressure: 1, motiveFlow: 7260, waterSuction: 1175 },
        { pressure: 1.5, motiveFlow: 8460, waterSuction: 1170 },
        { pressure: 2, motiveFlow: 9450, waterSuction: 1160 },
        { pressure: 2.5, motiveFlow: 10380, waterSuction: 1155 }
      ]
    },
    {
      id: "de5a5d8f-c379-4244-8ab8-79f12b4aca1f",
      name: "V1",
      size: "1\"(25MM)",
      className: "",
      category: "V1",
      is14483Table: [
        { pressure: 1, motiveFlow: 4380, waterSuction: 158 },
        { pressure: 1.25, motiveFlow: 4740, waterSuction: 157 },
        { pressure: 1.5, motiveFlow: 4920, waterSuction: 155 },
        { pressure: 2, motiveFlow: 5340, waterSuction: 151 }
      ]
    }
  ],
  defaultSpecs: [],
  storage: {
    reportsKey: "is14483_reports_v1",
    presetsKey: "is14483_presets_v1",
    specsKey: "is14483_specs_v1",
    headersKey: "is14483_custom_headers_v1",
    defaultPresetKey: "is14483_default_preset_id",
  }
};
