/**
 * Domain entity: Service offered by the solar company.
 */
export type ServiceCategory =
  | 'solar_panels'
  | 'solar_kits'
  | 'power_stations'
  | 'grounding'
  | 'electrical_repair'
  | 'electrical_installation';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  isActive: boolean;
}
