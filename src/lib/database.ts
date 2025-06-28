import { supabase } from './supabase';
import { CorruptionReport } from '../types';

export interface CreateReportData {
  corrupt_person_name: string;
  designation: string;
  address?: string;
  area_region: string;
  description: string;
  category: string;
  approached_police: boolean;
  was_resolved: boolean;
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_email?: string;
  evidence_files?: string[];
}

export class DatabaseService {
  // Create a new corruption report
  static async createReport(data: CreateReportData): Promise<{ data: CorruptionReport | null; error: any }> {
    try {
      const { data: report, error } = await supabase
        .from('corruption_reports')
        .insert([{
          corrupt_person_name: data.corrupt_person_name,
          designation: data.designation,
          address: data.address || null,
          area_region: data.area_region,
          description: data.description,
          category: data.category,
          approached_police: data.approached_police,
          was_resolved: data.was_resolved,
          is_anonymous: data.is_anonymous,
          reporter_name: data.is_anonymous ? null : data.reporter_name,
          reporter_email: data.is_anonymous ? null : data.reporter_email,
          evidence_files: data.evidence_files || []
        }])
        .select()
        .single();

      return { data: report, error };
    } catch (error) {
      console.error('Error creating report:', error);
      return { data: null, error };
    }
  }

  // Get all reports with optional filtering
  static async getReports(filters?: {
    category?: string;
    area_region?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: CorruptionReport[] | null; error: any }> {
    try {
      let query = supabase
        .from('corruption_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.area_region) {
        query = query.ilike('area_region', `%${filters.area_region}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error('Error fetching reports:', error);
      return { data: null, error };
    }
  }

  // Get reports by corrupt person (for defaulter directory)
  static async getReportsByPerson(personName: string): Promise<{ data: CorruptionReport[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('corruption_reports')
        .select('*')
        .ilike('corrupt_person_name', `%${personName}%`)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error fetching reports by person:', error);
      return { data: null, error };
    }
  }

  // Get statistics for dashboard
  static async getStatistics(): Promise<{
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
    regionStats: { region: string; count: number }[];
    categoryStats: { category: string; count: number }[];
  }> {
    try {
      // Get total counts
      const { count: totalReports } = await supabase
        .from('corruption_reports')
        .select('*', { count: 'exact', head: true });

      const { count: resolvedReports } = await supabase
        .from('corruption_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');

      const { count: pendingReports } = await supabase
        .from('corruption_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get region statistics
      const { data: regionData } = await supabase
        .from('corruption_reports')
        .select('area_region')
        .not('area_region', 'is', null);

      const regionStats = regionData?.reduce((acc: { [key: string]: number }, report) => {
        const region = report.area_region;
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      }, {});

      const regionStatsArray = Object.entries(regionStats || {})
        .map(([region, count]) => ({ region, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get category statistics
      const { data: categoryData } = await supabase
        .from('corruption_reports')
        .select('category');

      const categoryStats = categoryData?.reduce((acc: { [key: string]: number }, report) => {
        const category = report.category;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      const categoryStatsArray = Object.entries(categoryStats || {})
        .map(([category, count]) => ({ category, count: count as number }))
        .sort((a, b) => b.count - a.count);

      return {
        totalReports: totalReports || 0,
        resolvedReports: resolvedReports || 0,
        pendingReports: pendingReports || 0,
        regionStats: regionStatsArray,
        categoryStats: categoryStatsArray
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        totalReports: 0,
        resolvedReports: 0,
        pendingReports: 0,
        regionStats: [],
        categoryStats: []
      };
    }
  }

  // Get defaulters (people with multiple reports)
  static async getDefaulters(minReports: number = 2): Promise<{
    data: Array<{
      corrupt_person_name: string;
      designation: string;
      area_region: string;
      report_count: number;
      latest_report_date: string;
      categories: string[];
      status: string;
    }> | null;
    error: any;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_defaulters', { min_reports: minReports });

      return { data, error };
    } catch (error) {
      console.error('Error fetching defaulters:', error);
      return { data: null, error };
    }
  }
}