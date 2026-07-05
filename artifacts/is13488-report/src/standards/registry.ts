import { IS13488_CONFIG } from "./is13488/config";
import { generateRandomReport as gen13488, emptyReport as empty13488 } from "./is13488/generator";
import { ReportTemplate as Temp13488 } from "./is13488/Template";
import { IS13488Wizard } from "./is13488/Wizard";

import { IS13487_CONFIG } from "./is13487/config";
import { generateRandomReport as gen13487, emptyReport as empty13487 } from "./is13487/generator";
import { IS13487Template as Temp13487 } from "./is13487/Template";
import { IS13487Wizard } from "./is13487/Wizard";

import { IS14483_CONFIG } from "./is14483/config";
import { is14483Generator } from "./is14483/generator";
import Template14483 from "./is14483/Template";
import { IS14483Wizard } from "./is14483/Wizard";
import type { StandardDefinition } from "./types";

export const STANDARDS: StandardDefinition[] = [
  {
    ...IS13488_CONFIG,
    generator: {
      generateRandom: gen13488,
      getEmpty: empty13488,
    },
    components: {
      Wizard: IS13488Wizard,
      Template: Temp13488,
    }
  },
  {
    ...IS13487_CONFIG,
    generator: {
      generateRandom: gen13487,
      getEmpty: empty13487,
    },
    components: {
      Wizard: IS13487Wizard,
      Template: Temp13487,
    }
  },
  {
    ...IS14483_CONFIG,
    generator: {
      generateRandom: is14483Generator.generateRandom,
      getEmpty: is14483Generator.getEmpty,
    },
    components: {
      Wizard: IS14483Wizard,
      Template: Template14483,
    }
  }
];

export function getStandard(id: string): StandardDefinition | undefined {
  return STANDARDS.find(s => s.id === id);
}

export function getCurrentStandardId(): string {
  return localStorage.getItem("current_standard") || "is13488";
}

export function getCurrentStandard(): StandardDefinition {
  const id = getCurrentStandardId();
  return getStandard(id) || STANDARDS[0];
}
