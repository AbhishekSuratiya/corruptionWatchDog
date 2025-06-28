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

export interface HeatMapData {
  region: string;
  count: number;
  latitude?: number;
  longitude?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  categories: string[];
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

  // Get heat map data from real database
  static async getHeatMapData(): Promise<{
    regionData: HeatMapData[];
    categoryData: { name: string; value: number; color: string; key: string }[];
    error: any;
  }> {
    try {
      // Get all reports
      const { data: reports, error } = await supabase
        .from('corruption_reports')
        .select('area_region, category, latitude, longitude');

      if (error) {
        throw error;
      }

      if (!reports || reports.length === 0) {
        return {
          regionData: [],
          categoryData: [],
          error: null
        };
      }

      // Process region data
      const regionMap = new Map<string, {
        count: number;
        categories: Set<string>;
        latitude?: number;
        longitude?: number;
      }>();

      // Process category data
      const categoryMap = new Map<string, number>();

      reports.forEach(report => {
        // Process regions
        const region = report.area_region;
        if (region) {
          const existing = regionMap.get(region) || {
            count: 0,
            categories: new Set<string>(),
            latitude: report.latitude || undefined,
            longitude: report.longitude || undefined
          };
          
          existing.count += 1;
          existing.categories.add(report.category);
          
          // Use coordinates if available
          if (report.latitude && report.longitude) {
            existing.latitude = report.latitude;
            existing.longitude = report.longitude;
          }
          
          regionMap.set(region, existing);
        }

        // Process categories
        if (report.category) {
          categoryMap.set(report.category, (categoryMap.get(report.category) || 0) + 1);
        }
      });

      // Convert to arrays and add coordinates for major Indian cities if missing
      const indianCityCoordinates: { [key: string]: { lat: number; lng: number } } = {
        'mumbai': { lat: 19.0760, lng: 72.8777 },
        'delhi': { lat: 28.6139, lng: 77.2090 },
        'bangalore': { lat: 12.9716, lng: 77.5946 },
        'bengaluru': { lat: 12.9716, lng: 77.5946 },
        'chennai': { lat: 13.0827, lng: 80.2707 },
        'kolkata': { lat: 22.5726, lng: 88.3639 },
        'hyderabad': { lat: 17.3850, lng: 78.4867 },
        'pune': { lat: 18.5204, lng: 73.8567 },
        'ahmedabad': { lat: 23.0225, lng: 72.5714 },
        'jaipur': { lat: 26.9124, lng: 75.7873 },
        'lucknow': { lat: 26.8467, lng: 80.9462 },
        'bhopal': { lat: 23.2599, lng: 77.4126 },
        'patna': { lat: 25.5941, lng: 85.1376 },
        'kochi': { lat: 9.9312, lng: 76.2673 },
        'goa': { lat: 15.2993, lng: 74.1240 },
        'chandigarh': { lat: 30.7333, lng: 76.7794 },
        'indore': { lat: 22.7196, lng: 75.8577 },
        'nagpur': { lat: 21.1458, lng: 79.0882 },
        'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
        'surat': { lat: 21.1702, lng: 72.8311 }
      };

      const regionData: HeatMapData[] = Array.from(regionMap.entries()).map(([region, data]) => {
        let latitude = data.latitude;
        let longitude = data.longitude;

        // If coordinates are missing, try to find them for major Indian cities
        if (!latitude || !longitude) {
          const cityKey = region.toLowerCase().trim();
          const coords = indianCityCoordinates[cityKey];
          if (coords) {
            latitude = coords.lat;
            longitude = coords.lng;
          }
        }

        // Determine severity based on report count
        let severity: 'low' | 'medium' | 'high' | 'critical';
        if (data.count >= 40) severity = 'critical';
        else if (data.count >= 20) severity = 'high';
        else if (data.count >= 10) severity = 'medium';
        else severity = 'low';

        return {
          region,
          count: data.count,
          latitude,
          longitude,
          severity,
          categories: Array.from(data.categories)
        };
      }).sort((a, b) => b.count - a.count); // Sort by count descending

      // Modern colors for categories
      const MODERN_COLORS = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
      ];

      const categoryData = Array.from(categoryMap.entries()).map(([category, count], index) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
        value: count,
        color: MODERN_COLORS[index % MODERN_COLORS.length],
        key: category
      })).sort((a, b) => b.value - a.value); // Sort by value descending

      return {
        regionData,
        categoryData,
        error: null
      };

    } catch (error) {
      console.error('Error fetching heat map data:', error);
      return {
        regionData: [],
        categoryData: [],
        error
      };
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