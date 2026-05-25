export interface OfficeConfig {
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Allowed check-in radius in metres */
  radiusMeters: number;
  /** Work starts at HH:MM (24-hour) */
  workStartTime: string;
  /** Work ends at HH:MM (24-hour) */
  workEndTime: string;
}

export const OFFICE_CONFIG: OfficeConfig = {
  name: 'Assigned Branch',
  address: '',
  lat: -6.20876,
  lng: 106.84561,
  radiusMeters: 100,
  workStartTime: '08:00',
  workEndTime: '17:00',
};
