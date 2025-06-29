/*
  # Update database schema to use 'authorities' terminology instead of 'police'
  
  1. Changes
    - Rename 'approached_police' column to 'approached_authorities'
    - Update any references to maintain backward compatibility
    
  2. Notes
    - This migration maintains data integrity
    - Updates column name for better understanding
*/

-- Rename the column from approached_police to approached_authorities
ALTER TABLE corruption_reports 
RENAME COLUMN approached_police TO approached_authorities;

-- Update any existing comments or documentation
COMMENT ON COLUMN corruption_reports.approached_authorities IS 'Whether the reporter approached any authorities (police, supervisors, anti-corruption agencies, etc.)';