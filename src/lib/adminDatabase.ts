import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  user_metadata: {
    full_name?: string;
    phone?: string;
    location?: string;
  };
  report_count: number;
}

export interface AdminReport {
  id: string;
  corrupt_person_name: string;
  designation: string;
  address?: string;
  area_region: string;
  latitude?: number;
  longitude?: number;
  description: string;
  category: string;
  approached_authorities: boolean;
  was_resolved: boolean;
  evidence_files?: string[];
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_email?: string;
  status: string;
  dispute_count: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalReports: number;
  anonymousReports: number;
  verifiedReports: number;
  pendingReports: number;
  resolvedReports: number;
  disputedReports: number;
  reportsThisMonth: number;
  usersThisMonth: number;
}

export class AdminDatabaseService {
  // Get all users with their report counts
  static async getAllUsers(filters?: {
    search?: string;
    hasReports?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AdminUser[] | null; error: any; count?: number }> {
    try {
      // First get all users from auth.users (admin only)
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
        page: filters?.offset ? Math.floor(filters.offset / (filters.limit || 50)) + 1 : 1,
        perPage: filters?.limit || 50
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { data: null, error: authError };
      }

      if (!authUsers?.users) {
        return { data: [], error: null, count: 0 };
      }

      // Get report counts for each user
      const userIds = authUsers.users.map(user => user.id);
      const { data: reportCounts, error: reportError } = await supabase
        .from('corruption_reports')
        .select('reporter_email')
        .not('reporter_email', 'is', null);

      if (reportError) {
        console.warn('Error fetching report counts:', reportError);
      }

      // Count reports by email
      const reportCountMap = new Map<string, number>();
      if (reportCounts) {
        reportCounts.forEach(report => {
          if (report.reporter_email) {
            const count = reportCountMap.get(report.reporter_email) || 0;
            reportCountMap.set(report.reporter_email, count + 1);
          }
        });
      }

      // Transform users data
      let users: AdminUser[] = authUsers.users.map(user => ({
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        user_metadata: user.user_metadata || {},
        report_count: reportCountMap.get(user.email || '') || 0
      }));

      // Apply filters
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        users = users.filter(user => 
          user.email.toLowerCase().includes(searchLower) ||
          user.user_metadata.full_name?.toLowerCase().includes(searchLower) ||
          user.id.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.hasReports !== undefined) {
        users = users.filter(user => 
          filters.hasReports ? user.report_count > 0 : user.report_count === 0
        );
      }

      // Sort by creation date (newest first)
      users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { 
        data: users, 
        error: null, 
        count: users.length 
      };

    } catch (error) {
      console.error('Error fetching users:', error);
      return { data: null, error };
    }
  }

  // Get all reports with user information
  static async getAllReports(filters?: {
    search?: string;
    category?: string;
    status?: string;
    isAnonymous?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AdminReport[] | null; error: any; count?: number }> {
    try {
      let query = supabase
        .from('corruption_reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query.or(`corrupt_person_name.ilike.%${filters.search}%,designation.ilike.%${filters.search}%,area_region.ilike.%${filters.search}%,reporter_email.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.isAnonymous !== undefined) {
        query = query.eq('is_anonymous', filters.isAnonymous);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return { data: data as AdminReport[], error: null, count: count || 0 };

    } catch (error) {
      console.error('Error fetching reports:', error);
      return { data: null, error };
    }
  }

  // Get admin dashboard statistics
  static async getAdminStats(): Promise<{ data: AdminStats | null; error: any }> {
    try {
      // Get total users count
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      const totalUsers = authUsers?.users?.length || 0;

      // Get report statistics
      const { data: allReports, error: reportsError } = await supabase
        .from('corruption_reports')
        .select('id, is_anonymous, status, created_at');

      if (reportsError) {
        throw reportsError;
      }

      const totalReports = allReports?.length || 0;
      const anonymousReports = allReports?.filter(r => r.is_anonymous).length || 0;
      const verifiedReports = allReports?.filter(r => r.status === 'verified').length || 0;
      const pendingReports = allReports?.filter(r => r.status === 'pending').length || 0;
      const resolvedReports = allReports?.filter(r => r.status === 'resolved').length || 0;
      const disputedReports = allReports?.filter(r => r.status === 'disputed').length || 0;

      // Get this month's statistics
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const reportsThisMonth = allReports?.filter(r => 
        new Date(r.created_at) >= thisMonth
      ).length || 0;

      const usersThisMonth = authUsers?.users?.filter(u => 
        new Date(u.created_at) >= thisMonth
      ).length || 0;

      const stats: AdminStats = {
        totalUsers,
        totalReports,
        anonymousReports,
        verifiedReports,
        pendingReports,
        resolvedReports,
        disputedReports,
        reportsThisMonth,
        usersThisMonth
      };

      return { data: stats, error: null };

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return { data: null, error };
    }
  }

  // Update report status (admin only)
  static async updateReportStatus(reportId: string, status: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('corruption_reports')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', reportId);

      return { error };
    } catch (error) {
      console.error('Error updating report status:', error);
      return { error };
    }
  }

  // Delete report (admin only)
  static async deleteReport(reportId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('corruption_reports')
        .delete()
        .eq('id', reportId);

      return { error };
    } catch (error) {
      console.error('Error deleting report:', error);
      return { error };
    }
  }

  // Get reports by user email
  static async getReportsByUser(userEmail: string): Promise<{ data: AdminReport[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('corruption_reports')
        .select('*')
        .eq('reporter_email', userEmail)
        .order('created_at', { ascending: false });

      return { data: data as AdminReport[], error };
    } catch (error) {
      console.error('Error fetching user reports:', error);
      return { data: null, error };
    }
  }
}