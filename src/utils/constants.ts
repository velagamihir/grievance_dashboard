import type { GrievanceFormData } from '../types'

export const GRIEVANCE_TYPES: string[] = [
  "Infrastructure(lights, fans, ac's, Smart boards, benches)",
  'Hostel',
  'Academic',
  'Food & Transport',
  'Cleanliness/Sanitization',
  'Discipline'
]

export const DEFAULT_DEPARTMENTS: string[] = [
  'Computer Science',
  'Information Technology',
  'Electronics & Comm',
  'Mechanical',
  'Civil',
  'Electrical',
]

export const DEFAULT_SECTIONS: string[] = ['A', 'B', 'C', 'D']

export const DEFAULT_YEARS: string[] = ['1st Year', '2nd Year', '3rd Year', '4th Year']

export const initialGrievanceFormData: GrievanceFormData = {
  name: '',
  email: '',
  type_of_grievance: 'Hostel & Accommodation',
  problem_description: '',
  branch: 'Computer Science',
  section: 'A',
  year: '1st Year',
  room_no_and_block_name: '',
  bus_route: '',
  bus_number: '',
  suggestions: '',
  status: 'Not Yet Started',
  source: 'Form',
}
