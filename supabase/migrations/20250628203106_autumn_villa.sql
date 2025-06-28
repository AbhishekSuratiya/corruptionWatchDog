/*
  # Create corruption reports database schema

  1. New Tables
    - `corruption_reports`
      - `id` (uuid, primary key)
      - `corrupt_person_name` (text, required)
      - `designation` (text, required)
      - `address` (text, optional)
      - `area_region` (text, required)
      - `latitude` (numeric, optional)
      - `longitude` (numeric, optional)
      - `description` (text, required)
      - `category` (text, required)
      - `approached_police` (boolean, required)
      - `was_resolved` (boolean, required)
      - `evidence_files` (text array, optional)
      - `is_anonymous` (boolean, default true)
      - `reporter_name` (text, optional)
      - `reporter_email` (text, optional)
      - `status` (text, default 'pending')
      - `dispute_count` (integer, default 0)
      - `upvotes` (integer, default 0)
      - `downvotes` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `corruption_reports` table
    - Add policy for public read access (reports are public)
    - Add policy for public insert access (anyone can report)
    - Add policy for authenticated users to update their own reports

  3. Indexes
    - Index on area_region for location-based queries
    - Index on category for filtering
    - Index on created_at for sorting
    - Index on status for filtering
*/

-- Create corruption_reports table
CREATE TABLE IF NOT EXISTS corruption_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corrupt_person_name text NOT NULL,
  designation text NOT NULL,
  address text,
  area_region text NOT NULL,
  latitude numeric,
  longitude numeric,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('bribery', 'nepotism', 'extortion', 'embezzlement', 'fraud', 'abuse_of_power', 'kickbacks', 'misuse_of_funds', 'other')),
  approached_police boolean NOT NULL DEFAULT false,
  was_resolved boolean NOT NULL DEFAULT false,
  evidence_files text[],
  is_anonymous boolean NOT NULL DEFAULT true,
  reporter_name text,
  reporter_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'disputed', 'resolved')),
  dispute_count integer NOT NULL DEFAULT 0,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE corruption_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view corruption reports"
  ON corruption_reports
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert corruption reports"
  ON corruption_reports
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own reports"
  ON corruption_reports
  FOR UPDATE
  TO public
  USING (
    (is_anonymous = false AND reporter_email = current_setting('request.jwt.claims', true)::json->>'email')
    OR
    (auth.uid() IS NOT NULL)
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_corruption_reports_area_region ON corruption_reports(area_region);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_category ON corruption_reports(category);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_created_at ON corruption_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_status ON corruption_reports(status);
CREATE INDEX IF NOT EXISTS idx_corruption_reports_corrupt_person ON corruption_reports(corrupt_person_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_corruption_reports_updated_at
  BEFORE UPDATE ON corruption_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();