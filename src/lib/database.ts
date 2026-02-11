import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { CorruptionReport } from '../types';

export interface CreateReportData {
  corrupt_person_name: string;
  designation: string;
  address?: string;
  area_region: string;
  description: string;
  category: string;
  approached_authorities: boolean;
  was_resolved: boolean;
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_email?: string;
  evidence_files?: string[];
  latitude?: number;
  longitude?: number;
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
      const reportData: any = {
        corrupt_person_name: data.corrupt_person_name,
        designation: data.designation,
        address: data.address || null,
        area_region: data.area_region,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        description: data.description,
        category: data.category,
        approached_authorities: data.approached_authorities,
        was_resolved: data.was_resolved,
        is_anonymous: data.is_anonymous,
        reporter_name: data.is_anonymous ? null : data.reporter_name,
        reporter_email: data.is_anonymous ? null : data.reporter_email,
        evidence_files: data.evidence_files || [],
        created_at: serverTimestamp(),
        status: 'pending', // Default status
        upvotes: 0,
        downvotes: 0,
        dispute_count: 0
      };

      const docRef = await addDoc(collection(db, 'corruption_reports'), reportData);

      const newReport: CorruptionReport = {
        id: docRef.id,
        ...reportData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any;

      return { data: newReport, error: null };
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
      const reportsRef = collection(db, 'corruption_reports');
      let q = query(reportsRef, orderBy('created_at', 'desc'));

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      let reports = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: (data.created_at as Timestamp)?.toDate?.().toISOString() || new Date().toISOString()
        };
      }) as CorruptionReport[];

      if (filters?.area_region) {
        const regionFilter = filters.area_region.toLowerCase();
        reports = reports.filter(r => r.area_region.toLowerCase().includes(regionFilter));
      }

      return { data: reports, error: null };
    } catch (error) {
      console.error('Error fetching reports:', error);
      return { data: null, error };
    }
  }

  // Get reports by corrupt person
  static async getReportsByPerson(personName: string): Promise<{ data: CorruptionReport[] | null; error: any }> {
    try {
      const reportsRef = collection(db, 'corruption_reports');
      const q = query(reportsRef, orderBy('created_at', 'desc'));

      const querySnapshot = await getDocs(q);
      let reports = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: (data.created_at as Timestamp)?.toDate?.().toISOString() || new Date().toISOString()
        };
      }) as CorruptionReport[];

      const nameFilter = personName.toLowerCase();
      reports = reports.filter(r => r.corrupt_person_name.toLowerCase().includes(nameFilter));

      return { data: reports, error: null };
    } catch (error) {
      console.error('Error fetching reports by person:', error);
      return { data: null, error };
    }
  }

  // Get heat map data
  static async getHeatMapData(): Promise<{
    regionData: HeatMapData[];
    categoryData: { name: string; value: number; color: string; key: string }[];
    error: any;
  }> {
    try {
      const reportsRef = collection(db, 'corruption_reports');
      const querySnapshot = await getDocs(reportsRef);
      const reports = querySnapshot.docs.map(doc => doc.data());

      if (reports.length === 0) {
        return { regionData: [], categoryData: [], error: null };
      }

      const regionMap = new Map<string, {
        count: number;
        categories: Set<string>;
        latitude?: number;
        longitude?: number;
      }>();

      const categoryMap = new Map<string, number>();

      reports.forEach(report => {
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

          if (report.latitude && report.longitude) {
            existing.latitude = report.latitude;
            existing.longitude = report.longitude;
          }

          regionMap.set(region, existing);
        }

        if (report.category) {
          categoryMap.set(report.category, (categoryMap.get(report.category) || 0) + 1);
        }
      });

      const indianCityCoordinates: { [key: string]: { lat: number; lng: number } } = {
        'mumbai': { lat: 19.0760, lng: 72.8777 },
        'delhi': { lat: 28.6139, lng: 77.2090 },
        'delhinn': { lat: 28.6139, lng: 77.2090 }, // Handle typo in your data
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

        if (!latitude || !longitude) {
          const cityKey = region.toLowerCase().trim();
          const coords = indianCityCoordinates[cityKey];
          if (coords) {
            latitude = coords.lat;
            longitude = coords.lng;
          }
        }

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
      }).sort((a, b) => b.count - a.count);

      const MODERN_COLORS = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
      ];

      const categoryData = Array.from(categoryMap.entries()).map(([category, count], index) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
        value: count,
        color: MODERN_COLORS[index % MODERN_COLORS.length],
        key: category
      })).sort((a, b) => b.value - a.value);

      return { regionData, categoryData, error: null };

    } catch (error) {
      console.error('Error fetching heat map data:', error);
      return { regionData: [], categoryData: [], error };
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
      const reportsRef = collection(db, 'corruption_reports');
      const querySnapshot = await getDocs(reportsRef);
      const reports = querySnapshot.docs.map(doc => doc.data());

      const totalReports = reports.length;
      const resolvedReports = reports.filter(r => r.status === 'resolved').length;
      const pendingReports = reports.filter(r => r.status === 'pending').length;

      const regionStatsMap = new Map<string, number>();
      const categoryStatsMap = new Map<string, number>();

      reports.forEach(report => {
        if (report.area_region) {
          regionStatsMap.set(report.area_region, (regionStatsMap.get(report.area_region) || 0) + 1);
        }
        if (report.category) {
          categoryStatsMap.set(report.category, (categoryStatsMap.get(report.category) || 0) + 1);
        }
      });

      const regionStats = Array.from(regionStatsMap.entries())
        .map(([region, count]) => ({ region, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const categoryStats = Array.from(categoryStatsMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalReports,
        resolvedReports,
        pendingReports,
        regionStats,
        categoryStats
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
      const reportsRef = collection(db, 'corruption_reports');
      const querySnapshot = await getDocs(reportsRef);
      const allReports = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          created_at: (data.created_at as Timestamp)?.toDate?.().toISOString() || new Date().toISOString()
        };
      });

      const personMap = new Map<string, {
        designation: string;
        area_region: string;
        reports: any[];
        categories: Set<string>;
      }>();

      allReports.forEach((report: any) => {
        if (!report.corrupt_person_name) return;

        const personKey = report.corrupt_person_name.toLowerCase().trim();

        if (!personMap.has(personKey)) {
          personMap.set(personKey, {
            designation: report.designation,
            area_region: report.area_region,
            reports: [],
            categories: new Set()
          });
        }

        const person = personMap.get(personKey)!;
        person.reports.push(report);
        person.categories.add(report.category);

        // Update with most recent info
        if (new Date(report.created_at) > new Date(person.reports[0]?.created_at || '1970-01-01')) {
          person.designation = report.designation;
          person.area_region = report.area_region;
        }
      });

      const manualResults = Array.from(personMap.entries())
        .filter(([_, person]) => person.reports.length >= minReports)
        .map(([personName, person]) => {
          const reportCount = person.reports.length;
          let status = 'low';
          if (reportCount >= 20) status = 'critical';
          else if (reportCount >= 10) status = 'high';
          else if (reportCount >= 5) status = 'medium';

          return {
            corrupt_person_name: personName,
            designation: person.designation,
            area_region: person.area_region,
            report_count: reportCount,
            latest_report_date: new Date(Math.max(...person.reports.map(r => new Date(r.created_at).getTime()))).toISOString(),
            categories: Array.from(person.categories),
            status
          };
        })
        .sort((a, b) => b.report_count - a.report_count);

      return { data: manualResults, error: null };

    } catch (error) {
      console.error('Error in getDefaulters:', error);
      return { data: null, error };
    }
  }

  // Get all reports for testing/debugging
  static async getAllReportsGrouped(): Promise<{
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
      const reportsRef = collection(db, 'corruption_reports');
      const querySnapshot = await getDocs(reportsRef);
      const allReports = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          created_at: (data.created_at as Timestamp)?.toDate?.().toISOString() || new Date().toISOString()
        };
      });

      const personMap = new Map<string, {
        designation: string;
        area_region: string;
        reports: any[];
        categories: Set<string>;
      }>();

      allReports.forEach((report: any) => {
        if (!report.corrupt_person_name) return;

        const personKey = report.corrupt_person_name.toLowerCase().trim();

        if (!personMap.has(personKey)) {
          personMap.set(personKey, {
            designation: report.designation,
            area_region: report.area_region,
            reports: [],
            categories: new Set()
          });
        }

        const person = personMap.get(personKey)!;
        person.reports.push(report);
        person.categories.add(report.category);

        if (new Date(report.created_at) > new Date(person.reports[0]?.created_at || '1970-01-01')) {
          person.designation = report.designation;
          person.area_region = report.area_region;
        }
      });

      const allResults = Array.from(personMap.entries())
        .map(([personName, person]) => {
          const reportCount = person.reports.length;
          let status = 'single';
          if (reportCount >= 20) status = 'critical';
          else if (reportCount >= 10) status = 'high';
          else if (reportCount >= 5) status = 'medium';
          else if (reportCount >= 2) status = 'low';

          return {
            corrupt_person_name: personName,
            designation: person.designation,
            area_region: person.area_region,
            report_count: reportCount,
            latest_report_date: new Date(Math.max(...person.reports.map(r => new Date(r.created_at).getTime()))).toISOString(),
            categories: Array.from(person.categories),
            status
          };
        })
        .sort((a, b) => b.report_count - a.report_count);

      return { data: allResults, error: null };

    } catch (error) {
      console.error('Error in getAllReportsGrouped:', error);
      return { data: null, error };
    }
  }
}