export const STANDARDS = [
  { 
    id: 'is13488', 
    name: 'IS 13488 : 2008', 
    title: 'Emitting Pipe', 
    desc: 'Specification for Polyethylene Pipes for Irrigation',
  },
  { 
    id: 'is13487', 
    name: 'IS 13487 : 2024', 
    title: 'Emitters', 
    desc: 'Specification for Emitters/Drippers for Drip Irrigation',
  },
  { 
    id: 'is14483', 
    name: 'IS 14483 : 2024', 
    title: 'Drippers', 
    desc: 'Inline Emitters and Emitting Pipes (New Standard)',
  },
];

export function getCurrentStandardId(): string {
  if (typeof window === 'undefined') return 'is13488';
  return localStorage.getItem('current_standard') || 'is13488';
}

export function getCurrentStandard() {
  const id = getCurrentStandardId();
  return STANDARDS.find(s => s.id === id) || STANDARDS[0];
}

export function setCurrentStandard(id: string) {
  localStorage.setItem('current_standard', id);
}
