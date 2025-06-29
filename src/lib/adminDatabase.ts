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
      const isAdmin = user?.email?.endsWith('@corruptionwatchdog.in') || false;
      console.log('Admin check:', { email: user?.email, isAdmin });
      return isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Get all users with their report counts
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

      // Get unique users from reports (both anonymous and non-anonymous)
      const { data: allReports, error: reportsError } = await supabase
        .from('corruption_reports')
        .select('reporter_email, reporter_name, created_at, is_anonymous');

      if (reportsError) {
        console.error('Error fetching reports for users:', reportsError);
        throw reportsError;
      }

      // Create user map
      const userMap = new Map<string, AdminUser>();
      
      // Add admin user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        userMap.set(currentUser.email!, {
          id: currentUser.id,
          email: currentUser.email!,
          created_at: currentUser.created_at!,
          email_confirmed_at: currentUser.email_confirmed_at,
          last_sign_in_at: currentUser.last_sign_in_at,
          user_metadata: currentUser.user_metadata || {},
          report_count: 0
        });
      }

      // Process reports to extract users
      const reportCountMap = new Map<string, number>();
      
      if (allReports) {
        allReports.forEach((report: any) => {
          if (report.reporter_email && !report.is_anonymous) {
            // Count reports
            const count = reportCountMap.get(report.reporter_email) || 0;
            reportCountMap.set(report.reporter_email, count + 1);
            
            // Add user if not exists
            if (!userMap.has(report.reporter_email)) {
              userMap.set(report.reporter_email, {
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
                report_count: 0
              });
            }
          }
        });
      }

      // Update report counts
      userMap.forEach((user, email) => {
        user.report_count = reportCountMap.get(email) || 0;
      });

      let users = Array.from(userMap.values());

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

      // Apply pagination
      const startIndex = filters?.offset || 0;
      const endIndex = startIndex + (filters?.limit || 50);
      const paginatedUsers = users.slice(startIndex, endIndex);

      console.log(`Returning ${paginatedUsers.length} users out of ${users.length} total`);
      return { data: paginatedUsers, error: null, count: users.length };

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
        .select('id, is_anonymous, status, created_at, reporter_email');

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

      // Count unique users from non-anonymous reports
      const uniqueUserEmails = new Set(
        allReports?.filter((r: any) => !r.is_anonymous && r.reporter_email)
          .map((r: any) => r.reporter_email) || []
      );
      const totalUsers = uniqueUserEmails.size + 1; // +1 for admin

      const usersThisMonth = allReports?.filter((r: any) => 
        !r.is_anonymous && r.reporter_email && new Date(r.created_at) >= thisMonth
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
        console.error('Admin access denied for delete operation');
        return { error: new Error('Admin access required') };
      }

      console.log('Attempting to delete report:', reportId);

      // First verify the report exists
      const { data: existingReport, error: fetchError } = await supabase
        .from('corruption_reports')
        .select('id')
        .eq('id', reportId)
        .single();

      if (fetchError) {
        console.error('Error fetching report to delete:', fetchError);
        if (fetchError.code === 'PGRST116') {
          return { error: new Error('Report not found') };
        }
        throw fetchError;
      }

      if (!existingReport) {
        console.error('Report not found:', reportId);
        return { error: new Error('Report not found') };
      }

      console.log('Report exists, proceeding with deletion...');

      // Delete the report
      const { error: deleteError } = await supabase
        .from('corruption_reports')
        .delete()
        .eq('id', reportId);

      if (deleteError) {
        console.error('Supabase error deleting report:', deleteError);
        throw deleteError;
      }

      console.log('Report deleted successfully:', reportId);
      return { error: null };

    } catch (error) {
      console.error('Error in deleteReport function:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error occurred') };
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
        console.error('Admin access denied for bulk delete operation');
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: ['Admin access required'],
          error: new Error('Admin access required')
        };
      }

      console.log('Attempting to bulk delete reports:', reportIds);

      if (!reportIds || reportIds.length === 0) {
        console.log('No report IDs provided for bulk delete');
        return { success: 0, failed: 0, errors: [] };
      }

      // First verify which reports exist
      const { data: existingReports, error: fetchError } = await supabase
        .from('corruption_reports')
        .select('id')
        .in('id', reportIds);

      if (fetchError) {
        console.error('Error fetching reports for bulk delete:', fetchError);
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: [fetchError.message],
          error: fetchError 
        };
      }

      const existingIds = existingReports?.map(r => r.id) || [];
      const nonExistentIds = reportIds.filter(id => !existingIds.includes(id));

      console.log('Existing reports:', existingIds);
      console.log('Non-existent reports:', nonExistentIds);

      if (existingIds.length === 0) {
        console.log('No reports found to delete');
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: ['No reports found to delete'] 
        };
      }

      // Delete existing reports
      const { error: deleteError } = await supabase
        .from('corruption_reports')
        .delete()
        .in('id', existingIds);

      if (deleteError) {
        console.error('Supabase error bulk deleting reports:', deleteError);
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: [deleteError.message],
          error: deleteError 
        };
      }

      const successCount = existingIds.length;
      const failedCount = nonExistentIds.length;
      const errors = nonExistentIds.length > 0 ? [`${nonExistentIds.length} reports not found`] : [];

      console.log(`Bulk delete completed: ${successCount} successful, ${failedCount} failed`);
      
      return { 
        success: successCount, 
        failed: failedCount, 
        errors 
      };

    } catch (error) {
      console.error('Error in bulkDeleteReports function:', error);
      return { 
        success: 0, 
        failed: reportIds.length, 
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        error: error instanceof Error ? error : new Error('Unknown error')
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
        console.error('Admin access denied for bulk status update');
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: ['Admin access required'],
          error: new Error('Admin access required')
        };
      }

      console.log('Attempting to bulk update report status:', { reportIds, status });

      if (!reportIds || reportIds.length === 0) {
        console.log('No report IDs provided for bulk update');
        return { success: 0, failed: 0, errors: [] };
      }

      // Validate status
      const validStatuses = ['pending', 'verified', 'disputed', 'resolved'];
      if (!validStatuses.includes(status)) {
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: [`Invalid status: ${status}`],
          error: new Error(`Invalid status: ${status}`)
        };
      }

      // First verify which reports exist
      const { data: existingReports, error: fetchError } = await supabase
        .from('corruption_reports')
        .select('id')
        .in('id', reportIds);

      if (fetchError) {
        console.error('Error fetching reports for bulk update:', fetchError);
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: [fetchError.message],
          error: fetchError 
        };
      }

      const existingIds = existingReports?.map(r => r.id) || [];
      const nonExistentIds = reportIds.filter(id => !existingIds.includes(id));

      console.log('Existing reports for update:', existingIds);
      console.log('Non-existent reports:', nonExistentIds);

      if (existingIds.length === 0) {
        console.log('No reports found to update');
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: ['No reports found to update'] 
        };
      }

      // Update existing reports
      const { error: updateError } = await supabase
        .from('corruption_reports')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .in('id', existingIds);

      if (updateError) {
        console.error('Supabase error bulk updating reports:', updateError);
        return { 
          success: 0, 
          failed: reportIds.length, 
          errors: [updateError.message],
          error: updateError 
        };
      }

      const successCount = existingIds.length;
      const failedCount = nonExistentIds.length;
      const errors = nonExistentIds.length > 0 ? [`${nonExistentIds.length} reports not found`] : [];

      console.log(`Bulk status update completed: ${successCount} successful, ${failedCount} failed`);
      
      return { 
        success: successCount, 
        failed: failedCount, 
        errors 
      };

    } catch (error) {
      console.error('Error in bulkUpdateReportStatus function:', error);
      return { 
        success: 0, 
        failed: reportIds.length, 
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        error: error instanceof Error ? error : new Error('Unknown error')
      };
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

      console.log('Fetching reports for user:', userEmail);

      const { data, error } = await supabase
        .from('corruption_reports')
        .select('*')
        .eq('reporter_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user reports:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} reports for user ${userEmail}`);
      return { data: data as AdminReport[], error: null };

    } catch (error) {
      console.error('Error in getReportsByUser:', error);
      return { data: null, error };
    }
  }

  // Reset user password (admin only)
  static async resetUserPassword(userEmail: string): Promise<{ error: any }> {
    try {
      // Check if user is admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: new Error('Admin access required') };
      }

      console.log('Sending password reset for:', userEmail);

      // Use the regular password reset function
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Error sending password reset:', error);
        throw error;
      }

      console.log('Password reset email sent successfully');
      return { error: null };

    } catch (error) {
      console.error('Error in resetUserPassword:', error);
      return { error };
    }
  }

  // Placeholder methods for user management (require server-side implementation)
  static async deleteUser(userId: string): Promise<{ error: any }> {
    return { error: new Error('User deletion requires server-side implementation with Supabase Admin API') };
  }

  static async toggleUserBan(userId: string, banned: boolean): Promise<{ error: any }> {
    return { error: new Error('User ban/unban requires server-side implementation with Supabase Admin API') };
  }

  static async updateUserMetadata(userId: string, metadata: any): Promise<{ error: any }> {
    return { error: new Error('User metadata update requires server-side implementation with Supabase Admin API') };
  }
}