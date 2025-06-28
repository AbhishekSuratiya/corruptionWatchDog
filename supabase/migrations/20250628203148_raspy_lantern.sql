/*
  # Create function to get defaulters (people with multiple reports)
  
  This function aggregates corruption reports by person to identify
  individuals with multiple reports against them.
*/

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
    cr.designation,
    cr.area_region,
    COUNT(*) as report_count,
    MAX(cr.created_at) as latest_report_date,
    ARRAY_AGG(DISTINCT cr.category) as categories,
    CASE 
      WHEN COUNT(*) >= 10 THEN 'critical'
      WHEN COUNT(*) >= 5 THEN 'high'
      WHEN COUNT(*) >= 3 THEN 'medium'
      ELSE 'low'
    END as status
  FROM corruption_reports cr
  GROUP BY cr.corrupt_person_name, cr.designation, cr.area_region
  HAVING COUNT(*) >= min_reports
  ORDER BY report_count DESC, latest_report_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;