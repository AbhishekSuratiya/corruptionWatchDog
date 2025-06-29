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
  // Get current user's session token
  private static async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  // Check if current user is admin
  private static async isCurrentUserAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email?.endsWith('@corruptionwatchdog.in') || false;
  }

  // Get all users with their report counts
  static async getAllUsers(filters?: {
    search?: string;
    hasReports?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AdminUser[] | null; error: any; count?: number }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters || {})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return { data: result.data, error: null, count: result.count };

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
      const token = await this.getAuthToken();
      if (!token) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stats`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return { data: result.data, error: null };

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return { data: null, error };
    }
  }

  // Update report status (admin only)
  static async updateReportStatus(reportId: string, status: string): Promise<{ error: any }> {
    try {
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: new Error('Admin access required') };
      }

      console.log('Updating report status:', { reportId, status });

      const { error } = await supabase
        .from('corruption_reports')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', reportId);

      if (error) {
        console.error('Supabase error updating report status:', error);
        throw error;
      }

      console.log('Report status updated successfully');
      return { error: null };
    } catch (error) {
      console.error('Error updating report status:', error);
      return { error };
    }
  }

  // Delete report (admin only)
  static async deleteReport(reportId: string): Promise<{ error: any }> {
    try {
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: new Error('Admin access required') };
      }

      console.log('Deleting report:', reportId);

      const { error } = await supabase
        .from('corruption_reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        console.error('Supabase error deleting report:', error);
        throw error;
      }

      console.log('Report deleted successfully');
      return { error: null };
    } catch (error) {
      console.error('Error deleting report:', error);
      return { error };
    }
  }

  // Bulk delete reports (admin only)
  static async bulkDeleteReports(reportIds: string[]): Promise<{ 
    success: number; 
    failed: number; 
    errors: string[];
    error?: any;
  }> {
    try {
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: ['Admin access required'],
          error: new Error('Admin access required')
        };
      }

      console.log('Bulk deleting reports:', reportIds);

      if (!reportIds || reportIds.length === 0) {
        return { success: 0, failed: 0, errors: [] };
      }

      // Use Supabase's bulk delete with IN operator
      const { error } = await supabase
        .from('corruption_reports')
        .delete()
        .in('id', reportIds);

      if (error) {
        console.error('Supabase error bulk deleting reports:', error);
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: [error.message],
          error 
        };
      }

      console.log(`Successfully bulk deleted ${reportIds.length} reports`);
      return { 
        success: reportIds.length, 
        failed: 0, 
        errors: [] 
      };

    } catch (error) {
      console.error('Error bulk deleting reports:', error);
      return { 
        success: 0, 
        failed: reportIds.length, 
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        error 
      };
    }
  }

  // Bulk update report status (admin only)
  static async bulkUpdateReportStatus(reportIds: string[], status: string): Promise<{ 
    success: number; 
    failed: number; 
    errors: string[];
    error?: any;
  }> {
    try {
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: ['Admin access required'],
          error: new Error('Admin access required')
        };
      }

      console.log('Bulk updating report status:', { reportIds, status });

      if (!reportIds || reportIds.length === 0) {
        return { success: 0, failed: 0, errors: [] };
      }

      // Use Supabase's bulk update with IN operator
      const { error } = await supabase
        .from('corruption_reports')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .in('id', reportIds);

      if (error) {
        console.error('Supabase error bulk updating reports:', error);
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: [error.message],
          error 
        };
      }

      console.log(`Successfully bulk updated ${reportIds.length} reports to ${status}`);
      return { 
        success: reportIds.length, 
        failed: 0, 
        errors: [] 
      };

    } catch (error) {
      console.error('Error bulk updating reports:', error);
      return { 
        success: 0, 
        failed: reportIds.length, 
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        error 
      };
    }
  }

  // Delete user (admin only)
  static async deleteUser(userId: string): Promise<{ error: any }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { error: new Error('Not authenticated') };
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return { error: null };

    } catch (error) {
      console.error('Error deleting user:', error);
      return { error };
    }
  }

  // Reset user password (admin only)
  static async resetUserPassword(userEmail: string): Promise<{ error: any }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { error: new Error('Not authenticated') };
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return { error: null };

    } catch (error) {
      console.error('Error resetting user password:', error);
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

  // Ban/Unban user (admin only)
  static async toggleUserBan(userId: string, banned: boolean): Promise<{ error: any }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { error: new Error('Not authenticated') };
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ban-user`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, banned })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return { error: null };

    } catch (error) {
      console.error('Error toggling user ban:', error);
      return { error };
    }
  }

  // Update user metadata (admin only)
  static async updateUserMetadata(userId: string, metadata: any): Promise<{ error: any }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { error: new Error('Not authenticated') };
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, metadata })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return { error: null };

    } catch (error) {
      console.error('Error updating user metadata:', error);
      return { error };
    }
  }
}