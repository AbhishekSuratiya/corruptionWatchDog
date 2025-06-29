/*
  # Fix get_defaulters SQL function

  1. Function Updates
    - Drop existing get_defaulters function if it exists
    - Create new get_defaulters function with proper GROUP BY syntax
    - Function returns defaulters (people with multiple corruption reports)
    - Includes proper aggregation for all selected columns

  2. Function Features
    - Groups by corrupt_person_name to find repeat offenders
    - Returns person details with report counts and categories
    - Includes severity classification based on report count
    - Properly handles all non-aggregated columns in GROUP BY clause
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_defaulters(integer);

-- Create the corrected get_defaulters function
CREATE OR REPLACE FUNCTION get_defaulters(min_reports integer DEFAULT 2)
RETURNS TABLE (
  corrupt_person_name text,
  designation text,
  area_region text,
  report_count bigint,
  latest_report_date timestamp with time zone,
  categories text[],
  status text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.corrupt_person_name,
    -- Use the most recent designation for this person
    (array_agg(cr.designation ORDER BY cr.created_at DESC))[1] as designation,
    -- Use the most recent area_region for this person
    (array_agg(cr.area_region ORDER BY cr.created_at DESC))[1] as area_region,
    COUNT(*) as report_count,
    MAX(cr.created_at) as latest_report_date,
    -- Aggregate unique categories into an array
    array_agg(DISTINCT cr.category) as categories,
    -- Determine status based on report count
    CASE 
      WHEN COUNT(*) >= 20 THEN 'critical'
      WHEN COUNT(*) >= 10 THEN 'high'
      WHEN COUNT(*) >= 5 THEN 'medium'
      ELSE 'low'
    END as status
  FROM corruption_reports cr
  WHERE 
    cr.corrupt_person_name IS NOT NULL 
    AND cr.corrupt_person_name != ''
  GROUP BY cr.corrupt_person_name
  HAVING COUNT(*) >= min_reports
  ORDER BY COUNT(*) DESC, MAX(cr.created_at) DESC;
END;
$$;

-- Grant execute permission to public (since RLS policies handle access control)
GRANT EXECUTE ON FUNCTION get_defaulters(integer) TO public;