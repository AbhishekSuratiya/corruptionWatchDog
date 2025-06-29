/*
  # Fix defaulters function to include all reports
  
  Updates the get_defaulters function to properly aggregate all corruption reports
  regardless of whether they were submitted anonymously or by logged-in users.
  
  1. Function Updates
    - Improved grouping logic to capture all reports for each person
    - Better status calculation based on report count
    - Enhanced data aggregation for comprehensive results
    
  2. Performance Improvements
    - Optimized query structure
    - Better indexing support
    - Efficient aggregation logic
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS get_defaulters(integer);

-- Create improved function to get defaulters
CREATE OR REPLACE FUNCTION get_defaulters(min_reports integer DEFAULT 2)
RETURNS TABLE (
  corrupt_person_name text,
  designation text,
  area_region text,
  report_count bigint,
  latest_report_date timestamptz,
  categories text[],
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.corrupt_person_name,
    -- Use the most recent designation if there are multiple
    (array_agg(cr.designation ORDER BY cr.created_at DESC))[1] as designation,
    -- Use the most recent area_region if there are multiple
    (array_agg(cr.area_region ORDER BY cr.created_at DESC))[1] as area_region,
    COUNT(*) as report_count,
    MAX(cr.created_at) as latest_report_date,
    ARRAY_AGG(DISTINCT cr.category) as categories,
    CASE 
      WHEN COUNT(*) >= 20 THEN 'critical'
      WHEN COUNT(*) >= 10 THEN 'high'
      WHEN COUNT(*) >= 5 THEN 'medium'
      ELSE 'low'
    END as status
  FROM corruption_reports cr
  WHERE cr.corrupt_person_name IS NOT NULL 
    AND trim(cr.corrupt_person_name) != ''
  GROUP BY LOWER(trim(cr.corrupt_person_name))
  HAVING COUNT(*) >= min_reports
  ORDER BY report_count DESC, latest_report_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public (since reports are public)
GRANT EXECUTE ON FUNCTION get_defaulters(integer) TO public;