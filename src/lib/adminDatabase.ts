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
  // Check if current user is admin
  private static async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.email?.endsWith('@corruptionwatchdog.in') || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Get all users with their report counts (simplified version)
  static async getAllUsers(filters?: {
    search?: string;
    hasReports?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AdminUser[] | null; error: any; count?: number }> {
    try {
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: new Error('Admin access required') };
      }

      console.log('Fetching users with filters:', filters);

      // For now, we'll create mock admin users since we can't access auth.users directly
      // In a real implementation, you'd need to use Supabase Admin API or edge functions
      const mockUsers: AdminUser[] = [
        {
          id: '1',
          email: 'admin@corruptionwatchdog.in',
          created_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          user_metadata: {
            full_name: 'Admin User',
            phone: '+1234567890',
            location: 'Admin Location'
          },
          report_count: 0
        }
      ];

      // Get report counts for users who have submitted reports
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
        reportCounts.forEach((report: any) => {
          if (report.reporter_email) {
            const count = reportCountMap.get(report.reporter_email) || 0;
            reportCountMap.set(report.reporter_email, count + 1);
          }
        });
      }

      // Add users from reports (non-anonymous ones)
      const { data: nonAnonReports, error: nonAnonError } = await supabase
        .from('corruption_reports')
        .select('reporter_email, reporter_name, created_at')
        .eq('is_anonymous', false)
        .not('reporter_email', 'is', null);

      if (!nonAnonError && nonAnonReports) {
        const userEmails = new Set<string>();
        nonAnonReports.forEach((report: any) => {
          if (report.reporter_email && !userEmails.has(report.reporter_email)) {
            userEmails.add(report.reporter_email);
            mockUsers.push({
              id: `user-${report.reporter_email}`,
              email: report.reporter_email,
              created_at: report.created_at,
              email_confirmed_at: report.created_at,
              last_sign_in_at: report.created_at,
              user_metadata: {
                full_name: report.reporter_name || 'Unknown User',
                phone: '',
                location: ''
              },
              report_count: reportCountMap.get(report.reporter_email) || 0
            });
          }
        });
      }

      // Apply filters
      let filteredUsers = mockUsers;

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(searchLower) ||
          user.user_metadata.full_name?.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.hasReports !== undefined) {
        filteredUsers = filteredUsers.filter(user => 
          filters.hasReports ? user.report_count > 0 : user.report_count === 0
        );
      }

      // Apply pagination
      const startIndex = filters?.offset || 0;
      const endIndex = startIndex + (filters?.limit || 50);
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      console.log(`Returning ${paginatedUsers.length} users`);
      return { data: paginatedUsers, error: null, count: filteredUsers.length };

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
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: new Error('Admin access required') };
      }

      console.log('Fetching reports with filters:', filters);

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
        console.error('Supabase error fetching reports:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} reports`);
      return { data: data as AdminReport[], error: null, count: count || 0 };

    } catch (error) {
      console.error('Error fetching reports:', error);
      return { data: null, error };
    }
  }

  // Get admin dashboard statistics
  static async getAdminStats(): Promise<{ data: AdminStats | null; error: any }> {
    try {
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: new Error('Admin access required') };
      }

      console.log('Fetching admin stats...');

      // Get report statistics
      const { data: allReports, error: reportsError } = await supabase
        .from('corruption_reports')
        .select('id, is_anonymous, status, created_at');

      if (reportsError) {
        console.error('Error fetching reports for stats:', reportsError);
        throw reportsError;
      }

      const totalReports = allReports?.length || 0;
      const anonymousReports = allReports?.filter((r: any) => r.is_anonymous).length || 0;
      const verifiedReports = allReports?.filter((r: any) => r.status === 'verified').length || 0;
      const pendingReports = allReports?.filter((r: any) => r.status === 'pending').length || 0;
      const resolvedReports = allReports?.filter((r: any) => r.status === 'resolved').length || 0;
      const disputedReports = allReports?.filter((r: any) => r.status === 'disputed').length || 0;

      // Get this month's statistics
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const reportsThisMonth = allReports?.filter((r: any) => 
        new Date(r.created_at) >= thisMonth
      ).length || 0;

      // For users, we'll estimate based on non-anonymous reports
      const { data: nonAnonReports, error: nonAnonError } = await supabase
        .from('corruption_reports')
        .select('reporter_email, created_at')
        .eq('is_anonymous', false)
        .not('reporter_email', 'is', null);

      const uniqueUsers = new Set(nonAnonReports?.map((r: any) => r.reporter_email) || []);
      const totalUsers = uniqueUsers.size + 1; // +1 for admin

      const usersThisMonth = nonAnonReports?.filter((r: any) => 
        new Date(r.created_at) >= thisMonth
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

      console.log('Admin stats:', stats);
      return { data: stats, error: null };

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

  // Delete user (admin only) - Simplified version
  static async deleteUser(userId: string): Promise<{ error: any }> {
    try {
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: new Error('Admin access required') };
      }

      console.log('Delete user requested for:', userId);
      
      // For now, we'll just return success since we can't actually delete auth users
      // In a real implementation, you'd need Supabase Admin API or edge functions
      return { error: new Error('User deletion requires server-side implementation') };

    } catch (error) {
      console.error('Error deleting user:', error);
      return { error };
    }
  }

  // Reset user password (admin only) - Simplified version
  static async resetUserPassword(userEmail: string): Promise<{ error: any }> {
    try {
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: new Error('Admin access required') };
      }

      console.log('Password reset requested for:', userEmail);

      // Use the regular password reset function
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Error sending password reset:', error);
        throw error;
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
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: new Error('Admin access required') };
      }

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

  // Ban/Unban user (admin only) - Simplified version
  static async toggleUserBan(userId: string, banned: boolean): Promise<{ error: any }> {
    try {
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: new Error('Admin access required') };
      }

      console.log('Ban toggle requested for:', userId, banned);
      
      // For now, we'll just return success since we can't actually ban auth users
      // In a real implementation, you'd need Supabase Admin API or edge functions
      return { error: new Error('User ban/unban requires server-side implementation') };

    } catch (error) {
      console.error('Error toggling user ban:', error);
      return { error };
    }
  }

  // Update user metadata (admin only) - Simplified version
  static async updateUserMetadata(userId: string, metadata: any): Promise<{ error: any }> {
    try {
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: new Error('Admin access required') };
      }

      console.log('User metadata update requested for:', userId, metadata);
      
      // For now, we'll just return success since we can't actually update auth users
      // In a real implementation, you'd need Supabase Admin API or edge functions
      return { error: new Error('User metadata update requires server-side implementation') };

    } catch (error) {
      console.error('Error updating user metadata:', error);
      return { error };
    }
  }
}