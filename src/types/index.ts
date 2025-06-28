export interface CorruptionReport {
  id: string;
  corrupt_person_name: string;
  designation: string;
  address?: string;
  area_region: string;
  latitude?: number;
  longitude?: number;
  description: string;
  category: CorruptionCategory;
  approached_police: boolean;
  was_resolved: boolean;
  evidence_files?: string[];
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_email?: string;
  created_at: string;
  status: 'pending' | 'verified' | 'disputed' | 'resolved';
  dispute_count: number;
  upvotes: number;
  downvotes: number;
}

export interface Dispute {
  id: string;
  report_id: string;
  disputer_name?: string;
  disputer_email?: string;
  reason: string;
  evidence_files?: string[];
  created_at: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
}

export interface User {
  id: string;
  email: string;
  name?: string;
  is_verified: boolean;
  subscription_tier: 'free' | 'pro';
  created_at: string;
}

export type CorruptionCategory = 
  | 'bribery'
  | 'nepotism'
  | 'extortion'
  | 'embezzlement'
  | 'fraud'
  | 'abuse_of_power'
  | 'kickbacks'
  | 'misuse_of_funds'
  | 'other';

export interface RegionStats {
  region: string;
  count: number;
  latitude: number;
  longitude: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}