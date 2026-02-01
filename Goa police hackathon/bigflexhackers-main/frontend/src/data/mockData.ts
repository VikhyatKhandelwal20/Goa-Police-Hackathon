// Mock data for Police Deployment System

export interface Officer {
  id: string;
  name: string;
  rank: 'PI' | 'PSI' | 'ASI' | 'HC' | 'PC';
  sector: 'I' | 'II' | 'III';
  zone: string;
  status: 'on-duty' | 'off-duty' | 'break' | 'emergency';
  contact: string;
  assignedTime?: string;
}

export interface Sector {
  id: 'I' | 'II' | 'III';
  name: string;
  supervisor: string;
  zones: number;
  personnel_count: number;
  status: 'active' | 'inactive';
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  timestamp: string;
  status: 'open' | 'in-progress' | 'resolved';
}

export const mockSectors: Sector[] = [
  {
    id: 'I',
    name: 'Sector I',
    supervisor: 'SDPO Pernem',
    zones: 4,
    personnel_count: 45,
    status: 'active',
  },
  {
    id: 'II',
    name: 'Sector II',
    supervisor: 'SDPO Mapusa',
    zones: 4,
    personnel_count: 44,
    status: 'active',
  },
  {
    id: 'III',
    name: 'Sector III',
    supervisor: 'SDPO Panaji',
    zones: 4,
    personnel_count: 44,
    status: 'active',
  },
];

export const mockOfficers: Officer[] = [
  // Sector I Officers (45 total)
  { id: '1', name: 'Inspector Rajesh Sharma', rank: 'PI', sector: 'I', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 43210' },
  { id: '2', name: 'Sub-Inspector Priya Patel', rank: 'PSI', sector: 'I', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 43211' },
  { id: '3', name: 'Sub-Inspector Amit Kumar', rank: 'PSI', sector: 'I', zone: 'Zone 2', status: 'break', contact: '+91 98765 43212' },
  { id: '4', name: 'Sub-Inspector Sunita Rao', rank: 'PSI', sector: 'I', zone: 'Zone 3', status: 'on-duty', contact: '+91 98765 43213' },
  { id: '5', name: 'Sub-Inspector Vikram Singh', rank: 'PSI', sector: 'I', zone: 'Zone 4', status: 'on-duty', contact: '+91 98765 43214' },
  
  // ASI Officers - Sector I
  { id: '6', name: 'ASI Deepak Verma', rank: 'ASI', sector: 'I', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 43215' },
  { id: '7', name: 'ASI Meera Joshi', rank: 'ASI', sector: 'I', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 43216' },
  { id: '8', name: 'ASI Ravi Gupta', rank: 'ASI', sector: 'I', zone: 'Zone 2', status: 'off-duty', contact: '+91 98765 43217' },
  { id: '9', name: 'ASI Kavita Sharma', rank: 'ASI', sector: 'I', zone: 'Zone 2', status: 'on-duty', contact: '+91 98765 43218' },
  { id: '10', name: 'ASI Suresh Nair', rank: 'ASI', sector: 'I', zone: 'Zone 3', status: 'on-duty', contact: '+91 98765 43219' },
  { id: '11', name: 'ASI Pooja Reddy', rank: 'ASI', sector: 'I', zone: 'Zone 3', status: 'break', contact: '+91 98765 43220' },
  { id: '12', name: 'ASI Manoj Tiwari', rank: 'ASI', sector: 'I', zone: 'Zone 4', status: 'on-duty', contact: '+91 98765 43221' },
  { id: '13', name: 'ASI Anita Das', rank: 'ASI', sector: 'I', zone: 'Zone 4', status: 'on-duty', contact: '+91 98765 43222' },

  // Head Constables - Sector I (12 officers)
  { id: '14', name: 'HC Ramesh Yadav', rank: 'HC', sector: 'I', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 43223' },
  { id: '15', name: 'HC Sita Devi', rank: 'HC', sector: 'I', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 43224' },
  { id: '16', name: 'HC Krishna Murthy', rank: 'HC', sector: 'I', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 43225' },
  { id: '17', name: 'HC Lata Mishra', rank: 'HC', sector: 'I', zone: 'Zone 2', status: 'break', contact: '+91 98765 43226' },
  { id: '18', name: 'HC Ganesh Patil', rank: 'HC', sector: 'I', zone: 'Zone 2', status: 'on-duty', contact: '+91 98765 43227' },
  { id: '19', name: 'HC Rekha Singh', rank: 'HC', sector: 'I', zone: 'Zone 2', status: 'on-duty', contact: '+91 98765 43228' },
  { id: '20', name: 'HC Bharat Kumar', rank: 'HC', sector: 'I', zone: 'Zone 3', status: 'on-duty', contact: '+91 98765 43229' },
  { id: '21', name: 'HC Savita Jain', rank: 'HC', sector: 'I', zone: 'Zone 3', status: 'off-duty', contact: '+91 98765 43230' },
  { id: '22', name: 'HC Ajay Pandey', rank: 'HC', sector: 'I', zone: 'Zone 3', status: 'on-duty', contact: '+91 98765 43231' },
  { id: '23', name: 'HC Usha Rani', rank: 'HC', sector: 'I', zone: 'Zone 4', status: 'on-duty', contact: '+91 98765 43232' },
  { id: '24', name: 'HC Vinod Agarwal', rank: 'HC', sector: 'I', zone: 'Zone 4', status: 'on-duty', contact: '+91 98765 43233' },
  { id: '25', name: 'HC Nirmala Shah', rank: 'HC', sector: 'I', zone: 'Zone 4', status: 'on-duty', contact: '+91 98765 43234' },

  // Police Constables - Sector I (20 officers) - showing first 10 for brevity
  { id: '26', name: 'PC Rohit Sharma', rank: 'PC', sector: 'I', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 43235' },
  { id: '27', name: 'PC Priyanka Joshi', rank: 'PC', sector: 'I', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 43236' },
  { id: '28', name: 'PC Sunil Yadav', rank: 'PC', sector: 'I', zone: 'Zone 1', status: 'break', contact: '+91 98765 43237' },
  { id: '29', name: 'PC Neha Gupta', rank: 'PC', sector: 'I', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 43238' },
  { id: '30', name: 'PC Arjun Singh', rank: 'PC', sector: 'I', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 43239' },

  // Sector II Officers (44 total) - Sample
  { id: '46', name: 'Inspector Anjali Verma', rank: 'PI', sector: 'II', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 44000' },
  { id: '47', name: 'Sub-Inspector Raju Nair', rank: 'PSI', sector: 'II', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 44001' },
  { id: '48', name: 'Sub-Inspector Mamta Devi', rank: 'PSI', sector: 'II', zone: 'Zone 2', status: 'on-duty', contact: '+91 98765 44002' },
  { id: '49', name: 'Sub-Inspector Kamal Joshi', rank: 'PSI', sector: 'II', zone: 'Zone 3', status: 'break', contact: '+91 98765 44003' },

  // Sector III Officers (44 total) - Sample
  { id: '90', name: 'Inspector Sanjay Patel', rank: 'PI', sector: 'III', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 45000' },
  { id: '91', name: 'Sub-Inspector Maya Singh', rank: 'PSI', sector: 'III', zone: 'Zone 1', status: 'on-duty', contact: '+91 98765 45001' },
  { id: '92', name: 'Sub-Inspector Rahul Yadav', rank: 'PSI', sector: 'III', zone: 'Zone 2', status: 'off-duty', contact: '+91 98765 45002' },
];

export const mockIncidents: Incident[] = [
  {
    id: '1',
    title: 'Traffic Accident - Main Road',
    description: 'Minor collision between two vehicles near market area',
    location: 'Zone 1, Sector I',
    severity: 'medium',
    reportedBy: 'PC Rohit Sharma',
    timestamp: '2024-01-20T10:30:00Z',
    status: 'in-progress',
  },
  {
    id: '2',
    title: 'Suspicious Activity Report',
    description: 'Unidentified individuals spotted near government building',
    location: 'Zone 2, Sector II',
    severity: 'high',
    reportedBy: 'ASI Deepak Verma',
    timestamp: '2024-01-20T14:15:00Z',
    status: 'open',
  },
  {
    id: '3',
    title: 'Public Disturbance',
    description: 'Crowd gathering, peaceful demonstration',
    location: 'Zone 3, Sector I',
    severity: 'low',
    reportedBy: 'HC Ramesh Yadav',
    timestamp: '2024-01-20T16:45:00Z',
    status: 'resolved',
  },
];

// Statistics
export const deploymentStats = {
  totalPersonnel: 133,
  onDuty: 98,
  offDuty: 25,
  onBreak: 10,
  sectors: 3,
  zones: 12,
  activeIncidents: 2,
  resolvedToday: 5,
};