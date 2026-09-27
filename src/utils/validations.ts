import type {
  GrievanceFormData,
  ValidationResult,
  LocationValidationData,
  LocationValidationResult,
} from '../types'

/**
 * Validates that at least one of the following location fields is filled:
 * - Room No & Block Name (e.g. Room 304, Block B)
 * - Bus Number / Route (e.g. Route 14, KA-01-F-4421)
 *
 * @param locationData Object containing location-related fields
 * @returns LocationValidationResult with isValid flag and error message
 */
export const validateLocationRequirement = (
  locationData: LocationValidationData
): LocationValidationResult => {
  const roomAndBlock = (locationData.room_no_and_block_name || '').trim()
  const busRoute = (locationData.bus_route || '').trim()
  const busNumber = (locationData.bus_number || '').trim()

  const hasLocation = Boolean(roomAndBlock || busRoute || busNumber)

  if (!hasLocation) {
    return {
      isValid: false,
      error: 'Either "Room No & Block" or "Bus Number / Route" is mandatory and must be provided.',
    }
  }

  return {
    isValid: true,
    error: null,
  }
}

/**
 * Helper to check if location (room/block or bus/route) is filled.
 */
export const hasLocationFilled = (
  locationData: LocationValidationData
): boolean => {
  return validateLocationRequirement(locationData).isValid
}

/**
 * Validates complete Grievance Form submission data.
 * Checks for mandatory fields and ensures either Room No & Block or Bus No/Route is filled.
 *
 * @param data Grievance form data or partial form state
 * @returns ValidationResult with status, per-field errors, and primary error message
 */
export const validateGrievanceForm = (
  data: Partial<GrievanceFormData>
): ValidationResult => {
  const errors: Record<string, string> = {}

  if (!data.name || !data.name.trim()) {
    errors.name = 'Student / Complainant name is required.'
  }

  if (!data.email || !data.email.trim()) {
    errors.email = 'Contact email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Please provide a valid email address.'
  }

  if (!data.type_of_grievance || !data.type_of_grievance.trim()) {
    errors.type_of_grievance = 'Please select a grievance category.'
  }

  if (!data.problem_description || !data.problem_description.trim()) {
    errors.problem_description = 'Detailed problem description is required.'
  } else if (data.problem_description.trim().length < 10) {
    errors.problem_description = 'Problem description must be at least 10 characters.'
  }

  // Location requirement: Either room_no_and_block_name OR bus_number/bus_route
  const locationValidation = validateLocationRequirement({
    room_no_and_block_name: data.room_no_and_block_name,
    bus_route: data.bus_route,
    bus_number: data.bus_number,
  })

  if (!locationValidation.isValid) {
    const msg = locationValidation.error || 'Either Room No & Block or Bus No / Route is mandatory.'
    errors.room_no_and_block_name = msg
    errors.bus_number = msg
  }

  const isValid = Object.keys(errors).length === 0
  const firstErrorKey = Object.keys(errors)[0]
  const errorMessage = firstErrorKey ? errors[firstErrorKey] : null

  return {
    isValid,
    errors,
    errorMessage,
  }
}

/**
 * Validates Block Coordinator form submission data.
 * All fields (name, block, phone_no) are required.
 *
 * @param data Coordinator form data
 * @returns ValidationResult with status, per-field errors, and primary error message
 */
export const validateCoordinatorForm = (
  data: {
    name?: string | null
    block?: string | null
    phone_no?: string | null
  }
): ValidationResult => {
  const errors: Record<string, string> = {}

  if (!data.name || !data.name.trim()) {
    errors.name = 'Full name is required.'
  }

  if (!data.block || !data.block.trim()) {
    errors.block = 'Block / Ward name is required.'
  }

  if (!data.phone_no || !data.phone_no.trim()) {
    errors.phone_no = 'Phone number is required.'
  }

  const isValid = Object.keys(errors).length === 0
  const firstErrorKey = Object.keys(errors)[0]
  const errorMessage = firstErrorKey ? errors[firstErrorKey] : null

  return {
    isValid,
    errors,
    errorMessage,
  }
}

